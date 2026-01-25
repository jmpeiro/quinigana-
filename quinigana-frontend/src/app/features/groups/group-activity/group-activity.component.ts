import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GroupService, ActivityEntry } from '../../../core/services/group.service';
import { ErrorCardComponent } from '../../../shared/components/error-card/error-card.component';

@Component({
  selector: 'app-group-activity',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, ErrorCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="activity-container">
      <div class="activity-header">
        <a mat-icon-button [routerLink]="['/groups', groupId]">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1 class="page-title">Actividad del Grupo</h1>
      </div>

      @if (loading() && page() === 1) {
        <div class="loading-wrapper">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (error()) {
        <app-error-card (retry)="loadActivity()" />
      } @else {
        <div class="timeline">
          @for (entry of items(); track $index) {
            <div class="timeline-item">
              <div class="timeline-dot" [class]="'dot-' + entry.type"></div>
              <div class="timeline-content">
                <div class="timeline-icon-wrap">
                  <mat-icon>{{ getIcon(entry.type) }}</mat-icon>
                </div>
                <div class="timeline-info">
                  <span class="timeline-user">{{ entry.userName }}</span>
                  <span class="timeline-detail">{{ entry.detail }}</span>
                  <span class="timeline-date">{{ entry.createdAt | date:'short' }}</span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>history</mat-icon>
              <p>No hay actividad registrada</p>
            </div>
          }
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button mat-stroked-button (click)="loadMore()" [disabled]="loading()">
              {{ loading() ? 'Cargando...' : 'Cargar mas' }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .activity-container { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
    .activity-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
    .page-title { color: #1e293b; font-size: 1.3rem; margin: 0; }
    .loading-wrapper { display: flex; justify-content: center; padding: 3rem; }
    .timeline { display: flex; flex-direction: column; gap: 0; position: relative; padding-left: 20px; }
    .timeline::before { content: ''; position: absolute; left: 7px; top: 12px; bottom: 12px; width: 2px; background: #e2e8f0; }
    .timeline-item { position: relative; padding: 0.75rem 0; }
    .timeline-dot { position: absolute; left: -20px; top: 1.1rem; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; z-index: 1; }
    .dot-proposal_created { background: #c8a84b; }
    .dot-vote_cast { background: #ff9800; }
    .dot-member_joined { background: #4caf50; }
    .dot-proposal_approved { background: #00bcd4; }
    .dot-results_published { background: #c8a84b; }
    .timeline-content { display: flex; align-items: flex-start; gap: 0.75rem; background: #fff; border-radius: 10px; padding: 0.85rem 1rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .timeline-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; color: #64748b; }
    .timeline-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .timeline-user { color: #1e293b; font-weight: 600; font-size: 0.85rem; }
    .timeline-detail { color: #64748b; font-size: 0.8rem; }
    .timeline-date { color: #94a3b8; font-size: 0.7rem; margin-top: 2px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 3rem; color: #64748b; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; margin-bottom: 0.75rem; }
    .load-more { display: flex; justify-content: center; margin-top: 1.5rem; }
  `],
})
export class GroupActivityComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private groupService = inject(GroupService);

  groupId = 0;
  items = signal<ActivityEntry[]>([]);
  loading = signal(true);
  error = signal(false);
  page = signal(1);
  hasMore = signal(false);

  private total = 0;
  private readonly limit = 20;

  ngOnInit(): void {
    this.groupId = +(this.route.snapshot.params['id'] || 0);
    this.loadActivity();
  }

  loadActivity(): void {
    this.loading.set(true);
    this.error.set(false);
    this.groupService.getActivity(this.groupId, this.page(), this.limit).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (this.page() === 1) {
            this.items.set(res.data.items);
          } else {
            this.items.update(prev => [...prev, ...res.data!.items]);
          }
          this.total = res.data.total;
          this.hasMore.set(this.items().length < this.total);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  loadMore(): void {
    this.page.update(p => p + 1);
    this.loadActivity();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'proposal_created': return 'post_add';
      case 'vote_cast': return 'how_to_vote';
      case 'member_joined': return 'person_add';
      case 'proposal_approved': return 'check_circle';
      case 'results_published': return 'emoji_events';
      default: return 'info';
    }
  }
}
