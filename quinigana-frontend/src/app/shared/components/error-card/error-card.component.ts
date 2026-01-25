import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-card',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="error-card">
      <mat-icon class="error-icon">{{ icon() }}</mat-icon>
      <h3 class="error-title">{{ title() }}</h3>
      <p class="error-message">{{ message() }}</p>
      @if (retryable()) {
        <button mat-stroked-button (click)="retry.emit()">
          <mat-icon>refresh</mat-icon>
          Reintentar
        </button>
      }
    </div>
  `,
  styles: [`
    .error-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #c8a84b;
      margin-bottom: 1rem;
    }

    .error-title {
      margin: 0 0 0.5rem;
      color: #1e293b;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .error-message {
      margin: 0 0 1.5rem;
      color: #94a3b8;
      font-size: 0.85rem;
    }

    button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorCardComponent {
  icon = input('cloud_off');
  title = input('Error de conexion');
  message = input('No pudimos cargar los datos. Verifica tu conexion e intenta de nuevo.');
  retryable = input(true);
  retry = output();
}
