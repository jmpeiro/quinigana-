import { Component, Input, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-share-button',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="shareMenu" [matTooltip]="'Compartir'" class="share-btn">
      <mat-icon>share</mat-icon>
    </button>
    <mat-menu #shareMenu="matMenu">
      @if (hasNativeShare) {
        <button mat-menu-item (click)="nativeShare()">
          <mat-icon>phone_android</mat-icon>
          <span>Compartir</span>
        </button>
      }
      <button mat-menu-item (click)="shareWhatsApp()">
        <mat-icon>chat</mat-icon>
        <span>WhatsApp</span>
      </button>
      <button mat-menu-item (click)="shareTwitter()">
        <mat-icon>tag</mat-icon>
        <span>Twitter / X</span>
      </button>
      <button mat-menu-item (click)="shareTelegram()">
        <mat-icon>send</mat-icon>
        <span>Telegram</span>
      </button>
      <button mat-menu-item (click)="copyLink()">
        <mat-icon>content_copy</mat-icon>
        <span>Copiar enlace</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .share-btn { color: var(--text-secondary, #64748b); }
    .share-btn:hover { color: #c8a84b; }
  `],
})
export class ShareButtonComponent {
  @Input() text = '';
  @Input() url = '';
  @Input() title = 'QuiniGana';

  private snackBar = inject(MatSnackBar);

  get hasNativeShare(): boolean {
    return !!navigator.share;
  }

  private get shareUrl(): string {
    return this.url || window.location.href;
  }

  private get shareText(): string {
    return this.text || this.title;
  }

  async nativeShare(): Promise<void> {
    try {
      await navigator.share({
        title: this.title,
        text: this.shareText,
        url: this.shareUrl,
      });
    } catch { /* user cancelled */ }
  }

  shareWhatsApp(): void {
    const msg = encodeURIComponent(`${this.shareText} ${this.shareUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  shareTwitter(): void {
    const text = encodeURIComponent(this.shareText);
    const url = encodeURIComponent(this.shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  shareTelegram(): void {
    const url = encodeURIComponent(this.shareUrl);
    const text = encodeURIComponent(this.shareText);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.shareUrl);
      this.snackBar.open('Enlace copiado', 'OK', { duration: 2000 });
    } catch {
      this.snackBar.open('No se pudo copiar', 'OK', { duration: 2000 });
    }
  }
}
