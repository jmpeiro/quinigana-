import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="notif-container">
      <div class="notif-page-header">
        <h1 class="page-title">Notificaciones</h1>
        @if (notificationService.unreadCount() > 0) {
          <button mat-button class="mark-all-btn" (click)="markAllRead()">
            <mat-icon>done_all</mat-icon>
            Marcar todas como leidas
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="notif-list">
          @for (notif of notifications(); track notif.id) {
            <div class="notif-row" [class.unread]="!notif.is_read" (click)="onNotifClick(notif)">
              <div class="notif-icon-wrap">
                <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
              </div>
              <div class="notif-body">
                <div class="notif-title">{{ notif.title }}</div>
                <div class="notif-msg">{{ notif.message }}</div>
                <div class="notif-time">{{ formatTime(notif.created_at) }}</div>
              </div>
              @if (!notif.is_read) {
                <div class="unread-dot"></div>
              }
            </div>
          } @empty {
            <div class="empty">No tienes notificaciones.</div>
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
    .notif-container { max-width: 700px; margin: 0 auto; padding: 1.5rem; }
    .notif-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-title { color: #1e293b; font-size: 1.5rem; margin: 0; }
    .mark-all-btn { color: #c8a84b; font-size: 0.8rem; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .notif-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .notif-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: #fff; border-radius: 10px; cursor: pointer; border: 1px solid #e2e8f0; transition: background 0.2s; }
    .notif-row:hover { background: #f1f5f9; }
    .notif-row.unread { border-left: 3px solid #c8a84b; }
    .notif-icon-wrap { width: 36px; height: 36px; border-radius: 50%; background: rgba(200,168,75,0.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .notif-icon-wrap mat-icon { color: #c8a84b; font-size: 20px; width: 20px; height: 20px; }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { color: #1e293b; font-weight: 500; font-size: 0.9rem; }
    .notif-msg { color: #64748b; font-size: 0.8rem; margin-top: 2px; }
    .notif-time { color: #94a3b8; font-size: 0.7rem; margin-top: 4px; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #c8a84b; flex-shrink: 0; margin-top: 6px; }
    .empty { text-align: center; color: #64748b; padding: 3rem; font-size: 0.9rem; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; }
    .page-info { color: #64748b; font-size: 0.85rem; }
  `]
})
export class NotificationListComponent implements OnInit {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<AppNotification[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);

  ngOnInit(): void {
    this.loadNotifications();
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.notificationService.getNotifications(this.page(), 20).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notifications.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onNotifClick(notif: AppNotification): void {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        this.notificationService.unreadCount.update(c => Math.max(0, c - 1));
        this.notifications.update(list => list.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      });
    }
    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.unreadCount.set(0);
      this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'new_jornada': return 'event';
      case 'proposal_submitted': return 'ballot';
      case 'vote_needed': return 'how_to_vote';
      case 'results_published': return 'emoji_events';
      case 'invitation_received': return 'group_add';
      default: return 'notifications';
    }
  }
}
