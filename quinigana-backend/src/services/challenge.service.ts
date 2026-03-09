import { ChallengeModel } from '../models/challenge.model';
import { NotificationService } from './notification.service';
import { GamificationService } from './gamification.service';
import { withTransaction } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { Challenge, ChallengeWithDetails, CreateChallengeDto } from '../types';

// XP rewards for challenge activities
const XP_CHALLENGE_WIN = 20;
const XP_CHALLENGE_COMPLETE = 5; // Just for participating
const XP_CHALLENGE_DRAW = 3;

export class ChallengeService {
  // =====================================================
  // CRUD OPERATIONS
  // =====================================================

  /**
   * Create a new challenge between two users for a given jornada.
   */
  static async createChallenge(
    challengerId: number,
    data: CreateChallengeDto
  ): Promise<ChallengeWithDetails> {
    const challengeId = await ChallengeModel.create(
      challengerId,
      data.challenged_id,
      data.jornada_id,
      data.wager_points,
      data.message
    );

    const challenge = await ChallengeModel.findByIdWithDetails(challengeId);
    if (!challenge) {
      throw { statusCode: 500, code: 'CREATE_FAILED', message: 'Failed to create challenge' };
    }

    return challenge;
  }

  /**
   * Get a challenge by ID with full details.
   */
  static async getChallengeById(challengeId: number): Promise<ChallengeWithDetails | null> {
    return ChallengeModel.findByIdWithDetails(challengeId);
  }

  /**
   * Accept a pending challenge. Sets status to 'accepted' and initializes stats.
   */
  static async acceptChallenge(challengeId: number, challenge: Challenge): Promise<void> {
    await ChallengeModel.updateStatus(challengeId, 'accepted', new Date());

    // Ensure stats records exist for both directions
    await ChallengeModel.getOrCreateStats(challenge.challenger_id, challenge.challenged_id);
    await ChallengeModel.getOrCreateStats(challenge.challenged_id, challenge.challenger_id);
  }

  /**
   * Decline a pending challenge. Sets status to 'declined'.
   */
  static async declineChallenge(challengeId: number): Promise<void> {
    await ChallengeModel.updateStatus(challengeId, 'rejected', new Date());
  }

  /**
   * Cancel a pending challenge (only by the challenger).
   */
  static async cancelChallenge(challengeId: number): Promise<void> {
    await ChallengeModel.updateStatus(challengeId, 'cancelled');
  }

  /**
   * Verify that a user has predictions for the challenge's jornada.
   * Predictions are managed via the group proposal system.
   */
  static async verifyPredictions(
    userId: number,
    challenge: Challenge
  ): Promise<{ hasPredictions: boolean; message: string }> {
    const hasPredictions = await this.hasUserPredictions(userId, challenge.jornada_id);

    return {
      hasPredictions,
      message: hasPredictions
        ? 'Tus predicciones de grupo se usaran para el reto'
        : 'Necesitas tener una propuesta aprobada en algun grupo para que tus predicciones cuenten en el reto',
    };
  }

  // =====================================================
  // CHALLENGE RESOLUTION (called when jornada finishes)
  // =====================================================

  /**
   * Resolve all accepted challenges for a given jornada after scoring.
   * Wrapped in a transaction so score writes and reputation changes are atomic.
   */
  static async resolveChallengesForJornada(jornadaId: number): Promise<void> {
    const challenges = await ChallengeModel.getActiveChallengesForJornada(jornadaId);
    if (challenges.length === 0) return;

    for (const challenge of challenges) {
      await this.resolveChallenge(challenge, jornadaId);
    }
  }

