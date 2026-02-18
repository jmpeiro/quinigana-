import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { GroupScoresResponse, GroupScore } from '../models/proposal.model';

@Injectable({ providedIn: 'root' })
export class ScoreService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getGroupScores(groupId: number): Observable<ApiResponse<GroupScoresResponse>> {
    return this.http.get<ApiResponse<GroupScoresResponse>>(`${this.apiUrl}/groups/${groupId}/scores`);
  }

  getGroupScoreByJornada(groupId: number, jornadaId: number): Observable<ApiResponse<GroupScore>> {
    return this.http.get<ApiResponse<GroupScore>>(`${this.apiUrl}/groups/${groupId}/scores/${jornadaId}`);
  }
}
