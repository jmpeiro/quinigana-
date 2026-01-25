import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService } from '../../../core/services/stats.service';
import { GroupRankingEntry } from '../../../core/models/stats.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-group-rankings',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="rankings-container">
      <h1 class="page-title">Rankings del Grupo</h1>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="rankings-list">
          @for (entry of rankings(); track entry.userId; let i = $index) {
            <div class="ranking-row" [class.top3]="i < 3">
              <div class="rank-badge" [class.gold]="i === 0" [class.silver]="i === 1" [class.bronze]="i === 2">
                @if (i < 3) {
                  <mat-icon>{{ i === 0 ? 'emoji_events' : (i === 1 ? 'workspace_premium' : 'military_tech') }}</mat-icon>
                } @else {
                  <span>{{ i + 1 }}</span>
                }
              </div>
              <div class="rank-avatar">
                @if (resolveAvatar(entry.avatarUrl)) {
                  <img [src]="resolveAvatar(entry.avatarUrl)" [alt]="entry.userName" />
                } @else {
                  <mat-icon>person</mat-icon>
                }
              </div>
              <div class="rank-info">
                <span class="rank-name">{{ entry.userName }}</span>
                <span class="rank-meta">{{ entry.jornadasPlayed }} jornadas &middot; 1X2: {{ entry.correct1x2 }} &middot; Pleno: {{ entry.correctPleno }}</span>
              </div>
              <div class="rank-points">{{ entry.totalPoints }}</div>
            </div>
          } @empty {
            <div class="empty">No hay datos de rankings disponibles.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rankings-container { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
    .page-title { color: #1e293b; font-size: 1.5rem; margin: 0 0 1.5rem; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .rankings-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .ranking-row { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 10px; padding: 0.85rem 1rem; border: 1px solid #e2e8f0; }
    .ranking-row.top3 { border-color: rgba(200,168,75,0.3); }
    .rank-badge { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; flex-shrink: 0; }
    .rank-badge span { color: #64748b; font-weight: 700; font-size: 0.8rem; }
    .rank-badge.gold mat-icon { color: #ffd54f; }
    .rank-badge.silver mat-icon { color: #94a3b8; }
    .rank-badge.bronze mat-icon { color: #a1887f; }
    .rank-badge mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .rank-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .rank-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .rank-avatar mat-icon { color: #94a3b8; font-size: 22px; }
    .rank-info { flex: 1; min-width: 0; }
    .rank-name { color: #1e293b; font-weight: 500; font-size: 0.9rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-meta { color: #64748b; font-size: 0.7rem; }
    .rank-points { color: #c8a84b; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; }
    .empty { text-align: center; color: #64748b; padding: 3rem; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupRankingsComponent implements OnInit {
  private statsService = inject(StatsService);
  private route = inject(ActivatedRoute);
  private baseUrl = environment.apiUrl.replace('/api', '');

  rankings = signal<GroupRankingEntry[]>([]);
  loading = signal(true);

  resolveAvatar(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return this.baseUrl + url;
  }

  ngOnInit(): void {
    const groupId = parseInt(this.route.snapshot.params['groupId']);

    this.statsService.getGroupRankings(groupId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rankings.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
