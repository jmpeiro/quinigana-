import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { GlobalStats } from '../../../core/models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-container">
      <h1 class="page-title">Panel de Administracion</h1>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <mat-icon>people</mat-icon>
            <div class="stat-value">{{ stats()!.activeUsers }}/{{ stats()!.totalUsers }}</div>
            <div class="stat-label">Usuarios Activos</div>
          </div>
          <div class="stat-card">
            <mat-icon>groups</mat-icon>
            <div class="stat-value">{{ stats()!.activeGroups }}/{{ stats()!.totalGroups }}</div>
            <div class="stat-label">Grupos Activos</div>
          </div>
          <div class="stat-card">
            <mat-icon>sports_soccer</mat-icon>
            <div class="stat-value">{{ stats()!.totalJornadas }}</div>
            <div class="stat-label">Jornadas Total</div>
          </div>
          <div class="stat-card">
            <mat-icon>how_to_vote</mat-icon>
            <div class="stat-value">{{ stats()!.approvedProposals }}/{{ stats()!.totalProposals }}</div>
            <div class="stat-label">Propuestas Aprobadas</div>
          </div>
        </div>

        <div class="jornada-summary">
          <div class="summary-item">
            <span class="badge open">{{ stats()!.openJornadas }}</span>
            <span>Abiertas</span>
          </div>
          <div class="summary-item">
            <span class="badge closed">{{ stats()!.closedJornadas }}</span>
            <span>Cerradas</span>
          </div>
          <div class="summary-item">
            <span class="badge finished">{{ stats()!.finishedJornadas }}</span>
            <span>Finalizadas</span>
          </div>
        </div>

        <div class="admin-actions">
          <button mat-stroked-button (click)="navigate('/admin/users')">
            <mat-icon>manage_accounts</mat-icon>
            Gestionar Usuarios
          </button>
          <button mat-stroked-button (click)="navigate('/admin/groups')">
            <mat-icon>group_work</mat-icon>
            Gestionar Grupos
          </button>
          <button mat-stroked-button (click)="navigate('/admin/jornadas')">
            <mat-icon>event</mat-icon>
            Gestionar Jornadas
          </button>
          <button mat-stroked-button (click)="navigate('/admin/seasons')">
            <mat-icon>calendar_month</mat-icon>
            Gestionar Temporadas
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .page-title {
      color: #1e293b;
      font-size: 1.5rem;
      margin: 0 0 1.5rem;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      border: 1px solid #e2e8f0;

      mat-icon {
        color: #c8a84b;
        font-size: 1.5rem;
        width: 1.5rem;
        height: 1.5rem;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        margin-top: 0.25rem;
      }
    }

    .jornada-summary {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.85rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-size: 0.8rem;
      font-weight: 700;

      &.open { background: rgba(76, 175, 80, 0.2); color: #66bb6a; }
      &.closed { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
      &.finished { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }
    }

    .admin-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      button {
        height: 48px;
        justify-content: flex-start;
        padding-left: 1.5rem;
        border-radius: 10px;
        font-size: 0.9rem;

        mat-icon {
          margin-right: 0.75rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  stats = signal<GlobalStats | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.adminService.getGlobalStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
