import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProposalService } from '../../../core/services/proposal.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProposalWithDetails, ProposalComment } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-proposal-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="proposal-detail-container">
      <button mat-button class="back-button" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Back
      </button>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Loading proposal details...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
        </div>
      } @else if (proposal()) {
        <mat-card class="header-card">
          <mat-card-header>
            <mat-card-title>
              {{ proposal()!.title || 'Untitled Proposal' }}
            </mat-card-title>
            <mat-card-subtitle>
              Proposed by {{ proposal()!.proposer_name }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="header-meta">
              <span class="status-badge" [class]="'status-' + proposal()!.status">
                {{ proposal()!.status | uppercase }}
              </span>

              <div class="votes-info">
                <div class="vote-item vote-for">
                  <mat-icon>thumb_up</mat-icon>
                  <span>{{ proposal()!.votes_for }}</span>
                </div>
                <div class="vote-item vote-against">
                  <mat-icon>thumb_down</mat-icon>
                  <span>{{ proposal()!.votes_against }}</span>
                </div>
                <div class="vote-item vote-total">
                  <mat-icon>group</mat-icon>
                  <span>{{ proposal()!.total_members_at_creation }}</span>
                </div>
              </div>
            </div>
            @if (proposal()!.status === 'pending') {
              <p class="vote-hint">
                Se aprueba con {{ majorityNeeded() }}
                {{ majorityNeeded() === 1 ? 'voto a favor' : 'votos a favor' }}
                (mayoria de {{ proposal()!.total_members_at_creation }} miembros).
              </p>
            }
          </mat-card-content>

          <mat-card-actions class="header-actions">
            @if (canVote()) {
              <button mat-raised-button color="primary" (click)="vote('approve')" [disabled]="voting()">
                <mat-icon>thumb_up</mat-icon>
                Aprobar
              </button>
              <button mat-raised-button color="warn" (click)="vote('reject')" [disabled]="voting()">
                <mat-icon>thumb_down</mat-icon>
                Rechazar
              </button>
            }
            @if (canSubmitForVoting()) {
              <button mat-raised-button color="accent" (click)="submitForVoting()" [disabled]="voting()">
                <mat-icon>how_to_vote</mat-icon>
                Enviar a Votacion
              </button>
            }
            @if (canEdit()) {
              <button mat-stroked-button (click)="editProposal()">
                <mat-icon>edit</mat-icon>
                Editar
              </button>
            }
            @if (canDelete()) {
              <button mat-stroked-button color="warn" (click)="deleteProposal()" [disabled]="deleting()">
                <mat-icon>delete</mat-icon>
                Eliminar
              </button>
            }
            @if (voting() || deleting()) {
              <mat-spinner diameter="24"></mat-spinner>
            }
          </mat-card-actions>
        </mat-card>

        <mat-card class="predictions-card">
          <mat-card-header>
            <mat-card-title>Predictions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="predictions-table">
              <div class="table-header">
                <span class="col-num">#</span>
                <span class="col-teams">Match</span>
                <span class="col-pred">1X2</span>
                <span class="col-score">Score</span>
              </div>
              @for (prediction of proposal()!.predictions; track prediction.id; let i = $index) {
                <div class="table-row">
                  <span class="col-num">{{ i + 1 }}</span>
                  <span class="col-teams">
                    {{ getMatchTeams(prediction.match_id) }}
                  </span>
                  <span class="col-pred">
                    <span class="prediction-badge"
                      [class.pred-simple]="prediction.prediction_1x2.length === 1"
                      [class.pred-doble]="prediction.prediction_1x2.length === 2"
                      [class.pred-triple]="prediction.prediction_1x2.length === 3">
                      {{ prediction.prediction_1x2 }}
                    </span>
                  </span>
                  <span class="col-score">
                    @if (prediction.home_score_prediction !== null && prediction.away_score_prediction !== null) {
                      {{ prediction.home_score_prediction }} - {{ prediction.away_score_prediction }}
                    } @else {
                      <span class="no-score">-</span>
                    }
                  </span>
                </div>
                @if (!$last) {
                  <mat-divider></mat-divider>
                }
              } @empty {
                <div class="empty-predictions">
                  <p>No predictions available.</p>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Comments Section -->
        <mat-card class="comments-card">
          <mat-card-header>
            <mat-card-title>Comentarios ({{ commentTotal() }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="comment-input">
              <input type="text" placeholder="Escribe un comentario..."
                     [value]="newComment()"
                     (input)="newComment.set($any($event.target).value)"
                     (keydown.enter)="sendComment()"
                     [disabled]="sendingComment()"
                     maxlength="1000" />
              <button mat-icon-button (click)="sendComment()" [disabled]="!newComment().trim() || sendingComment()">
                <mat-icon>send</mat-icon>
              </button>
            </div>

            @if (loadingComments()) {
              <div class="comments-loading"><mat-spinner diameter="24"></mat-spinner></div>
            } @else {
              @for (comment of comments(); track comment.id) {
                <div class="comment-item">
                  <div class="comment-avatar">
                    @if (comment.avatarUrl) {
                      <img [src]="comment.avatarUrl" [alt]="comment.userName" />
                    } @else {
                      <mat-icon>account_circle</mat-icon>
                    }
                  </div>
                  <div class="comment-body">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.userName }}</span>
                      <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                      @if (comment.userId === currentUserId()) {
                        <button mat-icon-button class="comment-delete" (click)="removeComment(comment.id)">
                          <mat-icon>close</mat-icon>
                        </button>
                      }
                    </div>
                    <p class="comment-text">{{ comment.message }}</p>
                  </div>
                </div>
              } @empty {
                <p class="no-comments">No hay comentarios aun. Se el primero en opinar.</p>
              }

              @if (commentTotalPages() > 1 && commentPage() < commentTotalPages()) {
                <button mat-button class="load-more" (click)="loadMoreComments()">
                  Cargar mas comentarios
                </button>
              }
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
    }

    .proposal-detail-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .back-button {
      color: #64748b;
      margin-bottom: 16px;
      mat-icon { margin-right: 4px; }
      &:hover { color: #1e293b; }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      color: #64748b;
      p { margin-top: 16px; font-size: 16px; }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      color: #ef5350;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
      p { margin-top: 12px; font-size: 16px; }
    }

    .header-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 24px;
      mat-card-title { color: #1e293b; font-size: 22px; }
      mat-card-subtitle { color: #64748b; font-size: 14px; }
    }

    .header-meta {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .status-draft {
      background: rgba(158, 158, 158, 0.12);
      color: #9e9e9e;
      border: 1px solid rgba(158, 158, 158, 0.25);
    }

    .status-pending {
      background: rgba(255, 193, 7, 0.12);
      color: #ffc107;
      border: 1px solid rgba(255, 193, 7, 0.25);
    }

    .status-approved {
      background: rgba(76, 175, 80, 0.15);
      color: #66bb6a;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-rejected {
      background: rgba(239, 83, 80, 0.12);
      color: #ef5350;
      border: 1px solid rgba(239, 83, 80, 0.25);
    }

    .vote-hint {
      margin: 0.6rem 0 0;
      color: #64748b;
      font-size: 0.82rem;
      line-height: 1.45;
    }
    .votes-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .vote-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 500;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .vote-for { color: #66bb6a; }
    .vote-against { color: #ef5350; }
    .vote-total { color: #64748b; }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      flex-wrap: wrap;
      button { display: flex; align-items: center; gap: 6px; }
    }

    .predictions-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      mat-card-title { color: #1e293b; font-size: 20px; }
    }

    .predictions-table { margin-top: 12px; }

    .table-header {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-row {
      display: flex;
      align-items: center;
      padding: 12px 8px;
    }

    .col-num {
      width: 40px;
      flex-shrink: 0;
      text-align: center;
      color: #c8a84b;
      font-weight: 600;
      font-size: 13px;
    }

    .col-teams {
      flex: 1;
      color: #1e293b;
      font-size: 14px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .col-pred {
      width: 70px;
      flex-shrink: 0;
      text-align: center;
    }

    .col-score {
      width: 80px;
      flex-shrink: 0;
      text-align: center;
      color: #475569;
      font-size: 14px;
    }

    .prediction-badge {
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
    }

    .pred-simple { background: rgba(76, 175, 80, 0.2); color: #4caf50; }
    .pred-doble { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .pred-triple { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .no-score { color: #94a3b8; }
    .empty-predictions { padding: 32px; text-align: center; color: #94a3b8; }
    mat-divider { border-top-color: #e2e8f0; }

    .comments-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-top: 24px;
      mat-card-title { color: #1e293b; font-size: 18px; }
    }

    .comment-input {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      input {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 14px;
        outline: none;
        background: #f8fafc;
        color: #1e293b;
        &:focus { border-color: #c8a84b; }
        &::placeholder { color: #94a3b8; }
      }
      button {
        color: #c8a84b;
        &:disabled { color: #cbd5e1; }
      }
    }

    .comments-loading {
      display: flex;
      justify-content: center;
      padding: 16px;
    }

    .comment-item {
      display: flex;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;
      &:last-child { border-bottom: none; }
    }

    .comment-avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #94a3b8;
      }
    }

    .comment-body { flex: 1; min-width: 0; }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .comment-author {
      font-weight: 600;
      font-size: 13px;
      color: #1e293b;
    }

    .comment-time {
      font-size: 11px;
      color: #94a3b8;
    }

    .comment-delete {
      width: 20px !important;
      height: 20px !important;
      line-height: 20px !important;
      mat-icon {
        font-size: 14px !important;
        width: 14px !important;
        height: 14px !important;
        color: #94a3b8;
      }
      &:hover mat-icon { color: #ef5350; }
    }

    .comment-text {
      margin: 4px 0 0;
      font-size: 13px;
      color: #475569;
      word-break: break-word;
    }

    .no-comments {
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      padding: 16px 0;
    }

    .load-more {
      display: block;
      margin: 12px auto 0;
      color: #c8a84b;
      font-size: 13px;
    }
  `],
})
export class ProposalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private proposalService = inject(ProposalService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  proposal = signal<ProposalWithDetails | null>(null);
  loading = signal(true);
  voting = signal(false);
  error = signal<string | null>(null);

  // Comments
  comments = signal<ProposalComment[]>([]);
  newComment = signal('');
  loadingComments = signal(false);
  sendingComment = signal(false);
  commentPage = signal(1);
  commentTotal = signal(0);
  commentTotalPages = signal(1);

  groupId = 0;
  proposalId = 0;

  private matchTeamsMap = signal<Map<number, string>>(new Map());

  currentUserId = computed(() => {
    const user = this.authService.currentUser();
    return user ? user.id : 0;
  });

  majorityNeeded = computed(() => {
    const total = this.proposal()?.total_members_at_creation ?? 0;
    return Math.floor(total / 2) + 1;
  });

  canVote = computed(() => {
    const p = this.proposal();
    return p !== null && p.status === 'pending' && p.user_vote === null;
  });

  canSubmitForVoting = computed(() => {
    const p = this.proposal();
    const user = this.authService.currentUser();
    return p !== null && p.status === 'draft' && user !== null && p.proposed_by === user.id;
  });

  canEdit = computed(() => {
    const p = this.proposal();
    const user = this.authService.currentUser();
    return p !== null && p.status === 'draft' && user !== null && p.proposed_by === user.id;
  });

  canDelete = computed(() => {
    const p = this.proposal();
    const user = this.authService.currentUser();
    return p !== null && p.status !== 'approved' && user !== null && p.proposed_by === user.id;
  });

  deleting = signal(false);

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('groupId')) || 0;
    this.proposalId = Number(this.route.snapshot.paramMap.get('proposalId')) || 0;

    if (!this.groupId || !this.proposalId) {
      this.error.set('Invalid group or proposal ID.');
      this.loading.set(false);
      return;
    }

    this.loadProposal();
    this.loadComments();
  }

  private loadProposal(): void {
    this.loading.set(true);
    this.error.set(null);

    this.proposalService.getDetail(this.groupId, this.proposalId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.proposal.set(response.data);
        } else {
          this.error.set('Failed to load proposal details.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'An error occurred while loading proposal details.');
        this.loading.set(false);
      },
    });
  }

  getMatchTeams(matchId: number): string {
    const cached = this.matchTeamsMap().get(matchId);
    if (cached) return cached;
    return `Match #${matchId}`;
  }

  vote(voteType: 'approve' | 'reject'): void {
    this.voting.set(true);

    this.proposalService.vote(this.groupId, this.proposalId, voteType).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.proposal.set(response.data);
          this.snackBar.open(
            `Vote "${voteType}" registered successfully.`,
            'OK',
            { duration: 3000 }
          );
        } else {
          this.snackBar.open('Failed to register vote.', 'OK', {
            duration: 4000,
            panelClass: 'snackbar-error',
          });
        }
        this.voting.set(false);
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'An error occurred while voting.',
          'OK',
          { duration: 4000, panelClass: 'snackbar-error' }
        );
        this.voting.set(false);
      },
    });
  }

  submitForVoting(): void {
    this.voting.set(true);

    this.proposalService.submitForVoting(this.groupId, this.proposalId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.proposal.set(response.data);
          this.snackBar.open('Proposal submitted for voting!', 'OK', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to submit proposal for voting.', 'OK', {
            duration: 4000,
            panelClass: 'snackbar-error',
          });
        }
        this.voting.set(false);
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'An error occurred.',
          'OK',
          { duration: 4000, panelClass: 'snackbar-error' }
        );
        this.voting.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/groups', this.groupId]);
  }

  editProposal(): void {
    // Navigate to edit page (reuse create page with edit mode)
    const p = this.proposal();
    if (p) {
      this.router.navigate(['/quiniela/proposals/create'], {
        queryParams: { groupId: this.groupId, jornadaId: p.jornada_id, proposalId: this.proposalId }
      });
    }
  }

  deleteProposal(): void {
    if (!confirm('¿Estas seguro de que quieres eliminar esta propuesta?')) {
      return;
    }

    this.deleting.set(true);
    this.proposalService.delete(this.groupId, this.proposalId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Propuesta eliminada correctamente', 'OK', { duration: 3000 });
          this.router.navigate(['/groups', this.groupId]);
        } else {
          this.snackBar.open('Error al eliminar la propuesta', 'OK', { duration: 4000, panelClass: 'snackbar-error' });
        }
        this.deleting.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al eliminar la propuesta', 'OK', { duration: 4000, panelClass: 'snackbar-error' });
        this.deleting.set(false);
      },
    });
  }

  // --- Comments ---

  loadComments(): void {
    this.loadingComments.set(true);
    this.proposalService.getComments(this.groupId, this.proposalId, 1).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.comments.set(this.mapComments(response.data.items));
          this.commentTotal.set(response.data.total);
          this.commentTotalPages.set(response.data.totalPages);
          this.commentPage.set(1);
        }
        this.loadingComments.set(false);
      },
      error: () => this.loadingComments.set(false),
    });
  }

  loadMoreComments(): void {
    const nextPage = this.commentPage() + 1;
    this.proposalService.getComments(this.groupId, this.proposalId, nextPage).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.comments.set([...this.comments(), ...this.mapComments(response.data.items)]);
          this.commentPage.set(nextPage);
        }
      },
    });
  }

  sendComment(): void {
    const msg = this.newComment().trim();
    if (!msg || this.sendingComment()) return;

    this.sendingComment.set(true);
    this.proposalService.addComment(this.groupId, this.proposalId, msg).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const mapped = this.mapComments([response.data as any]);
          this.comments.set([...this.comments(), ...mapped]);
          this.commentTotal.set(this.commentTotal() + 1);
          this.newComment.set('');
        }
        this.sendingComment.set(false);
      },
      error: () => this.sendingComment.set(false),
    });
  }

  removeComment(commentId: number): void {
    this.proposalService.deleteComment(this.groupId, this.proposalId, commentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.comments.set(this.comments().filter(c => c.id !== commentId));
          this.commentTotal.set(Math.max(0, this.commentTotal() - 1));
        }
      },
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  private mapComments(items: any[]): ProposalComment[] {
    return items.map(item => ({
      id: item.id,
      proposalId: item.proposal_id ?? item.proposalId,
      userId: item.user_id ?? item.userId,
      userName: (item.user_name ?? item.userName ?? '').trim(),
      avatarUrl: item.avatar_url ?? item.avatarUrl ?? null,
      message: item.message,
      createdAt: item.created_at ?? item.createdAt,
    }));
  }
}
