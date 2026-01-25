import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/user.model';
import { QuinielaProposal, ProposalWithDetails, CreateProposalDto, PaginatedProposals, ProposalComment, PaginatedComments } from '../models/proposal.model';

@Injectable({ providedIn: 'root' })
export class ProposalService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getByGroup(groupId: number, page: number = 1, limit: number = 20): Observable<ApiResponse<PaginatedProposals>> {
    return this.http.get<ApiResponse<PaginatedProposals>>(`${this.apiUrl}/groups/${groupId}/proposals?page=${page}&limit=${limit}`);
  }

  getDetail(groupId: number, proposalId: number): Observable<ApiResponse<ProposalWithDetails>> {
    return this.http.get<ApiResponse<ProposalWithDetails>>(`${this.apiUrl}/groups/${groupId}/proposals/${proposalId}`);
  }

  create(groupId: number, data: CreateProposalDto): Observable<ApiResponse<ProposalWithDetails>> {
    return this.http.post<ApiResponse<ProposalWithDetails>>(`${this.apiUrl}/groups/${groupId}/proposals`, data);
  }

  update(groupId: number, proposalId: number, data: Partial<CreateProposalDto>): Observable<ApiResponse<ProposalWithDetails>> {
    return this.http.patch<ApiResponse<ProposalWithDetails>>(`${this.apiUrl}/groups/${groupId}/proposals/${proposalId}`, data);
  }

  delete(groupId: number, proposalId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/groups/${groupId}/proposals/${proposalId}`);
  }

  submitForVoting(groupId: number, proposalId: number): Observable<ApiResponse<ProposalWithDetails>> {
    return this.http.post<ApiResponse<ProposalWithDetails>>(`${this.apiUrl}/groups/${groupId}/proposals/${proposalId}/submit`, {});
  }

  vote(groupId: number, proposalId: number, vote: 'approve' | 'reject'): Observable<ApiResponse<ProposalWithDetails>> {
    return this.http.post<ApiResponse<ProposalWithDetails>>(`${this.apiUrl}/groups/${groupId}/proposals/${proposalId}/vote`, { vote });
  }

  getComments(groupId: number, proposalId: number, page: number = 1, limit: number = 20): Observable<ApiResponse<PaginatedComments>> {
    return this.http.get<ApiResponse<PaginatedComments>>(
      `${this.apiUrl}/groups/${groupId}/proposals/${proposalId}/comments?page=${page}&limit=${limit}`
    );
  }

  addComment(groupId: number, proposalId: number, message: string): Observable<ApiResponse<ProposalComment>> {
    return this.http.post<ApiResponse<ProposalComment>>(
      `${this.apiUrl}/groups/${groupId}/proposals/${proposalId}/comments`, { message }
    );
  }

  deleteComment(groupId: number, proposalId: number, commentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/groups/${groupId}/proposals/${proposalId}/comments/${commentId}`
    );
  }
}
