import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-create-api-key-dialog',
  standalone: true,
  imports: [
    MatButtonModule, MatDialogModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, ReactiveFormsModule,
  ],
  template: `
    <div class="create-key-dialog">
      @if (!createdKey()) {
        <h2>Crear API Key</h2>
        <p class="subtitle">Dale un nombre descriptivo a tu key</p>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput [formControl]="nameControl" placeholder="Mi aplicacion" />
          @if (nameControl.hasError('required') && nameControl.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <div class="actions">
          <button mat-stroked-button (click)="dialogRef.close(null)">Cancelar</button>
          <button mat-flat-button color="primary" (click)="createKey()" [disabled]="nameControl.invalid || isCreating()">
            @if (isCreating()) {
              <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
            }
            {{ isCreating() ? 'Creando...' : 'Crear' }}
          </button>
        </div>
      } @else {
        <div class="success-icon">
          <mat-icon>check_circle</mat-icon>
        </div>
        <h2>Key Creada</h2>
        <p class="warning">Copia esta key ahora. No se mostrara de nuevo.</p>

        <div class="key-display">
          <code>{{ createdKey() }}</code>
          <button mat-icon-button (click)="copyKey()" title="Copiar">
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>

        <div class="actions">
          <button mat-flat-button color="primary" (click)="dialogRef.close(true)">Listo</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .create-key-dialog {
      padding: 1.5rem;
      text-align: center;
      max-width: 380px;
    }

    h2 {
      margin: 0 0 0.25rem;
      color: var(--text-primary, #1e293b);
      font-size: 1.2rem;
    }

    .subtitle {
      margin: 0 0 1.25rem;
      color: var(--text-muted, #64748b);
      font-size: 0.85rem;
    }

    .full-width { width: 100%; }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 1rem;

      button { min-width: 100px; }
    }

    .btn-spinner {
      display: inline-block;
      margin-right: 8px;

      ::ng-deep circle { stroke: white; }
    }

    .success-icon {
      margin-bottom: 0.5rem;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #22c55e;
      }
    }

    .warning {
      margin: 0.5rem 0 1rem;
      color: #f59e0b;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .key-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;

      code {
        flex: 1;
        font-size: 0.7rem;
        word-break: break-all;
        text-align: left;
        color: var(--text-primary, #1e293b);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApiKeyDialogComponent {
  dialogRef = inject(MatDialogRef<CreateApiKeyDialogComponent>);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private clipboard = inject(Clipboard);

  nameControl = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  isCreating = signal(false);
  createdKey = signal<string | null>(null);

  async createKey(): Promise<void> {
    if (this.nameControl.invalid) return;

    this.isCreating.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; data: { key: string } }>(
          `${environment.apiUrl}/public/keys`,
          { name: this.nameControl.value!.trim(), permissions: ['read'] },
          { withCredentials: true }
        )
      );
      if (response.success && response.data?.key) {
        this.createdKey.set(response.data.key);
      }
    } catch {
      this.snackBar.open('Error al crear API key', 'Cerrar', { duration: 4000 });
    } finally {
      this.isCreating.set(false);
    }
  }

  copyKey(): void {
    const key = this.createdKey();
    if (key) {
      this.clipboard.copy(key);
      this.snackBar.open('Key copiada al portapapeles', 'OK', { duration: 2000 });
    }
  }
}
