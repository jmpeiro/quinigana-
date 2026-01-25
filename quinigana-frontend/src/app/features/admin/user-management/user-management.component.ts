import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { UserAdmin } from '../../../core/models/admin.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-container">
      <h1 class="page-title">Gestion de Usuarios</h1>

      <mat-form-field appearance="fill" class="search-field">
        <mat-label>Buscar por email o nombre</mat-label>
        <input matInput [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="users-list">
          @for (user of users(); track user.id) {
            <div class="user-row">
              <div class="user-info">
                <div class="user-name">{{ user.first_name }} {{ user.last_name || '' }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-meta">
                  <span class="provider">{{ user.auth_provider }}</span>
                  <span class="groups-count">{{ user.groupCount }} grupos</span>
                </div>
              </div>
              <div class="user-actions">
                <button mat-icon-button
                  [class.active-toggle]="user.is_admin"
                  (click)="toggleAdmin(user)"
                  [disabled]="toggling()"
                  title="Toggle admin">
                  <mat-icon>{{ user.is_admin ? 'admin_panel_settings' : 'person' }}</mat-icon>
                </button>
                <button mat-icon-button
                  [class.inactive-toggle]="!user.is_active"
                  (click)="toggleActive(user)"
                  [disabled]="toggling()"
                  title="Toggle active">
                  <mat-icon>{{ user.is_active ? 'check_circle' : 'block' }}</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty">No se encontraron usuarios.</div>
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
    .admin-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .page-title {
      color: #1e293b;
      font-size: 1.5rem;
      margin: 0 0 1rem;
    }

    .search-field {
      width: 100%;
      margin-bottom: 1rem;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .users-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .user-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      border: 1px solid #e2e8f0;
    }

    .user-info {
      .user-name {
        color: #1e293b;
        font-weight: 500;
        font-size: 0.9rem;
      }

      .user-email {
        color: #64748b;
        font-size: 0.8rem;
      }

      .user-meta {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.25rem;

        .provider, .groups-count {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      }
    }

    .user-actions {
      display: flex;
      gap: 0.25rem;

      .active-toggle {
        color: #c8a84b;
      }

      .inactive-toggle {
        color: #ef5350;
      }
    }

    .empty {
      text-align: center;
      color: #94a3b8;
      padding: 2rem;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;

      .page-info {
        color: #64748b;
        font-size: 0.85rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  users = signal<UserAdmin[]>([]);
  loading = signal(true);
  toggling = signal(false);
  searchQuery = signal('');
  page = signal(1);
  totalPages = signal(1);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadUsers();
    }, 400);
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.adminService.getUsers(this.page(), 20, this.searchQuery() || undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleAdmin(user: UserAdmin): void {
    this.toggling.set(true);
    this.adminService.toggleAdmin(user.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          user.is_admin = response.data.is_admin;
          this.users.update(list => [...list]);
          this.snackBar.open(`Admin ${response.data.is_admin ? 'activado' : 'desactivado'}`, 'OK', { duration: 2000 });
        }
        this.toggling.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cambiar rol', 'Close', { duration: 3000 });
        this.toggling.set(false);
      },
    });
  }

  toggleActive(user: UserAdmin): void {
    this.toggling.set(true);
    this.adminService.toggleActive(user.id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          user.is_active = response.data.is_active;
          this.users.update(list => [...list]);
          this.snackBar.open(`Usuario ${response.data.is_active ? 'activado' : 'desactivado'}`, 'OK', { duration: 2000 });
        }
        this.toggling.set(false);
      },
      error: () => {
        this.snackBar.open('Error al cambiar estado', 'Close', { duration: 3000 });
        this.toggling.set(false);
      },
    });
  }
}
