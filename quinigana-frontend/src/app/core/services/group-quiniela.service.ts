import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  GroupQuinielaWithDetails,
  GroupQuinielaRanking,
  CreateGroupQuinielaDto,
  SavePredictionsDto,
  SubmitResultsDto,
  GroupQuinielaPrediction,
  MembersPredictionsData
} from '../models/group-quiniela.model';

@Injectable({ providedIn: 'root' })
export class GroupQuinielaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/group-quinielas`;

  // Get user's active quinielas from all groups
  getMyActiveQuinielas(): Observable<ApiResponse<(GroupQuinielaWithDetails & { has_predicted: boolean })[]>> {
    return this.http.get<ApiResponse<(GroupQuinielaWithDetails & { has_predicted: boolean })[]>>(`${this.apiUrl}/active`);
  }

  // Get all quinielas for a group
  getByGroup(groupId: number): Observable<ApiResponse<GroupQuinielaWithDetails[]>> {
    return this.http.get<ApiResponse<GroupQuinielaWithDetails[]>>(`${this.apiUrl}/group/${groupId}`);
  }

  // Get quiniela details with matches
  getById(id: number): Observable<ApiResponse<GroupQuinielaWithDetails>> {
    return this.http.get<ApiResponse<GroupQuinielaWithDetails>>(`${this.apiUrl}/${id}`);
  }

  // Get ranking for a quiniela
  getRanking(id: number): Observable<ApiResponse<GroupQuinielaRanking[]>> {
    return this.http.get<ApiResponse<GroupQuinielaRanking[]>>(`${this.apiUrl}/${id}/ranking`);
  }

  // Create a new quiniela
  create(data: CreateGroupQuinielaDto): Observable<ApiResponse<GroupQuinielaWithDetails>> {
    return this.http.post<ApiResponse<GroupQuinielaWithDetails>>(this.apiUrl, data);
  }

  // Save predictions
  savePredictions(quinielaId: number, data: SavePredictionsDto): Observable<ApiResponse<GroupQuinielaPrediction[]>> {
    return this.http.post<ApiResponse<GroupQuinielaPrediction[]>>(`${this.apiUrl}/${quinielaId}/predictions`, data);
  }

  // Submit results (admin/creator)
  submitResults(quinielaId: number, data: SubmitResultsDto): Observable<ApiResponse<{ ranking: GroupQuinielaRanking[] }>> {
    return this.http.post<ApiResponse<{ ranking: GroupQuinielaRanking[] }>>(`${this.apiUrl}/${quinielaId}/results`, data);
  }

  // Close quiniela (admin/creator)
  close(quinielaId: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.patch<ApiResponse<{ message: string }>>(`${this.apiUrl}/${quinielaId}/close`, {});
  }

  // Delete quiniela (admin/creator)
  delete(quinielaId: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/${quinielaId}`);
  }

  // Get all members' predictions for comparison
  getMembersPredictions(quinielaId: number): Observable<ApiResponse<MembersPredictionsData>> {
    return this.http.get<ApiResponse<MembersPredictionsData>>(`${this.apiUrl}/${quinielaId}/members-predictions`);
  }
}
