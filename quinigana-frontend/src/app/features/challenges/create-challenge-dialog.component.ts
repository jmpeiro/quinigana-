import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ChallengeService } from '../../core/services/challenge.service';
import { JornadaService } from '../../core/services/jornada.service';
import { UserSearchService } from '../../core/services/user-search.service';
import { Jornada } from '../../core/models/jornada.model';

interface UserSearchResult {
  id: number;
  first_name: string;
  email: string;
  avatar_url: string | null;
}

@Component({
  selector: 'app-create-challenge-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSliderModule,
  ],
  template: `
    <h2 mat-dialog-title>Nuevo Reto 1vs1</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="challenge-form">
        <!-- User Search -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Retar a...</mat-label>
          <input
            matInput
            formControlName="userSearch"
            [matAutocomplete]="auto"
            placeholder="Buscar por nombre o email">
          <mat-icon matSuffix>search</mat-icon>
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onUserSelected($event)">
            @for (user of searchResults(); track user.id) {
              <mat-option [value]="user">
                <div class="user-option">
                  <div class="avatar" [style.backgroundImage]="getAvatarUrl(user.avatar_url)">
                    @if (!user.avatar_url) {
                      <mat-icon>person</mat-icon>
                    }
                  </div>
                  <div class="user-info">
                    <span class="name">{{ user.first_name }}</span>
                    <span class="email">{{ user.email }}</span>
                  </div>
                </div>
              </mat-option>
            }
            @if (searching()) {
              <mat-option disabled>
                <mat-spinner diameter="20"></mat-spinner>
                Buscando...
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        @if (selectedUser()) {
          <div class="selected-user">
            <div class="avatar" [style.backgroundImage]="getAvatarUrl(selectedUser()!.avatar_url)">
              @if (!selectedUser()!.avatar_url) {
                <mat-icon>person</mat-icon>
              }
            </div>
            <span class="name">{{ selectedUser()!.first_name }}</span>
            <button mat-icon-button (click)="clearSelectedUser()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }

        <!-- Jornada Selection -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Jornada</mat-label>
          <mat-select formControlName="jornada_id">
            @for (jornada of openJornadas(); track jornada.id) {
              <mat-option [value]="jornada.id">{{ jornada.name }}</mat-option>
            }
          </mat-select>
          @if (openJornadas().length === 0) {
            <mat-hint>No hay jornadas abiertas</mat-hint>
          }
        </mat-form-field>

        <!-- Wager Points -->
        <div class="wager-section">
          <label class="wager-label">Puntos a apostar</label>
          <div class="wager-slider">
            <span class="wager-value">{{ form.value.wager_points }}</span>
            <mat-slider min="0" max="50" step="5" discrete showTickMarks>
              <input matSliderThumb formControlName="wager_points">
            </mat-slider>
          </div>
          <span class="wager-hint">Tu reputacion: {{ currentReputation() }}</span>
        </div>

        <!-- Message -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mensaje (opcional)</mat-label>
          <textarea
            matInput
            formControlName="message"
            rows="2"
            maxlength="255"
            placeholder="Ej: A ver si te atreves..."></textarea>
          <mat-hint>{{ form.value.message?.length || 0 }}/255</mat-hint>
        </mat-form-field>
      </form>

      @if (errorMessage()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ errorMessage() }}
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!canSubmit() || submitting()"
        (click)="submit()">
        @if (submitting()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Enviar Reto
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .challenge-form { display: flex; flex-direction: column; gap: 1rem; min-width: 300px; }
    .full-width { width: 100%; }

    .user-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-secondary, #f1f5f9);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      mat-icon { font-size: 18px; color: var(--text-muted, #94a3b8); }
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }
    .name { font-size: 0.9rem; color: var(--text-primary, #1e293b); }
    .email { font-size: 0.75rem; color: var(--text-secondary, #64748b); }

    .selected-user {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(200, 168, 75, 0.1);
      border: 1px solid rgba(200, 168, 75, 0.3);
      border-radius: 12px;
      padding: 0.75rem;
      margin-top: -0.5rem;
    }
    .selected-user .name { font-weight: 500; flex: 1; }

    .wager-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .wager-label { font-size: 0.9rem; color: var(--text-primary, #1e293b); }
    .wager-slider {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .wager-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #c8a84b;
      min-width: 40px;
    }
    .wager-slider mat-slider { flex: 1; }
    .wager-hint { font-size: 0.75rem; color: var(--text-secondary, #64748b); }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ef4444;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    mat-dialog-actions button mat-spinner { margin-right: 8px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateChallengeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateChallengeDialogComponent>);
  private challengeService = inject(ChallengeService);
  private jornadaService = inject(JornadaService);
  private userSearchService = inject(UserSearchService);

  form: FormGroup;
  openJornadas = signal<Jornada[]>([]);
  searchResults = signal<UserSearchResult[]>([]);
  selectedUser = signal<UserSearchResult | null>(null);
  currentReputation = signal(100);

  searching = signal(false);
  submitting = signal(false);
  errorMessage = signal('');

  constructor() {
    this.form = this.fb.group({
      userSearch: [''],
      jornada_id: [null, Validators.required],
      wager_points: [10],
      message: [''],
    });
  }

  ngOnInit(): void {
    this.loadOpenJornadas();
    this.loadReputation();
    this.setupUserSearch();
  }

  private loadOpenJornadas(): void {
    this.jornadaService.getOpenJornadas().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.openJornadas.set(response.data);
          if (response.data.length > 0) {
            this.form.patchValue({ jornada_id: response.data[0].id });
          }
        }
      },
    });
  }

  private loadReputation(): void {
    this.challengeService.getMyStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentReputation.set(response.data.reputation);
        }
      },
    });
  }

  private setupUserSearch(): void {
    this.form.get('userSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        if (typeof value !== 'string' || value.length < 2) {
          this.searchResults.set([]);
          return of(null);
        }
        this.searching.set(true);
        return this.userSearchService.search(value);
      }),
    ).subscribe({
      next: (response) => {
        this.searching.set(false);
        if (response && response.success && response.data) {
          this.searchResults.set(response.data as UserSearchResult[]);
        }
      },
      error: () => this.searching.set(false),
    });
  }

  onUserSelected(event: { option: { value: UserSearchResult } }): void {
    this.selectedUser.set(event.option.value);
    this.form.patchValue({ userSearch: '' });
    this.searchResults.set([]);
  }

  clearSelectedUser(): void {
    this.selectedUser.set(null);
  }

  getAvatarUrl(url: string | null): string {
    return url ? `url(${url})` : '';
  }

  canSubmit(): boolean {
    return this.selectedUser() !== null &&
           this.form.value.jornada_id !== null &&
           this.form.value.wager_points <= this.currentReputation();
  }

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const dto = {
      challenged_id: this.selectedUser()!.id,
      jornada_id: this.form.value.jornada_id,
      wager_points: this.form.value.wager_points,
      message: this.form.value.message || undefined,
    };

    this.challengeService.create(dto).subscribe({
      next: (response) => {
        this.submitting.set(false);
        if (response.success) {
          this.dialogRef.close(true);
        } else {
          this.errorMessage.set(response.error?.message || 'Error al crear el reto');
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error?.message || 'Error al crear el reto');
      },
    });
  }
}
