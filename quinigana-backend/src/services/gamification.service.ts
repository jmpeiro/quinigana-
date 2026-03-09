import { GamificationModel } from '../models/gamification.model';
import { StatsModel } from '../models/stats.model';
import { NotificationModel } from '../models/notification.model';
import { WebPushService } from './web-push.service';
import { UserGamificationData, CreateNotificationDto } from '../types';

interface BadgeCondition {
  code: string;
  check: (ctx: BadgeContext) => boolean;
}

interface BadgeContext {
  totalPoints: number;
  totalPredictions: number;
  correctPleno: number;
  bestStreak: number;
  proposalCount: number;
  voteCount: number;
  isChampion: boolean;
}

export class GamificationService {
  static LEVEL_THRESHOLDS = [0, 50, 120, 220, 350, 520, 730, 1000, 1350, 1800];

  static XP_CORRECT_1X2 = 5;
  static XP_CORRECT_1X2_DOUBLE = 3;
  static XP_PLENO = 25;
  static XP_PROPOSAL = 5;
  static XP_VOTE = 2;

  private static BADGE_CONDITIONS: BadgeCondition[] = [
    { code: 'first_pleno', check: (ctx) => ctx.correctPleno >= 1 },
    { code: 'pleno_x5', check: (ctx) => ctx.correctPleno >= 5 },
    { code: 'streak_3', check: (ctx) => ctx.bestStreak >= 3 },
    { code: 'streak_5', check: (ctx) => ctx.bestStreak >= 5 },
    { code: 'streak_10', check: (ctx) => ctx.bestStreak >= 10 },
    { code: 'predictions_10', check: (ctx) => ctx.totalPredictions >= 10 },
    { code: 'predictions_50', check: (ctx) => ctx.totalPredictions >= 50 },
    { code: 'predictions_100', check: (ctx) => ctx.totalPredictions >= 100 },
    { code: 'points_50', check: (ctx) => ctx.totalPoints >= 50 },
    { code: 'points_100', check: (ctx) => ctx.totalPoints >= 100 },
    { code: 'points_500', check: (ctx) => ctx.totalPoints >= 500 },
    { code: 'points_1000', check: (ctx) => ctx.totalPoints >= 1000 },
    { code: 'group_champion', check: (ctx) => ctx.isChampion },
    { code: 'first_proposal', check: (ctx) => ctx.proposalCount >= 1 },
    { code: 'first_vote', check: (ctx) => ctx.voteCount >= 1 },
    { code: 'proposals_10', check: (ctx) => ctx.proposalCount >= 10 },
  ];

