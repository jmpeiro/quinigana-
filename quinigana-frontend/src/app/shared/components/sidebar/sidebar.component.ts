import { Component, ChangeDetectionStrategy, inject, signal, output, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { GlobalSearchComponent } from '../global-search/global-search.component';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <!-- Header -->
      <div class="sidebar-header">
        <img src="logoquinigana.png" alt="QuiniGana" class="logo" />
        @if (!collapsed()) {
          <span class="brand">QuiniGana</span>
        }
        <button mat-icon-button class="collapse-btn" (click)="toggleCollapse()">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>

      <!-- Search -->
      <div class="search-trigger" (click)="openSearch()">
        <mat-icon>search</mat-icon>
        @if (!collapsed()) {
          <span>Buscar...</span>
          <span class="kbd">Ctrl+K</span>
        }
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-section">
          @if (!collapsed()) {
            <span class="nav-label">Menu</span>
          }
          @for (item of navItems; track item.route) {
            @if (!item.adminOnly || isAdmin()) {
              <a [routerLink]="item.route"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
                 class="nav-item"
                 [matTooltip]="collapsed() ? item.label : ''"
                 matTooltipPosition="right">
                <mat-icon>{{ item.icon }}</mat-icon>
                @if (!collapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            }
          }
        </div>

        @if (isAdmin()) {
          <div class="nav-section">
            @if (!collapsed()) {
              <span class="nav-label">Administracion</span>
            }
            @for (item of adminItems; track item.route) {
              <a [routerLink]="item.route"
                 routerLinkActive="active"
                 class="nav-item"
                 [matTooltip]="collapsed() ? item.label : ''"
                 matTooltipPosition="right">
                <mat-icon>{{ item.icon }}</mat-icon>
                @if (!collapsed()) {
                  <span>{{ item.label }}</span>
                }
              </a>
            }
          </div>
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        @if (user(); as u) {
          <a routerLink="/profile" class="user-info" [matTooltip]="collapsed() ? u.first_name : ''" matTooltipPosition="right">
            @if (u.avatar_url) {
              <img [src]="u.avatar_url" alt="Avatar" class="avatar" />
            } @else {
              <div class="avatar-placeholder">
                <mat-icon>person</mat-icon>
              </div>
            }
            @if (!collapsed()) {
              <div class="user-details">
                <span class="user-name">{{ u.first_name }}</span>
                <span class="user-email">{{ u.email }}</span>
              </div>
            }
          </a>
        }
        <button mat-icon-button class="logout-btn" (click)="onLogout()" matTooltip="Cerrar sesion" matTooltipPosition="right">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    @if (mobileOpen()) {
      <div class="overlay" (click)="closeMobile()"></div>
    }

    <!-- Mobile toggle button -->
    <button mat-icon-button class="mobile-toggle" (click)="toggleMobile()">
      <mat-icon>menu</mat-icon>
    </button>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: 240px;
      background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      transition: width 200ms ease;
    }

    .sidebar.collapsed {
      width: 68px;
    }

    /* Header */
    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      min-height: 60px;
    }

    .logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .brand {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
    }

    .collapse-btn {
      margin-left: auto;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      line-height: 32px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        color: #64748b;
        background: #f1f5f9;
      }
    }

    .collapsed .collapse-btn {
      margin-left: 0;
    }

    /* Search trigger */
    .search-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 12px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      color: #94a3b8;
      font-size: 0.85rem;
      transition: all 0.15s;
    }
    .search-trigger:hover {
      border-color: #c8a84b;
      color: #c8a84b;
      background: rgba(200, 168, 75, 0.05);
    }
    .search-trigger .kbd {
      margin-left: auto;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      font-weight: 600;
    }
    .collapsed .search-trigger {
      justify-content: center;
      padding: 8px;
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .nav-section {
      margin-bottom: 1rem;
    }

    .nav-label {
      display: block;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border-radius: 10px;
      color: #64748b;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 150ms ease;
      margin-bottom: 2px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &:hover {
        background: #f8fafc;
        color: #1e293b;
      }

      &.active {
        background: linear-gradient(135deg, #c8a84b 0%, #b8943f 100%);
        color: #fff;

        mat-icon {
          color: #fff;
        }
      }
    }

    .collapsed .nav-item {
      justify-content: center;
      padding: 0.75rem;

      span {
        display: none;
      }
    }

    /* Footer */
    .sidebar-footer {
      padding: 0.75rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.4rem;
      border-radius: 8px;
      text-decoration: none;
      transition: background 150ms;
      min-width: 0;

      &:hover {
        background: #f8fafc;
      }
    }

    .avatar, .avatar-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .avatar {
      object-fit: cover;
    }

    .avatar-placeholder {
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #94a3b8;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.68rem;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      color: #94a3b8;
      flex-shrink: 0;

      &:hover {
        color: #ef4444;
        background: #fef2f2;
      }
    }

    .collapsed .user-info {
      padding: 0;
    }

    .collapsed .user-details {
      display: none;
    }

    /* Mobile */
    .overlay {
      display: none;
    }

    .mobile-toggle {
      display: none;
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 999;
      background: #fff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        width: 260px;
        box-shadow: 4px 0 16px rgba(0,0,0,0.1);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .sidebar.collapsed {
        width: 260px;
      }

      .collapse-btn {
        display: none;
      }

      .overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.4);
        z-index: 999;
      }

      .mobile-toggle {
        display: flex;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  @HostListener('document:keydown.control.k', ['$event'])
  onCtrlK(event: Event): void {
    event.preventDefault();
    this.openSearch();
  }

  openSearch(): void {
    this.dialog.open(GlobalSearchComponent, {
      width: '520px',
      maxWidth: '95vw',
      position: { top: '80px' },
      panelClass: 'search-dialog',
    });
  }

  user = this.authService.currentUser;
  isAdmin = () => this.user()?.is_admin ?? false;

  collapsed = signal(false);
  mobileOpen = signal(false);

  collapsedChange = output<boolean>();

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'sports_soccer', label: 'Jornadas', route: '/quiniela/jornadas' },
    { icon: 'group', label: 'Grupos', route: '/groups' },
    { icon: 'bar_chart', label: 'Estadisticas', route: '/stats' },
    { icon: 'notifications', label: 'Notificaciones', route: '/notifications' },
    { icon: 'person', label: 'Perfil', route: '/profile' },
  ];

  adminItems: NavItem[] = [
    { icon: 'admin_panel_settings', label: 'Panel Admin', route: '/admin' },
    { icon: 'event', label: 'Jornadas', route: '/admin/jornadas' },
    { icon: 'calendar_month', label: 'Temporadas', route: '/admin/seasons' },
    { icon: 'people', label: 'Usuarios', route: '/admin/users' },
    { icon: 'group_work', label: 'Grupos', route: '/admin/groups' },
  ];

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
    this.collapsedChange.emit(this.collapsed());
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
