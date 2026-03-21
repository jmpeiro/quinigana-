import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-achievement-card',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (data()) {
      <div class="card-preview" [innerHTML]="generateSVG()"></div>
      <div class="card-actions">
        <button mat-stroked-button (click)="downloadImage()"><mat-icon>download</mat-icon> Descargar</button>
        <button mat-stroked-button (click)="shareCard()"><mat-icon>share</mat-icon> Compartir</button>
      </div>
    }
  `,
  styles: [`:host{display:block} .card-preview{text-align:center;margin-bottom:1rem} .card-preview :deep(svg){max-width:100%;height:auto;border-radius:16px} .card-actions{display:flex;gap:8px;justify-content:center}`]
})
export class AchievementCardComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  data = signal<any>(null);

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/share/stats-card`, { withCredentials: true }).subscribe({
      next: res => { if (res.success) this.data.set(res.data); }
    });
  }

  generateSVG(): string {
    const d = this.data(); if (!d) return '';
    const s = d.stats;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0f172a"/><stop offset="100%" style="stop-color:#1e293b"/></linearGradient></defs><rect width="600" height="360" rx="20" fill="url(#bg)"/><text x="300" y="45" fill="#c8a84b" font-family="Arial" font-size="26" font-weight="bold" text-anchor="middle">QuiniGana</text><text x="300" y="85" fill="white" font-family="Arial" font-size="22" font-weight="bold" text-anchor="middle">${d.user.first_name} ${d.user.last_name||''}</text><text x="120" y="150" fill="#c8a84b" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle">${s.totalPoints}</text><text x="120" y="175" fill="#94a3b8" font-family="Arial" font-size="13" text-anchor="middle">Puntos</text><text x="300" y="150" fill="#c8a84b" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle">#${s.rank}</text><text x="300" y="175" fill="#94a3b8" font-family="Arial" font-size="13" text-anchor="middle">Ranking</text><text x="480" y="150" fill="#c8a84b" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle">Nv.${s.level}</text><text x="480" y="175" fill="#94a3b8" font-family="Arial" font-size="13" text-anchor="middle">Nivel</text><text x="300" y="335" fill="#475569" font-family="Arial" font-size="12" text-anchor="middle">quinigana.com</text></svg>`;
  }

  async downloadImage(): Promise<void> {
    const svg = this.generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 360;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      canvas.toBlob(b => { if(b){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='quinigana-stats.png';a.click();} });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async shareCard(): Promise<void> {
    if (navigator.share) { try { await navigator.share({ title:'QuiniGana Stats', url:window.location.origin }); } catch{} }
    else { await navigator.clipboard.writeText(window.location.origin+'/stats'); this.snackBar.open('Enlace copiado','OK',{duration:2000}); }
  }
}
