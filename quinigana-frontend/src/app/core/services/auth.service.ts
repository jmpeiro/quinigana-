import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TokenService } from './token.service';
import { NotificationService } from './notification.service';
import { User, AuthResponse, RefreshResponse, RegisterDto, LoginDto, ApiResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private injector = inject(Injector);

  private get notificationService(): NotificationService {
    return this.injector.get(NotificationService);
  }

  currentUser = signal<User | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());
  isLoading = signal(false);
  initialized = signal(false);
  private loggedOut = false;

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  async register(data: RegisterDto): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data, { withCredentials: true })
      );
      this.handleAuthResponse(response);
    } finally {
      this.isLoading.set(false);
    }
  }

  async login(data: LoginDto): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, data, { withCredentials: true })
      );
      this.handleAuthResponse(response);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshToken(): Promise<boolean> {
    if (this.loggedOut) {
      return false;
    }
    try {
      const response = await firstValueFrom(
        this.http.post<RefreshResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      );
      if (response.success && response.data.accessToken) {
        this.tokenService.setAccessToken(response.data.accessToken);
        this.scheduleRefresh(response.data.accessToken);
        return true;
      }
      return false;
    } catch {
      this.clearSession();
      return false;
    }
  }

  async logout(): Promise<void> {
    this.loggedOut = true;
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      );
    } catch {
      // Logout even if API call fails
    } finally {
      this.clearSession();
      this.router.navigate(['/auth/login']);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse>(`${environment.apiUrl}/auth/password/forgot`, { email })
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse>(`${environment.apiUrl}/auth/password/reset`, { token, password })
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponse>(`${environment.apiUrl}/auth/password/change`, { currentPassword, newPassword }, { withCredentials: true })
    );
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await firstValueFrom(
      this.http.post<ApiResponse<User>>(`${environment.apiUrl}/users/me/avatar`, formData, { withCredentials: true })
    );
    if (response.success && response.data) {
      this.currentUser.set(response.data);
      return response.data;
    }
    throw new Error('Failed to upload avatar');
  }

  async deleteAvatar(): Promise<void> {
    const response = await firstValueFrom(
      this.http.delete<ApiResponse<User>>(`${environment.apiUrl}/users/me/avatar`, { withCredentials: true })
    );
    if (response.success && response.data) {
      this.currentUser.set(response.data);
    }
  }

  async deleteAccount(): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiResponse>(`${environment.apiUrl}/users/me`, { withCredentials: true })
    );
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  async loadProfile(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/me`, { withCredentials: true })
      );
      if (response.success && response.data) {
        this.currentUser.set(response.data);
        this.notificationService.startPolling();
      }
    } catch {
      this.clearSession();
    }
  }

  async tryAutoLogin(): Promise<void> {
    try {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        await this.loadProfile();
      }
    } finally {
      this.initialized.set(true);
    }
  }

  googleLogin(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  handleGoogleCallback(token: string): void {
    this.tokenService.setAccessToken(token);
    this.scheduleRefresh(token);
    this.loadProfile();
  }

  private handleAuthResponse(response: AuthResponse): void {
    if (response.success) {
      this.loggedOut = false;
      this.tokenService.setAccessToken(response.data.accessToken);
      this.currentUser.set(response.data.user);
      this.scheduleRefresh(response.data.accessToken);
      this.notificationService.startPolling();
    }
  }

  private scheduleRefresh(token: string): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryMs = payload.exp * 1000;
      const refreshAt = expiryMs - Date.now() - 60000; // Refresh 1 min before expiry

      if (refreshAt > 0) {
        this.refreshTimer = setTimeout(() => this.refreshToken(), refreshAt);
      }
    } catch {
      // Token parsing failed
    }
  }

  private clearSession(): void {
    this.tokenService.clearAccessToken();
    this.currentUser.set(null);
    this.notificationService.stopPolling();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
