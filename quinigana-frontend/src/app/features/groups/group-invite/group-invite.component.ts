import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Subject, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs';
import { GroupService } from '../../../core/services/group.service';
import { UserSearchService } from '../../../core/services/user-search.service';
import { UserSearchResult } from '../../../core/models/group.model';

@Component({
  selector: 'app-group-invite',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="invite-container animate-fade-in">
      <mat-card class="invite-card">
        <div class="invite-header">
          <a mat-icon-button [routerLink]="['/groups', groupId()]" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1 class="invite-title">Invite Member</h1>
        </div>

        <div class="search-section">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search users by name or email</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput
                   [formControl]="searchControl"
                   [matAutocomplete]="auto"
                   placeholder="Type to search...">
            @if (searching()) {
              <mat-spinner matSuffix diameter="20"></mat-spinner>
            }
            <mat-autocomplete #auto="matAutocomplete"
                              (optionSelected)="onUserSelected($event)"
                              class="invite-autocomplete">
              @for (user of searchResults(); track user.id) {
                <mat-option [value]="user">
                  <div class="user-option">
                    <div class="user-avatar">
                      @if (user.avatar_url) {
                        <img [src]="user.avatar_url" [alt]="user.first_name" />
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                    </div>
                    <div class="user-details">
                      <span class="user-name">{{ user.first_name }} {{ user.last_name || '' }}</span>
                      <span class="user-email">{{ user.email }}</span>
                    </div>
                  </div>
                </mat-option>
              } @empty {
                @if (!searching() && searchControl.value && searchControl.value.toString().length >= 2) {
                  <mat-option disabled>
                    <span class="no-results">No users found</span>
                  </mat-option>
                }
              }
            </mat-autocomplete>
          </mat-form-field>
        </div>

        @if (inviting()) {
          <div class="inviting-overlay">
            <mat-spinner diameter="32"></mat-spinner>
            <span>Sending invitation...</span>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .invite-container {
      padding: $spacing-lg;
      max-width: 640px;
      margin: 0 auto;
    }

    .invite-card {
      background: $primary-700 !important;
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: $spacing-xl;
    }

    .invite-header {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      margin-bottom: $spacing-xl;

      .back-button {
        color: $neutral-400;

        &:hover {
          color: $neutral-100;
        }
      }

      .invite-title {
        margin: 0;
        font-size: $font-size-xl;
        font-weight: 700;
        color: $neutral-50;
      }
    }

    .search-section {
      width: 100%;
    }

    .search-field {
      width: 100%;
    }

    .user-option {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-xs 0;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: $radius-full;
      background: $primary-600;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: $neutral-400;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
      min-width: 0;

      .user-name {
        font-weight: 600;
        font-size: $font-size-sm;
        color: $neutral-100;
      }

      .user-email {
        font-size: $font-size-xs;
        color: $neutral-500;
      }
    }

    .no-results {
      color: $neutral-500;
      font-style: italic;
    }

    .inviting-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-md;
      padding: $spacing-lg;
      color: $neutral-400;
      font-size: $font-size-sm;
    }

    @media (max-width: $breakpoint-sm) {
      .invite-container {
        padding: $spacing-md;
      }

      .invite-card {
        padding: $spacing-lg;
      }
    }
  `],
})
export class GroupInviteComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private userSearchService = inject(UserSearchService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  groupId = signal<number>(0);
  searchControl = new FormControl<string | UserSearchResult>('');
  searchResults = signal<UserSearchResult[]>([]);
  searching = signal(false);
  inviting = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.groupId.set(+idParam);
    }

    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      filter((value): value is string => typeof value === 'string'),
      filter(value => value.length >= 2),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.searching.set(true);
        return this.userSearchService.search(query);
      }),
    ).subscribe({
      next: (res) => {
        this.searching.set(false);
        if (res.success && res.data) {
          this.searchResults.set(res.data);
        } else {
          this.searchResults.set([]);
        }
      },
      error: () => {
        this.searching.set(false);
        this.searchResults.set([]);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUserSelected(event: { option: { value: UserSearchResult } }): void {
    const user = event.option.value;
    this.inviteUser(user);
  }

  private inviteUser(user: UserSearchResult): void {
    this.inviting.set(true);
    this.groupService.inviteUser(this.groupId(), user.id).subscribe({
      next: () => {
        this.inviting.set(false);
        const name = (user.first_name + ' ' + (user.last_name || '')).trim();
        this.snackBar.open('Invitation sent to ' + name, 'Close', { duration: 3000 });
        this.searchControl.setValue('');
        this.searchResults.set([]);
      },
      error: (err) => {
        this.inviting.set(false);
        const message = err?.error?.error?.message || 'Failed to send invitation';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      },
    });
  }
}
