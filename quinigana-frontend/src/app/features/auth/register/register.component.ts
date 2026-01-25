import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = this.authService.isLoading;
  hidePassword = signal(true);
  hideConfirm = signal(true);

  registerForm = new FormGroup(
    {
      first_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      last_name: new FormControl('', [Validators.maxLength(100)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, strongPasswordValidator()]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') }
  );

  get passwordValue(): string {
    return this.registerForm.get('password')?.value || '';
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) return;

    try {
      await this.authService.register({
        email: this.registerForm.value.email!,
        password: this.registerForm.value.password!,
        first_name: this.registerForm.value.first_name!,
        last_name: this.registerForm.value.last_name || undefined,
      });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      const message = error?.error?.error?.message || 'Registration failed. Please try again.';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    }
  }

  togglePassword(): void {
    this.hidePassword.update((v) => !v);
  }

  toggleConfirm(): void {
    this.hideConfirm.update((v) => !v);
  }

  loginWithGoogle(): void {
    this.authService.googleLogin();
  }
}
