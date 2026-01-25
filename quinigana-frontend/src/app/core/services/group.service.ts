import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/user.model';
import { Group, GroupMember, CreateGroupDto } from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  groups = signal<Group[]>([]);
  loading = signal(false);

  getMyGroups(): Observable<ApiResponse<Group[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<Group[]>>(`${this.apiUrl}/groups`).pipe(
      tap(res => {
        if (res.success && res.data) this.groups.set(res.data);
        this.loading.set(false);
      })
    );
  }

  getGroupDetail(id: number): Observable<ApiResponse<Group>> {
    return this.http.get<ApiResponse<Group>>(`${this.apiUrl}/groups/${id}`);
  }

  createGroup(data: CreateGroupDto): Observable<ApiResponse<Group>> {
    return this.http.post<ApiResponse<Group>>(`${this.apiUrl}/groups`, data);
  }

  updateGroup(id: number, data: Partial<CreateGroupDto>): Observable<ApiResponse<Group>> {
    return this.http.patch<ApiResponse<Group>>(`${this.apiUrl}/groups/${id}`, data);
  }

  deleteGroup(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/groups/${id}`);
  }

  getMembers(groupId: number): Observable<ApiResponse<GroupMember[]>> {
    return this.http.get<ApiResponse<GroupMember[]>>(`${this.apiUrl}/groups/${groupId}/members`);
  }

  removeMember(groupId: number, userId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/groups/${groupId}/members/${userId}`);
  }

  leaveGroup(groupId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/groups/${groupId}/leave`, {});
  }

  inviteUser(groupId: number, userId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/groups/${groupId}/invitations`, { user_id: userId });
  }

  generateInviteLink(groupId: number): Observable<ApiResponse<{ token: string; expiresAt: string }>> {
    return this.http.post<ApiResponse<{ token: string; expiresAt: string }>>(`${this.apiUrl}/invite-links/groups/${groupId}/generate`, {});
  }

  getInviteLinkInfo(token: string): Observable<ApiResponse<{ groupName: string; groupDescription: string | null; memberCount: number; expiresAt: string }>> {
    return this.http.get<ApiResponse<{ groupName: string; groupDescription: string | null; memberCount: number; expiresAt: string }>>(`${this.apiUrl}/invite-links/${token}`);
  }

  acceptInviteLink(token: string): Observable<ApiResponse<{ groupId: number }>> {
    return this.http.post<ApiResponse<{ groupId: number }>>(`${this.apiUrl}/invite-links/${token}/accept`, {});
  }

  getActivity(groupId: number, page: number = 1, limit: number = 20): Observable<ApiResponse<{ items: ActivityEntry[]; total: number }>> {
    return this.http.get<ApiResponse<{ items: ActivityEntry[]; total: number }>>(`${this.apiUrl}/groups/${groupId}/activity?page=${page}&limit=${limit}`);
  }
}

export interface ActivityEntry {
  type: 'proposal_created' | 'vote_cast' | 'results_published' | 'member_joined' | 'proposal_approved';
  userName: string;
  detail: string;
  createdAt: string;
}
