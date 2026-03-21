import { Injectable, signal } from '@angular/core';

export type Platform = 'web' | 'android' | 'ios';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  platform = signal<Platform>(this.detectPlatform());
  isNative = signal(this.detectPlatform() !== 'web');
  isMobile = signal(window.innerWidth < 768);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
  }

  private detectPlatform(): Platform {
    const ua = navigator.userAgent.toLowerCase();
    if ((window as any).Capacitor?.isNativePlatform()) {
      if (ua.includes('android')) return 'android';
      if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    }
    return 'web';
  }
}
