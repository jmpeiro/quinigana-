import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { ScoreService } from '../../../core/services/score.service';
import { GroupScoresResponse } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-scores',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="scores-container">
      <button mat-button class="back-button" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Volver al grupo
      </button>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando puntuaciones...</p>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon class="error-icon">error_outline</mat-icon>
            <p>{{ error() }}</p>
            <button mat-raised-button color="primary" (click)="loadScores()">
              Reintentar
            </button>
          </mat-card-content>
        </mat-card>
      } @else if (scoresData()) {
        <mat-card class="header-card">
          <mat-card-content>
            <div class="header-content">
              <div class="header-info">
                <h1 class="group-name">{{ scoresData()!.group_name }}</h1>
                <p class="subtitle">Puntuaciones del grupo</p>
              </div>
              <div class="total-points-badge">
                <span class="points-label">Total Acumulado</span>
                <span class="points-value">{{ scoresData()!.total_points }}</span>
                <span class="points-unit">pts</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        @if (scoresData()!.jornadas.length === 0) {
          <mat-card class="empty-card">
            <mat-card-content>
              <mat-icon class="empty-icon">scoreboard</mat-icon>
              <h2>Sin puntuaciones todavia</h2>
              <p>Este grupo aun no tiene puntuaciones registradas. Las puntuaciones se generan cuando se envian resultados de una jornada.</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card class="table-card">
            <mat-card-content>
              <table mat-table [dataSource]="scoresData()!.jornadas" class="scores-table">
                <ng-container matColumnDef="jornada">
                  <th mat-header-cell *matHeaderCellDef>Jornada</th>
                  <td mat-cell *matCellDef="let score">
                    <div class="jornada-cell">
                      <mat-icon class="jornada-icon">event_note</mat-icon>
                      <span>{{ score.jornada_name || 'Jornada ' + score.jornada_number }}</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="points">
                  <th mat-header-cell *matHeaderCellDef>Puntos</th>
                  <td mat-cell *matCellDef="let score">
                    <span class="points-chip" [class.high-points]="score.total_points >= 10">
                      {{ score.total_points }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="correct1x2">
                  <th mat-header-cell *matHeaderCellDef>Aciertos 1X2</th>
                  <td mat-cell *matCellDef="let score">
                    <div class="result-cell">
                      <mat-icon class="result-icon">check_circle</mat-icon>
                      <span>{{ score.correct_1x2 }} / 15</span>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="correctPleno">
                  <th mat-header-cell *matHeaderCellDef>Plenos</th>
                  <td mat-cell *matCellDef="let score">
                    <div class="result-cell">
                      <mat-icon class="pleno-icon">stars</mat-icon>
                      <span>{{ score.correct_pleno }}</span>
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <div class="stats-row">
            <mat-card class="stat-card">
              <mat-card-content>
                <mat-icon>emoji_events</mat-icon>
                <span class="stat-value">{{ totalJornadas() }}</span>
                <span class="stat-label">Jornadas jugadas</span>
              </mat-card-content>
            </mat-card>
            <mat-card class="stat-card">
              <mat-card-content>
                <mat-icon>check_circle</mat-icon>
                <span class="stat-value">{{ totalCorrect1x2() }}</span>
                <span class="stat-label">Total aciertos 1X2</span>
              </mat-card-content>
            </mat-card>
            <mat-card class="stat-card">
              <mat-card-content>
                <mat-icon>stars</mat-icon>
                <span class="stat-value">{{ totalPlenos() }}</span>
                <span class="stat-label">Total plenos</span>
              </mat-card-content>
            </mat-card>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .scores-container { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .back-button { margin-bottom: 16px; color: #64748b; }
    .back-button mat-icon { margin-right: 4px; }
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; gap: 16px; color: #64748b; }
    .error-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center; padding: 40px; }
    .error-card .error-icon { font-size: 48px; width: 48px; height: 48px; color: #ef5350; margin-bottom: 16px; }
    .error-card p { color: #64748b; margin-bottom: 24px; }
    .header-card { background: linear-gradient(135deg, #c8a84b 0%, #d4b85c 100%); margin-bottom: 24px; border-radius: 12px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .header-info .group-name { font-size: 1.8rem; font-weight: 700; color: #ffffff; margin: 0 0 4px 0; }
    .header-info .subtitle { color: rgba(255,255,255,0.85); margin: 0; font-size: 0.9rem; }
    .total-points-badge { display: flex; flex-direction: column; align-items: center; background: rgba(255, 255, 255, 0.2); border-radius: 12px; padding: 12px 24px; backdrop-filter: blur(4px); }
    .points-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.85); }
    .points-value { font-size: 2.5rem; font-weight: 800; color: #ffffff; line-height: 1.1; }
    .points-unit { font-size: 0.8rem; color: rgba(255,255,255,0.85); }
    .empty-card { background: #fff; border: 1px solid #e2e8f0; text-align: center; padding: 60px 24px; border-radius: 12px; }
    .empty-card .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #94a3b8; margin-bottom: 16px; }
    .empty-card h2 { color: #1e293b; margin-bottom: 8px; }
    .empty-card p { color: #64748b; max-width: 400px; margin: 0 auto; line-height: 1.6; }
    .table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
    .scores-table { width: 100%; background: transparent; }
    .scores-table th { color: #64748b; font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom-color: #e2e8f0; }
    .scores-table td { color: #1e293b; border-bottom-color: #e2e8f0; }
    .scores-table tr:hover td { background: #f1f5f9; }
    .jornada-cell { display: flex; align-items: center; gap: 8px; }
    .jornada-icon { font-size: 18px; width: 18px; height: 18px; color: #c8a84b; }
    .points-chip { display: inline-flex; align-items: center; justify-content: center; background: #f1f5f9; color: #1e293b; border-radius: 16px; padding: 4px 12px; font-weight: 600; font-size: 0.85rem; min-width: 32px; }
    .points-chip.high-points { background: rgba(76, 175, 80, 0.2); color: #66bb6a; }
    .result-cell { display: flex; align-items: center; gap: 6px; }
    .result-icon { font-size: 16px; width: 16px; height: 16px; color: #66bb6a; }
    .pleno-icon { font-size: 16px; width: 16px; height: 16px; color: #ffd54f; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
    .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center; }
    .stat-card mat-card-content { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 20px 16px; }
    .stat-card mat-icon { color: #c8a84b; font-size: 28px; width: 28px; height: 28px; margin-bottom: 4px; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    @media (max-width: 600px) { .header-content { flex-direction: column; text-align: center; } .scores-table { font-size: 0.85rem; } .header-info .group-name { font-size: 1.4rem; } }
  `]
})
export class ScoresComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private scoreService = inject(ScoreService);

  scoresData = signal<GroupScoresResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  displayedColumns = ['jornada', 'points', 'correct1x2', 'correctPleno'];

  totalJornadas = computed(() => this.scoresData()?.jornadas.length ?? 0);
  totalCorrect1x2 = computed(() =>
    this.scoresData()?.jornadas.reduce((sum, j) => sum + j.correct_1x2, 0) ?? 0
  );
  totalPlenos = computed(() =>
    this.scoresData()?.jornadas.reduce((sum, j) => sum + j.correct_pleno, 0) ?? 0
  );

  private groupId!: number;

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('groupId'));
    this.loadScores();
  }

  loadScores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.scoreService.getGroupScores(this.groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.scoresData.set(response.data);
        } else {
          this.error.set(response.message || 'Error al cargar las puntuaciones.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las puntuaciones. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/groups', this.groupId]);
  }
}