  static calculateLevel(xp: number): number {
    let level = 1;
    for (let i = 1; i < this.LEVEL_THRESHOLDS.length; i++) {
      if (xp >= this.LEVEL_THRESHOLDS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return level;
  }

  static async grantXp(userId: number, amount: number, source: string, referenceId: number | null = null): Promise<{ newLevel: number; leveledUp: boolean }> {
    await GamificationModel.ensureUserXp(userId);
    const current = await GamificationModel.getUserXp(userId);
    const newTotal = current.total_xp + amount;
    const newLevel = this.calculateLevel(newTotal);
    const leveledUp = newLevel > current.level;
    await GamificationModel.addXp(userId, amount, source, referenceId, newLevel);
    return { newLevel, leveledUp };
  }

  static async processJornadaAchievements(jornadaId: number): Promise<void> {
    const userIds = await GamificationModel.getJornadaParticipants(jornadaId);

    for (const userId of userIds) {
      try {
        // Grant XP for correct predictions in this jornada
        const corrects = await GamificationModel.getJornadaCorrects(jornadaId, userId);
        const xpEarned =
          corrects.correct1x2 * this.XP_CORRECT_1X2 +
          corrects.doubles1x2 * this.XP_CORRECT_1X2_DOUBLE +
          corrects.correctPleno * this.XP_PLENO;

        if (xpEarned > 0) {
          await this.grantXp(userId, xpEarned, 'jornada_results', jornadaId);
        }

        // Check all badge conditions
        await this.checkAllBadges(userId);
      } catch {
        // Skip user on error, don't block others
      }
    }
  }

  static async processProposalCreated(userId: number): Promise<void> {
    await this.grantXp(userId, this.XP_PROPOSAL, 'proposal', null);
    await this.checkSocialBadges(userId);
  }

  static async processVoteCast(userId: number): Promise<void> {
    await this.grantXp(userId, this.XP_VOTE, 'vote', null);
    await this.checkSocialBadges(userId);
  }

  private static async checkSocialBadges(userId: number): Promise<void> {
    const ownedCodes = new Set(await GamificationModel.getUserBadgeCodes(userId));
    const proposalCount = await GamificationModel.getProposalCount(userId);
    const voteCount = await GamificationModel.getVoteCount(userId);

    const socialConditions = this.BADGE_CONDITIONS.filter(
      b => ['first_proposal', 'first_vote', 'proposals_10'].includes(b.code)
    );

    const ctx: BadgeContext = {
      totalPoints: 0,
      totalPredictions: 0,
      correctPleno: 0,
      bestStreak: 0,
      proposalCount,
      voteCount,
      isChampion: false,
    };

    for (const condition of socialConditions) {
      if (ownedCodes.has(condition.code)) continue;
      if (condition.check(ctx)) {
        await this.awardBadgeByCode(userId, condition.code);
      }
    }
  }

  private static async checkAllBadges(userId: number): Promise<void> {
    const ownedCodes = new Set(await GamificationModel.getUserBadgeCodes(userId));

    // Get stats
    const [baseStats, streaks] = await Promise.all([
      StatsModel.getPersonalStats(userId),
      StatsModel.getStreaks(userId),
    ]);
    const proposalCount = await GamificationModel.getProposalCount(userId);
    const voteCount = await GamificationModel.getVoteCount(userId);

    const ctx: BadgeContext = {
      totalPoints: baseStats.totalPoints,
      totalPredictions: baseStats.totalPredictions,
      correctPleno: baseStats.correctPleno,
      bestStreak: streaks.bestStreak,
      proposalCount,
      voteCount,
      isChampion: false,
    };

    // Check non-champion badges first
    for (const condition of this.BADGE_CONDITIONS) {
      if (condition.code === 'group_champion') continue;
      if (ownedCodes.has(condition.code)) continue;
      if (condition.check(ctx)) {
        await this.awardBadgeByCode(userId, condition.code);
      }
    }

    // Check champion badge (more expensive query)
    if (!ownedCodes.has('group_champion')) {
      const isChampion = await GamificationModel.isGroupChampion(userId);
      if (isChampion) {
        await this.awardBadgeByCode(userId, 'group_champion');
      }
    }
  }

  private static async awardBadgeByCode(userId: number, code: string): Promise<void> {
    const badge = await GamificationModel.getBadgeByCode(code);
    if (!badge) return;

    const awarded = await GamificationModel.awardBadge(userId, badge.id);
    if (!awarded) return; // Already had the badge

    // Grant XP reward
    if (badge.xp_reward > 0) {
      await this.grantXp(userId, badge.xp_reward, 'badge_reward', badge.id);
    }

    // Send notification
    const notification: CreateNotificationDto = {
      user_id: userId,
      type: 'badge_unlocked',
      title: 'Logro desbloqueado!',
      message: `Has obtenido: ${badge.name}`,
      link: '/stats',
    };
    await NotificationModel.create(notification);
    WebPushService.sendToUsers([userId], {
      title: 'Logro desbloqueado!',
      body: `Has obtenido: ${badge.name}`,
    }).catch(() => {});
  }

  /**
   * Award a badge by code if the user doesn't already have it.
   * Used by ChallengeService and other modules to award badges externally.
   */
  static async awardBadgeIfEligible(userId: number, badgeCode: string): Promise<void> {
    const ownedCodes = new Set(await GamificationModel.getUserBadgeCodes(userId));
    if (ownedCodes.has(badgeCode)) return;
    await this.awardBadgeByCode(userId, badgeCode);
  }

  static async getUserGamification(userId: number): Promise<UserGamificationData> {
    await GamificationModel.ensureUserXp(userId);
    const [xpData, badges, unseenCount] = await Promise.all([
      GamificationModel.getUserXp(userId),
      GamificationModel.getUserBadges(userId),
      GamificationModel.getUnseenCount(userId),
    ]);

    const level = this.calculateLevel(xpData.total_xp);
    const xpForCurrentLevel = this.LEVEL_THRESHOLDS[level - 1] || 0;
    const xpForNextLevel = this.LEVEL_THRESHOLDS[level] || this.LEVEL_THRESHOLDS[this.LEVEL_THRESHOLDS.length - 1];

    return {
      xp: xpData.total_xp,
      level,
      xpForCurrentLevel,
      xpForNextLevel,
      badges,
      unseenCount,
    };
  }
}
