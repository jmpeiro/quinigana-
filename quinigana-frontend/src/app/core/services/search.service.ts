import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SearchResults {
  groups: Array<{ id: number; name: string; description: string; member_count: number }>;
  users: Array<{ id: number; first_name: string; last_name: string; avatar_url: string | null }>;
  jornadas: Array<{ id: number; name: string; status: string; deadline: string }>;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);

  search(query: string): Observable<SearchResults> {
    if (!query || query.trim().length < 2) {
      return of({ groups: [], users: [], jornadas: [] });
    }
    return this.http.get<any>(
      `${environment.apiUrl}/search?q=${encodeURIComponent(query.trim())}`,
      { withCredentials: true }
    ).pipe(
      map(res => res.data || { groups: [], users: [], jornadas: [] })
    );
  }
}
