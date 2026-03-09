import {
  Component,
  input,
  output,
  signal,
  effect,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface SearchFilterChange {
  search: string;
  filters: Record<string, string>;
}

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="search-filter-bar">
      <mat-form-field class="search-field" appearance="outline" subscriptSizing="dynamic">
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          [placeholder]="placeholder()"
          [value]="searchValue()"
          (input)="onSearchInput($event)"
        />
        @if (searchValue()) {
          <button matSuffix mat-icon-button (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      @for (filter of filters(); track filter.key) {
        <mat-form-field class="filter-field" appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ filter.label }}</mat-label>
          <mat-select
            [value]="filterValues()[filter.key] || ''"
            (selectionChange)="onFilterChange(filter.key, $event.value)"
          >
            <mat-option value="">Todos</mat-option>
            @for (option of filter.options; track option.value) {
              <mat-option [value]="option.value">{{ option.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      }

      @if (hasActiveFilters()) {
        <button mat-icon-button class="clear-all-btn" (click)="clearAll()" matTooltip="Limpiar filtros">
          <mat-icon>filter_list_off</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .search-filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .filter-field {
      min-width: 140px;
      max-width: 200px;
    }

    .clear-all-btn {
      color: #94a3b8;
      &:hover { color: #ef5350; }
    }

    ::ng-deep .search-field .mat-mdc-form-field-icon-prefix {
      padding-right: 8px;
      color: #94a3b8;
    }

    ::ng-deep .search-filter-bar .mdc-text-field--outlined {
      --mdc-outlined-text-field-outline-color: #e2e8f0;
      --mdc-outlined-text-field-focus-outline-color: #c8a84b;
      --mdc-outlined-text-field-hover-outline-color: #cbd5e1;
    }

    @media (max-width: 600px) {
      .search-filter-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field, .filter-field {
        min-width: 100%;
        max-width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  /** Placeholder text for search input */
  placeholder = input<string>('Buscar...');

  /** Filter dropdown configurations */
  filters = input<FilterConfig[]>([]);

  /** Emits when search text or any filter changes */
  filterChange = output<SearchFilterChange>();

  /** Internal reactive state */
  searchValue = signal<string>('');
  filterValues = signal<Record<string, string>>({});

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  hasActiveFilters = signal(false);

  constructor() {
    effect(() => {
      const search = this.searchValue();
      const filters = this.filterValues();
      const hasSearch = search.length > 0;
      const hasFilters = Object.values(filters).some(v => v !== '');
      this.hasActiveFilters.set(hasSearch || hasFilters);
    });
  }

  ngOnInit(): void {
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.searchValue.set(value);
        this.emitChange();
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onFilterChange(key: string, value: string): void {
    this.filterValues.update(current => ({ ...current, [key]: value }));
    this.emitChange();
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.searchSubject.next('');
    this.emitChange();
  }

  clearAll(): void {
    this.searchValue.set('');
    this.searchSubject.next('');
    this.filterValues.set({});
    this.emitChange();
  }

  private emitChange(): void {
    this.filterChange.emit({
      search: this.searchValue(),
      filters: this.filterValues(),
    });
  }
}
