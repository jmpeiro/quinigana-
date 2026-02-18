import { ChallengeModel } from '../models/challenge.model';
import { NotificationService } from './notification.service';
import { GamificationService } from './gamification.service';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export class ChallengeSettlementService {
  private static WINNER_XP = 20;
  private static PARTICIPATION_XP = 5;

  static async settleForJornada(jornadaId: number): Promise<number> {
    const challenges = await ChallengeModel.getActiveChallengesForJornada(jornadaId);
    if (challenges.length === 0) return 0;

    let processed = 0;

    for (const challenge of challenges) {
      const challengerPerf = await ChallengeModel.getUserJornadaPerformance(challenge.challenger_id, jornadaId);
      const challengedPerf = await ChallengeModel.getUserJornadaPerformance(challenge.challenged_id, jornadaId);

      const winnerId = this.resolveWinner(
        challenge.challenger_id,
        challenge.challenged_id,
        challengerPerf,
        challengedPerf
      );

      await ChallengeModel.completeChallenge(
        challenge.id,
        challengerPerf.totalPoints,
        challengedPerf.totalPoints,
        winnerId
      );

      await ChallengeModel.getOrCreateStats(challenge.challenger_id, challenge.challenged_id);
      await ChallengeModel.getOrCreateStats(challenge.challenged_id, challenge.challenger_id);

      if (winnerId === null) {
        await ChallengeModel.updateStats(challenge.challenger_id, challenge.challenged_id, false, true, challenge.wager_points);
        await ChallengeModel.updateStats(challenge.challenged_id, challenge.challenger_id, false, true, challenge.wager_points);
      } else if (winnerId === challenge.challenger_id) {
        await ChallengeModel.updateStats(challenge.challenger_id, challenge.challenged_id, true, false, challenge.wager_points);
        await ChallengeModel.updateStats(challenge.challenged_id, challenge.challenger_id, false, false, challenge.wager_points);
        await ChallengeModel.updateUserReputation(challenge.challenger_id, challenge.wager_points);
        await ChallengeModel.updateUserReputation(challenge.challenged_id, -challenge.wager_points);
      } else {
        await ChallengeModel.updateStats(challenge.challenger_id, challenge.challenged_id, false, false, challenge.wager_points);
        await ChallengeModel.updateStats(challenge.challenged_id, challenge.challenger_id, true, false, challenge.wager_points);
        await ChallengeModel.updateUserReputation(challenge.challenger_id, -challenge.wager_points);
        await ChallengeModel.updateUserReputation(challenge.challenged_id, challenge.wager_points);
      }

      const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, first_name FROM users WHERE id IN (?, ?)',
        [challenge.challenger_id, challenge.challenged_id]
      );
      const names = new Map<number, string>();
      for (const row of userRows) {
        names.set(Number(row.id), String(row.first_name));
      }

      const challengerWon = winnerId === challenge.challenger_id;
      const challengedWon = winnerId === challenge.challenged_id;
      const isDraw = winnerId === null;

      await NotificationService.notifyChallengeResult(
        challenge.challenger_id,
        names.get(challenge.challenged_id) || 'Tu rival',
        `Jornada ${jornadaId}`,
        challengerWon,
        isDraw,
        challenge.wager_points
      );

      await NotificationService.notifyChallengeResult(
        challenge.challenged_id,
        names.get(challenge.challenger_id) || 'Tu rival',
        `Jornada ${jornadaId}`,
        challengedWon,
        isDraw,
        challenge.wager_points
      );

      await GamificationService.grantXp(challenge.challenger_id, this.PARTICIPATION_XP, 'challenge_participation', challenge.id);
      await GamificationService.grantXp(challenge.challenged_id, this.PARTICIPATION_XP, 'challenge_participation', challenge.id);
      if (winnerId === challenge.challenger_id) {
        await GamificationService.grantXp(challenge.challenger_id, this.WINNER_XP, 'challenge_win', challenge.id);
      } else if (winnerId === challenge.challenged_id) {
        await GamificationService.grantXp(challenge.challenged_id, this.WINNER_XP, 'challenge_win', challenge.id);
      }

      processed++;
    }

    return processed;
  }

  private static resolveWinner(
    challengerId: number,
    challengedId: number,
    challenger: { totalPoints: number; correct1x2: number; correctPleno: number },
    challenged: { totalPoints: number; correct1x2: number; correctPleno: number }
  ): number | null {
    if (challenger.totalPoints !== challenged.totalPoints) {
      return challenger.totalPoints > challenged.totalPoints ? challengerId : challengedId;
    }
    if (challenger.correctPleno !== challenged.correctPleno) {
      return challenger.correctPleno > challenged.correctPleno ? challengerId : challengedId;
    }
    if (challenger.correct1x2 !== challenged.correct1x2) {
      return challenger.correct1x2 > challenged.correct1x2 ? challengerId : challengedId;
    }
    return null;
  }
}
