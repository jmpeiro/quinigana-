import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/user.model';
import { UserSearchResult } from '../models/group.model';

@Injectable({ providedIn: 'root' })
export class UserSearchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  search(query: string): Observable<ApiResponse<UserSearchResult[]>> {
    return this.http.get<ApiResponse<UserSearchResult[]>>(`${this.apiUrl}/users/search`, {
      params: { q: query }
    });
  }
}
