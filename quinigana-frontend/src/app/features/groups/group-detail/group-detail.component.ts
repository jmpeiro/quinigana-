import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GroupService } from '../../../core/services/group.service';
import { ProposalService } from '../../../core/services/proposal.service';
import { ScoreService } from '../../../core/services/score.service';
import { AuthService } from '../../../core/services/auth.service';
import { Group, GroupMember } from '../../../core/models/group.model';
import { QuinielaProposal, GroupScoresResponse } from '../../../core/models/proposal.model';
import { environment } from '../../../../environments/environment';
import { GroupQuinielasComponent } from '../group-quinielas/group-quinielas.component';
import { SearchFilterComponent, SearchFilterChange, FilterConfig } from '../../../shared/search-filter/search-filter.component';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    GroupQuinielasComponent,
    SearchFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="group-detail-container animate-fade-in">
      @if (loading()) {
        <div class="loading-wrapper">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (group()) {
        <mat-card class="group-header-card">
          <div class="group-header">
            <div class="group-info">
              <div class="group-avatar">
                @if (resolveAvatar(group()!.avatar_url) && !brokenGroupAvatar) {
                  <img [src]="resolveAvatar(group()!.avatar_url)" [alt]="group()!.name" (error)="brokenGroupAvatar = true" />
                } @else {
                  <mat-icon class="avatar-icon">groups</mat-icon>
                }
              </div>
              <div class="group-text">
                <h1 class="group-name">{{ group()!.name }}</h1>
                @if (group()!.description) {
                  <p class="group-description">{{ group()!.description }}</p>
                }
                <div class="group-meta">
                  <span class="meta-item">
                    <mat-icon>people</mat-icon>
                    {{ members().length }} miembros
                  </span>
                  <span class="meta-item">
                    <mat-icon>calendar_today</mat-icon>
                    Creado {{ group()!.created_at | date:'mediumDate' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="group-actions">
              <a mat-stroked-button [routerLink]="['/groups', groupId(), 'activity']">
                <mat-icon>history</mat-icon>
                Actividad
              </a>
              @if (isAdmin()) {
                <button mat-stroked-button color="primary" (click)="editGroup()">
                  <mat-icon>edit</mat-icon>
                  Editar
                </button>
                <button mat-stroked-button color="warn" (click)="deleteGroup()">
                  <mat-icon>delete</mat-icon>
                  Eliminar
                </button>
              }
              @if (canLeave()) {
                <button mat-stroked-button color="warn" (click)="leaveGroup()">
                  <mat-icon>exit_to_app</mat-icon>
                  Salir
                </button>
              }
            </div>
          </div>
        </mat-card>

        <mat-tab-group class="group-tabs" animationDuration="200ms">
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>sports_soccer</mat-icon>
              <span class="tab-label-text">Quinielas</span>
            </ng-template>
            <div class="tab-content">
              <app-group-quinielas [groupId]="groupId()"></app-group-quinielas>
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>people</mat-icon>
              <span class="tab-label-text">Miembros</span>
            </ng-template>
            <div class="tab-content">
              @if (isAdmin()) {
                <div class="tab-actions">
                  <a mat-raised-button color="primary" [routerLink]="['/groups', groupId(), 'invite']">
                    <mat-icon>person_add</mat-icon>
                    Invitar
                  </a>
                  <button mat-stroked-button (click)="copyInviteLink()" [disabled]="generatingLink()">
                    <mat-icon>link</mat-icon>
                    {{ generatingLink() ? 'Generando...' : 'Copiar Enlace' }}
                  </button>
                </div>
              }
              <div class="members-list">
                @for (member of members(); track member.id) {
                  <div class="member-item">
                    <div class="member-avatar">
                      @if (resolveAvatar(member.avatar_url) && !brokenAvatars[member.user_id]) {
                        <img [src]="resolveAvatar(member.avatar_url)" [alt]="member.first_name" (error)="brokenAvatars[member.user_id] = true" />
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                    </div>
                    <div class="member-info">
                      <span class="member-name">{{ member.first_name }} {{ member.last_name || '' }}</span>
                      <span class="member-email">{{ member.email }}</span>
                    </div>
                    <mat-chip-set class="member-role">
                      <mat-chip [class.role-admin]="member.role === 'admin'" [class.role-member]="member.role === 'member'" [highlighted]="member.role === 'admin'">
                        {{ member.role }}
                      </mat-chip>
                    </mat-chip-set>
                    @if (isAdmin() && member.user_id !== currentUserId()) {
                      <button mat-icon-button color="warn" matTooltip="Eliminar miembro" (click)="removeMember(member)">
                        <mat-icon>person_remove</mat-icon>
                      </button>
                    }
                  </div>
                } @empty {
                  <div class="empty-state">
                    <mat-icon>group_off</mat-icon>
                    <p>No hay miembros.</p>
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>ballot</mat-icon>
              <span class="tab-label-text">Propuestas</span>
            </ng-template>
            <div class="tab-content">
              <app-search-filter
                placeholder="Buscar propuesta..."
                [filters]="proposalFilterConfigs"
                (filterChange)="onProposalFilterChange($event)"
              />
              <div class="proposals-list">
                @for (proposal of filteredProposals(); track proposal.id) {
                  <div class="proposal-item" (click)="goToProposal(proposal)" role="button" tabindex="0" (keydown.enter)="goToProposal(proposal)">
                    <div class="proposal-info">
                      <span class="proposal-title">{{ proposal.title || 'Propuesta #' + proposal.id }}</span>
                      <span class="proposal-meta">
                        @if (proposal.proposer_name) {
                          por {{ proposal.proposer_name }}
                        }
                        @if (proposal.jornada_name) {
                          &middot; {{ proposal.jornada_name }}
                        }
                      </span>
                    </div>
                    <div class="status-chip" [class]="'status-' + proposal.status">
                      @switch (proposal.status) {
                        @case ('draft') { <mat-icon>edit_note</mat-icon> }
                        @case ('pending') { <mat-icon>hourglass_top</mat-icon> }
                        @case ('approved') { <mat-icon>check_circle</mat-icon> }
                        @case ('rejected') { <mat-icon>cancel</mat-icon> }
                      }
                      {{ proposal.status }}
                    </div>
                    <div class="proposal-votes">
                      <span class="votes-for">{{ proposal.votes_for }}</span>
                      /
                      <span class="votes-against">{{ proposal.votes_against }}</span>
                    </div>
                    <mat-icon class="chevron-icon">chevron_right</mat-icon>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <mat-icon>ballot</mat-icon>
                    <p>No hay propuestas. ¡Crea una para empezar!</p>
                  </div>
                }
              </div>
              @if (hasMoreProposals()) {
                <div class="load-more">
                  <button mat-stroked-button (click)="loadMoreProposals()" [disabled]="loadingProposals()">
                    {{ loadingProposals() ? 'Cargando...' : 'Cargar mas' }}
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>leaderboard</mat-icon>
              <span class="tab-label-text">Puntuacion</span>
            </ng-template>
            <div class="tab-content">
              @if (scores()) {
                <div class="scores-summary">
                  <div class="total-score-card">
                    <span class="score-label">Puntos Totales</span>
                    <span class="score-value">{{ scores()!.total_points }}</span>
                  </div>
                </div>
                @if (scores()!.jornadas.length > 0) {
                  <table mat-table [dataSource]="scores()!.jornadas" class="scores-table">
                    <ng-container matColumnDef="jornada">
                      <th mat-header-cell *matHeaderCellDef>Jornada</th>
                      <td mat-cell *matCellDef="let score">{{ score.jornada_name || 'Jornada ' + score.jornada_number }}</td>
                    </ng-container>
                    <ng-container matColumnDef="points">
                      <th mat-header-cell *matHeaderCellDef>Puntos</th>
                      <td mat-cell *matCellDef="let score">{{ score.total_points }}</td>
                    </ng-container>
                    <ng-container matColumnDef="correct1x2">
                      <th mat-header-cell *matHeaderCellDef>1X2</th>
                      <td mat-cell *matCellDef="let score">{{ score.correct_1x2 }}</td>
                    </ng-container>
                    <ng-container matColumnDef="pleno">
                      <th mat-header-cell *matHeaderCellDef>Pleno</th>
                      <td mat-cell *matCellDef="let score">{{ score.correct_pleno }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="scoresColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: scoresColumns;"></tr>
                  </table>
                } @else {
                  <div class="empty-state">
                    <mat-icon>scoreboard</mat-icon>
                    <p>No hay puntuaciones registradas.</p>
                  </div>
                }
              } @else {
                <div class="empty-state">
                  <mat-icon>scoreboard</mat-icon>
                  <p>No hay puntuaciones disponibles para este grupo.</p>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <div class="error-state">
          <mat-icon>error_outline</mat-icon>
          <h2>Grupo no encontrado</h2>
          <p>El grupo que buscas no existe o no tienes acceso.</p>
          <a mat-raised-button color="primary" routerLink="/groups">
            <mat-icon>arrow_back</mat-icon>
            Volver a Grupos
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .group-detail-container {
      padding: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .group-header-card {
      background: #fff !important;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .group-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .group-info {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .group-avatar {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #c8a84b;
      }
    }

    .group-text {
      .group-name {
        margin: 0 0 0.25rem;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }

      .group-description {
        margin: 0 0 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }
    }

    .group-meta {
      display: flex;
      align-items: center;
      gap: 1rem;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.75rem;
        color: #94a3b8;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }

    .group-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .group-tabs {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .tab-label-text {
      margin-left: 0.5rem;
    }

    .tab-content {
      padding: 1.5rem;
    }

    .tab-actions {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .members-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fb;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      transition: background 150ms ease;

      &:hover {
        background: #f1f5f9;
      }
    }

    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        color: #64748b;
      }
    }

    .member-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .member-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.875rem;
      }

      .member-email {
        font-size: 0.75rem;
        color: #94a3b8;
      }
    }

    .role-admin {
      --mdc-chip-elevated-container-color: #c8a84b;
      --mdc-chip-label-text-color: #fff;
    }

    .role-member {
      --mdc-chip-elevated-container-color: #f1f5f9;
      --mdc-chip-label-text-color: #475569;
    }

    .proposals-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .proposal-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fb;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease;

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      &:focus-visible {
        outline: 2px solid #c8a84b;
        outline-offset: 2px;
      }
    }

    .proposal-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .proposal-title {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.875rem;
      }

      .proposal-meta {
        font-size: 0.75rem;
        color: #94a3b8;
      }
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      pointer-events: none;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .status-draft {
      background-color: #e2e8f0;
      color: #475569;
    }

    .status-pending {
      background-color: #ff9800;
      color: #1e293b;
    }

    .status-approved {
      background-color: #4caf50;
      color: #fff;
    }

    .status-rejected {
      background-color: #f44336;
      color: #fff;
    }

    .proposal-votes {
      font-size: 0.75rem;
      color: #64748b;

      .votes-for {
        color: #4caf50;
        font-weight: 600;
      }

      .votes-against {
        color: #f44336;
        font-weight: 600;
      }
    }

    .chevron-icon {
      color: #94a3b8;
    }

    .scores-summary {
      margin-bottom: 1.5rem;
    }

    .total-score-card {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem 2rem;
      background: #f8f9fb;
      border-radius: 12px;
      border: 1px solid #e2e8f0;

      .score-label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .score-value {
        font-size: 2rem;
        font-weight: 700;
        color: #c8a84b;
      }
    }

    .scores-table {
      width: 100%;
      background: transparent !important;

      th {
        color: #64748b !important;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom-color: #e2e8f0 !important;
      }

      td {
        color: #1e293b !important;
        border-bottom-color: #f1f5f9 !important;
      }

      tr:hover td {
        background: #f8f9fb;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #94a3b8;
      text-align: center;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #c8a84b;
        margin-bottom: 1rem;
      }

      h2 {
        margin: 0 0 0.5rem;
        color: #1e293b;
      }

      p {
        margin: 0 0 1.5rem;
        color: #64748b;
      }
    }

    .load-more {
      display: flex;
      justify-content: center;
      margin-top: 1.5rem;
    }

    @media (max-width: 768px) {
      .group-header {
        flex-direction: column;
      }

      .group-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .group-meta {
        justify-content: center;
      }

      .group-actions {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class GroupDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private proposalService = inject(ProposalService);
  private scoreService = inject(ScoreService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  brokenAvatars: Record<number, boolean> = {};
  brokenGroupAvatar = false;
  private baseUrl = environment.apiUrl.replace('/api', '');

  resolveAvatar(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return this.baseUrl + url;
  }

  groupId = signal<number>(0);
  group = signal<Group | null>(null);
  members = signal<GroupMember[]>([]);
  proposals = signal<QuinielaProposal[]>([]);
  scores = signal<GroupScoresResponse | null>(null);
  loading = signal(true);

  currentUserId = computed(() => this.authService.currentUser()?.id ?? 0);

  isAdmin = computed(() => {
    const userId = this.currentUserId();
    return this.members().some(m => m.user_id === userId && m.role === 'admin');
  });

  canLeave = computed(() => {
    const userId = this.currentUserId();
    const admins = this.members().filter(m => m.role === 'admin');
    if (admins.length === 1 && admins[0].user_id === userId) {
      return false;
    }
    return true;
  });

  generatingLink = signal(false);
  proposalPage = signal(1);
  hasMoreProposals = signal(false);
  loadingProposals = signal(false);
  scoresColumns = ['jornada', 'points', 'correct1x2', 'pleno'];

  /** Proposal search & filter state */
  private proposalSearchTerm = signal('');
  private proposalStatusFilter = signal('');

  proposalFilterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Estado',
      options: [
        { value: 'draft', label: 'Borrador' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'approved', label: 'Aprobada' },
        { value: 'rejected', label: 'Rechazada' },
      ],
    },
  ];

  filteredProposals = computed(() => {
    let result = this.proposals();
    const search = this.proposalSearchTerm().toLowerCase();
    const status = this.proposalStatusFilter();

    if (search) {
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(search) ||
        (p.proposer_name || '').toLowerCase().includes(search) ||
        (p.jornada_name || '').toLowerCase().includes(search) ||
        p.id.toString().includes(search)
      );
    }

    if (status) {
      result = result.filter(p => p.status === status);
    }

    return result;
  });

  onProposalFilterChange(event: SearchFilterChange): void {
    this.proposalSearchTerm.set(event.search);
    this.proposalStatusFilter.set(event.filters['status'] || '');
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.groupId.set(+idParam);
      this.loadGroupData();
    } else {
      this.loading.set(false);
    }
  }

  private loadGroupData(): void {
    const id = this.groupId();
    this.loading.set(true);

    this.groupService.getGroupDetail(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.group.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });

    this.groupService.getMembers(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.members.set(res.data);
        }
      },
    });

    this.loadProposals(id);

    this.scoreService.getGroupScores(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.scores.set(res.data);
        }
      },
    });
  }

  editGroup(): void {
    this.router.navigate(['/groups', this.groupId(), 'edit']);
  }

  deleteGroup(): void {
    if (confirm('¿Estas seguro de que quieres eliminar este grupo? Esta accion no se puede deshacer.')) {
      this.groupService.deleteGroup(this.groupId()).subscribe({
        next: () => {
          this.snackBar.open('Grupo eliminado correctamente', 'OK', { duration: 3000 });
          this.router.navigate(['/groups']);
        },
        error: () => {
          this.snackBar.open('Error al eliminar el grupo', 'OK', { duration: 3000 });
        },
      });
    }
  }

  leaveGroup(): void {
    if (confirm('¿Estas seguro de que quieres salir de este grupo?')) {
      this.groupService.leaveGroup(this.groupId()).subscribe({
        next: () => {
          this.snackBar.open('Has salido del grupo', 'OK', { duration: 3000 });
          this.router.navigate(['/groups']);
        },
        error: () => {
          this.snackBar.open('Error al salir del grupo', 'OK', { duration: 3000 });
        },
      });
    }
  }

  removeMember(member: GroupMember): void {
    const name = (member.first_name + ' ' + (member.last_name || '')).trim();
    if (confirm('¿Eliminar a ' + name + ' de este grupo?')) {
      this.groupService.removeMember(this.groupId(), member.user_id).subscribe({
        next: () => {
          this.members.update(list => list.filter(m => m.id !== member.id));
          this.snackBar.open(name + ' ha sido eliminado', 'OK', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al eliminar miembro', 'OK', { duration: 3000 });
        },
      });
    }
  }

  goToProposal(proposal: QuinielaProposal): void {
    this.router.navigate(['/groups', this.groupId(), 'proposals', proposal.id]);
  }

  copyInviteLink(): void {
    this.generatingLink.set(true);
    this.groupService.generateInviteLink(this.groupId()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const url = `${window.location.origin}/invite/${res.data.token}`;
          navigator.clipboard.writeText(url).then(() => {
            this.snackBar.open('Enlace copiado al portapapeles', 'OK', { duration: 3000 });
          }).catch(() => {
            this.snackBar.open('No se pudo copiar. URL: ' + url, 'OK', { duration: 8000 });
          });
        }
        this.generatingLink.set(false);
      },
      error: () => {
        this.snackBar.open('Error al generar enlace', 'Close', { duration: 3000 });
        this.generatingLink.set(false);
      },
    });
  }

  private loadProposals(groupId: number): void {
    this.loadingProposals.set(true);
    this.proposalService.getByGroup(groupId, this.proposalPage(), 20).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (this.proposalPage() === 1) {
            this.proposals.set(res.data.items);
          } else {
            this.proposals.update(prev => [...prev, ...res.data!.items]);
          }
          this.hasMoreProposals.set(this.proposals().length < res.data.total);
        }
        this.loadingProposals.set(false);
      },
      error: () => {
        this.loadingProposals.set(false);
      },
    });
  }

  loadMoreProposals(): void {
    this.proposalPage.update(p => p + 1);
    this.loadProposals(this.groupId());
  }
}
