import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { UserGamificationData, BadgeDefinition } from '../models/gamification.model';

@Injectable({ providedIn: 'root' })
export class GamificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMyGamification(): Observable<ApiResponse<UserGamificationData>> {
    return this.http.get<ApiResponse<UserGamificationData>>(`${this.apiUrl}/gamification/me`);
  }

  getAllBadges(): Observable<ApiResponse<BadgeDefinition[]>> {
    return this.http.get<ApiResponse<BadgeDefinition[]>>(`${this.apiUrl}/gamification/badges`);
  }

  markBadgesSeen(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/gamification/badges/seen`, {});
  }
}
