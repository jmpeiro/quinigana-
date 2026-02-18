import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SwPush } from '@angular/service-worker';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        NotificationService,
        {
          provide: SwPush,
          useValue: {
            isEnabled: false,
            subscription: { subscribe: jest.fn() },
            notificationClicks: { subscribe: jest.fn() },
          },
        },
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service?.stopPolling();
    httpMock.verify();
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with unreadCount 0', () => {
    expect(service.unreadCount()).toBe(0);
  });

  it('should update unreadCount on successful poll', () => {
    service.startPolling();

    const req = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req.flush({ success: true, data: { count: 5 } });

    expect(service.unreadCount()).toBe(5);
  });

  it('should reset unreadCount on stopPolling', () => {
    service.startPolling();

    const req = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req.flush({ success: true, data: { count: 3 } });

    expect(service.unreadCount()).toBe(3);
    service.stopPolling();
    expect(service.unreadCount()).toBe(0);
  });

  it('should schedule next poll after success with base delay', () => {
    service.startPolling();

    const req1 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req1.flush({ success: true, data: { count: 1 } });

    // After 60 seconds, the next poll fires
    jest.advanceTimersByTime(60000);
    const req2 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req2.flush({ success: true, data: { count: 2 } });

    expect(service.unreadCount()).toBe(2);
  });

  it('should apply exponential backoff on errors', () => {
    service.startPolling();

    // First poll fails - retryDelay becomes 120s
    const req1 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req1.error(new ProgressEvent('error'));

    // After 120s (60s * 2), next poll fires
    jest.advanceTimersByTime(120000);
    const req2 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req2.error(new ProgressEvent('error'));

    // After 240s (120s * 2), next poll fires
    jest.advanceTimersByTime(240000);
    const req3 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req3.flush({ success: true, data: { count: 0 } });
  });

  it('should stop polling after 5 consecutive errors', () => {
    service.startPolling();

    // Fail 5 times with increasing backoff
    const req1 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req1.error(new ProgressEvent('error')); // delay -> 120s
    jest.advanceTimersByTime(120000);

    const req2 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req2.error(new ProgressEvent('error')); // delay -> 240s
    jest.advanceTimersByTime(240000);

    const req3 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req3.error(new ProgressEvent('error')); // delay -> 300s (capped)
    jest.advanceTimersByTime(300000);

    const req4 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req4.error(new ProgressEvent('error')); // delay -> 300s (capped)
    jest.advanceTimersByTime(300000);

    const req5 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    req5.error(new ProgressEvent('error')); // 5th error - stops

    // After 5 errors, no more requests should be made
    jest.advanceTimersByTime(600000);
    httpMock.expectNone(r => r.url.includes('/notifications/unread-count'));
  });

  it('should reset delay after a successful response', () => {
    service.startPolling();

    // First poll fails
    const r1 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    r1.error(new ProgressEvent('error'));

    // Backoff: 120s
    jest.advanceTimersByTime(120000);

    // Second poll succeeds - resets delay to 60s
    const r2 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    r2.flush({ success: true, data: { count: 0 } });

    // Next poll should be at base delay (60s)
    jest.advanceTimersByTime(60000);
    const r3 = httpMock.expectOne(r => r.url.includes('/notifications/unread-count'));
    r3.flush({ success: true, data: { count: 0 } });
  });
});
