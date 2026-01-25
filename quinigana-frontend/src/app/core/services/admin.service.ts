import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/user.model';
import { UserAdmin, GlobalStats, GroupAdmin, PaginatedResponse } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getUsers(page: number, limit: number, search?: string): Observable<ApiResponse<PaginatedResponse<UserAdmin>>> {
    let url = `${this.apiUrl}/admin/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<ApiResponse<PaginatedResponse<UserAdmin>>>(url);
  }

  toggleAdmin(userId: number): Observable<ApiResponse<{ is_admin: boolean }>> {
    return this.http.patch<ApiResponse<{ is_admin: boolean }>>(`${this.apiUrl}/admin/users/${userId}/toggle-admin`, {});
  }

  toggleActive(userId: number): Observable<ApiResponse<{ is_active: boolean }>> {
    return this.http.patch<ApiResponse<{ is_active: boolean }>>(`${this.apiUrl}/admin/users/${userId}/toggle-active`, {});
  }

  getGlobalStats(): Observable<ApiResponse<GlobalStats>> {
    return this.http.get<ApiResponse<GlobalStats>>(`${this.apiUrl}/admin/stats`);
  }

  getAllGroups(page: number, limit: number, search?: string): Observable<ApiResponse<PaginatedResponse<GroupAdmin>>> {
    let url = `${this.apiUrl}/admin/groups?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<ApiResponse<PaginatedResponse<GroupAdmin>>>(url);
  }

  deactivateGroup(groupId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/admin/groups/${groupId}/deactivate`, {});
  }

  updateMatch(matchId: number, data: { home_team?: string; away_team?: string; match_date?: string }): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/admin/matches/${matchId}`, data);
  }

  reopenJornada(jornadaId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/admin/jornadas/${jornadaId}/reopen`, {});
  }

  getFootballDataCurrentMatchday(competition: string): Observable<ApiResponse<{ matchday: number }>> {
    return this.http.get<ApiResponse<{ matchday: number }>>(`${this.apiUrl}/admin/football-data/current-matchday?competition=${competition}`);
  }

  getFootballDataResults(competition: string, matchday: number): Observable<ApiResponse<{ match_number: number; home_team: string; away_team: string; home_score: number | null; away_score: number | null; status: string; sign: string | null }[]>> {
    return this.http.get<ApiResponse<{ match_number: number; home_team: string; away_team: string; home_score: number | null; away_score: number | null; status: string; sign: string | null }[]>>(
      `${this.apiUrl}/admin/football-data/results?competition=${competition}&matchday=${matchday}`
    );
  }

  getFootballDataMatches(competition: string, matchday: number): Observable<ApiResponse<{ match_number: number; home_team: string; away_team: string; match_date: string }[]>> {
    return this.http.get<ApiResponse<{ match_number: number; home_team: string; away_team: string; match_date: string }[]>>(
      `${this.apiUrl}/admin/football-data/matches?competition=${competition}&matchday=${matchday}`
    );
  }

  getQuinielaMatches(): Observable<ApiResponse<{ match_number: number; home_team: string; away_team: string; match_date: string }[]>> {
    return this.http.get<ApiResponse<{ match_number: number; home_team: string; away_team: string; match_date: string }[]>>(
      `${this.apiUrl}/admin/quiniela/matches`
    );
  }
}
