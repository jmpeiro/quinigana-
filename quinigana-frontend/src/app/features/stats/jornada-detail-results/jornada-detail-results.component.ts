import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService } from '../../../core/services/stats.service';
import { JornadaDetailResult } from '../../../core/models/stats.model';

@Component({
  selector: 'app-jornada-detail-results',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="detail-container">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (detail()) {
        <div class="detail-header">
          <h1 class="page-title">{{ detail()!.jornadaName }}</h1>
          <div class="total-points">{{ detail()!.totalPoints }} pts</div>
        </div>

        <div class="matches-table">
          <div class="table-header">
            <span class="col-num">#</span>
            <span class="col-match">Partido</span>
            <span class="col-pred">Prediccion</span>
            <span class="col-result">Resultado</span>
            <span class="col-pts">Pts</span>
          </div>
          @for (match of detail()!.matches; track match.matchNumber) {
            <div class="table-row" [class.correct]="match.isCorrect1x2" [class.wrong]="!match.isCorrect1x2 && match.actualResult1x2 !== '-'">
              <span class="col-num">{{ match.matchNumber }}</span>
              <div class="col-match">
                <span class="team">{{ match.homeTeam }}</span>
                <span class="vs">vs</span>
                <span class="team">{{ match.awayTeam }}</span>
              </div>
              <div class="col-pred">
                <span class="pred-1x2">{{ match.prediction1x2 }}</span>
                @if (match.homeScorePrediction !== null) {
                  <span class="pred-score">{{ match.homeScorePrediction }}-{{ match.awayScorePrediction }}</span>
                }
              </div>
              <div class="col-result">
                <span class="result-1x2">{{ match.actualResult1x2 }}</span>
                @if (match.homeScoreActual !== null) {
                  <span class="result-score">{{ match.homeScoreActual }}-{{ match.awayScoreActual }}</span>
                }
              </div>
              <div class="col-pts">
                <span class="pts-value">{{ match.points1x2 + match.pointsPleno }}</span>
                @if (match.isCorrectPleno) {
                  <mat-icon class="pleno-icon">stars</mat-icon>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty">No se encontraron resultados.</div>
      }
    </div>
  `,
  styles: [`
    .detail-container { max-width: 750px; margin: 0 auto; padding: 1.5rem; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-title { color: #1e293b; font-size: 1.4rem; margin: 0; }
    .total-points { color: #c8a84b; font-size: 1.5rem; font-weight: 700; }
    .matches-table { display: flex; flex-direction: column; gap: 2px; }
    .table-header { display: flex; align-items: center; padding: 0.6rem 0.8rem; color: #64748b; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .table-row { display: flex; align-items: center; padding: 0.7rem 0.8rem; background: #fff; border-radius: 6px; border-left: 3px solid transparent; border: 1px solid #e2e8f0; border-left: 3px solid transparent; }
    .table-row.correct { border-left-color: #4caf50; }
    .table-row.wrong { border-left-color: #ef5350; }
    .col-num { width: 28px; color: #64748b; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
    .col-match { flex: 2; display: flex; align-items: center; gap: 4px; min-width: 0; }
    .col-match .team { color: #1e293b; font-size: 0.78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .col-match .vs { color: #94a3b8; font-size: 0.65rem; flex-shrink: 0; }
    .col-pred { width: 70px; text-align: center; flex-shrink: 0; }
    .col-result { width: 70px; text-align: center; flex-shrink: 0; }
    .col-pts { width: 50px; text-align: center; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 4px; }
    .pred-1x2, .result-1x2 { display: block; font-weight: 700; font-size: 0.85rem; color: #1e293b; }
    .pred-score, .result-score { display: block; font-size: 0.65rem; color: #64748b; }
    .pts-value { color: #c8a84b; font-weight: 700; font-size: 0.9rem; }
    .pleno-icon { color: #ffd54f; font-size: 14px; width: 14px; height: 14px; }
    .empty { text-align: center; color: #64748b; padding: 3rem; }
    @media (max-width: 500px) { .col-match { flex: 1.5; } .col-match .team { font-size: 0.7rem; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JornadaDetailResultsComponent implements OnInit {
  private statsService = inject(StatsService);
  private route = inject(ActivatedRoute);

  detail = signal<JornadaDetailResult | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const groupId = parseInt(this.route.snapshot.params['groupId']);
    const jornadaId = parseInt(this.route.snapshot.params['jornadaId']);

    this.statsService.getJornadaDetail(groupId, jornadaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.detail.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
