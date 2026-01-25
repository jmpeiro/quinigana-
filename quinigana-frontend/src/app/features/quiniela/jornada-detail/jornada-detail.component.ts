import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

import { JornadaService } from '../../../core/services/jornada.service';
import { JornadaWithMatches, Match } from '../../../core/models/jornada.model';

@Component({
  selector: 'app-jornada-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
  ],
  template: `
    <div class="jornada-detail-container">
      <button mat-button class="back-button" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Volver a Jornadas
      </button>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando detalles...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
        </div>
      } @else if (jornada()) {
        <mat-card class="header-card">
          <mat-card-header>
            <mat-card-title>{{ jornada()!.name }}</mat-card-title>
            <mat-card-subtitle>
              Temporada {{ jornada()!.season }} - Jornada #{{ jornada()!.jornada_number }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="header-info">
              <div class="info-item">
                <span class="status-badge" [class]="'status-' + jornada()!.status">
                  {{ getStatusText(jornada()!.status) }}
                </span>
              </div>
              <div class="info-item" [class.deadline-closed]="deadlinePassed()">
                <mat-icon>{{ deadlinePassed() ? 'lock' : 'schedule' }}</mat-icon>
                <span>{{ deadlinePassed() ? 'Plazo cerrado' : 'Deadline: ' + formatDeadline(jornada()!.deadline) }}</span>
              </div>
            </div>
          </mat-card-content>
          @if (jornada()!.status === 'open' && !deadlinePassed()) {
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="createProposal()">
                <mat-icon>add</mat-icon>
                Crear Propuesta
              </button>
            </mat-card-actions>
          }
        </mat-card>

        <mat-card class="matches-card">
          <mat-card-header>
            <mat-card-title>Partidos ({{ jornada()!.matches.length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="matches-list">
              @for (match of jornada()!.matches; track match.id) {
                <div class="match-row">
                  <span class="match-number">{{ match.match_number }}</span>
                  <div class="match-teams">
                    <span class="team home-team">{{ match.home_team }}</span>
                    <span class="vs">vs</span>
                    <span class="team away-team">{{ match.away_team }}</span>
                  </div>
                  <div class="match-result">
                    @if (match.result) {
                      <span class="result-score">
                        {{ match.result.home_score }} - {{ match.result.away_score }}
                      </span>
                      <span class="result-badge" [class]="'result-' + match.result.result_1x2">
                        {{ match.result.result_1x2 }}
                      </span>
                    } @else {
                      <span class="pending-result">-</span>
                    }
                  </div>
                </div>
                @if (!$last) {
                  <mat-divider></mat-divider>
                }
              } @empty {
                <div class="empty-matches">
                  <p>No hay partidos disponibles para esta jornada.</p>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
    }

    .jornada-detail-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .back-button {
      color: #64748b;
      margin-bottom: 16px;
      mat-icon { margin-right: 4px; }
      &:hover { color: #1e293b; }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      color: #64748b;
      p { margin-top: 16px; font-size: 16px; }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      color: #ef5350;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
      p { margin-top: 12px; font-size: 16px; }
    }

    .header-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 24px;
      mat-card-title { color: #1e293b; font-size: 24px; }
      mat-card-subtitle { color: #64748b; font-size: 14px; }
      mat-card-actions { padding: 16px; }
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
      font-size: 14px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #c8a84b; }
      &.deadline-closed {
        color: #ef4444;
        mat-icon { color: #ef4444; }
      }
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .status-open {
      background: rgba(76, 175, 80, 0.15);
      color: #66bb6a;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-closed {
      background: rgba(255, 235, 59, 0.12);
      color: #fdd835;
      border: 1px solid rgba(255, 235, 59, 0.25);
    }

    .status-finished {
      background: rgba(158, 158, 158, 0.12);
      color: #9e9e9e;
      border: 1px solid rgba(158, 158, 158, 0.25);
    }

    .matches-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      mat-card-title { color: #1e293b; font-size: 20px; }
    }

    .matches-list { margin-top: 8px; }

    .match-row {
      display: flex;
      align-items: center;
      padding: 12px 8px;
      gap: 16px;
    }

    .match-number {
      background: #f1f5f9;
      color: #c8a84b;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .match-teams {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .team { color: #1e293b; font-size: 14px; font-weight: 500; }
    .vs { color: #94a3b8; font-size: 12px; font-style: italic; }

    .match-result {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .result-score { color: #1e293b; font-size: 14px; font-weight: 600; }
    .result-badge { padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; }
    .result-1 { background: rgba(76, 175, 80, 0.2); color: #66bb6a; }
    .result-X { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
    .result-2 { background: rgba(33, 150, 243, 0.2); color: #42a5f5; }
    .pending-result { color: #94a3b8; font-size: 18px; }
    .empty-matches { padding: 32px; text-align: center; color: #94a3b8; }
    mat-divider { border-top-color: #e2e8f0; }
  `],
})
export class JornadaDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jornadaService = inject(JornadaService);

  jornada = signal<JornadaWithMatches | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  deadlinePassed = signal(false);

  private deadlineInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadJornada(id);
    } else {
      this.error.set('Invalid jornada ID.');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.deadlineInterval) {
      clearInterval(this.deadlineInterval);
    }
  }

  private loadJornada(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.jornadaService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.jornada.set(response.data);
          this.checkDeadline(response.data.deadline);
        } else {
          this.error.set('Error al cargar los detalles de la jornada.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al cargar los detalles de la jornada.');
        this.loading.set(false);
      },
    });
  }

  private checkDeadline(deadline: string): void {
    const check = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      this.deadlinePassed.set(now >= target);
    };
    check();
    this.deadlineInterval = setInterval(check, 60000);
  }

  createProposal(): void {
    const jornadaId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/quiniela/proposals/create'], { queryParams: { jornadaId } });
  }

  goBack(): void {
    this.router.navigate(['/quiniela/jornadas']);
  }

  formatDeadline(deadline: string): string {
    const date = new Date(deadline);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'open': return 'ABIERTA';
      case 'closed': return 'CERRADA';
      case 'finished': return 'FINALIZADA';
      default: return status.toUpperCase();
    }
  }
}
