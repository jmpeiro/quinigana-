import { Injectable, signal } from '@angular/core';

interface CachedPrediction {
  jornadaId: number;
  jornadaName: string;
  predictions: Array<{ matchId: number; prediction: string; homeScore?: number; awayScore?: number }>;
  cachedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly STORAGE_KEY = 'quinigana-offline-data';
  isOnline = signal(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  cachePredictions(data: CachedPrediction): void {
    const cache = this.getCache();
    if (!cache.predictions) cache.predictions = {};
    cache.predictions[data.jornadaId] = data;
    this.saveCache(cache);
  }

  getCachedPredictions(jornadaId: number): CachedPrediction | null {
    const cache = this.getCache();
    return cache.predictions?.[jornadaId] || null;
  }

  cacheJornadas(jornadas: any[]): void {
    const cache = this.getCache();
    cache.jornadas = jornadas;
    cache.jornadasCachedAt = new Date().toISOString();
    this.saveCache(cache);
  }

  getCachedJornadas(): any[] | null {
    return this.getCache().jornadas || null;
  }

  cacheDashboard(data: any): void {
    const cache = this.getCache();
    cache.dashboard = data;
    cache.dashboardCachedAt = new Date().toISOString();
    this.saveCache(cache);
  }

  getCachedDashboard(): any | null {
    return this.getCache().dashboard || null;
  }

  private getCache(): any {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch { return {}; }
  }

  private saveCache(cache: any): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch { /* storage full */ }
  }
}
