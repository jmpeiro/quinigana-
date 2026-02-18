import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { LeagueService } from '../../core/services/league.service';
import { AuthService } from '../../core/services/auth.service';
import {
  LeagueDivision,
  UserLeagueProfile,
  LeagueStandingWithUser,
  LeagueHistory,
} from '../../core/models/league.model';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-leagues',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    SkeletonComponent,
  ],
  template: `
    <div class="leagues-container">
      <div class="page-header">
        <h1 class="page-title">Ligas y Divisiones</h1>
      </div>

      <!-- User Profile Card -->
      @if (loadingProfile()) {
        <app-skeleton variant="card" height="180px" />
      } @else if (profile()) {
        <div class="profile-card" [style.borderColor]="profile()!.division_color">
          <div class="profile-header">
            <div class="division-badge" [style.backgroundColor]="profile()!.division_color + '20'" [style.color]="profile()!.division_color">
              <mat-icon>{{ profile()!.division_icon }}</mat-icon>
              <span>{{ profile()!.division_name }}</span>
            </div>
            @if (profile()!.is_promotion_zone) {
              <mat-chip class="zone-chip promotion">Zona de Ascenso</mat-chip>
            } @else if (profile()!.is_relegation_zone) {
              <mat-chip class="zone-chip relegation">Zona de Descenso</mat-chip>
            }
          </div>

          <div class="profile-stats">
            <div class="stat">
              <span class="stat-value">{{ profile()!.position || '-' }}</span>
              <span class="stat-label">Posicion</span>
              @if (profile()!.previous_position !== null && profile()!.position !== null) {
                @if (profile()!.position! < profile()!.previous_position!) {
                  <mat-icon class="position-change up">arrow_upward</mat-icon>
                } @else if (profile()!.position! > profile()!.previous_position!) {
                  <mat-icon class="position-change down">arrow_downward</mat-icon>
                }
              }
            </div>
            <div class="stat">
              <span class="stat-value" [style.color]="profile()!.division_color">{{ profile()!.points }}</span>
              <span class="stat-label">Puntos</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile()!.jornadas_played }}</span>
              <span class="stat-label">Jornadas</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile()!.correct_pleno }}</span>
              <span class="stat-label">Plenos</span>
            </div>
          </div>

          <div class="profile-footer">
            <span class="total-users">{{ profile()!.total_in_division }} jugadores en tu division</span>
          </div>
        </div>
      } @else {
        <div class="no-profile">
          <mat-icon>sports_score</mat-icon>
          <p>No hay una temporada de liga activa</p>
        </div>
      }

      <!-- Division Tabs -->
      @if (divisions().length > 0) {
        <h2 class="section-title">Clasificaciones</h2>
        <mat-tab-group
          class="division-tabs"
          animationDuration="200ms"
          [selectedIndex]="selectedDivisionIndex()"
          (selectedIndexChange)="onDivisionChange($event)">
          @for (division of divisions(); track division.id) {
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon [style.color]="division.color">{{ division.icon }}</mat-icon>
                <span>{{ division.name.replace('Division ', '') }}</span>
              </ng-template>
              <div class="tab-content">
                @if (loadingStandings()) {
                  <app-skeleton variant="card" height="60px" />
                  <app-skeleton variant="card" height="60px" />
                  <app-skeleton variant="card" height="60px" />
                } @else if (standings().length === 0) {
                  <div class="empty-state">
                    <mat-icon>group</mat-icon>
                    <span>No hay jugadores en esta division</span>
                  </div>
                } @else {
                  <div class="standings-table">
                    <div class="standings-header">
                      <span class="col-pos">#</span>
                      <span class="col-name">Jugador</span>
                      <span class="col-stat">Pts</span>
                      <span class="col-stat">J</span>
                      <span class="col-stat">P</span>
                    </div>
                    @for (standing of standings(); track standing.id; let i = $index) {
                      <div
                        class="standings-row"
                        [class.current-user]="standing.user_id === currentUserId()"
                        [class.promotion]="isPromotionZone(i)"
                        [class.relegation]="isRelegationZone(i)">
                        <span class="col-pos">
                          {{ standing.position || i + 1 }}
                          @if (isPromotionZone(i)) {
                            <mat-icon class="zone-icon promotion">arrow_upward</mat-icon>
                          } @else if (isRelegationZone(i)) {
                            <mat-icon class="zone-icon relegation">arrow_downward</mat-icon>
                          }
                        </span>
                        <div class="col-name">
                          <div class="avatar" [style.backgroundImage]="getAvatarUrl(standing.user_avatar)">
                            @if (!standing.user_avatar) {
                              <mat-icon>person</mat-icon>
                            }
                          </div>
                          <span>{{ standing.user_name }}</span>
                        </div>
                        <span class="col-stat points">{{ standing.points }}</span>
                        <span class="col-stat">{{ standing.jornadas_played }}</span>
                        <span class="col-stat">{{ standing.correct_pleno }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      }

      <!-- History -->
      @if (history().length > 0) {
        <h2 class="section-title">Tu Historial</h2>
        <div class="history-list">
          @for (record of history(); track $index) {
            <div class="history-item">
              <div class="history-info">
                <span class="season-name">{{ record.season_name }}</span>
                <span class="division-name">{{ record.division_name }}</span>
              </div>
              <div class="history-result">
                <span class="position">#{{ record.final_position }}</span>
                <span class="points">{{ record.final_points }} pts</span>
                @if (record.movement_type === 'promoted') {
                  <mat-icon class="movement promoted">arrow_upward</mat-icon>
                } @else if (record.movement_type === 'relegated') {
                  <mat-icon class="movement relegated">arrow_downward</mat-icon>
                } @else {
                  <mat-icon class="movement maintained">remove</mat-icon>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .leagues-container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }

    .page-header { margin-bottom: 1.5rem; }
    .page-title { color: var(--text-primary, #1e293b); font-size: 1.5rem; margin: 0; }

    .profile-card {
      background: var(--bg-card, #fff);
      border-radius: 16px;
      padding: 1.5rem;
      border: 2px solid;
      margin-bottom: 2rem;
    }

    .profile-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .division-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }

    .zone-chip {
      font-size: 0.7rem;
      height: 28px;
    }
    .zone-chip.promotion { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
    .zone-chip.relegation { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat {
      text-align: center;
      position: relative;
    }
    .stat-value { display: block; font-size: 1.8rem; font-weight: 700; color: var(--text-primary, #1e293b); }
    .stat-label { display: block; font-size: 0.75rem; color: var(--text-secondary, #64748b); }
    .position-change {
      position: absolute;
      top: 0;
      right: 20%;
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .position-change.up { color: #22c55e; }
    .position-change.down { color: #ef4444; }

    .profile-footer {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
    .total-users { font-size: 0.8rem; color: var(--text-secondary, #64748b); }

    .no-profile {
      text-align: center;
      padding: 3rem;
      background: var(--bg-card, #fff);
      border-radius: 16px;
      border: 1px solid var(--border-color, #e2e8f0);
      margin-bottom: 2rem;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--text-muted, #94a3b8); }
      p { color: var(--text-secondary, #64748b); margin-top: 1rem; }
    }

    .section-title { color: var(--text-secondary, #475569); font-size: 1rem; font-weight: 600; margin: 1.5rem 0 1rem; }

    .division-tabs {
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

    .tab-content { padding: 1rem; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--text-muted, #94a3b8);
      gap: 8px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.5; }
    }

    .standings-table { display: flex; flex-direction: column; gap: 4px; }

    .standings-header {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-secondary, #64748b);
      text-transform: uppercase;
    }

    .standings-row {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary, #f8f9fb);
      border-radius: 10px;
      border: 1px solid transparent;
    }
    .standings-row.current-user {
      background: rgba(200, 168, 75, 0.1);
      border-color: rgba(200, 168, 75, 0.3);
    }
    .standings-row.promotion { background: rgba(34, 197, 94, 0.05); }
    .standings-row.relegation { background: rgba(239, 68, 68, 0.05); }

    .col-pos {
      width: 50px;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .zone-icon { font-size: 14px; width: 14px; height: 14px; }
    .zone-icon.promotion { color: #22c55e; }
    .zone-icon.relegation { color: #ef4444; }

    .col-name {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: var(--text-primary, #1e293b);
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-card, #fff);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color, #e2e8f0);
      mat-icon { font-size: 18px; color: var(--text-muted, #94a3b8); }
    }

    .col-stat {
      width: 50px;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-secondary, #64748b);
    }
    .col-stat.points { font-weight: 700; color: #c8a84b; }

    .history-list { display: flex; flex-direction: column; gap: 0.5rem; }

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card, #fff);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
    }

    .history-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .season-name { font-size: 0.9rem; font-weight: 500; color: var(--text-primary, #1e293b); }
    .division-name { font-size: 0.75rem; color: var(--text-secondary, #64748b); }

    .history-result {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .position { font-size: 1rem; font-weight: 700; color: var(--text-primary, #1e293b); }
    .points { font-size: 0.85rem; color: var(--text-secondary, #64748b); }
    .movement { font-size: 20px; width: 20px; height: 20px; }
    .movement.promoted { color: #22c55e; }
    .movement.relegated { color: #ef4444; }
    .movement.maintained { color: var(--text-muted, #94a3b8); }

    @media (max-width: 600px) {
      .profile-stats { grid-template-columns: repeat(2, 1fr); }
      .col-stat:not(.points) { display: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaguesComponent implements OnInit {
  private leagueService = inject(LeagueService);
  private authService = inject(AuthService);

  divisions = signal<LeagueDivision[]>([]);
  profile = signal<UserLeagueProfile | null>(null);
  standings = signal<LeagueStandingWithUser[]>([]);
  history = signal<LeagueHistory[]>([]);
  selectedDivisionIndex = signal(0);
  currentUserId = signal(0);

  loadingProfile = signal(true);
  loadingStandings = signal(false);

  private currentDivision: LeagueDivision | null = null;

  ngOnInit(): void {
    this.currentUserId.set(this.authService.currentUser()?.id ?? 0);
    this.loadDivisions();
    this.loadProfile();
    this.loadHistory();
  }

  private loadDivisions(): void {
    this.leagueService.getDivisions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.divisions.set(response.data);
        }
      },
    });
  }

  private loadProfile(): void {
    this.loadingProfile.set(true);
    this.leagueService.getMyProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.profile.set(response.data);
          // Auto-select user's division
          const divisions = this.divisions();
          const userDivisionIndex = divisions.findIndex(d => d.id === response.data!.division_id);
          if (userDivisionIndex !== -1) {
            this.selectedDivisionIndex.set(userDivisionIndex);
            this.loadStandings(response.data.division_id);
          }
        }
        this.loadingProfile.set(false);
      },
      error: () => this.loadingProfile.set(false),
    });
  }

  private loadHistory(): void {
    this.leagueService.getMyHistory().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.history.set(response.data);
        }
      },
    });
  }

  onDivisionChange(index: number): void {
    this.selectedDivisionIndex.set(index);
    const division = this.divisions()[index];
    if (division) {
      this.loadStandings(division.id);
    }
  }

  private loadStandings(divisionId: number): void {
    this.loadingStandings.set(true);
    this.currentDivision = this.divisions().find(d => d.id === divisionId) || null;
    this.leagueService.getDivisionStandings(divisionId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.standings.set(response.data.items);
        }
        this.loadingStandings.set(false);
      },
      error: () => this.loadingStandings.set(false),
    });
  }

  isPromotionZone(index: number): boolean {
    if (!this.currentDivision || this.currentDivision.tier === 1) return false;
    return index < this.currentDivision.promotion_slots;
  }

  isRelegationZone(index: number): boolean {
    if (!this.currentDivision || this.currentDivision.tier === 4) return false;
    const totalUsers = this.standings().length;
    return index >= totalUsers - this.currentDivision.relegation_slots;
  }

  getAvatarUrl(url: string | null): string {
    return url ? `url(${url})` : '';
  }
}