  /**
   * Resolve a single challenge: calculate scores, determine winner, update reputation.
   */
  private static async resolveChallenge(challenge: Challenge, jornadaId: number): Promise<void> {
    await withTransaction(async (conn) => {
      // Get each participant's total score for this jornada (across all groups)
      const [challengerRows] = await conn.execute<RowDataPacket[]>(
        `SELECT COALESCE(SUM(gs.total_points), 0) as score
         FROM group_scores gs
         JOIN group_members gm ON gm.group_id = gs.group_id
         WHERE gm.user_id = ? AND gs.jornada_id = ?`,
        [challenge.challenger_id, jornadaId]
      );
      const [challengedRows] = await conn.execute<RowDataPacket[]>(
        `SELECT COALESCE(SUM(gs.total_points), 0) as score
         FROM group_scores gs
         JOIN group_members gm ON gm.group_id = gs.group_id
         WHERE gm.user_id = ? AND gs.jornada_id = ?`,
        [challenge.challenged_id, jornadaId]
      );

      const challengerScore = Number((challengerRows[0] as RowDataPacket).score);
      const challengedScore = Number((challengedRows[0] as RowDataPacket).score);

      let winnerId: number | null = null;
      const isDraw = challengerScore === challengedScore;

      if (!isDraw) {
        winnerId = challengerScore > challengedScore
          ? challenge.challenger_id
          : challenge.challenged_id;
      }

      // Complete the challenge record
      await conn.execute(
        `UPDATE challenges
         SET status = 'completed',
             challenger_score = ?,
             challenged_score = ?,
             winner_id = ?,
             completed_at = NOW()
         WHERE id = ?`,
        [challengerScore, challengedScore, winnerId, challenge.id]
      );

      // Update reputation points
      if (!isDraw && winnerId) {
        const loserId = winnerId === challenge.challenger_id
          ? challenge.challenged_id
          : challenge.challenger_id;

        await conn.execute(
          'UPDATE users SET reputation_points = reputation_points + ? WHERE id = ?',
          [challenge.wager_points, winnerId]
        );
        await conn.execute(
          'UPDATE users SET reputation_points = GREATEST(0, reputation_points - ?) WHERE id = ?',
          [challenge.wager_points, loserId]
        );
      }

      // Fire-and-forget stats updates
      const isWinChallenger = winnerId === challenge.challenger_id;
      const isWinChallenged = winnerId === challenge.challenged_id;

      Promise.all([
        ChallengeModel.updateStats(challenge.challenger_id, challenge.challenged_id, isWinChallenger, isDraw, challenge.wager_points),
        ChallengeModel.updateStats(challenge.challenged_id, challenge.challenger_id, isWinChallenged, isDraw, challenge.wager_points),
      ]).catch(() => {});
    });

    // Post-transaction: notifications and gamification (non-critical)
    await this.postResolutionNotifications(challenge);
  }

  /**
   * Send notifications and award XP/badges after challenge resolution.
   */
  private static async postResolutionNotifications(challenge: Challenge): Promise<void> {
    const challengeDetails = await ChallengeModel.findByIdWithDetails(challenge.id);
    if (!challengeDetails) return;

    const isDraw = challengeDetails.challenger_score === challengeDetails.challenged_score;
    const isWinChallenger = challengeDetails.winner_id === challenge.challenger_id;
    const isWinChallenged = challengeDetails.winner_id === challenge.challenged_id;

    // Notify both participants
    NotificationService.notifyChallengeResult(
      challenge.challenger_id,
      challengeDetails.challenged_name,
      challengeDetails.jornada_name,
      isWinChallenger, isDraw, challenge.wager_points
    ).catch(() => {});

    NotificationService.notifyChallengeResult(
      challenge.challenged_id,
      challengeDetails.challenger_name,
      challengeDetails.jornada_name,
      isWinChallenged, isDraw, challenge.wager_points
    ).catch(() => {});

    // Award XP for participation and wins
    await this.awardChallengeXp(challenge.challenger_id, isWinChallenger, isDraw).catch(() => {});
    await this.awardChallengeXp(challenge.challenged_id, isWinChallenged, isDraw).catch(() => {});

    // Check challenge-related badges for both participants
    await this.checkChallengeBadges(challenge.challenger_id).catch(() => {});
    await this.checkChallengeBadges(challenge.challenged_id).catch(() => {});
  }

