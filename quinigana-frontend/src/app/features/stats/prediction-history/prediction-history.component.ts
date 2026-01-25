import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService } from '../../../core/services/stats.service';
import { PredictionHistoryEntry } from '../../../core/models/stats.model';
import { ErrorCardComponent } from '../../../shared/components/error-card/error-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-prediction-history',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, ErrorCardComponent, SkeletonComponent],
  template: `
    <div class="history-container">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="page-title">Historial de Predicciones</h1>
      </div>

      @if (loading()) {
        <div class="skeleton-section">
          <app-skeleton variant="card" width="100%" height="160px" />
          <app-skeleton variant="card" width="100%" height="60px" />
          <app-skeleton variant="card" width="100%" height="60px" />
          <app-skeleton variant="card" width="100%" height="60px" />
        </div>
      } @else if (error()) {
        <app-error-card (retry)="loadHistory()" />
      } @else {
        @if (entries().length > 0) {
          <div class="chart-section">
            <h2 class="section-title">Evolucion de Precision</h2>
            <div class="chart-container">
              @for (entry of entries(); track entry.jornadaId) {
                <div class="chart-bar-wrap" [title]="entry.jornadaName + ': ' + entry.accuracy1x2Percent + '% 1X2'">
                  <div class="chart-bar" [style.height.%]="entry.accuracy1x2Percent" [class.high]="entry.accuracy1x2Percent >= 70" [class.mid]="entry.accuracy1x2Percent >= 40 && entry.accuracy1x2Percent < 70" [class.low]="entry.accuracy1x2Percent < 40"></div>
                  <span class="chart-label">{{ entry.accuracy1x2Percent }}%</span>
                </div>
              }
            </div>
          </div>

          <div class="chart-section">
            <h2 class="section-title">Puntos por Jornada</h2>
            <div class="chart-container">
              @for (entry of entries(); track entry.jornadaId) {
                <div class="chart-bar-wrap" [title]="entry.jornadaName + ': ' + entry.totalPoints + ' pts'">
                  <div class="chart-bar points-bar" [style.height.%]="getPointsHeight(entry.totalPoints)"></div>
                  <span class="chart-label">{{ entry.totalPoints }}</span>
                </div>
              }
            </div>
          </div>

          <h2 class="section-title">Detalle por Jornada</h2>
          <div class="history-list">
            @for (entry of entries(); track entry.jornadaId) {
              <div class="history-row" (click)="viewDetail(entry)" [class.high-acc]="entry.accuracy1x2Percent >= 70" [class.mid-acc]="entry.accuracy1x2Percent >= 40 && entry.accuracy1x2Percent < 70" [class.low-acc]="entry.accuracy1x2Percent < 40">
                <div class="history-info">
                  <span class="history-name">{{ entry.jornadaName }}</span>
                  <span class="history-meta">{{ entry.season }} &middot; {{ entry.groupName }}</span>
                </div>
                <div class="history-stats">
                  <span class="history-points">{{ entry.totalPoints }} pts</span>
                  <div class="history-details">
                    <span>1X2: {{ entry.correct1x2 }}/{{ entry.totalMatches }}</span>
                    <span>Pleno: {{ entry.correctPleno }}</span>
                  </div>
                </div>
                <mat-icon class="history-arrow">chevron_right</mat-icon>
              </div>
            }
          </div>
        } @else {
          <div class="empty">No tienes predicciones finalizadas aun.</div>
        }

        @if (totalPages() > 1) {
          <div class="pagination">
            <button mat-icon-button [disabled]="page() <= 1" (click)="changePage(page() - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-info">{{ page() }} / {{ totalPages() }}</span>
            <button mat-icon-button [disabled]="page() >= totalPages()" (click)="changePage(page() + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .history-container { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem; }
    .page-title { color: #1e293b; font-size: 1.5rem; margin: 0; }
    .section-title { color: #475569; font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    .chart-section { margin-bottom: 1rem; }
    .chart-container { display: flex; align-items: flex-end; gap: 6px; height: 120px; background: #fff; border-radius: 12px; padding: 1rem; border: 1px solid #e2e8f0; overflow-x: auto; }
    .chart-bar-wrap { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 24px; height: 100%; justify-content: flex-end; }
    .chart-bar { width: 100%; max-width: 20px; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s; }
    .chart-bar.high { background: linear-gradient(to top, #16a34a, #4ade80); }
    .chart-bar.mid { background: linear-gradient(to top, #ca8a04, #facc15); }
    .chart-bar.low { background: linear-gradient(to top, #dc2626, #f87171); }
    .chart-bar.points-bar { background: linear-gradient(to top, #c8a84b, #e0c76a); }
    .chart-label { font-size: 0.55rem; color: #64748b; margin-top: 4px; }
    .history-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .history-row { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 10px; padding: 1rem; border: 1px solid #e2e8f0; border-left: 4px solid #e2e8f0; cursor: pointer; transition: background 0.2s; }
    .history-row:hover { background: #f1f5f9; }
    .history-row.high-acc { border-left-color: #16a34a; }
    .history-row.mid-acc { border-left-color: #ca8a04; }
    .history-row.low-acc { border-left-color: #dc2626; }
    .history-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .history-name { color: #1e293b; font-weight: 500; font-size: 0.9rem; }
    .history-meta { color: #64748b; font-size: 0.75rem; }
    .history-stats { text-align: right; }
    .history-points { color: #c8a84b; font-weight: 700; font-size: 1.1rem; }
    .history-details { display: flex; gap: 0.75rem; color: #64748b; font-size: 0.7rem; margin-top: 2px; }
    .history-arrow { color: #94a3b8; }
    .empty { text-align: center; color: #64748b; padding: 3rem; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }
    .page-info { color: #64748b; font-size: 0.85rem; }
    .skeleton-section { display: flex; flex-direction: column; gap: 0.75rem; }
    @media (max-width: 480px) { .chart-container { height: 100px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredictionHistoryComponent implements OnInit {
  private statsService = inject(StatsService);
  private router = inject(Router);

  entries = signal<PredictionHistoryEntry[]>([]);
  loading = signal(true);
  error = signal(false);
  page = signal(1);
  totalPages = signal(1);

  private maxPoints = 1;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(false);
    this.statsService.getPredictionHistory(this.page()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.entries.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
          this.maxPoints = Math.max(...response.data.items.map(e => e.totalPoints), 1);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadHistory();
  }

  getPointsHeight(points: number): number {
    return this.maxPoints > 0 ? (points / this.maxPoints) * 100 : 0;
  }

  viewDetail(entry: PredictionHistoryEntry): void {
    this.router.navigate(['/stats/groups', entry.groupId, 'jornadas', entry.jornadaId]);
  }

  goBack(): void {
    this.router.navigate(['/stats']);
  }
}
