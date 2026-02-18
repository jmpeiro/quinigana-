import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { PersonalStats, GroupHistoryResponse, JornadaDetailResult, GroupRankingEntry, PredictionHistoryResponse, GlobalRankingResponse, HeatmapJornada, StreakSummary } from '../models/stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getPersonalStats(seasonId?: number): Observable<ApiResponse<PersonalStats>> {
    const params = seasonId ? `?seasonId=${seasonId}` : '';
    return this.http.get<ApiResponse<PersonalStats>>(`${this.apiUrl}/stats/me${params}`);
  }

  getGroupHistory(groupId: number, page: number = 1, limit: number = 10): Observable<ApiResponse<GroupHistoryResponse>> {
    return this.http.get<ApiResponse<GroupHistoryResponse>>(`${this.apiUrl}/stats/groups/${groupId}/history?page=${page}&limit=${limit}`);
  }

  getJornadaDetail(groupId: number, jornadaId: number): Observable<ApiResponse<JornadaDetailResult>> {
    return this.http.get<ApiResponse<JornadaDetailResult>>(`${this.apiUrl}/stats/groups/${groupId}/jornadas/${jornadaId}`);
  }

  getGroupRankings(groupId: number): Observable<ApiResponse<GroupRankingEntry[]>> {
    return this.http.get<ApiResponse<GroupRankingEntry[]>>(`${this.apiUrl}/stats/groups/${groupId}/rankings`);
  }

  getPredictionHistory(page: number, limit: number = 20): Observable<ApiResponse<PredictionHistoryResponse>> {
    return this.http.get<ApiResponse<PredictionHistoryResponse>>(
      `${this.apiUrl}/stats/me/predictions?page=${page}&limit=${limit}`
    );
  }

  getGlobalRankings(
    page: number = 1,
    limit: number = 20,
    filters?: { seasonId?: number; groupId?: number }
  ): Observable<ApiResponse<GlobalRankingResponse>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.seasonId) params.set('seasonId', String(filters.seasonId));
    if (filters?.groupId) params.set('groupId', String(filters.groupId));

    return this.http.get<ApiResponse<GlobalRankingResponse>>(
      `${this.apiUrl}/stats/global-rankings?${params.toString()}`
    );
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/stats/export/csv`, { responseType: 'blob' });
  }

  getPredictionsHeatmap(limit: number = 10): Observable<ApiResponse<HeatmapJornada[]>> {
    return this.http.get<ApiResponse<HeatmapJornada[]>>(
      `${this.apiUrl}/stats/me/heatmap?limit=${limit}`
    );
  }

  getStreaks(seasonId?: number): Observable<ApiResponse<StreakSummary>> {
    const params = seasonId ? `?seasonId=${seasonId}` : '';
    return this.http.get<ApiResponse<StreakSummary>>(`${this.apiUrl}/stats/me/streaks${params}`);
  }
}
