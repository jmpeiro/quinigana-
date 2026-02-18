import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { GroupQuinielaService } from '../../../core/services/group-quiniela.service';
import { GroupQuinielaWithDetails, GroupQuinielaMatch, GroupQuinielaPrediction, GroupQuinielaRanking } from '../../../core/models/group-quiniela.model';

interface MatchWithPrediction extends GroupQuinielaMatch {
  prediction_1x2?: '1' | 'X' | '2';
  home_score_prediction?: number | null;
  away_score_prediction?: number | null;
}

@Component({
  selector: 'app-play-quiniela',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  template: `
    <div class="play-container">
      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (quiniela()) {
        <header class="quiniela-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-info">
            <h1>{{ quiniela()!.name }}</h1>
            <span class="header-meta">
              {{ quiniela()!.group_name }} · {{ quiniela()!.match_count }} partidos
            </span>
          </div>
          <mat-chip [class]="'status-' + quiniela()!.status">
            {{ quiniela()!.status === 'open' ? 'Abierta' : quiniela()!.status === 'closed' ? 'Cerrada' : 'Finalizada' }}
          </mat-chip>
        </header>

        <div class="deadline-banner" [class.expired]="isExpired()">
          <mat-icon>{{ isExpired() ? 'timer_off' : 'schedule' }}</mat-icon>
          <span>{{ isExpired() ? 'Plazo terminado' : 'Cierra: ' + (quiniela()!.deadline | date:'medium') }}</span>
        </div>

        <mat-tab-group animationDuration="200ms">
          <mat-tab label="Predicciones">
            <div class="predictions-section">
              @if (quiniela()!.status === 'open' && !isExpired()) {
                <p class="instructions">Selecciona tu prediccion para cada partido (1 = Local, X = Empate, 2 = Visitante)</p>
              }

              <div class="matches-table">
                @for (match of matchesWithPredictions(); track match.id) {
                  <div class="match-row" [class.has-result]="match.result_1x2">
                    <span class="match-num">{{ match.match_number }}</span>
                    <div class="teams">
                      <span class="team home">{{ match.home_team }}</span>
                      @if (match.home_score !== null) {
                        <span class="result">{{ match.home_score }} - {{ match.away_score }}</span>
                      } @else {
                        <span class="vs">vs</span>
                      }
                      <span class="team away">{{ match.away_team }}</span>
                    </div>
                    <div class="predictions-btns">
                      @if (quiniela()!.status === 'open' && !isExpired()) {
                        <button class="pred-btn" [class.selected]="match.prediction_1x2 === '1'" (click)="setPrediction(match, '1')">1</button>
                        <button class="pred-btn" [class.selected]="match.prediction_1x2 === 'X'" (click)="setPrediction(match, 'X')">X</button>
                        <button class="pred-btn" [class.selected]="match.prediction_1x2 === '2'" (click)="setPrediction(match, '2')">2</button>
                      } @else {
                        <span class="pred-display" [class.correct]="match.prediction_1x2 === match.result_1x2" [class.wrong]="match.result_1x2 && match.prediction_1x2 !== match.result_1x2">
                          {{ match.prediction_1x2 || '-' }}
                        </span>
                        @if (match.result_1x2) {
                          <span class="result-sign">{{ match.result_1x2 }}</span>
                        }
                      }
                    </div>
                  </div>
                }
              </div>

              @if (quiniela()!.status === 'open' && !isExpired()) {
                <div class="save-section">
                  <button mat-raised-button color="primary" (click)="savePredictions()" [disabled]="saving() || !hasChanges()">
                    @if (saving()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    }
                    @if (!saving()) {
                      <mat-icon>save</mat-icon>
                    }
                    <span>Guardar Predicciones</span>
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Ranking">
            <div class="ranking-section">
              @if (ranking().length > 0) {
                <div class="ranking-list">
                  @for (user of ranking(); track user.user_id) {
                    <div class="ranking-row" [class.top-3]="user.position <= 3">
                      <span class="position" [class.gold]="user.position === 1" [class.silver]="user.position === 2" [class.bronze]="user.position === 3">
                        {{ user.position }}
                      </span>
                      <span class="user-name">{{ user.first_name }} {{ user.last_name || '' }}</span>
                      <div class="scores">
                        <span class="score-1x2">{{ user.correct_1x2 }} <small>1X2</small></span>
                        <span class="score-pleno">{{ user.correct_pleno }} <small>Pleno</small></span>
                      </div>
                      <span class="total-points">{{ user.total_points }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-ranking">
                  <mat-icon>leaderboard</mat-icon>
                  <p>El ranking estara disponible cuando se envien los resultados</p>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="not-found">
          <mat-icon>error_outline</mat-icon>
          <h2>Quiniela no encontrada</h2>
          <button mat-raised-button (click)="goBack()">Volver</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .play-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .loading, .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 1rem;
      color: #64748b;
    }

    .quiniela-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;

      h1 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
      }

      .header-info { flex: 1; }
      .header-meta {
        font-size: 0.75rem;
        color: #64748b;
      }
    }

    .deadline-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(200, 168, 75, 0.1);
      color: #b8943f;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 1rem;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &.expired {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    }

    .status-open { background: rgba(16, 185, 129, 0.1) !important; color: #10b981 !important; }
    .status-closed { background: rgba(245, 158, 11, 0.1) !important; color: #f59e0b !important; }
    .status-finished { background: rgba(100, 116, 139, 0.1) !important; color: #64748b !important; }

    .predictions-section {
      padding: 1rem 0;
    }

    .instructions {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0 0 1rem;
    }

    .matches-table {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }

    .match-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; }
      &:nth-child(even) { background: #fafbfc; }
      &.has-result { background: rgba(200, 168, 75, 0.03); }
    }

    .match-num {
      min-width: 24px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #c8a84b;
      text-align: center;
    }

    .teams {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;

      .team { flex: 1; color: #1e293b; font-weight: 500; }
      .team.home { text-align: right; }
      .team.away { text-align: left; }
      .vs { color: #94a3b8; font-size: 0.7rem; }
      .result { font-weight: 700; color: #1e293b; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    }

    .predictions-btns {
      display: flex;
      gap: 4px;
    }

    .pred-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      font-weight: 700;
      font-size: 0.8rem;
      color: #64748b;
      cursor: pointer;
      transition: all 120ms;

      &:hover { border-color: #c8a84b; color: #c8a84b; }
      &.selected {
        background: #c8a84b;
        border-color: #c8a84b;
        color: #fff;
      }
    }

    .pred-display {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
      color: #64748b;

      &.correct { border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1); }
      &.wrong { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    }

    .result-sign {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1e293b;
      color: #fff;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.7rem;
    }

    .save-section {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;

      button mat-icon { margin-right: 4px; }
    }

    .ranking-section {
      padding: 1rem 0;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ranking-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 1rem;

      &.top-3 { border-color: rgba(200, 168, 75, 0.3); }
    }

    .position {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.8rem;
      color: #64748b;

      &.gold { background: #fef3c7; color: #d97706; }
      &.silver { background: #e2e8f0; color: #475569; }
      &.bronze { background: #fed7aa; color: #c2410c; }
    }

    .user-name {
      flex: 1;
      font-weight: 600;
      color: #1e293b;
    }

    .scores {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #64748b;

      small {
        font-size: 0.65rem;
        color: #94a3b8;
        margin-left: 2px;
      }
    }

    .total-points {
      font-size: 1.1rem;
      font-weight: 700;
      color: #c8a84b;
      min-width: 40px;
      text-align: right;
    }

    .empty-ranking {
      text-align: center;
      padding: 3rem;
      color: #94a3b8;

      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
      p { margin: 1rem 0 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayQuinielaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quinielaService = inject(GroupQuinielaService);
  private snackBar = inject(MatSnackBar);

  quiniela = signal<GroupQuinielaWithDetails | null>(null);
  ranking = signal<GroupQuinielaRanking[]>([]);
  loading = signal(true);
  saving = signal(false);

  private originalPredictions = new Map<number, string>();

  matchesWithPredictions = computed<MatchWithPrediction[]>(() => {
    const q = this.quiniela();
    if (!q || !q.matches) return [];

    return q.matches.map(match => {
      const pred = q.myPredictions?.find(p => p.match_id === match.id);
      return {
        ...match,
        prediction_1x2: pred?.prediction_1x2,
        home_score_prediction: pred?.home_score_prediction,
        away_score_prediction: pred?.away_score_prediction
      };
    });
  });

  isExpired = computed(() => {
    const q = this.quiniela();
    if (!q) return false;
    return new Date(q.deadline) < new Date();
  });

  ngOnInit(): void {
    const quinielaId = parseInt(this.route.snapshot.params['quinielaId']);
    this.loadQuiniela(quinielaId);
    this.loadRanking(quinielaId);
  }

  private loadQuiniela(id: number): void {
    this.loading.set(true);
    this.quinielaService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.quiniela.set(response.data);
          // Store original predictions
          response.data.myPredictions?.forEach(p => {
            this.originalPredictions.set(p.match_id, p.prediction_1x2);
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadRanking(id: number): void {
    this.quinielaService.getRanking(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ranking.set(response.data);
        }
      }
    });
  }

  setPrediction(match: MatchWithPrediction, value: '1' | 'X' | '2'): void {
    const q = this.quiniela();
    if (!q || !q.matches) return;

    const updated = q.matches.map(m => {
      if (m.id === match.id) {
        return { ...m };
      }
      return m;
    });

    // Update myPredictions
    const existingPreds = q.myPredictions || [];
    const existingIndex = existingPreds.findIndex(p => p.match_id === match.id);

    let newPreds: GroupQuinielaPrediction[];
    if (existingIndex >= 0) {
      newPreds = [...existingPreds];
      newPreds[existingIndex] = { ...newPreds[existingIndex], prediction_1x2: value };
    } else {
      newPreds = [...existingPreds, {
        id: 0,
        quiniela_id: q.id,
        user_id: 0,
        match_id: match.id,
        match_number: match.match_number,
        home_team: match.home_team,
        away_team: match.away_team,
        prediction_1x2: value,
        home_score_prediction: null,
        away_score_prediction: null
      }];
    }

    this.quiniela.set({
      ...q,
      matches: updated,
      myPredictions: newPreds
    });
  }

  hasChanges(): boolean {
    const q = this.quiniela();
    if (!q || !q.myPredictions) return false;

    for (const pred of q.myPredictions) {
      const original = this.originalPredictions.get(pred.match_id);
      if (original !== pred.prediction_1x2) return true;
    }
    return q.myPredictions.length !== this.originalPredictions.size;
  }

  savePredictions(): void {
    const q = this.quiniela();
    if (!q || !q.myPredictions) return;

    const predictions = q.myPredictions.map(p => ({
      match_id: p.match_id,
      prediction_1x2: p.prediction_1x2
    }));

    if (predictions.length === 0) {
      this.snackBar.open('Selecciona al menos una prediccion', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    this.quinielaService.savePredictions(q.id, { predictions }).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          // Update original predictions
          predictions.forEach(p => {
            this.originalPredictions.set(p.match_id, p.prediction_1x2);
          });
          this.snackBar.open('Predicciones guardadas', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err.error?.error?.message || 'Error al guardar', 'Cerrar', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    const groupId = this.route.snapshot.params['id'];
    this.router.navigate(['/groups', groupId]);
  }
}
