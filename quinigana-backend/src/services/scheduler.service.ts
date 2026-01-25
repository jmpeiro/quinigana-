import cron from 'node-cron';
import { JornadaModel } from '../models/jornada.model';
import { ScoreService } from './score.service';

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

    // Run immediately on startup
    this.processJornadas().catch(err => {
      console.error('[Scheduler] Error on initial run:', err);
    });

    console.log('[Scheduler] Cron jobs initialized. Running every 5 minutes.');
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
      } catch (err) {
        console.error(`[Scheduler] Error finishing jornada ${jornada.id}:`, err);
      }
    }
  }
}
