import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { DashboardData, LiveMatch, UserPrediction } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDashboardData(): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.apiUrl}/dashboard`);
  }

  getLiveScores(jornadaId: number): Observable<ApiResponse<LiveMatch[]>> {
    return this.http.get<ApiResponse<LiveMatch[]>>(`${this.apiUrl}/jornadas/${jornadaId}/live-scores`);
  }

  getMyPredictions(jornadaId: number): Observable<ApiResponse<UserPrediction[]>> {
    return this.http.get<ApiResponse<UserPrediction[]>>(`${this.apiUrl}/jornadas/${jornadaId}/my-predictions`);
  }
}
