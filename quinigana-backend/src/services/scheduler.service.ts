import cron from 'node-cron';
import { JornadaModel } from '../models/jornada.model';
import { ScoreService } from './score.service';
import { ChallengeService } from './challenge.service';
import { GamificationService } from './gamification.service';
import { UserModel } from '../models/user.model';
import logger from '../config/logger';

const SOFT_DELETE_GRACE_PERIOD_DAYS = 30;

export class SchedulerService {
  private static initialized = false;

  static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    logger.info('Initializing cron jobs...');

    // Run every 5 minutes to check for jornadas to close/finish
    cron.schedule('*/5 * * * *', async () => {
      await this.processJornadas();
    });

    // Run every 30 minutes to expire old pending challenges (48h rule)
    cron.schedule('*/30 * * * *', async () => {
      await this.expirePendingChallenges();
    });

    // Run daily at 3:00 AM to process pending account soft-deletions (30-day grace period)
    cron.schedule('0 3 * * *', async () => {
      await this.processPendingDeletions();
    });

    // Run immediately on startup
    this.processJornadas().catch(err => {
      logger.error({ error: err }, 'Error on initial jornada run');
    });
    this.expirePendingChallenges().catch(err => {
      logger.error({ error: err }, 'Error on initial challenge expiry run');
    });

    logger.info('Cron jobs initialized. Jornadas: every 5 min. Challenge expiry: every 30 min. Soft-delete: daily 3 AM.');
  }

  private static async processJornadas(): Promise<void> {
    try {
      await this.closeExpiredJornadas();
      await this.finishCompletedJornadas();
    } catch (err) {
      logger.error({ error: err }, 'Error processing jornadas');
    }
  }

  private static async closeExpiredJornadas(): Promise<void> {
    const expiredJornadas = await JornadaModel.findOpenPastDeadline();

    for (const jornada of expiredJornadas) {
      try {
        await JornadaModel.updateStatus(jornada.id, 'closed');
        logger.info({ jornadaId: jornada.id, name: jornada.name }, 'Jornada closed - deadline passed');
      } catch (err) {
        logger.error({ error: err, jornadaId: jornada.id }, 'Error closing jornada');
      }
    }
  }

  private static async finishCompletedJornadas(): Promise<void> {
    const completedJornadas = await JornadaModel.findClosedWithAllResults();

    for (const jornada of completedJornadas) {
      try {
        // Calculate scores before marking as finished
        await ScoreService.calculateScoresForJornada(jornada.id);
        await JornadaModel.updateStatus(jornada.id, 'finished');
        logger.info({ jornadaId: jornada.id, name: jornada.name }, 'Jornada finished - scores calculated');

        // Resolve challenges for this jornada
        try {
          await ChallengeService.resolveChallengesForJornada(jornada.id);
          logger.info({ jornadaId: jornada.id }, 'Challenges resolved');
        } catch (err) {
          logger.error({ error: err, jornadaId: jornada.id }, 'Error resolving challenges');
        }

        // Process gamification achievements for this jornada
        try {
          await GamificationService.processJornadaAchievements(jornada.id);
          logger.info({ jornadaId: jornada.id }, 'Gamification processed');
        } catch (err) {
          logger.error({ error: err, jornadaId: jornada.id }, 'Error processing gamification');
        }
      } catch (err) {
        logger.error({ error: err, jornadaId: jornada.id }, 'Error finishing jornada');
      }
    }
  }

  /**
   * Expire pending challenges that have been waiting for more than 48 hours.
   */
  private static async expirePendingChallenges(): Promise<void> {
    try {
      const count = await ChallengeService.expirePendingChallenges();
      if (count > 0) {
        logger.info({ count }, 'Expired pending challenges (48h timeout)');
      }
    } catch (err) {
      logger.error({ error: err }, 'Error expiring pending challenges');
    }
  }

  /**
   * Process accounts that requested deletion and have passed the grace period.
   * Applies soft-delete (sets deleted_at) for accounts where deletion_requested_at
   * is older than SOFT_DELETE_GRACE_PERIOD_DAYS days (migration 020).
   */
  private static async processPendingDeletions(): Promise<void> {
    try {
      const userIds = await UserModel.findPendingDeletions(SOFT_DELETE_GRACE_PERIOD_DAYS);
      if (userIds.length === 0) return;

      for (const userId of userIds) {
        try {
          await UserModel.softDelete(userId);
          logger.info({ userId }, 'Soft-deleted user (grace period expired)');
        } catch (err) {
          logger.error({ error: err, userId }, 'Error soft-deleting user');
        }
      }

      logger.info({ count: userIds.length }, 'Processed pending deletions');
    } catch (err) {
      logger.error({ error: err }, 'Error processing pending deletions');
    }
  }
}
