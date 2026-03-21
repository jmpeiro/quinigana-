import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { SearchService, SearchResults } from '../../../core/services/search.service';

@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="search-overlay">
      <div class="search-header">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          #searchInput
          class="search-input"
          [formControl]="searchControl"
          placeholder="Buscar grupos, usuarios, jornadas..."
          autocomplete="off" />
        <span class="shortcut-badge">ESC</span>
      </div>

      <div class="search-body">
        @if (loading()) {
          <div class="search-loading">
            <mat-spinner diameter="28"></mat-spinner>
          </div>
        } @else if (hasResults()) {
          @if (results().groups.length > 0) {
            <div class="result-section">
              <div class="section-label">Grupos</div>
              @for (group of results().groups; track group.id) {
                <div class="result-item" (click)="navigate('/groups/' + group.id)">
                  <mat-icon class="result-icon">groups</mat-icon>
                  <div class="result-info">
                    <span class="result-title">{{ group.name }}</span>
                    <span class="result-sub">{{ group.member_count }} miembros</span>
                  </div>
                </div>
              }
            </div>
          }

          @if (results().users.length > 0) {
            <div class="result-section">
              <div class="section-label">Usuarios</div>
              @for (user of results().users; track user.id) {
                <div class="result-item" (click)="navigate('/stats')">
                  <mat-icon class="result-icon">person</mat-icon>
                  <div class="result-info">
                    <span class="result-title">{{ user.first_name }} {{ user.last_name || '' }}</span>
                  </div>
                </div>
              }
            </div>
          }

          @if (results().jornadas.length > 0) {
            <div class="result-section">
              <div class="section-label">Jornadas</div>
              @for (jornada of results().jornadas; track jornada.id) {
                <div class="result-item" (click)="navigate('/quiniela/jornadas/' + jornada.id)">
                  <mat-icon class="result-icon">event</mat-icon>
                  <div class="result-info">
                    <span class="result-title">{{ jornada.name }}</span>
                    <span class="result-sub status-{{ jornada.status }}">{{ jornada.status }}</span>
                  </div>
                </div>
              }
            </div>
          }
        } @else if (searched()) {
          <div class="no-results">
            <mat-icon>search_off</mat-icon>
            <span>Sin resultados para "{{ searchControl.value }}"</span>
          </div>
        } @else {
          <div class="search-hint">
            <mat-icon>tips_and_updates</mat-icon>
            <span>Escribe al menos 2 caracteres para buscar</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-overlay { max-height: 70vh; display: flex; flex-direction: column; }

    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .search-icon { color: var(--text-muted, #94a3b8); }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      background: transparent;
      color: var(--text-primary, #1e293b);
    }
    .search-input::placeholder { color: var(--text-muted, #94a3b8); }

    .shortcut-badge {
      font-size: 0.65rem;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--bg-secondary, #f1f5f9);
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }

    .search-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .search-loading, .no-results, .search-hint {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 8px;
      color: var(--text-muted, #94a3b8);
      font-size: 0.85rem;
      mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: 0.5; }
    }

    .result-section { padding: 4px 0; }

    .section-label {
      padding: 8px 20px 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted, #94a3b8);
      letter-spacing: 0.05em;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .result-item:hover { background: var(--bg-secondary, #f8f9fb); }

    .result-icon {
      color: #c8a84b;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .result-info { display: flex; flex-direction: column; gap: 2px; }
    .result-title { font-size: 0.9rem; color: var(--text-primary, #1e293b); font-weight: 500; }
    .result-sub { font-size: 0.75rem; color: var(--text-muted, #94a3b8); }
    .status-open { color: #22c55e; }
    .status-closed { color: #f59e0b; }
    .status-finished { color: #64748b; }
  `],
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private dialogRef: MatDialogRef<GlobalSearchComponent>;
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  results = signal<SearchResults>({ groups: [], users: [], jornadas: [] });
  loading = signal(false);
  searched = signal(false);

  constructor(dialogRef: MatDialogRef<GlobalSearchComponent>) {
    this.dialogRef = dialogRef;
  }

  hasResults(): boolean {
    const r = this.results();
    return r.groups.length > 0 || r.users.length > 0 || r.jornadas.length > 0;
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.searched.set(false);
          this.results.set({ groups: [], users: [], jornadas: [] });
          return [];
        }
        this.loading.set(true);
        return this.searchService.search(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (data) {
        this.results.set(data);
        this.searched.set(true);
      }
      this.loading.set(false);
    });
  }

  navigate(path: string): void {
    this.dialogRef.close();
    this.router.navigateByUrl(path);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
