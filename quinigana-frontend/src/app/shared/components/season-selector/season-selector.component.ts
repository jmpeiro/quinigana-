import { Component, inject, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { SeasonService } from '../../../core/services/season.service';
import { SeasonWithStats } from '../../../core/models/season.model';

@Component({
  selector: 'app-season-selector',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="season-select">
      <mat-label>Temporada</mat-label>
      <mat-select
        [value]="seasonService.selectedSeasonId()"
        (selectionChange)="onSeasonChange($event.value)">
        <mat-option [value]="null">
          <mat-icon>calendar_view_month</mat-icon>
          Todas las temporadas
        </mat-option>
        @for (season of seasonService.seasons(); track season.id) {
          <mat-option [value]="season.id">
            <div class="season-option">
              <span class="season-name">{{ season.display_name }}</span>
              <span class="season-stats">{{ season.finishedCount }}/{{ season.jornadasCount }} jornadas</span>
            </div>
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [`
    @use 'styles/variables' as *;

    .season-select {
      width: 100%;
      max-width: 280px;

      ::ng-deep .mat-mdc-select-value {
        color: var(--text-primary);
      }

      ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
    }

    .season-option {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 0;
    }

    .season-name {
      font-weight: 500;
    }

    .season-stats {
      font-size: $font-size-xs;
      color: var(--text-muted);
    }

    mat-icon {
      margin-right: 8px;
      color: var(--accent-primary, $accent-500);
    }
  `]
})
export class SeasonSelectorComponent implements OnInit {
  seasonService = inject(SeasonService);
  seasonChanged = output<number | null>();

  ngOnInit(): void {
    // Load seasons if not already loaded
    if (this.seasonService.seasons().length === 0) {
      this.seasonService.getAll().subscribe();
    }
  }

  onSeasonChange(seasonId: number | null): void {
    this.seasonService.selectSeason(seasonId);
    this.seasonChanged.emit(seasonId);
  }
}
