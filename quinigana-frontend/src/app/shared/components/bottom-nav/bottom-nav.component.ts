import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="bottom-nav">
      <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
        <mat-icon>home</mat-icon>
        <span>Inicio</span>
      </a>
      <a routerLink="/quiniela/jornadas" routerLinkActive="active" class="nav-item">
        <mat-icon>sports_soccer</mat-icon>
        <span>Jornadas</span>
      </a>
      <a routerLink="/groups" routerLinkActive="active" class="nav-item">
        <mat-icon>group</mat-icon>
        <span>Grupos</span>
      </a>
      <a routerLink="/stats" routerLinkActive="active" class="nav-item">
        <mat-icon>bar_chart</mat-icon>
        <span>Stats</span>
      </a>
      <a routerLink="/profile" routerLinkActive="active" class="nav-item">
        <mat-icon>person</mat-icon>
        <span>Perfil</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      background: var(--nav-bg);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--nav-border);
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 1000;
      padding: 0 8px;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      text-decoration: none;
      color: var(--nav-inactive);
      font-size: 0.65rem;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 8px;
      transition: color 150ms ease;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      &.active {
        color: var(--accent-primary);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {}
