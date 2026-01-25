import { Component, Input, ChangeDetectionStrategy, computed, signal, Pipe, PipeTransform } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface HeatmapMatch {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  prediction1x2: string;
  actualResult1x2: string | null;
  homeScorePrediction: number | null;
  awayScorePrediction: number | null;
  homeScoreActual: number | null;
  awayScoreActual: number | null;
  isCorrect1x2: boolean;
  isCorrectPleno: boolean;
}

export interface HeatmapJornada {
  jornadaId: number;
  jornadaName: string;
  matches: HeatmapMatch[];
}

@Pipe({ name: 'shortenJornada', standalone: true })
export class ShortenJornadaPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace('Jornada ', 'J');
  }
}

@Component({
  selector: 'app-predictions-heatmap',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, ShortenJornadaPipe],
  template: `
    <div class="heatmap-container">
      @if (jornadasData().length > 0) {
        <div class="heatmap-scroll">
          <div class="heatmap-grid" [style.gridTemplateColumns]="gridColumns()">
            <!-- Header row with match numbers -->
            <div class="header-cell corner">Jornada</div>
            @for (num of matchNumbers(); track num) {
              <div class="header-cell">{{ num }}</div>
            }

            <!-- Data rows -->
            @for (jornada of jornadasData(); track jornada.jornadaId) {
              <div class="row-label">{{ jornada.jornadaName | shortenJornada }}</div>
              @for (num of matchNumbers(); track num) {
                @if (getMatch(jornada, num); as match) {
                  <div
                    class="heatmap-cell"
                    [class.correct-1x2]="match.isCorrect1x2 && !match.isCorrectPleno"
                    [class.correct-pleno]="match.isCorrectPleno"
                    [class.incorrect]="match.actualResult1x2 && !match.isCorrect1x2"
                    [class.pending]="!match.actualResult1x2"
                    [matTooltip]="getTooltip(match)">
                    <span class="cell-pred">{{ match.prediction1x2 }}</span>
                    @if (match.isCorrectPleno) {
                      <mat-icon class="cell-icon pleno">auto_awesome</mat-icon>
                    } @else if (match.isCorrect1x2) {
                      <mat-icon class="cell-icon hit">check</mat-icon>
                    } @else if (match.actualResult1x2 && !match.isCorrect1x2) {
                      <mat-icon class="cell-icon miss">close</mat-icon>
                    }
                  </div>
                } @else {
                  <div class="heatmap-cell empty">-</div>
                }
              }
            }
          </div>
        </div>

        <!-- Legend -->
        <div class="legend">
          <div class="legend-item">
            <span class="legend-dot pleno"></span>
            <span>Pleno</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot correct"></span>
            <span>1X2 Correcto</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot incorrect"></span>
            <span>Incorrecto</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot pending"></span>
            <span>Pendiente</span>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>grid_off</mat-icon>
          <span>Sin datos de predicciones</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .heatmap-container {
      width: 100%;
    }

    .heatmap-scroll {
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .heatmap-grid {
      display: grid;
      gap: 2px;
      min-width: fit-content;
    }

    .header-cell {
      background: var(--bg-secondary, #f8f9fb);
      color: var(--text-secondary, #64748b);
      font-size: 0.65rem;
      font-weight: 600;
      padding: 6px 4px;
      text-align: center;
      border-radius: 4px;
      min-width: 28px;

      &.corner {
        min-width: 70px;
        text-align: left;
        padding-left: 8px;
      }
    }

    .row-label {
      background: var(--bg-secondary, #f8f9fb);
      color: var(--text-primary, #1e293b);
      font-size: 0.7rem;
      font-weight: 600;
      padding: 6px 8px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      white-space: nowrap;
    }

    .heatmap-cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      min-width: 28px;
      min-height: 28px;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: default;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1;
      }

      &.correct-1x2 {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      &.correct-pleno {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(200, 168, 75, 0.2));
        color: #8b5cf6;
      }

      &.incorrect {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      &.pending {
        background: var(--bg-input, #f1f5f9);
        color: var(--text-muted, #94a3b8);
      }

      &.empty {
        background: transparent;
        color: var(--text-muted, #cbd5e1);
      }
    }

    .cell-pred {
      font-size: 0.72rem;
    }

    .cell-icon {
      position: absolute;
      bottom: 1px;
      right: 1px;
      font-size: 10px;
      width: 10px;
      height: 10px;

      &.hit { color: #10b981; }
      &.miss { color: #ef4444; }
      &.pleno { color: #8b5cf6; }
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      color: var(--text-secondary, #64748b);
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;

      &.pleno {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(200, 168, 75, 0.4));
      }
      &.correct {
        background: rgba(16, 185, 129, 0.3);
      }
      &.incorrect {
        background: rgba(239, 68, 68, 0.2);
      }
      &.pending {
        background: var(--bg-input, #f1f5f9);
        border: 1px solid var(--border-color, #e2e8f0);
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 2rem;
      color: var(--text-muted, #94a3b8);

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        opacity: 0.5;
      }

      span {
        font-size: 0.85rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredictionsHeatmapComponent {
  @Input() set data(value: HeatmapJornada[]) {
    this._data.set(value || []);
  }

  private _data = signal<HeatmapJornada[]>([]);

  jornadasData = computed(() => this._data());

  matchNumbers = computed(() => {
    const data = this._data();
    if (!data.length) return [];
    const maxMatch = Math.max(...data.flatMap(j => j.matches.map(m => m.matchNumber)));
    return Array.from({ length: maxMatch }, (_, i) => i + 1);
  });

  gridColumns = computed(() => {
    const nums = this.matchNumbers();
    return `70px repeat(${nums.length}, minmax(28px, 1fr))`;
  });

  getMatch(jornada: HeatmapJornada, matchNumber: number): HeatmapMatch | undefined {
    return jornada.matches.find(m => m.matchNumber === matchNumber);
  }

  getTooltip(match: HeatmapMatch): string {
    const teams = `${match.homeTeam} vs ${match.awayTeam}`;
    const pred = `Predicción: ${match.prediction1x2}`;
    const predScore = match.homeScorePrediction !== null
      ? ` (${match.homeScorePrediction}-${match.awayScorePrediction})`
      : '';
    const actual = match.actualResult1x2
      ? `\nResultado: ${match.actualResult1x2} (${match.homeScoreActual}-${match.awayScoreActual})`
      : '\nPendiente';
    return `${teams}\n${pred}${predScore}${actual}`;
  }
}
