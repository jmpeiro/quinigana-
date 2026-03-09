import cron from 'node-cron';
import { JornadaModel } from '../models/jornada.model';
import { ScoreService } from './score.service';
import { ChallengeService } from './challenge.service';
import { GamificationService } from './gamification.service';
import { UserModel } from '../models/user.model';

const SOFT_DELETE_GRACE_PERIOD_DAYS = 30;

export class SchedulerService {
  private static initialized = false;

  static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    console.log('[Scheduler] Initializing cron jobs...');

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
      console.error('[Scheduler] Error on initial jornada run:', err);
    });
    this.expirePendingChallenges().catch(err => {
      console.error('[Scheduler] Error on initial challenge expiry run:', err);
    });

    console.log('[Scheduler] Cron jobs initialized. Jornadas: every 5 min. Challenge expiry: every 30 min. Soft-delete: daily 3 AM.');
  }

  private static async processJornadas(): Promise<void> {
    try {
      await this.closeExpiredJornadas();
      await this.finishCompletedJornadas();
    } catch (err) {
      console.error('[Scheduler] Error processing jornadas:', err);
    }
  }

  private static async closeExpiredJornadas(): Promise<void> {
    const expiredJornadas = await JornadaModel.findOpenPastDeadline();

    for (const jornada of expiredJornadas) {
      try {
        await JornadaModel.updateStatus(jornada.id, 'closed');
        console.log(`[Scheduler] Jornada ${jornada.id} (${jornada.name}) closed - deadline passed`);
      } catch (err) {
        console.error(`[Scheduler] Error closing jornada ${jornada.id}:`, err);
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
        console.log(`[Scheduler] Jornada ${jornada.id} (${jornada.name}) finished - all results in, scores calculated`);

        // Resolve challenges for this jornada
        try {
          await ChallengeService.resolveChallengesForJornada(jornada.id);
          console.log(`[Scheduler] Challenges resolved for jornada ${jornada.id}`);
        } catch (err) {
          console.error(`[Scheduler] Error resolving challenges for jornada ${jornada.id}:`, err);
        }

        // Process gamification achievements for this jornada
        try {
          await GamificationService.processJornadaAchievements(jornada.id);
          console.log(`[Scheduler] Gamification processed for jornada ${jornada.id}`);
        } catch (err) {
          console.error(`[Scheduler] Error processing gamification for jornada ${jornada.id}:`, err);
        }
      } catch (err) {
        console.error(`[Scheduler] Error finishing jornada ${jornada.id}:`, err);
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
        console.log(`[Scheduler] Expired ${count} pending challenges (48h timeout)`);
      }
    } catch (err) {
      console.error('[Scheduler] Error expiring pending challenges:', err);
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
          console.log(`[Scheduler] Soft-deleted user ${userId} (grace period expired)`);
        } catch (err) {
          console.error(`[Scheduler] Error soft-deleting user ${userId}:`, err);
        }
      }

      console.log(`[Scheduler] Processed ${userIds.length} pending deletion(s)`);
    } catch (err) {
      console.error('[Scheduler] Error processing pending deletions:', err);
    }
  }
}
