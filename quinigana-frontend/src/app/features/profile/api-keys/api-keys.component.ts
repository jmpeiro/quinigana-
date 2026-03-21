import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RouterLink } from '@angular/router';
import { CreateApiKeyDialogComponent } from './create-api-key-dialog.component';

interface ApiKey {
  id: number;
  name: string;
  permissions: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, DatePipe, RouterLink],
  template: `
    <div class="api-keys-container animate-fade-in">
      <div class="api-keys-card">
        <div class="header">
          <div class="header-left">
            <button mat-icon-button routerLink="/profile">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h2>API Keys</h2>
          </div>
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Crear Key
          </button>
        </div>

        <div class="info-box">
          <mat-icon>info</mat-icon>
          <div>
            <p>Las API keys permiten acceso de solo lectura a la API publica de QuiniGana.</p>
            <p>Usa el header <code>X-API-Key</code> en tus peticiones.</p>
            <p>Base URL: <code>{{ apiBaseUrl }}/public</code></p>
          </div>
        </div>

        <mat-divider></mat-divider>

        @if (isLoading()) {
          <div class="loading">
            <mat-spinner diameter="32"></mat-spinner>
          </div>
        } @else if (keys().length === 0) {
          <div class="empty-state">
            <mat-icon>vpn_key</mat-icon>
            <p>No tienes API keys</p>
            <p class="hint">Crea una key para acceder a la API publica</p>
          </div>
        } @else {
          <div class="keys-list">
            @for (key of keys(); track key.id) {
              <div class="key-item" [class.inactive]="!key.is_active">
                <div class="key-info">
                  <div class="key-name">
                    <strong>{{ key.name }}</strong>
                    @if (!key.is_active) {
                      <span class="badge revoked">Revocada</span>
                    } @else {
                      <span class="badge active">Activa</span>
                    }
                  </div>
                  <div class="key-meta">
                    <span>Creada: {{ key.created_at | date:'short' }}</span>
                    @if (key.last_used_at) {
                      <span>Ultimo uso: {{ key.last_used_at | date:'short' }}</span>
                    } @else {
                      <span>Nunca usada</span>
                    }
                  </div>
                </div>
                @if (key.is_active) {
                  <button mat-icon-button color="warn" (click)="revokeKey(key.id)" title="Revocar">
                    <mat-icon>block</mat-icon>
                  </button>
                }
              </div>
            }
          </div>
        }

        <mat-divider></mat-divider>

        <div class="endpoints-info">
          <h3>Endpoints disponibles</h3>
          <ul>
            <li><code>GET /public/standings</code> - Clasificacion general</li>
            <li><code>GET /public/jornadas</code> - Lista de jornadas</li>
            <li><code>GET /public/jornadas/:id/results</code> - Resultados de jornada</li>
            <li><code>GET /public/users/:id/stats</code> - Estadisticas de usuario</li>
            <li><code>GET /public/groups/:id/rankings</code> - Rankings de grupo</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .api-keys-container {
      display: flex;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }

    .api-keys-card {
      width: 100%;
      max-width: 600px;
      background: var(--bg-card, #1e293b);
      border-radius: 16px;
      padding: 1.5rem;
      color: var(--text-primary, #f1f5f9);
      align-self: flex-start;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      h2 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .info-box {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(200, 168, 75, 0.08);
      border-radius: 8px;
      border: 1px solid rgba(200, 168, 75, 0.2);
      margin-bottom: 1rem;

      mat-icon {
        color: #c8a84b;
        flex-shrink: 0;
      }

      p {
        margin: 0 0 0.25rem;
        font-size: 0.8rem;
        color: var(--text-secondary, #94a3b8);

        &:last-child { margin-bottom: 0; }
      }

      code {
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted, #64748b);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }

      p { margin: 0.5rem 0 0; }
      .hint { font-size: 0.8rem; }
    }

    .keys-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 0;
    }

    .key-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);

      &.inactive { opacity: 0.5; }
    }

    .key-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .badge {
      font-size: 0.65rem;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;

      &.active {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }

      &.revoked {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    }

    .key-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }

    .endpoints-info {
      padding-top: 1rem;

      h3 {
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
        color: var(--text-primary, #f1f5f9);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        padding: 0.35rem 0;
        font-size: 0.8rem;
        color: var(--text-secondary, #94a3b8);

        code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          color: #c8a84b;
        }
      }
    }

    mat-divider {
      border-top-color: var(--divider-color, rgba(255, 255, 255, 0.08));
      margin: 1rem 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeysComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  keys = signal<ApiKey[]>([]);
  isLoading = signal(false);
  apiBaseUrl = environment.apiUrl;

  ngOnInit(): void {
    this.loadKeys();
  }

  async loadKeys(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: ApiKey[] }>(
          `${environment.apiUrl}/public/keys`,
          { withCredentials: true }
        )
      );
      if (response.success) {
        this.keys.set(response.data);
      }
    } catch {
      this.snackBar.open('Error al cargar API keys', 'Cerrar', { duration: 4000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CreateApiKeyDialogComponent, {
      width: '400px',
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.loadKeys();
      }
    });
  }

  async revokeKey(keyId: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<{ success: boolean }>(
          `${environment.apiUrl}/public/keys/${keyId}`,
          { withCredentials: true }
        )
      );
      this.snackBar.open('API key revocada', 'OK', { duration: 3000 });
      this.loadKeys();
    } catch {
      this.snackBar.open('Error al revocar API key', 'Cerrar', { duration: 4000 });
    }
  }
}
