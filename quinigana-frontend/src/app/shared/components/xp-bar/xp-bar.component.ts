import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-xp-bar',
  standalone: true,
  template: `
    <div class="xp-bar-container">
      <div class="xp-info">
        <span class="xp-level">Nivel {{ level }}</span>
        <span class="xp-text">{{ xp }} / {{ xpForNextLevel }} XP</span>
      </div>
      <div class="xp-track">
        <div class="xp-fill" [style.width.%]="progressPercent"></div>
      </div>
    </div>
  `,
  styles: [`
    .xp-bar-container {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
    }
    .xp-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .xp-level {
      color: #c8a84b;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .xp-text {
      color: #64748b;
      font-size: 0.7rem;
    }
    .xp-track {
      width: 100%;
      height: 6px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }
    .xp-fill {
      height: 100%;
      background: linear-gradient(to right, #c8a84b, #e0c76a);
      border-radius: 3px;
      transition: width 0.4s ease;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpBarComponent {
  @Input() level = 1;
  @Input() xp = 0;
  @Input() xpForCurrentLevel = 0;
  @Input() xpForNextLevel = 50;

  get progressPercent(): number {
    const range = this.xpForNextLevel - this.xpForCurrentLevel;
    if (range <= 0) return 100;
    const progress = this.xp - this.xpForCurrentLevel;
    return Math.min(100, Math.max(0, (progress / range) * 100));
  }
}
