import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { GroupAdmin } from '../../../core/models/admin.model';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-container">
      <h1 class="page-title">Gestion de Grupos</h1>

      <mat-form-field appearance="fill" class="search-field">
        <mat-label>Buscar por nombre</mat-label>
        <input matInput [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="groups-list">
          @for (group of groups(); track group.id) {
            <div class="group-row" [class.inactive]="!group.is_active">
              <div class="group-info">
                <div class="group-name">
                  {{ group.name }}
                  @if (!group.is_active) {
                    <span class="inactive-badge">Inactivo</span>
                  }
                </div>
                <div class="group-meta">
                  <span>{{ group.member_count }} miembros</span>
                  <span>Creado por: {{ group.creator_name }}</span>
                </div>
              </div>
              <div class="group-actions">
                @if (group.is_active) {
                  <button mat-icon-button color="warn" (click)="deactivate(group)" [disabled]="acting()" title="Desactivar grupo">
                    <mat-icon>block</mat-icon>
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty">No se encontraron grupos.</div>
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

    .groups-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .group-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fff;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      border: 1px solid #e2e8f0;

      &.inactive {
        opacity: 0.6;
      }
    }

    .group-info {
      .group-name {
        color: #1e293b;
        font-weight: 500;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .inactive-badge {
        font-size: 0.65rem;
        background: rgba(239, 83, 80, 0.15);
        color: #ef5350;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }

      .group-meta {
        display: flex;
        gap: 1rem;
        margin-top: 0.25rem;
        color: #94a3b8;
        font-size: 0.75rem;
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
export class GroupManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  groups = signal<GroupAdmin[]>([]);
  loading = signal(true);
  acting = signal(false);
  searchQuery = signal('');
  page = signal(1);
  totalPages = signal(1);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.loadGroups();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadGroups();
    }, 400);
  }

  changePage(newPage: number): void {
    this.page.set(newPage);
    this.loadGroups();
  }

  private loadGroups(): void {
    this.loading.set(true);
    this.adminService.getAllGroups(this.page(), 20, this.searchQuery() || undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.groups.set(response.data.items);
          this.totalPages.set(response.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  deactivate(group: GroupAdmin): void {
    this.acting.set(true);
    this.adminService.deactivateGroup(group.id).subscribe({
      next: (response) => {
        if (response.success) {
          group.is_active = false;
          this.groups.update(list => [...list]);
          this.snackBar.open('Grupo desactivado', 'OK', { duration: 2000 });
        }
        this.acting.set(false);
      },
      error: () => {
        this.snackBar.open('Error al desactivar grupo', 'Close', { duration: 3000 });
        this.acting.set(false);
      },
    });
  }
}
