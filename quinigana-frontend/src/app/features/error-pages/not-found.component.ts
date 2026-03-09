import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">404</div>
        <h1 class="error-title">Pagina no encontrada</h1>
        <p class="error-message">
          La pagina que buscas no existe o ha sido movida.
        </p>
        <div class="error-actions">
          <button mat-raised-button class="btn-back" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Volver atras
          </button>
          <button mat-stroked-button class="btn-home" (click)="goHome()">
            <mat-icon>home</mat-icon>
            Ir al inicio
          </button>
        </div>
      </div>
      <div class="error-illustration">
        <mat-icon class="big-icon">search_off</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 80vh; }

    .error-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 2rem;
      gap: 3rem;
    }

    .error-content {
      max-width: 480px;
    }

    .error-code {
      font-size: 6rem;
      font-weight: 800;
      color: #c8a84b;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .error-title {
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem;
    }

    .error-message {
      font-size: 1rem;
      color: #64748b;
      line-height: 1.6;
      margin: 0 0 2rem;
    }

    .error-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-back {
      background: #c8a84b !important;
      color: #fff !important;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-home {
      border-color: #c8a84b !important;
      color: #c8a84b !important;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .error-illustration {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .big-icon {
      font-size: 180px;
      width: 180px;
      height: 180px;
      color: #e2e8f0;
    }

    @media (max-width: 768px) {
      .error-page {
        flex-direction: column-reverse;
        text-align: center;
        gap: 1.5rem;
      }

      .error-actions {
        justify-content: center;
      }

      .error-code { font-size: 4rem; }
      .big-icon { font-size: 120px; width: 120px; height: 120px; }
    }
  `],
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
