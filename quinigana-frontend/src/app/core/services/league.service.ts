import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  LeagueDivision,
  LeagueSeason,
  UserLeagueProfile,
  DivisionStandingsResponse,
  LeagueHistory,
} from '../models/league.model';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDivisions(): Observable<ApiResponse<LeagueDivision[]>> {
    return this.http.get<ApiResponse<LeagueDivision[]>>(
      `${this.apiUrl}/leagues/divisions`
    );
  }

  getActiveSeason(): Observable<ApiResponse<LeagueSeason>> {
    return this.http.get<ApiResponse<LeagueSeason>>(
      `${this.apiUrl}/leagues/season`
    );
  }

  getMyProfile(): Observable<ApiResponse<UserLeagueProfile>> {
    return this.http.get<ApiResponse<UserLeagueProfile>>(
      `${this.apiUrl}/leagues/me`
    );
  }

  getDivisionStandings(
    divisionId: number,
    page = 1,
    limit = 50
  ): Observable<ApiResponse<DivisionStandingsResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<DivisionStandingsResponse>>(
      `${this.apiUrl}/leagues/standings/${divisionId}`,
      { params }
    );
  }

  getMyHistory(): Observable<ApiResponse<LeagueHistory[]>> {
    return this.http.get<ApiResponse<LeagueHistory[]>>(
      `${this.apiUrl}/leagues/history`
    );
  }
}
