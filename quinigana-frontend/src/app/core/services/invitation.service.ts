import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/user.model';
import { GroupInvitation } from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  pendingInvitations = signal<GroupInvitation[]>([]);
  loading = signal(false);

  getPending(): Observable<ApiResponse<GroupInvitation[]>> {
    this.loading.set(true);
    return this.http.get<ApiResponse<GroupInvitation[]>>(`${this.apiUrl}/invitations/pending`).pipe(
      tap(res => {
        if (res.success && res.data) this.pendingInvitations.set(res.data);
        this.loading.set(false);
      })
    );
  }

  accept(invitationId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/invitations/${invitationId}/accept`, {});
  }

  reject(invitationId: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/invitations/${invitationId}/reject`, {});
  }
}
