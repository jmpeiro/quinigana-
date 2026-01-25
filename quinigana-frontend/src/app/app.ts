import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private authService = inject(AuthService);
  isAuthenticated = this.authService.isAuthenticated;
  sidebarCollapsed = signal(false);

  onSidebarCollapse(collapsed: boolean): void {
    this.sidebarCollapsed.set(collapsed);
  }
}
