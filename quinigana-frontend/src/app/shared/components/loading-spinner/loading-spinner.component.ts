import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(200, 168, 75, 0.2);
      border-top-color: #c8a84b;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {}
