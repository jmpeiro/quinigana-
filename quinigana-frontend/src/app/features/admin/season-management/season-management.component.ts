import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { SeasonService } from '../../../core/services/season.service';
import { SeasonWithStats, CreateSeasonDto, UpdateSeasonDto } from '../../../core/models/season.model';

@Component({
  selector: 'app-season-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="admin-container">
      <div class="page-header">
        <h1 class="page-title">Gestionar Temporadas</h1>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nueva Temporada
        </button>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="seasons-list">
          @for (season of seasons(); track season.id) {
            <div class="season-card" [class.current]="season.is_current">
              <div class="season-header">
                <div class="season-info">
                  <h3>{{ season.display_name }}</h3>
                  <span class="season-code">{{ season.name }}</span>
                </div>
                @if (season.is_current) {
                  <mat-chip-listbox>
                    <mat-chip color="primary" selected>Actual</mat-chip>
                  </mat-chip-listbox>
                }
              </div>

              <div class="season-dates">
                <mat-icon>date_range</mat-icon>
                <span>{{ formatDate(season.start_date) }} - {{ formatDate(season.end_date) }}</span>
              </div>

              <div class="season-stats">
                <div class="stat">
                  <span class="stat-value">{{ season.jornadasCount }}</span>
                  <span class="stat-label">Jornadas</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ season.finishedCount }}</span>
                  <span class="stat-label">Finalizadas</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ getProgress(season) }}%</span>
                  <span class="stat-label">Progreso</span>
                </div>
              </div>

              <div class="season-actions">
                @if (!season.is_current) {
                  <button mat-stroked-button (click)="setAsCurrent(season)" [disabled]="saving()">
                    <mat-icon>star</mat-icon>
                    Marcar Actual
                  </button>
                }
                <button mat-stroked-button (click)="openEditDialog(season)">
                  <mat-icon>edit</mat-icon>
                  Editar
                </button>
                @if (season.jornadasCount === 0) {
                  <button mat-stroked-button color="warn" (click)="deleteSeason(season)" [disabled]="saving()">
                    <mat-icon>delete</mat-icon>
                    Eliminar
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>calendar_month</mat-icon>
              <p>No hay temporadas creadas</p>
              <button mat-flat-button color="primary" (click)="openCreateDialog()">
                Crear Primera Temporada
              </button>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Dialog -->
      @if (showDialog()) {
        <div class="dialog-overlay" (click)="closeDialog()">
          <div class="dialog-content" (click)="$event.stopPropagation()">
            <h2>{{ editingSeason() ? 'Editar Temporada' : 'Nueva Temporada' }}</h2>
            <form [formGroup]="seasonForm" (ngSubmit)="saveSeason()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Codigo</mat-label>
                <input matInput formControlName="name" placeholder="ej: 2024-25" />
                <mat-hint>Identificador unico de la temporada</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre a Mostrar</mat-label>
                <input matInput formControlName="display_name" placeholder="ej: Temporada 2024-25" />
              </mat-form-field>

              <div class="date-row">
                <mat-form-field appearance="outline">
                  <mat-label>Fecha Inicio</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="start_date" />
                  <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                  <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Fecha Fin</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="end_date" />
                  <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                  <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>
              </div>

              <mat-slide-toggle formControlName="is_current">
                Marcar como temporada actual
              </mat-slide-toggle>

              <div class="dialog-actions">
                <button mat-stroked-button type="button" (click)="closeDialog()">Cancelar</button>
                <button mat-flat-button color="primary" type="submit"
                        [disabled]="seasonForm.invalid || saving()">
                  {{ saving() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .admin-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .page-title {
      color: var(--text-primary, #1e293b);
      font-size: 1.5rem;
      margin: 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 3rem;
    }

    .seasons-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .season-card {
      background: var(--bg-card, #fff);
      border-radius: 12px;
      padding: 1.25rem;
      border: 1px solid var(--border-color, #e2e8f0);

      &.current {
        border-color: rgba(200, 168, 75, 0.5);
        box-shadow: 0 0 0 1px rgba(200, 168, 75, 0.2);
      }
    }

    .season-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .season-info {
      h3 {
        margin: 0 0 4px;
        color: var(--text-primary, #1e293b);
        font-size: 1.1rem;
      }
      .season-code {
        font-size: 0.75rem;
        color: var(--text-muted, #94a3b8);
        font-family: monospace;
      }
    }

    .season-dates {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary, #64748b);
      font-size: 0.85rem;
      margin-bottom: 1rem;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .season-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: var(--bg-secondary, #f8f9fb);
      border-radius: 8px;
    }

    .stat {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary, #1e293b);
      }
      .stat-label {
        font-size: 0.7rem;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
      }
    }

    .season-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      button {
        font-size: 0.8rem;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted, #94a3b8);

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }

      p {
        margin: 1rem 0;
      }
    }

    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dialog-content {
      background: var(--bg-card, #fff);
      border-radius: 16px;
      padding: 1.5rem;
      width: 90%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;

      h2 {
        margin: 0 0 1.5rem;
        color: var(--text-primary, #1e293b);
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
    }

    .full-width {
      width: 100%;
    }

    .date-row {
      display: flex;
      gap: 1rem;

      mat-form-field {
        flex: 1;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonManagementComponent implements OnInit {
  private seasonService = inject(SeasonService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  seasons = signal<SeasonWithStats[]>([]);
  loading = signal(true);
  saving = signal(false);
  showDialog = signal(false);
  editingSeason = signal<SeasonWithStats | null>(null);

  seasonForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    display_name: ['', [Validators.required, Validators.maxLength(100)]],
    start_date: [null, Validators.required],
    end_date: [null, Validators.required],
    is_current: [false],
  });

  ngOnInit(): void {
    this.loadSeasons();
  }

  loadSeasons(): void {
    this.loading.set(true);
    this.seasonService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.seasons.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar temporadas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  openCreateDialog(): void {
    this.editingSeason.set(null);
    this.seasonForm.reset({ is_current: false });
    this.showDialog.set(true);
  }

  openEditDialog(season: SeasonWithStats): void {
    this.editingSeason.set(season);
    this.seasonForm.patchValue({
      name: season.name,
      display_name: season.display_name,
      start_date: new Date(season.start_date),
      end_date: new Date(season.end_date),
      is_current: season.is_current,
    });
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
    this.editingSeason.set(null);
  }

  saveSeason(): void {
    if (this.seasonForm.invalid) return;

    this.saving.set(true);
    const formValue = this.seasonForm.value;
    const data = {
      name: formValue.name,
      display_name: formValue.display_name,
      start_date: this.formatDateForApi(formValue.start_date),
      end_date: this.formatDateForApi(formValue.end_date),
      is_current: formValue.is_current,
    };

    const editing = this.editingSeason();
    const request = editing
      ? this.seasonService.update(editing.id, data as UpdateSeasonDto)
      : this.seasonService.create(data as CreateSeasonDto);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            editing ? 'Temporada actualizada' : 'Temporada creada',
            'Cerrar',
            { duration: 3000 }
          );
          this.closeDialog();
          this.loadSeasons();
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(
          err.error?.error?.message || 'Error al guardar',
          'Cerrar',
          { duration: 3000 }
        );
      },
    });
  }

  setAsCurrent(season: SeasonWithStats): void {
    this.saving.set(true);
    this.seasonService.setAsCurrent(season.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Temporada marcada como actual', 'Cerrar', { duration: 3000 });
          this.loadSeasons();
        }
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 });
      },
    });
  }

  deleteSeason(season: SeasonWithStats): void {
    if (!confirm(`¿Eliminar la temporada "${season.display_name}"?`)) return;

    this.saving.set(true);
    this.seasonService.delete(season.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Temporada eliminada', 'Cerrar', { duration: 3000 });
          this.loadSeasons();
        }
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(
          err.error?.error?.message || 'Error al eliminar',
          'Cerrar',
          { duration: 3000 }
        );
      },
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getProgress(season: SeasonWithStats): number {
    if (season.jornadasCount === 0) return 0;
    return Math.round((season.finishedCount / season.jornadasCount) * 100);
  }
}
