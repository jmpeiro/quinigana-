jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));
jest.mock('../../config/environment', () => ({
  env: { nodeEnv: 'test' },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../models/jornada.model');
jest.mock('../../services/score.service');
jest.mock('../../services/challenge.service');
jest.mock('../../services/gamification.service');
jest.mock('../../models/user.model');

import cron from 'node-cron';
import { SchedulerService } from '../../services/scheduler.service';
import { JornadaModel } from '../../models/jornada.model';
import { ScoreService } from '../../services/score.service';
import { ChallengeService } from '../../services/challenge.service';
import { GamificationService } from '../../services/gamification.service';
import { UserModel } from '../../models/user.model';

const mockJornadaModel = JornadaModel as jest.Mocked<typeof JornadaModel>;
const mockScoreService = ScoreService as jest.Mocked<typeof ScoreService>;
const mockChallengeService = ChallengeService as jest.Mocked<typeof ChallengeService>;
const mockGamificationService = GamificationService as jest.Mocked<typeof GamificationService>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockCronSchedule = cron.schedule as jest.Mock;

describe('SchedulerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static initialized flag
    (SchedulerService as any).initialized = false;
  });

  describe('init', () => {
    it('should schedule three cron jobs on init', () => {
      // Mock immediate tasks to resolve
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      SchedulerService.init();

      expect(mockCronSchedule).toHaveBeenCalledTimes(3);
      // Every 5 min, every 30 min, daily at 3 AM
      expect(mockCronSchedule.mock.calls[0][0]).toBe('*/5 * * * *');
      expect(mockCronSchedule.mock.calls[1][0]).toBe('*/30 * * * *');
      expect(mockCronSchedule.mock.calls[2][0]).toBe('0 3 * * *');
    });

    it('should not re-initialize if already initialized', () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      SchedulerService.init();
      SchedulerService.init(); // Second call

      expect(mockCronSchedule).toHaveBeenCalledTimes(3); // Only called once
    });

    it('should run processJornadas on startup', async () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      SchedulerService.init();

      // Wait for async tasks
      await new Promise(r => setTimeout(r, 50));

      expect(mockJornadaModel.findOpenPastDeadline).toHaveBeenCalled();
      expect(mockJornadaModel.findClosedWithAllResults).toHaveBeenCalled();
    });
  });

  describe('closeExpiredJornadas (via processJornadas)', () => {
    it('should close jornadas past deadline', async () => {
      const expiredJornadas = [
        { id: 1, name: 'Jornada 1' },
        { id: 2, name: 'Jornada 2' },
      ];
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue(expiredJornadas as any);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockJornadaModel.updateStatus.mockResolvedValue(undefined as any);

      // Access the private method through init
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);
      SchedulerService.init();
      await new Promise(r => setTimeout(r, 50));

      expect(mockJornadaModel.updateStatus).toHaveBeenCalledWith(1, 'closed');
      expect(mockJornadaModel.updateStatus).toHaveBeenCalledWith(2, 'closed');
    });

    it('should handle errors gracefully when closing individual jornadas', async () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([{ id: 1, name: 'J1' }] as any);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockJornadaModel.updateStatus.mockRejectedValueOnce(new Error('DB error'));
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      // Should not throw
      SchedulerService.init();
      await new Promise(r => setTimeout(r, 50));
    });
  });

  describe('finishCompletedJornadas (via processJornadas)', () => {
    it('should score, finish, resolve challenges, and process gamification', async () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([
        { id: 10, name: 'Completed Jornada' },
      ] as any);
      mockScoreService.calculateScoresForJornada.mockResolvedValue(undefined);
      mockJornadaModel.updateStatus.mockResolvedValue(undefined as any);
      mockChallengeService.resolveChallengesForJornada.mockResolvedValue(undefined);
      mockGamificationService.processJornadaAchievements.mockResolvedValue(undefined);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      SchedulerService.init();
      await new Promise(r => setTimeout(r, 100));

      expect(mockScoreService.calculateScoresForJornada).toHaveBeenCalledWith(10);
      expect(mockJornadaModel.updateStatus).toHaveBeenCalledWith(10, 'finished');
      expect(mockChallengeService.resolveChallengesForJornada).toHaveBeenCalledWith(10);
      expect(mockGamificationService.processJornadaAchievements).toHaveBeenCalledWith(10);
    });
  });

  describe('expirePendingChallenges', () => {
    it('should call ChallengeService.expirePendingChallenges on startup', async () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(3);

      SchedulerService.init();
      await new Promise(r => setTimeout(r, 50));

      expect(mockChallengeService.expirePendingChallenges).toHaveBeenCalled();
    });
  });

  describe('processPendingDeletions (via cron)', () => {
    it('should soft-delete users past grace period when cron fires', async () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      SchedulerService.init();

      // Get the daily cron callback (3rd schedule call)
      const dailyCronCallback = mockCronSchedule.mock.calls[2][1];

      mockUserModel.findPendingDeletions.mockResolvedValue([100, 200]);
      mockUserModel.softDelete.mockResolvedValue(undefined as any);

      await dailyCronCallback();

      expect(mockUserModel.findPendingDeletions).toHaveBeenCalledWith(30);
      expect(mockUserModel.softDelete).toHaveBeenCalledWith(100);
      expect(mockUserModel.softDelete).toHaveBeenCalledWith(200);
    });

    it('should skip when no pending deletions', async () => {
      mockJornadaModel.findOpenPastDeadline.mockResolvedValue([]);
      mockJornadaModel.findClosedWithAllResults.mockResolvedValue([]);
      mockChallengeService.expirePendingChallenges.mockResolvedValue(0);

      SchedulerService.init();
      const dailyCronCallback = mockCronSchedule.mock.calls[2][1];

      mockUserModel.findPendingDeletions.mockResolvedValue([]);

      await dailyCronCallback();

      expect(mockUserModel.softDelete).not.toHaveBeenCalled();
    });
  });
});
