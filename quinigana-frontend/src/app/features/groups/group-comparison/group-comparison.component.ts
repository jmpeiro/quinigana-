import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ComparisonService } from '../../../core/services/comparison.service';
import { GroupMemberLiveScore, GroupComparisonData, MatchComparison } from '../../../core/models/comparison.model';

@Component({
  selector: 'app-group-comparison',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="comparison-container">
      <button mat-button class="back-button" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Volver
      </button>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando comparativa...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <!-- Ranking Summary -->
        <mat-card class="ranking-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>leaderboard</mat-icon>
              Ranking de la Jornada
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="ranking-list">
              @for (member of ranking(); track member.user_id; let i = $index) {
                <div class="ranking-item" [class.top-1]="i === 0" [class.top-2]="i === 1" [class.top-3]="i === 2">
                  <span class="position">{{ i + 1 }}</span>
                  <span class="name">{{ member.user_name }}</span>
                  <div class="scores">
                    <span class="score score-1x2" title="Aciertos 1X2">{{ member.correct_1x2 }}</span>
                    <span class="score score-pleno" title="Plenos">{{ member.correct_pleno }}</span>
                    <span class="score score-total" title="Puntos totales">{{ member.total_points }}</span>
                  </div>
                </div>
              } @empty {
                <p class="empty-text">No hay datos de ranking disponibles</p>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Match Comparison Table -->
        <mat-card class="comparison-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>compare_arrows</mat-icon>
              Comparativa de Predicciones
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (comparison()) {
              <div class="comparison-table-wrapper">
                <table class="comparison-table">
                  <thead>
                    <tr>
                      <th class="col-match">#</th>
                      <th class="col-teams">Partido</th>
                      <th class="col-result">Resultado</th>
                      <th class="col-pred">Prediccion</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (match of comparison()!.matches; track match.match_number) {
                      <tr [class.has-result]="match.result_1x2">
                        <td class="col-match">{{ match.match_number }}</td>
                        <td class="col-teams">
                          <span class="team-home">{{ match.home_team }}</span>
                          <span class="vs">vs</span>
                          <span class="team-away">{{ match.away_team }}</span>
                        </td>
                        <td class="col-result">
                          @if (match.home_score !== null) {
                            <span class="result-score">{{ match.home_score }} - {{ match.away_score }}</span>
                            <span class="result-sign" [class]="'sign-' + match.result_1x2">{{ match.result_1x2 }}</span>
                          } @else {
                            <span class="pending">-</span>
                          }
                        </td>
                        <td class="col-pred">
                          @if (match.predictions.length > 0) {
                            @for (pred of match.predictions; track pred.user_id) {
                              <span
                                class="pred-badge"
                                [class.correct]="pred.is_correct_1x2 === true"
                                [class.incorrect]="pred.is_correct_1x2 === false"
                                [class.pleno]="pred.is_correct_pleno === true"
                                [title]="pred.user_name">
                                {{ pred.prediction_1x2 }}
                              </span>
                            }
                          } @else {
                            <span class="no-pred">-</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Legend -->
              <div class="legend">
                <span class="legend-item"><span class="legend-dot correct"></span> Acierto 1X2</span>
                <span class="legend-item"><span class="legend-dot pleno"></span> Pleno</span>
                <span class="legend-item"><span class="legend-dot incorrect"></span> Fallo</span>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
      background: #f8f9fb;
      min-height: 100vh;
    }

    .comparison-container {
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

    .ranking-card, .comparison-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 24px;

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;
        color: #1e293b;
        mat-icon { color: #c8a84b; }
      }
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 10px;
      transition: all 150ms;

      &:hover { background: #f1f5f9; }
      &.top-1 { background: rgba(200, 168, 75, 0.15); }
      &.top-2 { background: rgba(148, 163, 184, 0.15); }
      &.top-3 { background: rgba(205, 127, 50, 0.15); }
    }

    .position {
      font-size: 18px;
      font-weight: 800;
      color: #c8a84b;
      min-width: 28px;
      text-align: center;
    }

    .name {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }

    .scores {
      display: flex;
      gap: 8px;
    }

    .score {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;

      &.score-1x2 {
        background: rgba(200, 168, 75, 0.15);
        color: #c8a84b;
      }
      &.score-pleno {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }
      &.score-total {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
    }

    .comparison-table-wrapper {
      overflow-x: auto;
    }

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;

      th, td {
        padding: 12px 8px;
        text-align: left;
        border-bottom: 1px solid #f1f5f9;
      }

      th {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: #f8fafc;
      }

      tr:hover { background: #fafbfc; }
      tr.has-result { background: #fafbfc; }
    }

    .col-match {
      width: 40px;
      text-align: center;
      font-weight: 700;
      color: #94a3b8;
    }

    .col-teams {
      min-width: 200px;
    }

    .team-home, .team-away {
      font-weight: 500;
      color: #1e293b;
    }

    .vs {
      color: #94a3b8;
      font-size: 12px;
      margin: 0 6px;
    }

    .col-result {
      width: 100px;
      text-align: center;
    }

    .result-score {
      font-weight: 700;
      color: #1e293b;
      margin-right: 6px;
    }

    .result-sign {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 12px;

      &.sign-1 { background: rgba(200, 168, 75, 0.2); color: #c8a84b; }
      &.sign-X { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
      &.sign-2 { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    }

    .pending {
      color: #94a3b8;
      font-size: 18px;
    }

    .col-pred {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .pred-badge {
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      background: #f1f5f9;
      color: #64748b;
      cursor: default;

      &.correct {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
      &.incorrect {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
      &.pleno {
        background: rgba(139, 92, 246, 0.2);
        color: #8b5cf6;
        box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
      }
    }

    .no-pred {
      color: #cbd5e1;
    }

    .legend {
      display: flex;
      gap: 20px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;

      &.correct { background: rgba(16, 185, 129, 0.5); }
      &.pleno { background: rgba(139, 92, 246, 0.5); }
      &.incorrect { background: rgba(239, 68, 68, 0.3); }
    }

    .empty-text {
      text-align: center;
      color: #94a3b8;
      padding: 24px;
    }
  `],
})
export class GroupComparisonComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private comparisonService = inject(ComparisonService);

  loading = signal(true);
  error = signal<string | null>(null);
  ranking = signal<GroupMemberLiveScore[]>([]);
  comparison = signal<GroupComparisonData | null>(null);

  private groupId = 0;
  private jornadaId = 0;

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.jornadaId = Number(this.route.snapshot.paramMap.get('jornadaId'));

    if (this.groupId && this.jornadaId) {
      this.loadData();
    } else {
      this.error.set('Parámetros inválidos');
      this.loading.set(false);
    }
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load ranking
    this.comparisonService.getGroupJornadaRanking(this.groupId, this.jornadaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.ranking.set(res.data);
        }
      },
      error: () => {}
    });

    // Load comparison
    this.comparisonService.getGroupJornadaComparison(this.groupId, this.jornadaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.comparison.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al cargar la comparativa');
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/groups', this.groupId]);
  }
}
