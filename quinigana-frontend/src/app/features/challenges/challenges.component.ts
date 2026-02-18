import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChallengeService } from '../../core/services/challenge.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ChallengeWithDetails,
  ChallengeStats,
  RivalryStats,
  HeadToHeadResponse,
} from '../../core/models/challenge.model';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { CreateChallengeDialogComponent } from './create-challenge-dialog.component';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    SkeletonComponent,
  ],
  template: `
    <div class="challenges-container">
      <div class="page-header">
        <h1 class="page-title">Retos 1vs1</h1>
        <div class="header-actions">
          @if (isAdmin()) {
            <button mat-stroked-button class="auto-btn" (click)="autoGenerateWeekly()" [disabled]="loadingAutoGenerate()">
              <mat-icon>auto_awesome</mat-icon>
              Auto semanal
            </button>
          }
          <button mat-flat-button color="primary" class="create-btn" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Nuevo Reto
          </button>
        </div>
      </div>

      <!-- Stats Summary -->
      @if (stats()) {
        <div class="stats-grid">
          <div class="stat-card accent">
            <div class="stat-value">{{ stats()!.reputation }}</div>
            <div class="stat-label">Reputacion</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.wins }}-{{ stats()!.losses }}-{{ stats()!.draws }}</div>
            <div class="stat-label">G-P-E</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.winRate }}%</div>
            <div class="stat-label">% Victoria</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats()!.currentStreak }}</div>
            <div class="stat-label">Racha</div>
          </div>
        </div>
      }

      <!-- Pending Challenges Alert -->
      @if (pendingChallenges().length > 0) {
        <div class="pending-alert">
          <mat-icon>notifications_active</mat-icon>
          <span>Tienes {{ pendingChallenges().length }} reto(s) pendiente(s) de responder</span>
        </div>
      }

      <!-- Tabs -->
      <mat-tab-group class="challenges-tabs" animationDuration="200ms" (selectedIndexChange)="onTabChange($event)">
        <!-- Pending -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>hourglass_empty</mat-icon>
            <span>Pendientes</span>
            @if (pendingChallenges().length > 0) {
              <span class="badge">{{ pendingChallenges().length }}</span>
            }
          </ng-template>
          <div class="tab-content">
            @if (loadingPending()) {
              <app-skeleton variant="card" height="100px" />
              <app-skeleton variant="card" height="100px" />
            } @else if (pendingChallenges().length === 0) {
              <div class="empty-state">
                <mat-icon>sports_kabaddi</mat-icon>
                <span>No tienes retos pendientes</span>
              </div>
            } @else {
              @for (challenge of pendingChallenges(); track challenge.id) {
                <div class="challenge-card pending">
                  <div class="challenge-header">
                    <div class="challenge-users">
                      <div class="user">
                        <div class="avatar" [style.backgroundImage]="getAvatarUrl(challenge.challenger_avatar)">
                          @if (!challenge.challenger_avatar) {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <span class="name">{{ challenge.challenger_name }}</span>
                      </div>
                      <div class="vs">VS</div>
                      <div class="user">
                        <div class="avatar" [style.backgroundImage]="getAvatarUrl(challenge.challenged_avatar)">
                          @if (!challenge.challenged_avatar) {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <span class="name">{{ challenge.challenged_name }}</span>
                      </div>
                    </div>
                    <div class="wager">
                      <mat-icon>stars</mat-icon>
                      {{ challenge.wager_points }}
                    </div>
                  </div>
                  <div class="challenge-info">
                    <span class="jornada">{{ challenge.jornada_name }}</span>
                    @if (challenge.message) {
                      <span class="message">"{{ challenge.message }}"</span>
                    }
                  </div>
                  @if (isChallengee(challenge)) {
                    <div class="challenge-actions">
                      <button mat-stroked-button color="warn" (click)="rejectChallenge(challenge.id)">
                        Rechazar
                      </button>
                      <button mat-flat-button color="primary" (click)="acceptChallenge(challenge.id)">
                        Aceptar
                      </button>
                    </div>
                  } @else {
                    <div class="challenge-actions">
                      <button mat-stroked-button (click)="cancelChallenge(challenge.id)">
                        Cancelar
                      </button>
                      <span class="waiting">Esperando respuesta...</span>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </mat-tab>

        <!-- Active -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>play_circle</mat-icon>
            <span>Activos</span>
          </ng-template>
          <div class="tab-content">
            @if (loadingActive()) {
              <app-skeleton variant="card" height="100px" />
            } @else if (activeChallenges().length === 0) {
              <div class="empty-state">
                <mat-icon>sports_score</mat-icon>
                <span>No tienes retos activos</span>
              </div>
            } @else {
              @for (challenge of activeChallenges(); track challenge.id) {
                <div class="challenge-card active">
                  <div class="challenge-header">
                    <div class="challenge-users">
                      <div class="user">
                        <div class="avatar" [style.backgroundImage]="getAvatarUrl(challenge.challenger_avatar)">
                          @if (!challenge.challenger_avatar) {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <span class="name">{{ challenge.challenger_name }}</span>
                      </div>
                      <div class="vs">VS</div>
                      <div class="user">
                        <div class="avatar" [style.backgroundImage]="getAvatarUrl(challenge.challenged_avatar)">
                          @if (!challenge.challenged_avatar) {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <span class="name">{{ challenge.challenged_name }}</span>
                      </div>
                    </div>
                    <div class="wager">
                      <mat-icon>stars</mat-icon>
                      {{ challenge.wager_points }}
                    </div>
                  </div>
                  <div class="challenge-info">
                    <span class="jornada">{{ challenge.jornada_name }}</span>
                    <mat-chip class="status-chip accepted">En curso</mat-chip>
                  </div>
                </div>
              }
            }
          </div>
        </mat-tab>

        <!-- Completed -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>emoji_events</mat-icon>
            <span>Historial</span>
          </ng-template>
          <div class="tab-content">
            @if (loadingCompleted()) {
              <app-skeleton variant="card" height="100px" />
              <app-skeleton variant="card" height="100px" />
            } @else if (completedChallenges().length === 0) {
              <div class="empty-state">
                <mat-icon>history</mat-icon>
                <span>No hay retos completados</span>
              </div>
            } @else {
              @for (challenge of completedChallenges(); track challenge.id) {
                <div class="challenge-card completed" [class.won]="isWinner(challenge)" [class.lost]="isLoser(challenge)">
                  <div class="challenge-header">
                    <div class="challenge-users">
                      <div class="user" [class.winner]="challenge.winner_id === challenge.challenger_id">
                        <div class="avatar" [style.backgroundImage]="getAvatarUrl(challenge.challenger_avatar)">
                          @if (!challenge.challenger_avatar) {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <span class="name">{{ challenge.challenger_name }}</span>
                        <span class="score">{{ challenge.challenger_score }}</span>
                      </div>
                      <div class="vs">VS</div>
                      <div class="user" [class.winner]="challenge.winner_id === challenge.challenged_id">
                        <div class="avatar" [style.backgroundImage]="getAvatarUrl(challenge.challenged_avatar)">
                          @if (!challenge.challenged_avatar) {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <span class="name">{{ challenge.challenged_name }}</span>
                        <span class="score">{{ challenge.challenged_score }}</span>
                      </div>
                    </div>
                    <div class="result-badge" [class.win]="isWinner(challenge)" [class.loss]="isLoser(challenge)" [class.draw]="isDraw(challenge)">
                      @if (isWinner(challenge)) {
                        <mat-icon>emoji_events</mat-icon>
                        +{{ challenge.wager_points }}
                      } @else if (isLoser(challenge)) {
                        <mat-icon>trending_down</mat-icon>
                        -{{ challenge.wager_points }}
                      } @else {
                        <mat-icon>handshake</mat-icon>
                        Empate
                      }
                    </div>
                  </div>
                  <div class="challenge-info">
                    <span class="jornada">{{ challenge.jornada_name }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </mat-tab>

        <!-- Rivalries -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>groups</mat-icon>
            <span>Rivales</span>
          </ng-template>
          <div class="tab-content">
            @if (loadingRivalries()) {
              <app-skeleton variant="card" height="80px" />
              <app-skeleton variant="card" height="80px" />
            } @else if (rivalries().length === 0) {
              <div class="empty-state">
                <mat-icon>person_search</mat-icon>
                <span>No tienes rivales todavia</span>
              </div>
            } @else {
              @for (rival of rivalries(); track rival.opponent_id) {
                <div class="rivalry-card">
                  <div class="rival-info">
                    <div class="avatar" [style.backgroundImage]="getAvatarUrl(rival.opponent_avatar)">
                      @if (!rival.opponent_avatar) {
                        <mat-icon>person</mat-icon>
                      }
                    </div>
                    <div class="rival-details">
                      <span class="rival-name">{{ rival.opponent_name }}</span>
                      <span class="rival-record">{{ rival.wins }}-{{ rival.losses }}-{{ rival.draws }}</span>
                    </div>
                  </div>
                  <div class="rival-stats">
                    <span class="net-points" [class.positive]="rival.net_points > 0" [class.negative]="rival.net_points < 0">
                      {{ rival.net_points > 0 ? '+' : '' }}{{ rival.net_points }}
                    </span>
                    <span class="total-matches">{{ rival.total_challenges }} retos</span>
                    <button mat-stroked-button class="h2h-btn" (click)="loadHeadToHead(rival.opponent_id)">Ver H2H</button>
                  </div>
                </div>

                @if (selectedRivalId() === rival.opponent_id) {
                  <div class="h2h-panel">
                    @if (loadingHeadToHead()) {
                      <app-skeleton variant="card" height="80px" />
                    } @else if (!selectedHeadToHead()?.recent?.length) {
                      <div class="h2h-empty">Sin historial reciente.</div>
                    } @else {
                      <div class="h2h-summary">
                        <span>Total: {{ selectedHeadToHead()?.stats?.total_challenges || 0 }}</span>
                        <span>Record: {{ selectedHeadToHead()?.stats?.wins || 0 }}-{{ selectedHeadToHead()?.stats?.losses || 0 }}-{{ selectedHeadToHead()?.stats?.draws || 0 }}</span>
                        <span>Neto: {{ selectedHeadToHead()?.stats?.net_points || 0 }}</span>
                      </div>
                      @for (item of selectedHeadToHead()!.recent; track item.challenge_id) {
                        <div class="h2h-item">
                          <span class="h2h-jornada">{{ item.jornada_name }}</span>
                          <span class="h2h-score">{{ item.challenger_score }} - {{ item.challenged_score }}</span>
                          @if (item.winner_id === currentUserId) {
                            <span class="h2h-result win">Ganado</span>
                          } @else if (item.winner_id === null) {
                            <span class="h2h-result draw">Empate</span>
                          } @else {
                            <span class="h2h-result loss">Perdido</span>
                          }
                        </div>
                      }
                    }
                  </div>
                }
              }
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .challenges-container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .header-actions { display: flex; gap: 0.5rem; }
    .page-title { color: var(--text-primary, #1e293b); font-size: 1.5rem; margin: 0; }
    .create-btn {
      background: linear-gradient(135deg, #c8a84b 0%, #dfc56a 100%);
      color: #1e293b;
    }
    .auto-btn { border-color: rgba(200, 168, 75, 0.45); color: #7a6220; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: var(--bg-card, #fff);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .stat-card.accent { border-color: rgba(200,168,75,0.3); }
    .stat-value { font-size: 1.4rem; font-weight: 700; color: var(--text-primary, #1e293b); }
    .stat-card.accent .stat-value { color: #c8a84b; }
    .stat-label { color: var(--text-secondary, #64748b); font-size: 0.7rem; margin-top: 4px; }

    .pending-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      color: #f57c00;
    }
    .pending-alert mat-icon { font-size: 24px; }

    .challenges-tabs {
      background: var(--bg-card, #fff);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      overflow: hidden;

      ::ng-deep .mat-mdc-tab-labels { background: var(--bg-secondary, #f8f9fb); }
      ::ng-deep .mat-mdc-tab-label-content {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
      }
      ::ng-deep mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .badge {
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 6px;
    }

    .tab-content { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-muted, #94a3b8);
      gap: 8px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; }
      span { font-size: 0.9rem; }
    }

    .challenge-card {
      background: var(--bg-secondary, #f8f9fb);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .challenge-card.completed.won { border-color: rgba(34, 197, 94, 0.3); }
    .challenge-card.completed.lost { border-color: rgba(239, 68, 68, 0.3); }

    .challenge-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .challenge-users {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .user.winner .name { color: #22c55e; font-weight: 600; }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-card, #fff);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--border-color, #e2e8f0);
      mat-icon { font-size: 20px; color: var(--text-muted, #94a3b8); }
    }

    .name { font-size: 0.85rem; color: var(--text-primary, #1e293b); font-weight: 500; }
    .score { font-size: 1rem; font-weight: 700; color: var(--text-primary, #1e293b); margin-left: 4px; }

    .vs {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted, #94a3b8);
      padding: 4px 8px;
      background: var(--bg-card, #fff);
      border-radius: 8px;
    }

    .wager {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #c8a84b;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .result-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .result-badge.win { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .result-badge.loss { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .result-badge.draw { background: rgba(148, 163, 184, 0.1); color: #64748b; }

    .challenge-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .jornada { font-size: 0.8rem; color: var(--text-secondary, #64748b); }
    .message { font-size: 0.8rem; color: var(--text-muted, #94a3b8); font-style: italic; }

    .status-chip {
      font-size: 0.7rem;
      height: 24px;
    }
    .status-chip.accepted { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

    .challenge-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
    .waiting { font-size: 0.8rem; color: var(--text-muted, #94a3b8); }

    .rivalry-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-secondary, #f8f9fb);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .rival-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rival-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .rival-name { font-size: 0.9rem; font-weight: 500; color: var(--text-primary, #1e293b); }
    .rival-record { font-size: 0.75rem; color: var(--text-secondary, #64748b); }

    .rival-stats {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .h2h-btn { margin-top: 0.4rem; }
    .net-points {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-muted, #94a3b8);
    }
    .net-points.positive { color: #22c55e; }
    .net-points.negative { color: #ef4444; }
    .total-matches { font-size: 0.7rem; color: var(--text-muted, #94a3b8); }

    .h2h-panel {
      background: var(--bg-secondary, #f8f9fb);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      padding: 0.75rem;
      margin-top: -0.25rem;
      margin-bottom: 0.5rem;
    }
    .h2h-summary {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 0.75rem;
      color: var(--text-secondary, #64748b);
      margin-bottom: 0.5rem;
    }
    .h2h-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.45rem 0.25rem;
      border-top: 1px dashed var(--border-color, #e2e8f0);
      font-size: 0.8rem;
    }
    .h2h-item:first-of-type { border-top: none; }
    .h2h-jornada { color: var(--text-primary, #1e293b); }
    .h2h-score { font-weight: 600; color: var(--text-primary, #1e293b); }
    .h2h-result.win { color: #22c55e; font-weight: 600; }
    .h2h-result.loss { color: #ef4444; font-weight: 600; }
    .h2h-result.draw { color: #64748b; font-weight: 600; }
    .h2h-empty { font-size: 0.8rem; color: var(--text-muted, #94a3b8); }

    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .challenge-users { flex-direction: column; gap: 8px; }
      .vs { display: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChallengesComponent implements OnInit {
  private challengeService = inject(ChallengeService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  stats = signal<ChallengeStats | null>(null);
  pendingChallenges = signal<ChallengeWithDetails[]>([]);
  activeChallenges = signal<ChallengeWithDetails[]>([]);
  completedChallenges = signal<ChallengeWithDetails[]>([]);
  rivalries = signal<RivalryStats[]>([]);
  selectedHeadToHead = signal<HeadToHeadResponse | null>(null);
  selectedRivalId = signal<number | null>(null);

  loadingPending = signal(true);
  loadingActive = signal(false);
  loadingCompleted = signal(false);
  loadingRivalries = signal(false);
  loadingHeadToHead = signal(false);
  loadingAutoGenerate = signal(false);

  currentUserId = 0;

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser()?.id ?? 0;
    this.loadStats();
    this.loadPendingChallenges();
  }

  onTabChange(index: number): void {
    switch (index) {
      case 0:
        if (this.pendingChallenges().length === 0) this.loadPendingChallenges();
        break;
      case 1:
        if (this.activeChallenges().length === 0) this.loadActiveChallenges();
        break;
      case 2:
        if (this.completedChallenges().length === 0) this.loadCompletedChallenges();
        break;
      case 3:
        if (this.rivalries().length === 0) this.loadRivalries();
        break;
    }
  }

  private loadStats(): void {
    this.challengeService.getMyStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
      },
    });
  }

  private loadPendingChallenges(): void {
    this.loadingPending.set(true);
    this.challengeService.getMyChallenges('pending').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pendingChallenges.set(response.data.items);
        }
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false),
    });
  }

  private loadActiveChallenges(): void {
    this.loadingActive.set(true);
    this.challengeService.getMyChallenges('accepted').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.activeChallenges.set(response.data.items);
        }
        this.loadingActive.set(false);
      },
      error: () => this.loadingActive.set(false),
    });
  }

  private loadCompletedChallenges(): void {
    this.loadingCompleted.set(true);
    this.challengeService.getMyChallenges('completed').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.completedChallenges.set(response.data.items);
        }
        this.loadingCompleted.set(false);
      },
      error: () => this.loadingCompleted.set(false),
    });
  }

  private loadRivalries(): void {
    this.loadingRivalries.set(true);
    this.challengeService.getRivalries().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rivalries.set(response.data);
        }
        this.loadingRivalries.set(false);
      },
      error: () => this.loadingRivalries.set(false),
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateChallengeDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadPendingChallenges();
        this.loadStats();
      }
    });
  }

  acceptChallenge(id: number): void {
    this.challengeService.accept(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Reto aceptado', 'OK', { duration: 3000 });
          this.loadPendingChallenges();
          this.loadActiveChallenges();
          this.loadStats();
        }
      },
      error: () => {
        this.snackBar.open('Error al aceptar el reto', 'OK', { duration: 3000 });
      },
    });
  }

  rejectChallenge(id: number): void {
    this.challengeService.reject(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Reto rechazado', 'OK', { duration: 3000 });
          this.loadPendingChallenges();
        }
      },
      error: () => {
        this.snackBar.open('Error al rechazar el reto', 'OK', { duration: 3000 });
      },
    });
  }

  cancelChallenge(id: number): void {
    this.challengeService.cancel(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Reto cancelado', 'OK', { duration: 3000 });
          this.loadPendingChallenges();
        }
      },
      error: () => {
        this.snackBar.open('Error al cancelar el reto', 'OK', { duration: 3000 });
      },
    });
  }

  isChallengee(challenge: ChallengeWithDetails): boolean {
    return challenge.challenged_id === this.currentUserId;
  }

  isWinner(challenge: ChallengeWithDetails): boolean {
    return challenge.winner_id === this.currentUserId;
  }

  isLoser(challenge: ChallengeWithDetails): boolean {
    return challenge.winner_id !== null && challenge.winner_id !== this.currentUserId;
  }

  isDraw(challenge: ChallengeWithDetails): boolean {
    return challenge.status === 'completed' && challenge.winner_id === null;
  }

  getAvatarUrl(url: string | null): string {
    return url ? `url(${url})` : '';
  }

  loadHeadToHead(opponentId: number): void {
    if (this.selectedRivalId() === opponentId && this.selectedHeadToHead()) {
      this.selectedRivalId.set(null);
      this.selectedHeadToHead.set(null);
      return;
    }

    this.selectedRivalId.set(opponentId);
    this.loadingHeadToHead.set(true);
    this.challengeService.getHeadToHead(opponentId, 10).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedHeadToHead.set(response.data);
        } else {
          this.selectedHeadToHead.set(null);
        }
        this.loadingHeadToHead.set(false);
      },
      error: () => {
        this.selectedHeadToHead.set(null);
        this.loadingHeadToHead.set(false);
      },
    });
  }

  isAdmin(): boolean {
    return !!this.authService.currentUser()?.is_admin;
  }

  autoGenerateWeekly(): void {
    this.loadingAutoGenerate.set(true);
    this.challengeService.autoGenerateWeekly().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.snackBar.open(
            `Auto-generados: ${response.data.created} retos`,
            'OK',
            { duration: 3500 }
          );
          this.loadPendingChallenges();
        } else {
          this.snackBar.open('No se pudieron autogenerar retos', 'OK', { duration: 3000 });
        }
        this.loadingAutoGenerate.set(false);
      },
      error: () => {
        this.loadingAutoGenerate.set(false);
        this.snackBar.open('Error al autogenerar retos', 'OK', { duration: 3000 });
      },
    });
  }
}
