import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService } from '../../../core/services/stats.service';
import { GlobalRankingEntry } from '../../../core/models/stats.model';
import { SearchFilterComponent, SearchFilterChange } from '../../../shared/search-filter/search-filter.component';
import { ExportButtonComponent } from '../../../shared/export-button/export-button.component';

@Component({
  selector: 'app-global-rankings',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, SearchFilterComponent, ExportButtonComponent],
  template: `
    <div class="rankings-container">
      <div class="rankings-header">
        <h1 class="page-title">Ranking Global</h1>
        <app-export-button exportType="rankings" />
      </div>

      <app-search-filter
        placeholder="Buscar grupo..."
        (filterChange)="onFilterChange($event)"
      />

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="rankings-list">
          @for (entry of filteredRankings(); track entry.groupId; let i = $index) {
            <div class="ranking-row" [class.top3]="getPosition(i) <= 3" (click)="goToGroup(entry.groupId)">
              <div class="rank-badge" [class.gold]="getPosition(i) === 1" [class.silver]="getPosition(i) === 2" [class.bronze]="getPosition(i) === 3">
                @if (getPosition(i) <= 3) {
                  <mat-icon>{{ getPosition(i) === 1 ? 'emoji_events' : (getPosition(i) === 2 ? 'workspace_premium' : 'military_tech') }}</mat-icon>
                } @else {
                  <span>{{ getPosition(i) }}</span>
                }
              </div>
              <div class="rank-info">
                <span class="rank-name">{{ entry.groupName }}</span>
                <span class="rank-meta">
                  {{ entry.memberCount }} miembros &middot;
                  {{ entry.totalJornadas }} jornadas &middot;
                  1X2: {{ entry.correct1x2 }} &middot;
                  Pleno: {{ entry.correctPleno }}
                </span>
              </div>
              <div class="rank-points">{{ entry.totalPoints }}</div>
            </div>
          } @empty {
            <div class="empty">No hay datos de rankings disponibles.</div>
          }
        </div>

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
    .rankings-container { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
    .rankings-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .page-title { color: #1e293b; font-size: 1.5rem; margin: 0; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .rankings-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .ranking-row { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 10px; padding: 0.85rem 1rem; border: 1px solid #e2e8f0; cursor: pointer; transition: border-color 0.2s; }
    .ranking-row:hover { border-color: rgba(200,168,75,0.4); }
    .ranking-row.top3 { border-color: rgba(200,168,75,0.3); }
    .rank-badge { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; flex-shrink: 0; }
    .rank-badge span { color: #64748b; font-weight: 700; font-size: 0.8rem; }
    .rank-badge.gold mat-icon { color: #ffd54f; }
    .rank-badge.silver mat-icon { color: #94a3b8; }
    .rank-badge.bronze mat-icon { color: #a1887f; }
    .rank-badge mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .rank-info { flex: 1; min-width: 0; }
    .rank-name { color: #1e293b; font-weight: 500; font-size: 0.9rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-meta { color: #64748b; font-size: 0.7rem; }
    .rank-points { color: #c8a84b; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; }
    .empty { text-align: center; color: #64748b; padding: 3rem; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }
    .page-info { color: #64748b; font-size: 0.85rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalRankingsComponent implements OnInit {
  private statsService = inject(StatsService);
  private router = inject(Router);

  rankings = signal<GlobalRankingEntry[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);

  /** Search state */
  private searchTerm = signal('');

  /** Computed filtered rankings based on search */
  filteredRankings = computed(() => {
    const search = this.searchTerm().toLowerCase();
    if (!search) return this.rankings();
    return this.rankings().filter(entry =>
      entry.groupName.toLowerCase().includes(search)
    );
  });

  ngOnInit(): void {
    this.loadRankings();
  }

  onFilterChange(event: SearchFilterChange): void {
    this.searchTerm.set(event.search);
  }

  loadRankings(): void {
    this.loading.set(true);
    this.statsService.getGlobalRankings(this.page(), 20).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rankings.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getPosition(index: number): number {
    return (this.page() - 1) * 20 + index + 1;
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadRankings();
  }

  goToGroup(groupId: number): void {
    this.router.navigate(['/groups', groupId]);
  }
}
