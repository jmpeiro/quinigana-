import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { GroupService } from '../../../core/services/group.service';
import { InvitationService } from '../../../core/services/invitation.service';
import { Group } from '../../../core/models/group.model';
import { ErrorCardComponent } from '../../../shared/components/error-card/error-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    ErrorCardComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="group-list-container">
      <div class="header">
        <h1>My Groups</h1>
        <button mat-icon-button (click)="loadGroups()" [class.spinning]="loading()">
          <mat-icon>refresh</mat-icon>
        </button>

        <!-- Siempre visible: si solo apareciera con invitaciones pendientes,
             no habria forma de llegar a la pantalla para comprobarlo. -->
        <button
          mat-raised-button
          class="invitations-btn"
          [matBadge]="pendingCount()"
          [matBadgeHidden]="pendingCount() === 0"
          matBadgeColor="warn"
          matBadgeSize="small"
          (click)="navigateToInvitations()"
        >
          <mat-icon>mail</mat-icon>
          Invitaciones
        </button>
      </div>

      @if (loading()) {
        <div class="skeleton-groups">
          <app-skeleton variant="card" width="100%" height="120px" />
          <app-skeleton variant="card" width="100%" height="120px" />
          <app-skeleton variant="card" width="100%" height="120px" />
        </div>
      } @else if (error()) {
        <app-error-card (retry)="loadGroups()" />
      } @else if (groups().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">group_off</mat-icon>
          <h2>No Groups Yet</h2>
          <p>You are not a member of any group. Create one or wait for an invitation.</p>
        </div>
      } @else {
        <div class="groups-grid">
          @for (group of groups(); track group.id) {
            <mat-card class="group-card" (click)="navigateToGroup(group.id.toString())">
              <mat-card-header>
                <mat-card-title>{{ group.name }}</mat-card-title>
                <span class="role-badge" [class]="'role-' + group.role">
                  {{ group.role }}
                </span>
              </mat-card-header>
              <mat-card-content>
                <p class="description">{{ truncateDescription(group.description ?? undefined) }}</p>
                <div class="member-info">
                  <mat-icon>people</mat-icon>
                  <span>{{ group.member_count }} {{ group.member_count === 1 ? 'member' : 'members' }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <button
        mat-fab
        class="create-fab"
        color="primary"
        (click)="navigateToCreate()"
        aria-label="Create Group"
      >
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .group-list-container {
      padding: 24px;
      min-height: 100vh;
      background-color: #f8f9fb;
      position: relative;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;

      h1 {
        color: #1e293b;
        font-size: 28px;
        font-weight: 600;
        margin: 0;
      }
    }

    .spinning mat-icon { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .invitations-btn {
      background-color: #fff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;

      p {
        color: #64748b;
        margin-top: 16px;
        font-size: 14px;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #94a3b8;
        opacity: 0.5;
      }

      h2 {
        color: #1e293b;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      p {
        color: #64748b;
        max-width: 400px;
      }
    }

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .group-card {
      background-color: #fff;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid #e2e8f0;
      border-radius: 14px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      mat-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        mat-card-title {
          color: #1e293b;
          font-size: 18px;
          margin: 0;
        }
      }

      mat-card-content {
        padding-top: 12px;
      }

      .description {
        color: #64748b;
        font-size: 14px;
        line-height: 1.4;
        margin-bottom: 12px;
        min-height: 40px;
      }

      .member-info {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 13px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .role-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;

      &.role-admin {
        background-color: rgba(200, 168, 75, 0.15);
        color: #c8a84b;
      }

      &.role-owner {
        background-color: rgba(200, 168, 75, 0.15);
        color: #c8a84b;
      }

      &.role-member {
        background-color: #f1f5f9;
        color: #64748b;
      }
    }

    .create-fab {
      position: fixed;
      bottom: 88px;
      right: 24px;
      background-color: #c8a84b;
      color: #fff;
    }

    .skeleton-groups {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  `],
})
export class GroupListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly groupService = inject(GroupService);
  private readonly invitationService = inject(InvitationService);

  readonly groups = signal<Group[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal(false);
  readonly pendingCount = signal<number>(0);

  ngOnInit(): void {
    this.loadGroups();
    this.loadPendingInvitations();
  }

  loadGroups(): void {
    this.loading.set(true);
    this.error.set(false);
    this.groupService.getMyGroups().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.groups.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private loadPendingInvitations(): void {
    this.invitationService.getPending().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pendingCount.set(response.data.length);
        }
      },
    });
  }

  truncateDescription(description: string | undefined): string {
    if (!description) return 'No description provided.';
    return description.length > 120
      ? description.substring(0, 120) + '...'
      : description;
  }

  navigateToGroup(id: string): void {
    this.router.navigate(['/groups', id]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/groups/create']);
  }

  navigateToInvitations(): void {
    this.router.navigate(['/groups/invitations']);
  }
}
