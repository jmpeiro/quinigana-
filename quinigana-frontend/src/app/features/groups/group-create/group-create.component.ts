import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { GroupService } from '../../../core/services/group.service';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="create-container">
      <mat-card class="create-card">
        <mat-card-header>
          <mat-card-title>Create New Group</mat-card-title>
          <mat-card-subtitle>Set up a new group for your quiniela</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Group Name</mat-label>
              <input matInput formControlName="name" placeholder="Enter group name" />
              <mat-icon matPrefix>group</mat-icon>
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <mat-error>Group name is required</mat-error>
              }
              @if (form.get('name')?.hasError('minlength') && form.get('name')?.touched) {
                <mat-error>Name must be at least 2 characters</mat-error>
              }
              @if (form.get('name')?.hasError('maxlength') && form.get('name')?.touched) {
                <mat-error>Name cannot exceed 100 characters</mat-error>
              }
              <mat-hint align="end">{{ form.get('name')?.value?.length || 0 }} / 100</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                formControlName="description"
                placeholder="Describe your group (optional)"
                rows="4"
              ></textarea>
              <mat-icon matPrefix>description</mat-icon>
              @if (form.get('description')?.hasError('maxlength') && form.get('description')?.touched) {
                <mat-error>Description cannot exceed 500 characters</mat-error>
              }
              <mat-hint align="end">{{ form.get('description')?.value?.length || 0 }} / 500</mat-hint>
            </mat-form-field>

            <div class="actions">
              <button
                mat-stroked-button
                type="button"
                class="cancel-btn"
                (click)="onCancel()"
                [disabled]="submitting()"
              >
                Cancel
              </button>

              <button
                mat-raised-button
                type="submit"
                class="submit-btn"
                [disabled]="form.invalid || submitting()"
              >
                @if (submitting()) {
                  <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
                  Creating...
                } @else {
                  <mat-icon>add_circle</mat-icon>
                  Create Group
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 48px 24px;
      min-height: 100vh;
      background-color: #f8f9fb;
    }

    .create-card {
      width: 100%;
      max-width: 560px;
      background-color: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;

      mat-card-header {
        margin-bottom: 24px;

        mat-card-title {
          color: #1e293b;
          font-size: 24px;
          font-weight: 600;
        }

        mat-card-subtitle {
          color: #64748b;
          margin-top: 4px;
        }
      }

      mat-card-content {
        padding-top: 8px;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;

      ::ng-deep {
        .mat-mdc-text-field-wrapper {
          background-color: #f8f9fb;
        }

        .mat-mdc-form-field-focus-overlay {
          background-color: transparent;
        }

        .mdc-text-field--outlined .mdc-notched-outline__leading,
        .mdc-text-field--outlined .mdc-notched-outline__notch,
        .mdc-text-field--outlined .mdc-notched-outline__trailing {
          border-color: #e2e8f0;
        }

        .mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover
          .mdc-notched-outline
          .mdc-notched-outline__leading,
        .mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover
          .mdc-notched-outline
          .mdc-notched-outline__notch,
        .mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover
          .mdc-notched-outline
          .mdc-notched-outline__trailing {
          border-color: #c8a84b;
        }

        .mat-mdc-input-element {
          color: #1e293b;
        }

        .mat-mdc-form-field-icon-prefix {
          color: #64748b;
          padding-right: 8px;
        }

        mat-label {
          color: #64748b;
        }

        .mat-mdc-form-field-hint {
          color: #94a3b8;
        }
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .cancel-btn {
      color: #64748b;
      border-color: #e2e8f0;

      &:hover:not(:disabled) {
        border-color: #94a3b8;
      }
    }

    .submit-btn {
      background-color: #c8a84b;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;

      &:disabled {
        opacity: 0.6;
      }

      .btn-spinner {
        display: inline-block;

        ::ng-deep circle {
          stroke: #fff;
        }
      }
    }
  `],
})
export class GroupCreateComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal<boolean>(false);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);

    const { name, description } = this.form.value;

    this.groupService.createGroup({ name, description }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snackBar.open('Group created successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar'],
        });
        this.router.navigate(['/groups']);
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Failed to create group. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/groups']);
  }
}
