import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatBadgeModule, MatMenuModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notifMenu" (menuOpened)="loadRecent()" class="bell-btn">
      @if (notificationService.unreadCount() > 0) {
        <mat-icon [matBadge]="notificationService.unreadCount()" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
      } @else {
        <mat-icon>notifications_none</mat-icon>
      }
    </button>

    <mat-menu #notifMenu="matMenu" class="notif-menu">
      <div class="notif-header" (click)="$event.stopPropagation()">
        <span>Notificaciones</span>
        @if (notificationService.unreadCount() > 0) {
          <button mat-button class="mark-all-btn" (click)="markAllRead()">Marcar todas</button>
        }
      </div>
      @for (notif of recentNotifs(); track notif.id) {
        <button mat-menu-item class="notif-item" [class.unread]="!notif.is_read" (click)="onNotifClick(notif)">
          <mat-icon class="notif-icon">{{ getIcon(notif.type) }}</mat-icon>
          <div class="notif-content">
            <span class="notif-title">{{ notif.title }}</span>
            <span class="notif-msg">{{ notif.message }}</span>
          </div>
        </button>
      } @empty {
        <div class="notif-empty" (click)="$event.stopPropagation()">Sin notificaciones</div>
      }
      <button mat-menu-item class="view-all-btn" (click)="viewAll()">
        <mat-icon>list</mat-icon>
        Ver todas
      </button>
    </mat-menu>
  `,
  styles: [`
    .bell-btn { color: #64748b; }
    .notif-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600; font-size: 0.9rem; }
    .mark-all-btn { font-size: 0.7rem; color: #c8a84b; min-width: auto; padding: 0 8px; line-height: 28px; }
    .notif-item { height: auto !important; padding: 10px 16px !important; white-space: normal !important; }
    .notif-item.unread { background: rgba(200, 168, 75, 0.06); }
    .notif-icon { color: #c8a84b; margin-right: 12px; flex-shrink: 0; }
    .notif-content { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .notif-title { font-size: 0.8rem; color: #1e293b; font-weight: 500; }
    .notif-msg { font-size: 0.72rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .notif-empty { padding: 24px 16px; text-align: center; color: #94a3b8; font-size: 0.85rem; }
    .view-all-btn { border-top: 1px solid #e2e8f0; color: #c8a84b; font-size: 0.8rem; }
  `]
})
export class NotificationBellComponent {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  recentNotifs = signal<AppNotification[]>([]);

  loadRecent(): void {
    this.notificationService.getNotifications(1, 5).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentNotifs.set(response.data.items);
        }
      }
    });
  }

  onNotifClick(notif: AppNotification): void {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        this.notificationService.unreadCount.update(c => Math.max(0, c - 1));
      });
    }
    const route = this.resolveRoute(notif);
    if (route) this.router.navigateByUrl(route);
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.unreadCount.set(0);
      this.recentNotifs.update(list => list.map(n => ({ ...n, is_read: true })));
    });
  }

  viewAll(): void {
    this.router.navigate(['/notifications']);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'new_jornada': return 'event';
      case 'proposal_submitted': return 'ballot';
      case 'vote_needed': return 'how_to_vote';
      case 'results_published': return 'emoji_events';
      case 'invitation_received': return 'group_add';
      case 'badge_unlocked': return 'workspace_premium';
      case 'challenge_received': return 'sports_martial_arts';
      case 'challenge_accepted': return 'flag';
      case 'challenge_result': return 'military_tech';
      case 'league_update': return 'leaderboard';
      default: return 'notifications';
    }
  }

  private resolveRoute(notif: AppNotification): string | null {
    if (notif.actionType) {
      if (notif.actionType === 'open_proposal' && notif.actionTarget?.groupId && notif.actionTarget?.proposalId) {
        return `/quiniela/groups/${notif.actionTarget.groupId}/proposals/${notif.actionTarget.proposalId}`;
      }
      if (notif.actionType === 'open_jornada' && notif.actionTarget?.jornadaId) {
        return `/quiniela/jornadas/${notif.actionTarget.jornadaId}`;
      }
      if (notif.actionType === 'open_invite') {
        return '/groups/invitations';
      }
      if (notif.actionType === 'open_challenge') {
        return '/challenges';
      }
    }

    return notif.link;
  }
}
