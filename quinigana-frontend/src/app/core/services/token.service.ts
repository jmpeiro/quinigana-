import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken = signal<string | null>(null);

  getAccessToken(): string | null {
    return this.accessToken();
  }

  setAccessToken(token: string): void {
    this.accessToken.set(token);
  }

  clearAccessToken(): void {
    this.accessToken.set(null);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryMs = payload.exp * 1000;
      return Date.now() >= expiryMs - 30000; // 30s buffer
    } catch {
      return true;
    }
  }

  getTokenPayload(token: string): { userId: number; email: string; provider: string } | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}
