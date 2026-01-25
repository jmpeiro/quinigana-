import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="skeleton" [class]="variant()" [style.width]="width()" [style.height]="height()" [style.border-radius]="borderRadius()"></div>`,
  styles: [`
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .skeleton {
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite ease-in-out;

      &.text {
        border-radius: 4px;
      }

      &.card {
        border-radius: 12px;
      }

      &.circle {
        border-radius: 50%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  width = input('100%');
  height = input('1rem');
  borderRadius = input('8px');
  variant = input<'text' | 'card' | 'circle'>('text');
}
