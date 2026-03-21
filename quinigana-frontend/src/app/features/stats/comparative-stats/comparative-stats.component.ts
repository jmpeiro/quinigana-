import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AchievementCardComponent } from '../../../shared/components/achievement-card/achievement-card.component';

@Component({
  selector: 'app-comparative-stats',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, RouterLink, DecimalPipe, AchievementCardComponent],
  template: `
    <div class="comp-container">
      <div class="page-header"><a mat-icon-button routerLink="/stats"><mat-icon>arrow_back</mat-icon></a><h1>Estadisticas Comparativas</h1></div>
      @if (loading()) { <div class="loading"><mat-spinner diameter="40"></mat-spinner></div> }
      @else if (data()) {
        <div class="percentile-card">
          <div class="pct-circle">
            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" stroke-width="8"/><circle cx="60" cy="60" r="52" fill="none" stroke="#c8a84b" stroke-width="8" [attr.stroke-dasharray]="dash(data()!.percentile)" stroke-linecap="round" transform="rotate(-90 60 60)"/></svg>
            <span class="pct-val">{{data()!.percentile | number:'1.0-0'}}%</span>
          </div>
          <p>Eres mejor que el <strong>{{data()!.percentile | number:'1.0-0'}}%</strong> de los usuarios</p>
          <p class="rank-info">Ranking #{{data()!.globalRank}} de {{data()!.totalUsers}}</p>
        </div>
        <div class="section-card"><h3><mat-icon>analytics</mat-icon> Precision por Tipo</h3>
          @for(item of [['Local (1)', data()!.predictionTypeAccuracy.home, 'home'], ['Empate (X)', data()!.predictionTypeAccuracy.draw, 'draw'], ['Visitante (2)', data()!.predictionTypeAccuracy.away, 'away']]; track item[0]) {
            <div class="bar-row"><span class="bar-label">{{item[0]}}</span><div class="bar-track"><div class="bar-fill" [class]="item[2]" [style.width.%]="item[1]"></div></div><span class="bar-val">{{item[1]}}%</span></div>
          }
        </div>
        <div class="section-card"><h3><mat-icon>local_fire_department</mat-icon> Rachas</h3>
          <div class="streak-grid">
            <div class="si"><span class="sv gold">{{data()!.streakComparison.yourBest}}</span><span class="sl">Tu mejor</span></div>
            <div class="si"><span class="sv">{{data()!.streakComparison.communityAverage | number:'1.1-1'}}</span><span class="sl">Media</span></div>
            <div class="si"><span class="sv">{{data()!.streakComparison.communityBest}}</span><span class="sl">Record</span></div>
          </div>
        </div>
        <div class="section-card"><h3><mat-icon>card_giftcard</mat-icon> Tu Tarjeta</h3><app-achievement-card /></div>
      }
    </div>
  `,
  styles: [`
    .comp-container{max-width:600px;margin:0 auto;padding:1.5rem}
    .page-header{display:flex;align-items:center;gap:8px;margin-bottom:1.5rem} .page-header h1{font-size:1.3rem;color:var(--text-primary,#1e293b);margin:0}
    .loading{display:flex;justify-content:center;padding:3rem}
    .percentile-card,.section-card{background:var(--bg-card,#fff);border-radius:16px;padding:2rem;border:1px solid var(--border-color,#e2e8f0);margin-bottom:1.5rem;text-align:center}
    .pct-circle{position:relative;width:120px;height:120px;margin:0 auto 1rem} .pct-circle svg{width:100%;height:100%}
    .pct-val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#c8a84b}
    .rank-info{font-size:0.8rem;color:var(--text-muted,#94a3b8);margin:4px 0 0}
    .section-card h3{display:flex;align-items:center;gap:8px;font-size:1rem;color:var(--text-primary,#1e293b);margin:0 0 1.5rem} .section-card h3 mat-icon{color:#c8a84b}
    .bar-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
    .bar-label{width:90px;font-size:0.8rem;color:var(--text-secondary,#64748b);text-align:right}
    .bar-track{flex:1;height:10px;background:var(--bg-secondary,#f1f5f9);border-radius:5px;overflow:hidden}
    .bar-fill{height:100%;border-radius:5px;transition:width 0.6s} .bar-fill.home{background:#22c55e} .bar-fill.draw{background:#94a3b8} .bar-fill.away{background:#ef4444}
    .bar-val{width:40px;font-size:0.8rem;font-weight:600;color:var(--text-primary,#1e293b)}
    .streak-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
    .si{text-align:center} .sv{display:block;font-size:2rem;font-weight:700;color:var(--text-primary,#1e293b)} .sv.gold{color:#c8a84b} .sl{font-size:0.75rem;color:var(--text-muted,#94a3b8)}
  `]
})
export class ComparativeStatsComponent implements OnInit {
  private http = inject(HttpClient);
  data = signal<any>(null);
  loading = signal(true);
  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/stats/me/comparative`, { withCredentials: true }).subscribe({
      next: res => { if (res.success) this.data.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
  dash(p: number): string { const c = 2*Math.PI*52; return `${(p/100)*c} ${c}`; }
}
