import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { StatsService } from '../../../core/services/stats.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { AuthService } from '../../../core/services/auth.service';
import { SeasonService } from '../../../core/services/season.service';
import { PersonalStats, HeatmapJornada, GroupRankingEntry } from '../../../core/models/stats.model';
import { UserGamificationData, BadgeDefinition } from '../../../core/models/gamification.model';
import { ErrorCardComponent } from '../../../shared/components/error-card/error-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { XpBarComponent } from '../../../shared/components/xp-bar/xp-bar.component';
import { BadgeGridComponent } from '../../../shared/components/badge-grid/badge-grid.component';
import { EvolutionChartComponent } from '../../../shared/components/evolution-chart/evolution-chart.component';
import { MembersComparisonChartComponent, MemberRankingData } from '../../../shared/components/members-comparison-chart/members-comparison-chart.component';
import { PredictionsHeatmapComponent } from '../../../shared/components/predictions-heatmap/predictions-heatmap.component';
import { SeasonSelectorComponent } from '../../../shared/components/season-selector/season-selector.component';

@Component({
  selector: 'app-personal-stats',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    ErrorCardComponent,
    SkeletonComponent,
    XpBarComponent,
    BadgeGridComponent,
    EvolutionChartComponent,
    MembersComparisonChartComponent,
    PredictionsHeatmapComponent,
    SeasonSelectorComponent,
  ],
  template: `
    <div class="stats-container">
      <div class="page-header">
        <div class="header-top">
          <h1 class="page-title">Mis Estadisticas</h1>
          @if (stats()) {
            <div class="header-actions">
              <button mat-stroked-button class="action-btn" (click)="viewPredictionHistory()">
                <mat-icon>history</mat-icon>
                Historial
              </button>
              <button mat-stroked-button class="action-btn" (click)="viewGlobalRankings()">
                <mat-icon>leaderboard</mat-icon>
                Ranking
              </button>
              <button mat-stroked-button class="action-btn" (click)="exportCsv()" [disabled]="exporting()">
                <mat-icon>download</mat-icon>
                {{ exporting() ? 'Exportando...' : 'CSV' }}
              </button>
            </div>
          }
        </div>
        <app-season-selector (seasonChanged)="onSeasonChange($event)" />
      </div>

      @if (loading()) {
        <div class="skeleton-stats">
          <div class="stats-grid">
            <app-skeleton variant="card" width="100%" height="80px" />
            <app-skeleton variant="card" width="100%" height="80px" />
            <app-skeleton variant="card" width="100%" height="80px" />
            <app-skeleton variant="card" width="100%" height="80px" />
          </div>
          <app-skeleton variant="card" width="100%" height="150px" />
          <app-skeleton variant="card" width="100%" height="300px" />
        </div>
      } @else if (error()) {
        <app-error-card (retry)="loadStats()" />
      } @else if (stats()) {
        <!-- Summary Stats -->
        <div class="stats-grid">
          <div class="stat-card accent">
            <div class="stat-value">{{ stats()!.totalPoints }}</div>
            <div class="stat-label">Puntos Totales</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.accuracy1x2Percent }}%</div>
            <div class="stat-label">Precision 1X2</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.accuracyPlenoPercent }}%</div>
            <div class="stat-label">Precision Pleno</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.totalJornadas }}</div>
            <div class="stat-label">Jornadas Jugadas</div>
          </div>
        </div>

        <!-- Streaks -->
        <div class="streak-section">
          <div class="streak-card">
            <mat-icon>local_fire_department</mat-icon>
            <div class="streak-info">
              <span class="streak-value">{{ stats()!.currentStreak }}</span>
              <span class="streak-label">Racha Actual</span>
            </div>
          </div>
          <div class="streak-card">
            <mat-icon>emoji_events</mat-icon>
            <div class="streak-info">
              <span class="streak-value">{{ stats()!.bestStreak }}</span>
              <span class="streak-label">Mejor Racha</span>
            </div>
          </div>
        </div>

        <!-- Charts Tabs -->
        <mat-tab-group class="charts-tabs" animationDuration="200ms">
          <!-- Evolution Chart -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>show_chart</mat-icon>
              <span>Evolucion</span>
            </ng-template>
            <div class="tab-content">
              @if (stats()!.evolution.length > 0) {
                <app-evolution-chart [data]="stats()!.evolution" [height]="280" />
              } @else {
                <div class="empty-chart">
                  <mat-icon>trending_up</mat-icon>
                  <span>Sin datos de evolucion todavia</span>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Predictions Heatmap -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>grid_on</mat-icon>
              <span>Heatmap</span>
            </ng-template>
            <div class="tab-content">
              @if (heatmapData().length > 0) {
                <app-predictions-heatmap [data]="heatmapData()" />
              } @else {
                <div class="empty-chart">
                  <mat-icon>grid_off</mat-icon>
                  <span>Sin predicciones para mostrar</span>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Group Comparison -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>groups</mat-icon>
              <span>Comparativa</span>
            </ng-template>
            <div class="tab-content">
              @if (stats()!.groupComparison.length > 0) {
                <div class="group-selector">
                  @for (group of stats()!.groupComparison; track group.groupId) {
                    <button
                      mat-stroked-button
                      class="group-btn"
                      [class.active]="selectedGroupId() === group.groupId"
                      (click)="selectGroup(group.groupId)">
                      {{ group.groupName }}
                    </button>
                  }
                </div>
                @if (groupRankings().length > 0) {
                  <app-members-comparison-chart
                    [data]="groupRankings()"
                    [currentUserId]="currentUserId()"
                    [height]="320" />
                } @else {
                  <div class="empty-chart small">
                    <mat-icon>hourglass_empty</mat-icon>
                    <span>Cargando comparativa...</span>
                  </div>
                }
              } @else {
                <div class="empty-chart">
                  <mat-icon>group_off</mat-icon>
                  <span>No perteneces a ningun grupo</span>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>

        <!-- Group Comparison List -->
        @if (stats()!.groupComparison.length > 0) {
          <h2 class="section-title">Puntos por Grupo</h2>
          <div class="group-comparison">
            @for (group of stats()!.groupComparison; track group.groupId) {
              <div class="group-comp-row">
                <span class="group-comp-name">{{ group.groupName }}</span>
                <div class="group-comp-stats">
                  <span>{{ group.totalPoints }} pts</span>
                  <span class="group-comp-jornadas">{{ group.jornadasPlayed }} jornadas</span>
                </div>
              </div>
            }
          </div>
        }

        <!-- Gamification -->
        @if (gamification()) {
          <h2 class="section-title">Logros</h2>
          <app-xp-bar
            [level]="gamification()!.level"
            [xp]="gamification()!.xp"
            [xpForCurrentLevel]="gamification()!.xpForCurrentLevel"
            [xpForNextLevel]="gamification()!.xpForNextLevel" />
          <div class="badges-section">
            <app-badge-grid [badges]="gamification()!.badges" [allBadges]="allBadges()" />
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .stats-container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }
    .page-header { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    .header-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
    .page-title { color: var(--text-primary, #1e293b); font-size: 1.5rem; margin: 0; }
    .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .action-btn { font-size: 0.8rem; }

    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
    .stat-card {
      background: var(--bg-card, #fff);
      border-radius: 12px;
      padding: 1.2rem;
      text-align: center;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .stat-card.accent { border-color: rgba(200,168,75,0.3); }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: var(--text-primary, #1e293b); }
    .stat-card.accent .stat-value { color: #c8a84b; }
    .stat-label { color: var(--text-secondary, #64748b); font-size: 0.75rem; margin-top: 4px; }

    .streak-section { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .streak-card {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--bg-card, #fff);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .streak-card mat-icon { color: #ff9800; font-size: 28px; width: 28px; height: 28px; }
    .streak-info { display: flex; flex-direction: column; }
    .streak-value { font-size: 1.4rem; font-weight: 700; color: var(--text-primary, #1e293b); }
    .streak-label { font-size: 0.7rem; color: var(--text-secondary, #64748b); }

    .charts-tabs {
      background: var(--bg-card, #fff);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      margin-bottom: 1.5rem;
      overflow: hidden;

      ::ng-deep .mat-mdc-tab-labels {
        background: var(--bg-secondary, #f8f9fb);
      }
      ::ng-deep .mat-mdc-tab {
        min-width: 100px;
      }
      ::ng-deep .mat-mdc-tab-label-content {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
      }
      ::ng-deep mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .tab-content {
      padding: 1rem;
      min-height: 300px;
    }

    .empty-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--text-muted, #94a3b8);
      gap: 8px;

      &.small { height: 120px; }

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        opacity: 0.5;
      }
      span { font-size: 0.85rem; }
    }

    .group-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .group-btn {
      font-size: 0.75rem;
      &.active {
        background: rgba(200, 168, 75, 0.1);
        border-color: #c8a84b;
        color: #c8a84b;
      }
    }

    .section-title { color: var(--text-secondary, #475569); font-size: 1rem; font-weight: 600; margin: 1.5rem 0 1rem; }

    .group-comparison { display: flex; flex-direction: column; gap: 0.5rem; }
    .group-comp-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card, #fff);
      border-radius: 10px;
      padding: 0.85rem 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .group-comp-name { color: var(--text-primary, #1e293b); font-weight: 500; font-size: 0.9rem; }
    .group-comp-stats { display: flex; gap: 1rem; color: #c8a84b; font-weight: 600; font-size: 0.85rem; }
    .group-comp-jornadas { color: var(--text-secondary, #64748b); font-weight: 400; font-size: 0.75rem; }

    .badges-section { margin-top: 0.75rem; }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .streak-section { flex-direction: column; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalStatsComponent implements OnInit {
  private statsService = inject(StatsService);
  private gamificationService = inject(GamificationService);
  private authService = inject(AuthService);
  private seasonService = inject(SeasonService);
  private router = inject(Router);

  stats = signal<PersonalStats | null>(null);
  gamification = signal<UserGamificationData | null>(null);
  allBadges = signal<BadgeDefinition[]>([]);
  heatmapData = signal<HeatmapJornada[]>([]);
  groupRankings = signal<MemberRankingData[]>([]);
  selectedGroupId = signal<number | null>(null);
  currentUserId = signal<number | null>(null);

  loading = signal(true);
  error = signal(false);
  exporting = signal(false);

  ngOnInit(): void {
    this.currentUserId.set(this.authService.currentUser()?.id ?? null);
    this.loadStats();
    this.loadGamification();
    this.loadHeatmap();
  }

  onSeasonChange(seasonId: number | null): void {
    this.loadStats(seasonId ?? undefined);
  }

  loadStats(seasonId?: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.statsService.getPersonalStats(seasonId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
          // Auto-select first group if available
          if (response.data.groupComparison.length > 0) {
            this.selectGroup(response.data.groupComparison[0].groupId);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private loadGamification(): void {
    forkJoin({
      gamification: this.gamificationService.getMyGamification(),
      badges: this.gamificationService.getAllBadges(),
    }).subscribe({
      next: ({ gamification, badges }) => {
        if (gamification.success && gamification.data) {
          this.gamification.set(gamification.data);
        }
        if (badges.success && badges.data) {
          this.allBadges.set(badges.data);
        }
      },
    });
  }

  private loadHeatmap(): void {
    this.statsService.getPredictionsHeatmap(10).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.heatmapData.set(response.data);
        }
      },
    });
  }

  selectGroup(groupId: number): void {
    this.selectedGroupId.set(groupId);
    this.groupRankings.set([]); // Clear while loading
    this.statsService.getGroupRankings(groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.groupRankings.set(response.data as MemberRankingData[]);
        }
      },
    });
  }

  viewPredictionHistory(): void {
    this.router.navigate(['/stats/predictions']);
  }

  viewGlobalRankings(): void {
    this.router.navigate(['/stats/global-rankings']);
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.statsService.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quinigana-stats.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
      },
    });
  }
}
