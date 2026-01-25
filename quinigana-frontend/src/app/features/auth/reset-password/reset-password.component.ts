import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PasswordStrengthComponent } from '../../../shared/components/password-strength/password-strength.component';
import { passwordMatchValidator, strongPasswordValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    PasswordStrengthComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);
  resetSuccess = signal(false);
  hidePassword = signal(true);
  private token = '';

  resetForm = new FormGroup(
    {
      password: new FormControl('', [Validators.required, strongPasswordValidator()]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') }
  );

  get passwordValue(): string {
    return this.resetForm.get('password')?.value || '';
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
  }

  togglePassword(): void {
    this.hidePassword.update((v) => !v);
  }

  async onSubmit(): Promise<void> {
    if (this.resetForm.invalid || !this.token) return;

    this.isLoading.set(true);
    try {
      await this.authService.resetPassword(this.token, this.resetForm.value.password!);
      this.resetSuccess.set(true);
    } catch (error: any) {
      const message = error?.error?.error?.message || 'Reset failed. The link may have expired.';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.isLoading.set(false);
    }
  }
}
