import { DashboardModel } from '../models/dashboard.model';
import { DashboardData } from '../types';

export class DashboardService {
  static async getDashboardData(userId: number): Promise<DashboardData> {
    console.log('[DASHBOARD SERVICE] Fetching dashboard data for user:', userId);

    // Fetch active jornada
    const activeJornada = await DashboardModel.getActiveJornada(userId);
    console.log('[DASHBOARD SERVICE] Active jornada:', activeJornada ? activeJornada.id : 'None');

    // Fetch user groups
    const myGroups = await DashboardModel.getUserGroupsWithScores(userId);
    console.log('[DASHBOARD SERVICE] User groups count:', myGroups.length);

    // Fetch latest results with error handling
    let latestResults: any[] = [];
    try {
      latestResults = await DashboardModel.getLatestResults(userId, 5);
      console.log('[DASHBOARD SERVICE] Latest results fetched:', latestResults.length);
    } catch (error) {
      console.error('[DASHBOARD SERVICE] Error fetching latest results (will return empty):', error);
      // Return empty array instead of failing the whole dashboard
      latestResults = [];
    }

    // Fetch user stats
    const stats = await DashboardModel.getUserStats(userId);
    console.log('[DASHBOARD SERVICE] User stats:', stats);

    return {
      activeJornada,
      myGroups,
      latestResults,
      stats,
    };
  }
}
