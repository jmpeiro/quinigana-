import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ApiResponse } from '../models/user.model';
import { NotificationsResponse } from '../models/notification.model';
import { PushNotificationService } from './push-notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private http = inject(HttpClient);
  private pushService = inject(PushNotificationService);
  private apiUrl = environment.apiUrl;
  private pollingTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = 60000;
  private consecutiveErrors = 0;
  private readonly MAX_ERRORS = 5;
  private readonly BASE_DELAY = 60000;
  private readonly MAX_DELAY = 300000;

  unreadCount = signal(0);

  startPolling(): void {
    this.consecutiveErrors = 0;
    this.retryDelay = this.BASE_DELAY;
    this.fetchUnreadCount();
    this.pushService.checkStatus();
  }

  stopPolling(): void {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
      this.pollingTimeout = null;
    }
    this.consecutiveErrors = 0;
    this.retryDelay = this.BASE_DELAY;
    this.unreadCount.set(0);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private scheduleNext(): void {
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
    }
    this.pollingTimeout = setTimeout(() => this.fetchUnreadCount(), this.retryDelay);
  }

  private fetchUnreadCount(): void {
    this.http.get<ApiResponse<{ count: number }>>(`${this.apiUrl}/notifications/unread-count`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.unreadCount.set(response.data.count);
        }
        this.consecutiveErrors = 0;
        this.retryDelay = this.BASE_DELAY;
        this.scheduleNext();
      },
      error: () => {
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= this.MAX_ERRORS) {
          return; // Stop polling after too many consecutive errors
        }
        this.retryDelay = Math.min(this.retryDelay * 2, this.MAX_DELAY);
        this.scheduleNext();
      },
    });
  }

  getNotifications(page: number, limit: number = 20): Observable<ApiResponse<NotificationsResponse>> {
    return this.http.get<ApiResponse<NotificationsResponse>>(`${this.apiUrl}/notifications?page=${page}&limit=${limit}`);
  }

  markAsRead(notificationId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/notifications/read-all`, {});
  }
}
