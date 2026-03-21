import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type SupportedLang = 'es' | 'en';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'quinigana-lang';

  currentLang = signal<SupportedLang>(this.getSavedLang());
  private translations: Record<string, any> = {};

  private getSavedLang(): SupportedLang {
    const saved = localStorage.getItem(this.STORAGE_KEY) as SupportedLang;
    if (saved === 'en' || saved === 'es') return saved;
    const browserLang = navigator.language.substring(0, 2);
    return browserLang === 'en' ? 'en' : 'es';
  }

  async init(): Promise<void> {
    await this.loadTranslations(this.currentLang());
  }

  async setLang(lang: SupportedLang): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.currentLang.set(lang);
    await this.loadTranslations(lang);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = this.translations;
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value !== 'string') return key;
    if (params) {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{${param}}`, String(val));
      });
    }
    return value;
  }

  private async loadTranslations(lang: SupportedLang): Promise<void> {
    try {
      this.translations = await firstValueFrom(
        this.http.get<Record<string, any>>(`/assets/i18n/${lang}.json`)
      );
    } catch {
      this.translations = {};
    }
  }
}
