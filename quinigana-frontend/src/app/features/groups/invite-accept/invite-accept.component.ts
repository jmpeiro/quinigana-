import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-invite-accept',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="invite-container">
      @if (loading()) {
        <div class="invite-card">
          <mat-spinner diameter="40"></mat-spinner>
          <p class="loading-text">Cargando invitacion...</p>
        </div>
      } @else if (error()) {
        <div class="invite-card error">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h2>{{ errorTitle() }}</h2>
          <p>{{ error() }}</p>
          <button mat-flat-button color="primary" (click)="goHome()">Ir al Inicio</button>
        </div>
      } @else if (accepted()) {
        <div class="invite-card success">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h2>Te has unido al grupo</h2>
          <p>Ahora eres miembro de <strong>{{ groupName() }}</strong></p>
          <button mat-flat-button color="primary" (click)="goToGroup()">Ver Grupo</button>
        </div>
      } @else {
        <div class="invite-card">
          <mat-icon class="invite-icon">group_add</mat-icon>
          <h2>Invitacion a Grupo</h2>
          <div class="group-info">
            <h3>{{ groupName() }}</h3>
            @if (groupDescription()) {
              <p class="description">{{ groupDescription() }}</p>
            }
            <div class="meta">
              <span><mat-icon>people</mat-icon> {{ memberCount() }} miembros</span>
            </div>
          </div>
          <button mat-flat-button color="primary" (click)="accept()" [disabled]="accepting()">
            {{ accepting() ? 'Uniendose...' : 'Unirse al Grupo' }}
          </button>
          @if (!isAuthenticated()) {
            <p class="login-hint">Debes iniciar sesion para unirte</p>
            <button mat-stroked-button (click)="goToLogin()">Iniciar Sesion</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .invite-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 1.5rem; background: #f8f9fb; }
    .invite-card { background: #fff; border-radius: 16px; padding: 2rem; text-align: center; max-width: 400px; width: 100%; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .invite-card h2 { color: #1e293b; font-size: 1.3rem; margin: 1rem 0 0.5rem; }
    .invite-card p { color: #64748b; font-size: 0.9rem; margin: 0.5rem 0; }
    .invite-icon, .success-icon, .error-icon { font-size: 48px; width: 48px; height: 48px; }
    .invite-icon { color: #c8a84b; }
    .success-icon { color: #4caf50; }
    .error-icon { color: #ef5350; }
    .group-info { background: #f1f5f9; border-radius: 12px; padding: 1rem; margin: 1.5rem 0; }
    .group-info h3 { color: #1e293b; font-size: 1.1rem; margin: 0 0 0.5rem; }
    .group-info .description { color: #64748b; font-size: 0.85rem; }
    .group-info .meta { display: flex; justify-content: center; gap: 1rem; margin-top: 0.75rem; color: #64748b; font-size: 0.8rem; }
    .group-info .meta mat-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; }
    .loading-text { color: #64748b; margin-top: 1rem; }
    .login-hint { color: #ff9800; font-size: 0.8rem; margin-top: 1rem; }
    button { margin-top: 1rem; }
    .invite-card.error h2 { color: #ef5350; }
    .invite-card.success h2 { color: #4caf50; }
  `],
})
export class InviteAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);

  loading = signal(true);
  error = signal<string | null>(null);
  errorTitle = signal('Error');
  accepted = signal(false);
  accepting = signal(false);
  groupName = signal('');
  groupDescription = signal<string | null>(null);
  memberCount = signal(0);
  isAuthenticated = this.authService.isAuthenticated;

  private token = '';
  private groupId = 0;

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    this.loadInfo();
  }

  loadInfo(): void {
    this.groupService.getInviteLinkInfo(this.token).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.groupName.set(res.data.groupName);
          this.groupDescription.set(res.data.groupDescription);
          this.memberCount.set(res.data.memberCount);
        }
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error?.message || 'Enlace no valido o expirado';
        this.errorTitle.set('Enlace no disponible');
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  accept(): void {
    if (!this.isAuthenticated()) {
      this.goToLogin();
      return;
    }
    this.accepting.set(true);
    this.groupService.acceptInviteLink(this.token).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.groupId = res.data.groupId;
          this.accepted.set(true);
        }
        this.accepting.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error?.message || 'No se pudo unir al grupo';
        this.error.set(msg);
        this.accepting.set(false);
      },
    });
  }

  goToGroup(): void {
    this.router.navigate(['/groups', this.groupId]);
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
