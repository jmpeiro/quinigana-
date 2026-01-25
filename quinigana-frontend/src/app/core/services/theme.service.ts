import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'quinigana-theme';

  isDarkMode = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved === 'dark') {
        this.isDarkMode.set(true);
      } else if (saved === 'light') {
        this.isDarkMode.set(false);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode.set(prefersDark);
      }

      effect(() => {
        this.applyTheme(this.isDarkMode());
      });

      this.applyTheme(this.isDarkMode());
    }
  }

  toggle(): void {
    this.isDarkMode.update(v => !v);
  }

  setTheme(dark: boolean): void {
    this.isDarkMode.set(dark);
  }

  private applyTheme(dark: boolean): void {
    const mode: ThemeMode = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }
}
