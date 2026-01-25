import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-forgot-password',
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
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  emailControl = new FormControl('', [Validators.required, Validators.email]);
  isLoading = signal(false);
  emailSent = signal(false);

  async onSubmit(): Promise<void> {
    if (this.emailControl.invalid) return;

    this.isLoading.set(true);
    try {
      await this.authService.forgotPassword(this.emailControl.value!);
      this.emailSent.set(true);
    } catch {
      // Still show success to not reveal if email exists
      this.emailSent.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