  // =====================================================
  // EXPIRATION LOGIC
  // =====================================================

  /**
   * Expire all pending challenges older than 48 hours.
   * Called by the scheduler cron job and also on-access.
   */
  static async expirePendingChallenges(): Promise<number> {
    const expiredChallenges = await ChallengeModel.findExpiredPendingChallenges();
    if (expiredChallenges.length === 0) return 0;

    const count = await ChallengeModel.expireOldPendingChallenges();

    // Notify challengers about expiration (fire-and-forget)
    for (const ch of expiredChallenges) {
      NotificationService.notify(
        ch.challenger_id,
        'challenge_result',
        'Reto expirado',
        'Tu reto no fue aceptado y ha expirado tras 48 horas.',
        '/challenges'
      ).catch(() => {});
    }

    return count;
  }

  /**
   * Check-on-access: if a specific challenge is expired, auto-update it.
   */
  static async checkAndExpireIfNeeded(challenge: Challenge): Promise<Challenge> {
    return ChallengeModel.checkAndExpireIfNeeded(challenge);
  }

  // =====================================================
  // GAMIFICATION INTEGRATION
  // =====================================================

  /**
   * Award XP for challenge completion. Extra XP for winning. Bonus for draws.
   */
  private static async awardChallengeXp(userId: number, isWinner: boolean, isDraw = false): Promise<void> {
    // Everyone gets participation XP
    await GamificationService.grantXp(userId, XP_CHALLENGE_COMPLETE, 'challenge_complete', null);

    // Winner gets bonus XP
    if (isWinner) {
      await GamificationService.grantXp(userId, XP_CHALLENGE_WIN, 'challenge_win', null);
    }

    // Draw gets a small consolation XP
    if (isDraw) {
      await GamificationService.grantXp(userId, XP_CHALLENGE_DRAW, 'challenge_draw', null);
    }
  }

  /**
   * Check and award challenge-related badges.
   * Badges: first_challenge, challenge_wins_5, challenge_wins_20, undefeated_5
   */
  static async checkChallengeBadges(userId: number): Promise<void> {
    const [completedCount, winCount, winStreak] = await Promise.all([
      ChallengeModel.getUserCompletedCount(userId),
      ChallengeModel.getUserWinCount(userId),
      ChallengeModel.getUserWinStreak(userId),
    ]);

    // first_challenge: completed at least 1 challenge
    if (completedCount >= 1) {
      await GamificationService.awardBadgeIfEligible(userId, 'first_challenge');
    }

    // challenge_wins_5: won 5 challenges
    if (winCount >= 5) {
      await GamificationService.awardBadgeIfEligible(userId, 'challenge_wins_5');
    }

    // challenge_wins_20: won 20 challenges
    if (winCount >= 20) {
      await GamificationService.awardBadgeIfEligible(userId, 'challenge_wins_20');
    }

    // undefeated_5: 5 consecutive wins
    if (winStreak >= 5) {
      await GamificationService.awardBadgeIfEligible(userId, 'undefeated_5');
    }
  }

  // =====================================================
  // HELPER: Check if user has predictions for jornada
  // =====================================================

  /**
   * Check if a user has predictions for the given jornada (through any group).
   */
  static async hasUserPredictions(userId: number, jornadaId: number): Promise<boolean> {
    const pool = (await import('../config/database')).default;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM quiniela_proposals qp
       JOIN group_members gm ON gm.group_id = qp.group_id AND gm.user_id = ?
       WHERE qp.jornada_id = ? AND qp.status IN ('approved', 'pending')`,
      [userId, jornadaId]
    );
    return Number((rows[0] as RowDataPacket).count) > 0;
  }
}
