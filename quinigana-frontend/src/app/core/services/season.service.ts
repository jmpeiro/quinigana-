import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { Season, SeasonWithStats, CreateSeasonDto, UpdateSeasonDto, SeasonStats } from '../models/season.model';

@Injectable({ providedIn: 'root' })
export class SeasonService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Signal to track the currently selected season for filtering
  selectedSeasonId = signal<number | null>(null);

  // Signal for available seasons
  seasons = signal<SeasonWithStats[]>([]);

  // Signal for current season
  currentSeason = signal<Season | null>(null);

  getAll(): Observable<ApiResponse<SeasonWithStats[]>> {
    return this.http.get<ApiResponse<SeasonWithStats[]>>(`${this.apiUrl}/seasons`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.seasons.set(response.data);
        }
      })
    );
  }

  getById(id: number): Observable<ApiResponse<Season>> {
    return this.http.get<ApiResponse<Season>>(`${this.apiUrl}/seasons/${id}`);
  }

  getCurrent(): Observable<ApiResponse<Season | null>> {
    return this.http.get<ApiResponse<Season | null>>(`${this.apiUrl}/seasons/current`).pipe(
      tap(response => {
        if (response.success) {
          this.currentSeason.set(response.data ?? null);
        }
      })
    );
  }

  getStats(id: number): Observable<ApiResponse<SeasonStats>> {
    return this.http.get<ApiResponse<SeasonStats>>(`${this.apiUrl}/seasons/${id}/stats`);
  }

  // Admin methods
  create(data: CreateSeasonDto): Observable<ApiResponse<Season>> {
    return this.http.post<ApiResponse<Season>>(`${this.apiUrl}/seasons`, data);
  }

  update(id: number, data: UpdateSeasonDto): Observable<ApiResponse<Season>> {
    return this.http.put<ApiResponse<Season>>(`${this.apiUrl}/seasons/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/seasons/${id}`);
  }

  setAsCurrent(id: number): Observable<ApiResponse<Season>> {
    return this.http.post<ApiResponse<Season>>(`${this.apiUrl}/seasons/${id}/set-current`, {});
  }

  // Helper to set selected season for filtering
  selectSeason(seasonId: number | null): void {
    this.selectedSeasonId.set(seasonId);
  }

  // Helper to get display name for a season
  getSeasonDisplayName(seasonId: number | null): string {
    if (!seasonId) return 'Todas las temporadas';
    const season = this.seasons().find(s => s.id === seasonId);
    return season?.display_name || 'Temporada';
  }
}
