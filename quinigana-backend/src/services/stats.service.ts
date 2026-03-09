import { StatsModel } from '../models/stats.model';
import { PersonalStats, GroupHistoryEntry, JornadaDetailResult, GroupRankingEntry, PaginatedResponse } from '../types';
import { CacheService } from './cache.service';
import { CacheKey } from '../config/cache';

export class StatsService {
  static async getPersonalStats(userId: number, seasonId?: number): Promise<PersonalStats> {
    const [baseStats, evolution, groupComparison, streaks] = await Promise.all([
      StatsModel.getPersonalStats(userId, seasonId),
      StatsModel.getEvolution(userId, seasonId),
      StatsModel.getGroupComparison(userId, seasonId),
      StatsModel.getStreaks(userId, seasonId),
    ]);

    return {
      ...baseStats,
      accuracy1x2Percent: baseStats.totalPredictions > 0
        ? Math.round((baseStats.correct1x2 / baseStats.totalPredictions) * 100)
        : 0,
      accuracyPlenoPercent: baseStats.totalPredictions > 0
        ? Math.round((baseStats.correctPleno / baseStats.totalPredictions) * 100)
        : 0,
      currentStreak: streaks.currentStreak,
      bestStreak: streaks.bestStreak,
      evolution,
      groupComparison,
    };
  }

  static async getGroupHistory(groupId: number, page: number, limit: number): Promise<PaginatedResponse<GroupHistoryEntry>> {
    const { items, total } = await StatsModel.getGroupHistory(groupId, page, limit);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getJornadaDetail(groupId: number, jornadaId: number): Promise<JornadaDetailResult | null> {
    return StatsModel.getJornadaDetail(groupId, jornadaId);
  }

  static async getGroupRankings(groupId: number): Promise<GroupRankingEntry[]> {
    return StatsModel.getGroupRankings(groupId);
  }

  static async getPredictionHistory(userId: number, page: number, limit: number) {
    const { items, total } = await StatsModel.getPredictionHistory(userId, page, limit);
    return {
      items: items.map(item => ({
        ...item,
        accuracy1x2Percent: item.totalMatches > 0
          ? Math.round((item.correct1x2 / item.totalMatches) * 100)
          : 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getGlobalRankings(page: number, limit: number) {
    // Cache global rankings (frequently accessed, expensive query)
    const cacheKey = CacheService.buildKey(CacheKey.RANKINGS, 'global', page, limit);
    const cached = CacheService.get<any>(cacheKey);
    if (cached) return cached;

    const { items, total } = await StatsModel.getGlobalRankings(page, limit);
    const totalPages = Math.ceil(total / limit);
    const result = {
      items: items.map((item: any) => ({
        groupId: item.group_id,
        groupName: item.group_name,
        memberCount: Number(item.member_count),
        totalPoints: Number(item.total_points),
        totalJornadas: Number(item.total_jornadas),
        correct1x2: Number(item.correct_1x2),
        correctPleno: Number(item.correct_pleno),
      })),
      total,
      page,
      limit,
      totalPages,
    };

    CacheService.set(cacheKey, result);
    return result;
  }

  static async getExportData(userId: number): Promise<string> {
    const rows = await StatsModel.getExportData(userId);
    const header = 'Jornada,Grupo,Fecha,Puntos,Aciertos 1X2,Plenos';
    const lines = rows.map((r: any) =>
      `"${r.jornadaName}","${r.groupName}","${r.finishedAt}",${r.totalPoints},${r.correct1x2},${r.correctPleno}`
    );
    return [header, ...lines].join('\n');
  }

  static async getPredictionsHeatmap(userId: number, limit: number = 10) {
    return StatsModel.getPredictionsHeatmap(userId, limit);
  }
}
