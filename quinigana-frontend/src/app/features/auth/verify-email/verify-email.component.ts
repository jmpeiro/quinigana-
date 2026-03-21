import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="verify-container">
      <div class="verify-card">
        <h1 class="logo">QuiniGana</h1>

        @if (state() === 'loading') {
          <div class="state-box">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Verificando tu correo electronico...</p>
          </div>
        }

        @if (state() === 'success') {
          <div class="state-box success">
            <mat-icon class="state-icon success-icon">check_circle</mat-icon>
            <h2>Email verificado</h2>
            <p>Tu correo electronico ha sido verificado correctamente. Ya puedes iniciar sesion.</p>
            <a routerLink="/auth/login" mat-flat-button class="action-btn">Iniciar Sesion</a>
          </div>
        }

        @if (state() === 'error') {
          <div class="state-box error">
            <mat-icon class="state-icon error-icon">error</mat-icon>
            <h2>Error de verificacion</h2>
            <p>{{ errorMessage() }}</p>

            <div class="resend-section">
              <p class="resend-label">Reenviar email de verificacion:</p>
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Correo electronico</mat-label>
                <input matInput [formControl]="emailControl" type="email" />
                <mat-icon matPrefix>mail</mat-icon>
              </mat-form-field>
              <button mat-flat-button class="action-btn" [disabled]="emailControl.invalid || resending()" (click)="resend()">
                @if (resending()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Reenviar email
                }
              </button>
            </div>
          </div>
        }

        @if (state() === 'resent') {
          <div class="state-box success">
            <mat-icon class="state-icon success-icon">mark_email_read</mat-icon>
            <h2>Email reenviado</h2>
            <p>Hemos enviado un nuevo enlace de verificacion a tu correo.</p>
            <a routerLink="/auth/login" mat-stroked-button class="action-btn secondary">Ir a Iniciar Sesion</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .verify-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1rem;
    }

    .verify-card {
      background: var(--bg-card, #fff);
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .logo {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #c8a84b, #dfc56a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 2rem;
    }

    .state-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 1rem 0;
    }

    .state-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    .success-icon { color: #22c55e; }
    .error-icon { color: #ef4444; }

    h2 {
      font-size: 1.3rem;
      color: var(--text-primary, #1e293b);
      margin: 0;
    }

    p {
      color: var(--text-secondary, #64748b);
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.5;
    }

    .action-btn {
      margin-top: 1rem;
      background: linear-gradient(135deg, #c8a84b 0%, #dfc56a 100%);
      color: #1e293b;
      font-weight: 600;
      min-width: 200px;
    }

    .action-btn.secondary {
      background: transparent;
      border-color: rgba(200, 168, 75, 0.5);
      color: #c8a84b;
    }

    .resend-section {
      margin-top: 1.5rem;
      width: 100%;
      border-top: 1px solid var(--border-color, #e2e8f0);
      padding-top: 1.5rem;
    }

    .resend-label {
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
    }

    .full-width { width: 100%; }

    @media (max-width: 480px) {
      .verify-card { padding: 1.5rem; }
    }
  `],
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  state = signal<'loading' | 'success' | 'error' | 'resent'>('loading');
  errorMessage = signal('El enlace de verificacion es invalido o ha expirado.');
  resending = signal(false);
  emailControl = new FormControl('', [Validators.required, Validators.email]);

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParams['token'];
    if (!token) {
      this.errorMessage.set('No se encontro el token de verificacion en el enlace.');
      this.state.set('error');
      return;
    }

    try {
      await this.authService.verifyEmail(token);
      this.state.set('success');
    } catch (err: any) {
      this.errorMessage.set(
        err?.error?.error?.message || 'El enlace de verificacion es invalido o ha expirado.'
      );
      this.state.set('error');
    }
  }

  async resend(): Promise<void> {
    if (this.emailControl.invalid) return;
    this.resending.set(true);
    try {
      await this.authService.resendVerification(this.emailControl.value!);
      this.state.set('resent');
    } catch {
      this.errorMessage.set('No se pudo reenviar el email. Intentalo de nuevo mas tarde.');
    } finally {
      this.resending.set(false);
    }
  }
}
