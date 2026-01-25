import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService } from '../../../core/services/stats.service';
import { GroupHistoryEntry } from '../../../core/models/stats.model';

@Component({
  selector: 'app-group-history',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="history-container">
      <h1 class="page-title">Historial de Jornadas</h1>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="history-list">
          @for (entry of entries(); track entry.jornadaId) {
            <div class="history-row" (click)="viewDetail(entry)">
              <div class="history-info">
                <span class="history-name">{{ entry.jornadaName }}</span>
                <span class="history-meta">{{ entry.season }} &middot; Jornada {{ entry.jornadaNumber }}</span>
              </div>
              <div class="history-stats">
                <span class="history-points">{{ entry.totalPoints }} pts</span>
                <div class="history-details">
                  <span>1X2: {{ entry.correct1x2 }}</span>
                  <span>Pleno: {{ entry.correctPleno }}</span>
                </div>
              </div>
              <mat-icon class="history-arrow">chevron_right</mat-icon>
            </div>
          } @empty {
            <div class="empty">No hay jornadas finalizadas para este grupo.</div>
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
    .history-container { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
    .page-title { color: #1e293b; font-size: 1.5rem; margin: 0 0 1.5rem; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .history-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .history-row { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 10px; padding: 1rem; border: 1px solid #e2e8f0; cursor: pointer; transition: background 0.2s; }
    .history-row:hover { background: #f1f5f9; }
    .history-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .history-name { color: #1e293b; font-weight: 500; font-size: 0.9rem; }
    .history-meta { color: #64748b; font-size: 0.75rem; }
    .history-stats { text-align: right; }
    .history-points { color: #c8a84b; font-weight: 700; font-size: 1.1rem; }
    .history-details { display: flex; gap: 0.75rem; color: #64748b; font-size: 0.7rem; margin-top: 2px; }
    .history-arrow { color: #94a3b8; }
    .empty { text-align: center; color: #64748b; padding: 3rem; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }
    .page-info { color: #64748b; font-size: 0.85rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupHistoryComponent implements OnInit {
  private statsService = inject(StatsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  entries = signal<GroupHistoryEntry[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  private groupId = 0;

  ngOnInit(): void {
    this.groupId = parseInt(this.route.snapshot.params['groupId']);
    this.loadHistory();
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadHistory();
  }

  viewDetail(entry: GroupHistoryEntry): void {
    this.router.navigate(['/stats/groups', this.groupId, 'jornadas', entry.jornadaId]);
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.statsService.getGroupHistory(this.groupId, this.page()).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.entries.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
