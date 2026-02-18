import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import {
  ChallengeWithDetails,
  ChallengeStats,
  RivalryStats,
  HeadToHeadResponse,
  CreateChallengeDto,
  PaginatedChallenges,
} from '../models/challenge.model';

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  create(dto: CreateChallengeDto): Observable<ApiResponse<ChallengeWithDetails>> {
    return this.http.post<ApiResponse<ChallengeWithDetails>>(
      `${this.apiUrl}/challenges`,
      dto
    );
  }

  getMyChallenges(
    status?: string,
    page = 1,
    limit = 20
  ): Observable<ApiResponse<PaginatedChallenges>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PaginatedChallenges>>(
      `${this.apiUrl}/challenges`,
      { params }
    );
  }

  getPending(): Observable<ApiResponse<ChallengeWithDetails[]>> {
    return this.http.get<ApiResponse<ChallengeWithDetails[]>>(
      `${this.apiUrl}/challenges/pending`
    );
  }

  getById(id: number): Observable<ApiResponse<ChallengeWithDetails>> {
    return this.http.get<ApiResponse<ChallengeWithDetails>>(
      `${this.apiUrl}/challenges/${id}`
    );
  }

  accept(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/challenges/${id}/accept`,
      {}
    );
  }

  reject(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/challenges/${id}/reject`,
      {}
    );
  }

  cancel(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.apiUrl}/challenges/${id}/cancel`,
      {}
    );
  }

  getMyStats(): Observable<ApiResponse<ChallengeStats>> {
    return this.http.get<ApiResponse<ChallengeStats>>(
      `${this.apiUrl}/challenges/stats`
    );
  }

  getRivalries(): Observable<ApiResponse<RivalryStats[]>> {
    return this.http.get<ApiResponse<RivalryStats[]>>(
      `${this.apiUrl}/challenges/rivalries`
    );
  }

  getHeadToHead(opponentId: number, limit: number = 10): Observable<ApiResponse<HeadToHeadResponse>> {
    return this.http.get<ApiResponse<HeadToHeadResponse>>(
      `${this.apiUrl}/challenges/head-to-head/${opponentId}?limit=${limit}`
    );
  }

  autoGenerateWeekly(): Observable<ApiResponse<{
    created: number;
    skippedExisting: number;
    skippedInsufficientMembers: number;
    jornadasProcessed: number;
  }>> {
    return this.http.post<ApiResponse<{
      created: number;
      skippedExisting: number;
      skippedInsufficientMembers: number;
      jornadasProcessed: number;
    }>>(
      `${this.apiUrl}/challenges/auto-generate`,
      {}
    );
  }
}
