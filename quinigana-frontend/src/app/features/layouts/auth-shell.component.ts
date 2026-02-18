import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <app-sidebar (collapsedChange)="onSidebarCollapse($event)" />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .main-content {
      flex: 1;
      margin-left: 240px;
      min-height: 100vh;
      background: #f8f9fb;
      transition: margin-left 200ms ease;
    }

    .sidebar-collapsed .main-content {
      margin-left: 68px;
    }

    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding-top: 60px;
      }

      .sidebar-collapsed .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class AuthShellComponent {
  sidebarCollapsed = signal(false);

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
