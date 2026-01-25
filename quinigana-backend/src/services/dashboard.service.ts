import { DashboardModel } from '../models/dashboard.model';
import { DashboardData } from '../types';

export class DashboardService {
  static async getDashboardData(userId: number): Promise<DashboardData> {
    const [activeJornada, myGroups, latestResults, stats] = await Promise.all([
      DashboardModel.getActiveJornada(userId),
      DashboardModel.getUserGroupsWithScores(userId),
      DashboardModel.getLatestResults(userId, 5),
      DashboardModel.getUserStats(userId),
    ]);

    return {
      activeJornada,
      myGroups,
      latestResults,
      stats,
    };
  }
}
