import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BadgeDefinition, UserBadgeWithDetails } from '../../../core/models/gamification.model';

interface DisplayBadge {
  definition: BadgeDefinition;
  earned: boolean;
  earnedAt: string | null;
}

@Component({
  selector: 'app-badge-grid',
  standalone: true,
  imports: [MatIconModule, MatSnackBarModule],
  template: `
    <div class="badge-grid">
      @for (item of displayBadges; track item.definition.id) {
        <div class="badge-item"
          [class.earned]="item.earned"
          [class.bronze]="item.earned && item.definition.tier === 'bronze'"
          [class.silver]="item.earned && item.definition.tier === 'silver'"
          [class.gold]="item.earned && item.definition.tier === 'gold'"
          [class.platinum]="item.earned && item.definition.tier === 'platinum'"
          (click)="showBadgeInfo(item)">
          <mat-icon>{{ item.definition.icon }}</mat-icon>
        </div>
      }
    </div>
  `,
  styles: [`
    .badge-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
      gap: 8px;
    }
    .badge-item {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .badge-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #cbd5e1;
    }
    .badge-item.earned mat-icon { color: inherit; }
    .badge-item.earned {
      background: #fff;
      border: 2px solid currentColor;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    .badge-item.earned:hover { transform: scale(1.1); }
    .badge-item.bronze { color: #a1887f; }
    .badge-item.silver { color: #94a3b8; }
    .badge-item.gold { color: #c8a84b; }
    .badge-item.platinum { color: #7c3aed; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeGridComponent {
  @Input() badges: UserBadgeWithDetails[] = [];
  @Input() allBadges: BadgeDefinition[] = [];

  private snackBar = inject(MatSnackBar);

  get displayBadges(): DisplayBadge[] {
    const earnedMap = new Map(this.badges.map(b => [b.badge.code, b]));
    return this.allBadges.map(def => ({
      definition: def,
      earned: earnedMap.has(def.code),
      earnedAt: earnedMap.get(def.code)?.earned_at || null,
    }));
  }

  showBadgeInfo(item: DisplayBadge): void {
    const status = item.earned ? 'Desbloqueado' : 'Bloqueado';
    this.snackBar.open(`${item.definition.name} - ${item.definition.description} (${status})`, 'OK', {
      duration: 4000,
    });
  }
}
