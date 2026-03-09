import { DashboardModel } from '../models/dashboard.model';
import { DashboardData } from '../types';
import { CacheService } from './cache.service';
import { CacheKey } from '../config/cache';

export class DashboardService {
  static async getDashboardData(userId: number): Promise<DashboardData> {
    const cacheKey = CacheService.buildKey(CacheKey.DASHBOARD, userId);
    const cached = CacheService.get<DashboardData>(cacheKey);
    if (cached) return cached;

    const [activeJornada, myGroups, latestResults, stats] = await Promise.all([
      DashboardModel.getActiveJornada(userId),
      DashboardModel.getUserGroupsWithScores(userId),
      DashboardModel.getLatestResults(userId, 5),
      DashboardModel.getUserStats(userId),
    ]);

    const data: DashboardData = {
      activeJornada,
      myGroups,
      latestResults,
      stats,
    };

    // Cache for 5 minutes (default TTL)
    CacheService.set(cacheKey, data);

    return data;
  }
}
