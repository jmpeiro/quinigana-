import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { ApiResponse, User } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AvatarPickerComponent, AvatarPickerResult } from '../../shared/components/avatar-picker/avatar-picker.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  pushService = inject(PushNotificationService);
  themeService = inject(ThemeService);

  user = this.authService.currentUser;
  isEditing = signal(false);
  isSaving = signal(false);
  isUploadingAvatar = signal(false);
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);
  showPasswordSection = signal(false);

  canChangePassword = computed(() => {
    const u = this.user();
    return u?.auth_provider === 'local' || u?.auth_provider === 'both';
  });

  profileForm = new FormGroup({
    first_name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    last_name: new FormControl('', [Validators.maxLength(100)]),
  });

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    ]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  get initials(): string {
    const u = this.user();
    if (!u) return '?';
    return (u.first_name[0] + (u.last_name?.[0] || '')).toUpperCase();
  }

  get avatarUrl(): string | null {
    const u = this.user();
    if (!u?.avatar_url) return null;
    if (u.avatar_url.startsWith('http')) return u.avatar_url;
    return environment.apiUrl.replace('/api', '') + u.avatar_url;
  }

  get passwordsMatch(): boolean {
    return this.passwordForm.value.newPassword === this.passwordForm.value.confirmPassword;
  }

  startEditing(): void {
    const u = this.user();
    if (u) {
      this.profileForm.patchValue({
        first_name: u.first_name,
        last_name: u.last_name || '',
      });
    }
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    try {
      const response = await firstValueFrom(
        this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, this.profileForm.value, { withCredentials: true })
      );
      if (response.success && response.data) {
        this.authService.currentUser.set(response.data);
        this.isEditing.set(false);
        this.snackBar.open('Profile updated', 'OK', { duration: 3000 });
      }
    } catch {
      this.snackBar.open('Failed to update profile', 'Close', { duration: 5000 });
    } finally {
      this.isSaving.set(false);
    }
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('Image must be less than 2MB', 'Close', { duration: 4000 });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.snackBar.open('Only JPEG, PNG, and WebP images are allowed', 'Close', { duration: 4000 });
      return;
    }

    this.uploadAvatar(file);
  }

  async uploadAvatar(file: File): Promise<void> {
    this.isUploadingAvatar.set(true);
    try {
      await this.authService.uploadAvatar(file);
      this.snackBar.open('Avatar updated', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to upload avatar', 'Close', { duration: 5000 });
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  async removeAvatar(): Promise<void> {
    this.isUploadingAvatar.set(true);
    try {
      await this.authService.deleteAvatar();
      this.snackBar.open('Avatar removed', 'OK', { duration: 3000 });
    } catch {
      this.snackBar.open('Failed to remove avatar', 'Close', { duration: 5000 });
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  togglePasswordSection(): void {
    this.showPasswordSection.update(v => !v);
    if (!this.showPasswordSection()) {
      this.passwordForm.reset();
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid || !this.passwordsMatch) return;

    this.isChangingPassword.set(true);
    try {
      await this.authService.changePassword(
        this.passwordForm.value.currentPassword!,
        this.passwordForm.value.newPassword!
      );
      this.snackBar.open('Password changed successfully', 'OK', { duration: 3000 });
      this.passwordForm.reset();
      this.showPasswordSection.set(false);
    } catch {
      this.snackBar.open('Failed to change password. Check your current password.', 'Close', { duration: 5000 });
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  openDeleteDialog(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Cuenta',
        message: 'Esta accion no se puede deshacer. Tu cuenta sera desactivada permanentemente.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    ref.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      this.isDeletingAccount.set(true);
      try {
        await this.authService.deleteAccount();
        this.snackBar.open('Account deleted', 'OK', { duration: 3000 });
      } catch {
        this.snackBar.open('Failed to delete account', 'Close', { duration: 5000 });
        this.isDeletingAccount.set(false);
      }
    });
  }

  async togglePush(): Promise<void> {
    if (this.pushService.isSubscribed()) {
      const success = await this.pushService.unsubscribe();
      if (success) {
        this.snackBar.open('Notificaciones push desactivadas', 'OK', { duration: 3000 });
      }
    } else {
      const success = await this.pushService.subscribe();
      if (success) {
        this.snackBar.open('Notificaciones push activadas', 'OK', { duration: 3000 });
      } else if (Notification.permission === 'denied') {
        this.snackBar.open('Permisos bloqueados. Activalos en la configuracion del navegador.', 'Cerrar', { duration: 6000 });
      } else {
        this.snackBar.open('No se pudo activar las notificaciones push', 'Cerrar', { duration: 5000 });
      }
    }
  }

  // Language
  currentLang = signal<'es' | 'en'>(
    (localStorage.getItem('quinigana-lang') as 'es' | 'en') || 'es'
  );

  setLang(lang: 'es' | 'en'): void {
    localStorage.setItem('quinigana-lang', lang);
    this.currentLang.set(lang);
    this.snackBar.open(
      lang === 'es' ? 'Idioma cambiado a Espanol' : 'Language changed to English',
      'OK',
      { duration: 3000 }
    );
  }

  openAvatarPicker(): void {
    const u = this.user();
    if (!u) return;

    const ref = this.dialog.open(AvatarPickerComponent, {
      data: { userName: `${u.first_name} ${u.last_name || ''}`.trim() },
      width: '420px',
    });

    ref.afterClosed().subscribe(async (result: AvatarPickerResult | null) => {
      if (result?.file) {
        await this.uploadAvatar(result.file);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
