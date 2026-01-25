import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvitationService } from '../../../core/services/invitation.service';
import { GroupInvitation } from '../../../core/models/group.model';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="invitations-container animate-fade-in">
      <header class="invitations-header">
        <a routerLink="/groups" mat-icon-button aria-label="Back to groups">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1>Pending Invitations</h1>
      </header>

      @if (invitationService.loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36"></mat-spinner>
        </div>
      } @else if (invitationService.pendingInvitations().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">mail_outline</mat-icon>
          <h2>No pending invitations</h2>
          <p>You don't have any group invitations at the moment.</p>
          <a routerLink="/groups" mat-flat-button color="primary">
            Back to Groups
          </a>
        </div>
      } @else {
        <div class="invitations-list">
          @for (invitation of invitationService.pendingInvitations(); track invitation.id) {
            <div class="invitation-card">
              <div class="invitation-info">
                <h3 class="group-name">{{ invitation.group_name }}</h3>
                <p class="invited-by">
                  <mat-icon class="info-icon">person</mat-icon>
                  Invited by <strong>{{ invitation.inviter_name }}</strong>
                </p>
                <p class="invited-date">
                  <mat-icon class="info-icon">schedule</mat-icon>
                  {{ invitation.created_at | date:'mediumDate' }}
                </p>
              </div>
              <div class="invitation-actions">
                <button
                  mat-flat-button
                  class="accept-btn"
                  (click)="acceptInvitation(invitation)"
                  [disabled]="processingId === invitation.id"
                >
                  <mat-icon>check</mat-icon>
                  Accept
                </button>
                <button
                  mat-stroked-button
                  class="reject-btn"
                  (click)="rejectInvitation(invitation)"
                  [disabled]="processingId === invitation.id"
                >
                  <mat-icon>close</mat-icon>
                  Reject
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .invitations-container {
      min-height: 100vh;
      padding: $spacing-lg;
      max-width: 700px;
      margin: 0 auto;
    }

    .invitations-header {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-xl;
      padding-bottom: $spacing-md;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      h1 {
        margin: 0;
        font-size: $font-size-2xl;
        font-weight: 700;
        color: $neutral-100;
      }
    }

    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: $spacing-3xl;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: $spacing-3xl $spacing-xl;
      text-align: center;

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: $neutral-500;
        margin-bottom: $spacing-lg;
      }

      h2 {
        margin: 0 0 $spacing-sm;
        font-size: $font-size-xl;
        color: $neutral-200;
      }

      p {
        margin: 0 0 $spacing-xl;
        color: $neutral-400;
        font-size: $font-size-sm;
      }
    }

    .invitations-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-md;
    }

    .invitation-card {
      background: $primary-700;
      border-radius: $radius-lg;
      padding: $spacing-lg;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: $spacing-lg;
      transition: border-color $transition-base;

      &:hover {
        border-color: rgba(233, 69, 96, 0.2);
      }

      @media (max-width: $breakpoint-sm) {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .invitation-info {
      flex: 1;

      .group-name {
        margin: 0 0 $spacing-sm;
        font-size: $font-size-lg;
        font-weight: 600;
        color: $neutral-100;
      }

      .invited-by,
      .invited-date {
        margin: 0;
        display: flex;
        align-items: center;
        gap: $spacing-xs;
        color: $neutral-400;
        font-size: $font-size-sm;
        line-height: 1.8;

        strong {
          color: $neutral-200;
        }
      }

      .info-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: $neutral-500;
      }
    }

    .invitation-actions {
      display: flex;
      gap: $spacing-sm;
      flex-shrink: 0;

      .accept-btn {
        background: $success;
        color: #fff;
      }

      .reject-btn {
        border-color: $neutral-500;
        color: $neutral-300;
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: $spacing-xs;
      }

      @media (max-width: $breakpoint-sm) {
        width: 100%;

        button {
          flex: 1;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationsComponent implements OnInit {
  readonly invitationService = inject(InvitationService);
  private readonly snackBar = inject(MatSnackBar);

  processingId: number | null = null;

  ngOnInit(): void {
    this.loadInvitations();
  }

  acceptInvitation(invitation: GroupInvitation): void {
    this.processingId = invitation.id;
    this.invitationService.accept(invitation.id).subscribe({
      next: () => {
        this.snackBar.open(`Joined "${invitation.group_name}" successfully!`, 'OK', { duration: 3000 });
        this.loadInvitations();
      },
      error: () => {
        this.snackBar.open('Failed to accept invitation. Please try again.', 'OK', { duration: 3000 });
        this.processingId = null;
      },
    });
  }

  rejectInvitation(invitation: GroupInvitation): void {
    this.processingId = invitation.id;
    this.invitationService.reject(invitation.id).subscribe({
      next: () => {
        this.snackBar.open('Invitation rejected.', 'OK', { duration: 3000 });
        this.loadInvitations();
      },
      error: () => {
        this.snackBar.open('Failed to reject invitation. Please try again.', 'OK', { duration: 3000 });
        this.processingId = null;
      },
    });
  }

  private loadInvitations(): void {
    this.invitationService.getPending().subscribe({
      complete: () => {
        this.processingId = null;
      },
    });
  }
}
