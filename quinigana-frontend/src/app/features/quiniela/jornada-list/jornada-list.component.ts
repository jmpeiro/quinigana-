import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { JornadaService } from '../../../core/services/jornada.service';
import { AuthService } from '../../../core/services/auth.service';
import { Jornada } from '../../../core/models/jornada.model';
import { ErrorCardComponent } from '../../../shared/components/error-card/error-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-jornada-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ErrorCardComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="jornada-list-container">
      <div class="page-header">
        <h1 class="page-title">Jornadas</h1>
        <div class="header-actions">
          @if (isAdmin()) {
            <a mat-raised-button class="btn-create" routerLink="/admin/jornadas">
              <mat-icon>add</mat-icon>
              Crear Jornada
            </a>
          }
          <button mat-icon-button (click)="loadJornadas()" [class.spinning]="loading()">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-jornadas">
          <app-skeleton variant="card" width="100%" height="130px" />
          <app-skeleton variant="card" width="100%" height="130px" />
          <app-skeleton variant="card" width="100%" height="130px" />
        </div>
      } @else if (error()) {
        <app-error-card [message]="error()!" (retry)="loadJornadas()" />
      } @else {
        <div class="jornadas-grid">
          @for (jornada of jornadas(); track jornada.id) {
            <mat-card class="jornada-card" (click)="navigateToDetail(jornada.id)" tabindex="0">
              <mat-card-header>
                <mat-card-title>{{ jornada.name }}</mat-card-title>
                <mat-card-subtitle>Season {{ jornada.season }} - Jornada #{{ jornada.jornada_number }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="card-info">
                  <div class="status-row">
                    <span class="status-badge" [class]="'status-' + jornada.status">
                      {{ jornada.status | uppercase }}
                    </span>
                  </div>
                  <div class="deadline-row">
                    <mat-icon>schedule</mat-icon>
                    <span>{{ formatDeadline(jornada.deadline) }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon>sports_soccer</mat-icon>
              <p>No jornadas available yet.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
    }

    .jornada-list-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn-create { background: #c8a84b !important; color: #fff !important; font-size: 0.82rem; display: flex; align-items: center; gap: 4px; }
    .page-title {
      color: #1e293b;
      font-size: 28px;
      font-weight: 500;
      margin: 0;
    }
    .spinning mat-icon { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      color: #64748b;

      p {
        margin-top: 16px;
        font-size: 16px;
      }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      color: #ef5350;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      p {
        margin-top: 12px;
        font-size: 16px;
      }
    }

    .jornadas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .jornada-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border-color: #c8a84b;
      }

      &:focus {
        outline: 2px solid #c8a84b;
        outline-offset: 2px;
      }

      mat-card-title {
        color: #1e293b;
        font-size: 18px;
      }

      mat-card-subtitle {
        color: #64748b;
        font-size: 14px;
      }
    }

    .card-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }

    .status-row {
      display: flex;
      align-items: center;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .status-open {
      background: rgba(76, 175, 80, 0.15);
      color: #66bb6a;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .status-closed {
      background: rgba(255, 235, 59, 0.12);
      color: #fdd835;
      border: 1px solid rgba(255, 235, 59, 0.25);
    }

    .status-finished {
      background: rgba(158, 158, 158, 0.12);
      color: #9e9e9e;
      border: 1px solid rgba(158, 158, 158, 0.25);
    }

    .deadline-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
      font-size: 13px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #c8a84b;
      }
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 0;
      color: #94a3b8;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }

      p {
        font-size: 16px;
      }
    }

    .skeleton-jornadas {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
  `],
})
export class JornadaListComponent implements OnInit {
  private jornadaService = inject(JornadaService);
  private authService = inject(AuthService);
  private router = inject(Router);

  jornadas = signal<Jornada[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  isAdmin = computed(() => !!this.authService.currentUser()?.is_admin);

  ngOnInit(): void {
    this.loadJornadas();
  }

  loadJornadas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.jornadaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.jornadas.set(response.data);
        } else {
          this.error.set('Failed to load jornadas.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'An error occurred while loading jornadas.');
        this.loading.set(false);
      },
    });
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/quiniela/jornadas', id]);
  }

  formatDeadline(deadline: string): string {
    const date = new Date(deadline);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
