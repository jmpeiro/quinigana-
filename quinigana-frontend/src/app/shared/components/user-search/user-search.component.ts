import { Component, ChangeDetectionStrategy, inject, input, output, signal, OnInit, DestroyRef } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSearchService } from '../../../core/services/user-search.service';
import { UserSearchResult } from '../../../core/models/group.model';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-form-field appearance="outline" class="user-search-field">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        [formControl]="searchControl"
        [matAutocomplete]="auto"
        [placeholder]="placeholder()"
        type="text"
      />
      @if (loading()) {
        <mat-spinner matSuffix diameter="20"></mat-spinner>
      }
      <mat-autocomplete
        #auto="matAutocomplete"
        (optionSelected)="onOptionSelected($event.option.value)"
        [displayWith]="displayFn"
        class="user-search-panel"
      >
        @for (user of results(); track user.id) {
          <mat-option [value]="user" class="user-option">
            <div class="user-option-content">
              <div class="user-avatar">
                @if (user.avatar_url) {
                  <img [src]="user.avatar_url" [alt]="user.first_name" />
                } @else {
                  <span class="initials">{{ getInitials(user) }}</span>
                }
              </div>
              <div class="user-details">
                <span class="user-name">{{ user.first_name }} {{ user.last_name || '' }}</span>
                <span class="user-email">{{ user.email }}</span>
              </div>
            </div>
          </mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [`
    @use 'styles/variables' as *;

    :host {
      display: block;
      width: 100%;
    }

    .user-search-field {
      width: 100%;

      mat-icon[matPrefix] {
        color: $neutral-400;
        margin-right: $spacing-sm;
      }
    }

    .user-option-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-xs 0;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: $radius-full;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $primary-600;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .initials {
        font-size: $font-size-sm;
        font-weight: 600;
        color: $accent-500;
        text-transform: uppercase;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;

      .user-name {
        font-size: $font-size-sm;
        font-weight: 500;
        color: $neutral-100;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-email {
        font-size: $font-size-xs;
        color: $neutral-400;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSearchComponent implements OnInit {
  private readonly userSearchService = inject(UserSearchService);
  private readonly destroyRef = inject(DestroyRef);

  placeholder = input<string>('Search users...');
  userSelected = output<UserSearchResult>();

  searchControl = new FormControl('');
  results = signal<UserSearchResult[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((value): value is string => typeof value === 'string' && value.trim().length >= 2),
      switchMap(query => {
        this.loading.set(true);
        return this.userSearchService.search(query.trim());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.results.set(response.success && response.data ? response.data : []);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }

  onOptionSelected(user: UserSearchResult): void {
    this.userSelected.emit(user);
    this.searchControl.setValue('');
    this.results.set([]);
  }

  displayFn(user: UserSearchResult | string): string {
    if (typeof user === 'string') return user;
    return user ? `${user.first_name} ${user.last_name || ''}`.trim() : '';
  }

  getInitials(user: UserSearchResult): string {
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return `${first}${last}`;
  }
}
