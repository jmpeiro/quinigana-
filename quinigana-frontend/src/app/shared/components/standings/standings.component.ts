import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

interface LeagueStanding {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

@Component({
  selector: 'app-standings',
  standalone: true,
  imports: [MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="standings-card">
      <div class="standings-header">
        <mat-icon>emoji_events</mat-icon>
        <h3>{{ standingsTitle() }}</h3>
      </div>

      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <p>No se pudo cargar</p>
          <button (click)="loadStandings()">Reintentar</button>
        </div>
      } @else {
        <div class="table-container">
          <table class="standings-table">
            <thead>
              <tr>
                <th class="pos">#</th>
                <th class="team">Equipo</th>
                <th class="num">PT</th>
                <th class="num">PJ</th>
                <th class="num hide-mobile">PG</th>
                <th class="num hide-mobile">PE</th>
                <th class="num hide-mobile">PP</th>
                <th class="num hide-mobile">GF</th>
                <th class="num hide-mobile">GC</th>
              </tr>
            </thead>
            <tbody>
              @for (team of standings(); track team.position) {
                <tr [class.champion-zone]="team.position <= 4"
                    [class.europa-zone]="team.position >= 5 && team.position <= 6"
                    [class.relegation-zone]="team.position >= 18">
                  <td class="pos">{{ team.position }}</td>
                  <td class="team">{{ team.team }}</td>
                  <td class="num points">{{ team.points }}</td>
                  <td class="num">{{ team.played }}</td>
                  <td class="num hide-mobile">{{ team.won }}</td>
                  <td class="num hide-mobile">{{ team.drawn }}</td>
                  <td class="num hide-mobile">{{ team.lost }}</td>
                  <td class="num hide-mobile">{{ team.goalsFor }}</td>
                  <td class="num hide-mobile">{{ team.goalsAgainst }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="empty">{{ emptyMessage() }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .standings-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .standings-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #c8a84b;
      }

      h3 {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3rem;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      color: #94a3b8;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0 0 0.75rem;
        font-size: 0.8rem;
      }

      button {
        padding: 0.4rem 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: #c8a84b;
        background: transparent;
        border: 1px solid #c8a84b;
        border-radius: 6px;
        cursor: pointer;
        transition: all 150ms;

        &:hover {
          background: rgba(200, 168, 75, 0.1);
        }
      }
    }

    .table-container {
      max-height: 520px;
      overflow-y: auto;
    }

    .standings-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;

      th, td {
        padding: 0.5rem 0.4rem;
        text-align: left;
        border-bottom: 1px solid #f1f5f9;
      }

      th {
        background: #f8fafc;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: 0.5px;
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .pos {
        width: 28px;
        text-align: center;
        font-weight: 600;
        color: #94a3b8;
      }

      .team {
        font-weight: 500;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 120px;
      }

      .num {
        text-align: center;
        width: 32px;
        color: #64748b;
      }

      .points {
        font-weight: 700;
        color: #1e293b;
      }

      tbody tr {
        transition: background 150ms;

        &:hover {
          background: #f8fafc;
        }
      }

      .champion-zone {
        .pos {
          color: #16a34a;
        }

        td:first-child {
          border-left: 3px solid #16a34a;
        }
      }

      .europa-zone {
        .pos {
          color: #3b82f6;
        }

        td:first-child {
          border-left: 3px solid #3b82f6;
        }
      }

      .relegation-zone {
        .pos {
          color: #dc2626;
        }

        td:first-child {
          border-left: 3px solid #dc2626;
        }
      }

      .empty {
        text-align: center;
        color: #94a3b8;
        padding: 2rem;
      }
    }

    @media (max-width: 640px) {
      .hide-mobile {
        display: none;
      }

      .standings-table {
        .team {
          max-width: 100px;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StandingsComponent implements OnInit {
  private http = inject(HttpClient);

  standings = signal<LeagueStanding[]>([]);
  standingsTitle = signal('Clasificacion La Liga');
  emptyMessage = signal('No hay datos disponibles');
  loading = signal(false);
  error = signal(false);

  ngOnInit(): void {
    this.loadStandings();
  }

  loadStandings(): void {
    this.loading.set(true);
    this.error.set(false);
    this.standingsTitle.set('Clasificacion La Liga');
    this.emptyMessage.set('No hay datos disponibles');

    this.http.get<{ success: boolean; data: LeagueStanding[]; message?: string }>(`${environment.apiUrl}/dashboard/standings?division=primera`).subscribe({
      next: (res) => {
        const primera = res.data || [];
        if (primera.length > 0) {
          this.standings.set(primera);
          this.loading.set(false);
          return;
        }
        if (res.message) {
          this.emptyMessage.set(res.message);
        }
        this.loadFallbackSegunda();
      },
      error: () => this.loadFallbackSegunda(),
    });
  }

  private loadFallbackSegunda(): void {
    this.http.get<{ success: boolean; data: LeagueStanding[]; message?: string }>(`${environment.apiUrl}/dashboard/standings?division=segunda`).subscribe({
      next: (res) => {
        const segunda = res.data || [];
        this.standings.set(segunda);
        if (segunda.length > 0) {
          this.standingsTitle.set('Clasificacion Segunda');
        } else if (res.message) {
          this.emptyMessage.set(res.message);
        }
        this.loading.set(false);
      },
      error: () => {
        this.standings.set([]);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}

