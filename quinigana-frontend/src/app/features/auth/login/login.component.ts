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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = this.authService.isLoading;
  hidePassword = signal(true);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false),
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    try {
      await this.authService.login({
        email: this.loginForm.value.email!,
        password: this.loginForm.value.password!,
        rememberMe: this.loginForm.value.rememberMe ?? false,
      });
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      const message = error?.error?.error?.message || 'Error al iniciar sesion. Intenta de nuevo.';
      this.snackBar.open(message, 'Cerrar', { duration: 5000 });
    }
  }

  loginWithGoogle(): void {
    this.authService.googleLogin();
  }

  togglePassword(): void {
    this.hidePassword.update((v) => !v);
  }
}
