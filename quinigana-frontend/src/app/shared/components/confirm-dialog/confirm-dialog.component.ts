import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      @if (data.icon) {
        <div class="dialog-icon" [class.warn]="data.confirmColor === 'warn'">
          <mat-icon>{{ data.icon }}</mat-icon>
        </div>
      }
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions">
        <button mat-stroked-button (click)="dialogRef.close(false)">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-flat-button
                [color]="data.confirmColor || 'primary'"
                (click)="dialogRef.close(true)">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      padding: 1.5rem;
      text-align: center;
      max-width: 340px;
    }

    .dialog-icon {
      margin-bottom: 1rem;

      mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #c8a84b;
      }

      &.warn mat-icon {
        color: #f44336;
      }
    }

    .dialog-title {
      margin: 0 0 0.5rem;
      color: #1e293b;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .dialog-message {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .dialog-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;

      button {
        min-width: 100px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
}
