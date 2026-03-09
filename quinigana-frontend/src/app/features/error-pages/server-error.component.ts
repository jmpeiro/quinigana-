import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error-page">
      <div class="error-content">
        <div class="error-code">500</div>
        <h1 class="error-title">Error del servidor</h1>
        <p class="error-message">
          Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
          Por favor, intenta de nuevo mas tarde.
        </p>
        @if (requestId) {
          <p class="request-id">
            <mat-icon>fingerprint</mat-icon>
            ID de referencia: <code>{{ requestId }}</code>
          </p>
        }
        <div class="error-actions">
          <button mat-raised-button class="btn-back" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Volver atras
          </button>
          <button mat-stroked-button class="btn-home" (click)="goHome()">
            <mat-icon>home</mat-icon>
            Ir al inicio
          </button>
          <button mat-stroked-button class="btn-retry" (click)="retry()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
        </div>
      </div>
      <div class="error-illustration">
        <mat-icon class="big-icon">cloud_off</mat-icon>
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

    .error-content { max-width: 480px; }

    .error-code {
      font-size: 6rem;
      font-weight: 800;
      color: #ef5350;
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
      margin: 0 0 1rem;
    }

    .request-id {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #94a3b8;
      margin: 0 0 1.5rem;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      code {
        background: #f1f5f9;
        padding: 2px 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.75rem;
        user-select: all;
      }
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

    .btn-home, .btn-retry {
      border-color: #e2e8f0 !important;
      color: #64748b !important;
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
      color: #fce4ec;
    }

    @media (max-width: 768px) {
      .error-page {
        flex-direction: column-reverse;
        text-align: center;
        gap: 1.5rem;
      }

      .error-actions { justify-content: center; }
      .request-id { justify-content: center; }
      .error-code { font-size: 4rem; }
      .big-icon { font-size: 120px; width: 120px; height: 120px; }
    }
  `],
})
export class ServerErrorComponent {
  private router = inject(Router);
  requestId: string | null = null;

  constructor() {
    const nav = this.router.getCurrentNavigation();
    this.requestId = nav?.extras?.state?.['requestId'] ?? null;
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  retry(): void {
    window.location.reload();
  }
}
