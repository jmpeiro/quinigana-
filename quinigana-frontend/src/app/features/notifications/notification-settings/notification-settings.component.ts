import { Component, signal, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface NotificationPref {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const STORAGE_KEY = 'quinigana-notification-prefs';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [MatDialogModule, MatSlideToggleModule, MatIconModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>tune</mat-icon>
      Preferencias de Notificaciones
    </h2>
    <mat-dialog-content>
      @for (pref of preferences(); track pref.key) {
        <div class="pref-row">
          <div class="pref-info">
            <mat-icon>{{ pref.icon }}</mat-icon>
            <div>
              <span class="pref-label">{{ pref.label }}</span>
              <span class="pref-desc">{{ pref.description }}</span>
            </div>
          </div>
          <mat-slide-toggle
            [checked]="pref.enabled"
            (change)="toggle(pref.key)">
          </mat-slide-toggle>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button class="save-btn" (click)="close()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
      color: var(--text-primary, #1e293b);
      mat-icon { color: #c8a84b; }
    }

    .pref-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }
    .pref-row:last-child { border-bottom: none; }

    .pref-info {
      display: flex;
      align-items: center;
      gap: 12px;
      mat-icon {
        color: var(--text-secondary, #64748b);
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
    }

    .pref-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-primary, #1e293b);
    }

    .pref-desc {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
      margin-top: 2px;
    }

    .save-btn {
      background: linear-gradient(135deg, #c8a84b, #dfc56a);
      color: #1e293b;
      font-weight: 600;
    }
  `],
})
export class NotificationSettingsComponent implements OnInit {
  private dialogRef: MatDialogRef<NotificationSettingsComponent>;

  constructor(dialogRef: MatDialogRef<NotificationSettingsComponent>) {
    this.dialogRef = dialogRef;
  }

  preferences = signal<NotificationPref[]>([
    { key: 'challenges', label: 'Nuevos Retos', description: 'Cuando alguien te reta', icon: 'sports_kabaddi', enabled: true },
    { key: 'jornada_results', label: 'Resultados de Jornada', description: 'Cuando finaliza una jornada', icon: 'emoji_events', enabled: true },
    { key: 'group_activity', label: 'Actividad de Grupo', description: 'Nuevas propuestas y comentarios', icon: 'groups', enabled: true },
    { key: 'proposal_votes', label: 'Votos en Propuestas', description: 'Cuando votan tu propuesta', icon: 'how_to_vote', enabled: true },
    { key: 'invitations', label: 'Invitaciones a Grupos', description: 'Cuando te invitan a un grupo', icon: 'mail', enabled: true },
    { key: 'deadline_reminder', label: 'Recordatorio de Deadline', description: 'Antes de que cierre una jornada', icon: 'alarm', enabled: true },
  ]);

  ngOnInit(): void {
    this.loadPrefs();
  }

  toggle(key: string): void {
    this.preferences.update(prefs =>
      prefs.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p)
    );
    this.savePrefs();
  }

  close(): void {
    this.savePrefs();
    this.dialogRef.close();
  }

  private loadPrefs(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Object.keys(saved).length > 0) {
        this.preferences.update(prefs =>
          prefs.map(p => ({ ...p, enabled: saved[p.key] ?? p.enabled }))
        );
      }
    } catch { /* ignore */ }
  }

  private savePrefs(): void {
    const prefs: Record<string, boolean> = {};
    this.preferences().forEach(p => prefs[p.key] = p.enabled);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }
}
