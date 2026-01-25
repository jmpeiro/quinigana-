import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { GroupMemberLiveScore, GroupComparisonData } from '../models/comparison.model';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getGroupJornadaRanking(groupId: number, jornadaId: number): Observable<ApiResponse<GroupMemberLiveScore[]>> {
    return this.http.get<ApiResponse<GroupMemberLiveScore[]>>(
      `${this.apiUrl}/groups/${groupId}/jornadas/${jornadaId}/ranking`
    );
  }

  getGroupJornadaComparison(groupId: number, jornadaId: number): Observable<ApiResponse<GroupComparisonData>> {
    return this.http.get<ApiResponse<GroupComparisonData>>(
      `${this.apiUrl}/groups/${groupId}/jornadas/${jornadaId}/comparison`
    );
  }
}
