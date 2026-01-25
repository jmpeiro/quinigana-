import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  isSupported = signal(false);
  isSubscribed = signal(false);
  permissionState = signal<NotificationPermission>('default');
  isLoading = signal(false);

  constructor() {
    this.isSupported.set(this.swPush.isEnabled);

    if (this.swPush.isEnabled) {
      this.permissionState.set(Notification.permission);

      this.swPush.subscription.subscribe(sub => {
        this.isSubscribed.set(!!sub);
      });

      this.swPush.notificationClicks.subscribe(event => {
        const url = event.notification?.data?.url;
        if (url) {
          window.open(url, '_self');
        }
      });
    }
  }

  async checkStatus(): Promise<void> {
    if (!this.swPush.isEnabled) return;

    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<{ subscribed: boolean }>>(`${this.apiUrl}/push/status`)
      );
      if (response.success && response.data) {
        this.isSubscribed.set(response.data.subscribed);
      }
    } catch {
      // Push is an enhancement - fail silently
    }
  }

  async subscribe(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;

    this.isLoading.set(true);
    try {
      const keyResponse = await firstValueFrom(
        this.http.get<ApiResponse<{ publicKey: string }>>(`${this.apiUrl}/push/vapid-public-key`)
      );

      if (!keyResponse.success || !keyResponse.data?.publicKey) {
        return false;
      }

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: keyResponse.data.publicKey,
      });

      const subJson = subscription.toJSON();
      await firstValueFrom(
        this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/push/subscribe`, {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent,
        })
      );

      this.isSubscribed.set(true);
      this.permissionState.set(Notification.permission);
      return true;
    } catch {
      this.permissionState.set(Notification.permission);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;

    this.isLoading.set(true);
    try {
      const sub = await firstValueFrom(this.swPush.subscription);

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        await firstValueFrom(
          this.http.request<ApiResponse<unknown>>('DELETE', `${this.apiUrl}/push/unsubscribe`, {
            body: { endpoint },
          })
        );
      }

      this.isSubscribed.set(false);
      return true;
    } catch {
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }
}
