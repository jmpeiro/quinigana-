import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';

import { JornadaService } from '../../../core/services/jornada.service';
import { ProposalService } from '../../../core/services/proposal.service';
import { GroupService } from '../../../core/services/group.service';
import { JornadaWithMatches, Match } from '../../../core/models/jornada.model';
import { CreateProposalDto, Prediction1x2 } from '../../../core/models/proposal.model';
import { Group } from '../../../core/models/group.model';

interface MatchPrediction {
  match: Match;
  prediction_1x2: Prediction1x2 | null;
  home_score_prediction: number | null;
  away_score_prediction: number | null;
}

@Component({
  selector: 'app-proposal-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatSelectModule,
  ],
  template: `
    <div class="proposal-create-container">
      <h1 class="page-title">Crear Propuesta</h1>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Cargando...</p>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          @if (existingProposalId()) {
            <button mat-raised-button color="primary" (click)="goToExisting()">
              <mat-icon>visibility</mat-icon>
              Ver la quiniela del grupo
            </button>
          }
        </div>
      } @else if (jornada()) {
        <mat-card class="jornada-info-card">
          <mat-card-content>
            <div class="jornada-info">
              <span class="jornada-name">{{ jornada()!.name }}</span>
              <span class="jornada-detail">Temporada {{ jornada()!.season }} - Jornada #{{ jornada()!.jornada_number }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="rules-card">
          <mat-card-content>
            <div class="rules-head">
              <mat-icon>emoji_events</mat-icon>
              <span>Como se puntua</span>
            </div>
            <ul class="rules-list">
              <li><b>1 punto</b> por acertar el 1X2 marcando un solo signo</li>
              <li><b>0,5 puntos</b> si marcas doble y aciertas</li>
              <li><b>0 puntos</b> si marcas triple</li>
              <li><b>3 puntos</b> por acertar el resultado exacto del Pleno al 15</li>
            </ul>
            <p class="rules-foot">La propuesta se aprueba cuando la vota a favor la mitad de los miembros mas uno.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-content>
            @if (groups().length > 0) {
              <mat-form-field appearance="outline" class="group-field">
                <mat-label>Grupo</mat-label>
                <mat-select [(ngModel)]="groupId" required>
                  @for (group of groups(); track group.id) {
                    <mat-option [value]="group.id">{{ group.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }

            <mat-form-field appearance="outline" class="title-field">
              <mat-label>Titulo (opcional)</mat-label>
              <input matInput [(ngModel)]="title" placeholder="Titulo para tu propuesta">
            </mat-form-field>

            <div class="predictions-list">
              @for (pred of predictions(); track pred.match.id; let i = $index) {
                <div class="prediction-row" [class.invalid]="submitted() && (!pred.prediction_1x2 || pred.prediction_1x2.length === 0)">
                  <div class="match-info">
                    <span class="match-number">{{ pred.match.match_number }}</span>
                    <div class="match-teams">
                      <span class="team">{{ pred.match.home_team }}</span>
                      <span class="vs">vs</span>
                      <span class="team">{{ pred.match.away_team }}</span>
                    </div>
                  </div>

                  <div class="prediction-controls">
                    <div class="prediction-buttons">
                      <button type="button" class="pred-btn"
                        [class.selected]="pred.prediction_1x2?.includes('1')"
                        (click)="togglePrediction(i, '1')">1</button>
                      <button type="button" class="pred-btn"
                        [class.selected]="pred.prediction_1x2?.includes('X')"
                        (click)="togglePrediction(i, 'X')">X</button>
                      <button type="button" class="pred-btn"
                        [class.selected]="pred.prediction_1x2?.includes('2')"
                        (click)="togglePrediction(i, '2')">2</button>
                      @if (pred.prediction_1x2 && pred.prediction_1x2.length > 1) {
                        <span class="pred-type-badge"
                          [class.doble]="pred.prediction_1x2.length === 2"
                          [class.triple]="pred.prediction_1x2.length === 3">
                          {{ pred.prediction_1x2.length === 2 ? 'D' : 'T' }}
                        </span>
                      }
                    </div>

                    <div class="score-inputs">
                      <mat-form-field appearance="outline" class="score-field">
                        <mat-label>H</mat-label>
                        <input matInput type="number" min="0" max="99"
                          [ngModel]="pred.home_score_prediction"
                          (ngModelChange)="setHomeScore(i, $event)">
                      </mat-form-field>
                      <span class="score-separator">-</span>
                      <mat-form-field appearance="outline" class="score-field">
                        <mat-label>A</mat-label>
                        <input matInput type="number" min="0" max="99"
                          [ngModel]="pred.away_score_prediction"
                          (ngModelChange)="setAwayScore(i, $event)">
                      </mat-form-field>
                    </div>
                  </div>
                </div>
                @if (!$last) {
                  <mat-divider></mat-divider>
                }
              }
            </div>
          </mat-card-content>

          <mat-card-actions class="form-actions">
            <button mat-button (click)="cancel()" [disabled]="submitting()">
              Cancel
            </button>
            <button mat-raised-button color="primary" (click)="submitProposal()" [disabled]="submitting()">
              @if (submitting()) {
                <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
              }
              @if (!submitting()) {
                <mat-icon>send</mat-icon>
              }
              <span>{{ submitting() ? 'Submitting...' : 'Submit Proposal' }}</span>
            </button>
          </mat-card-actions>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
    }

    .proposal-create-container {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-title {
      color: #1e293b;
      font-size: 28px;
      font-weight: 500;
      margin-bottom: 24px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 0;
      color: #64748b;
      p { margin-top: 16px; font-size: 16px; }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      color: #ef5350;
      mat-icon { font-size: 48px; width: 48px; height: 48px; }
      p { margin-top: 12px; font-size: 16px; }
    }

    .rules-card {
      margin-bottom: 1rem;
      border-left: 3px solid #c9a227;
    }
    .rules-head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.6rem;
      mat-icon { color: #c9a227; font-size: 20px; width: 20px; height: 20px; }
    }
    .rules-list {
      margin: 0;
      padding-left: 1.15rem;
      color: #64748b;
      font-size: 0.87rem;
      line-height: 1.7;
      b { color: #334155; }
    }
    .rules-foot {
      margin: 0.7rem 0 0;
      color: #94a3b8;
      font-size: 0.82rem;
      line-height: 1.45;
    }
    .jornada-info-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .jornada-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .jornada-name { color: #1e293b; font-size: 18px; font-weight: 500; }
    .jornada-detail { color: #64748b; font-size: 14px; }

    .form-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }

    .group-field {
      width: 100%;
      margin-bottom: 8px;
    }

    .title-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .predictions-list {
      display: flex;
      flex-direction: column;
    }

    .prediction-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 8px;
      gap: 16px;
      flex-wrap: wrap;
      border-left: 3px solid transparent;
      transition: border-color 0.2s ease;
      &.invalid {
        border-left-color: #ef5350;
        background: rgba(239, 83, 80, 0.05);
      }
    }

    .match-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 200px;
    }

    .match-number {
      background: #f1f5f9;
      color: #c8a84b;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .match-teams {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .team { color: #1e293b; font-size: 14px; font-weight: 500; }
    .vs { color: #94a3b8; font-size: 12px; font-style: italic; }

    .prediction-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .prediction-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pred-btn {
      width: 32px;
      height: 32px;
      border: 2px solid #e2e8f0;
      border-radius: 6px;
      background: transparent;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s;
    }
    .pred-btn.selected {
      border-color: #c8a84b;
      background: rgba(200, 168, 75, 0.15);
      color: #c8a84b;
    }
    .pred-type-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      margin-left: 2px;
    }
    .pred-type-badge.doble { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .pred-type-badge.triple { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    .score-inputs {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .score-field {
      width: 56px;
      ::ng-deep .mat-mdc-text-field-wrapper { padding: 0 8px; }
      ::ng-deep input { text-align: center; }
    }

    .score-separator { color: #94a3b8; font-size: 16px; margin: 0 2px; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px;
      button { display: flex; align-items: center; gap: 8px; }
    }

    .button-spinner { display: inline-block; }
    mat-divider { border-top-color: #e2e8f0; }
  `],
})
export class ProposalCreateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jornadaService = inject(JornadaService);
  private proposalService = inject(ProposalService);
  private groupService = inject(GroupService);
  private snackBar = inject(MatSnackBar);

  jornada = signal<JornadaWithMatches | null>(null);
  predictions = signal<MatchPrediction[]>([]);
  groups = signal<Group[]>([]);
  loading = signal(true);
  submitting = signal(false);
  submitted = signal(false);
  existingProposalId = signal<number | null>(null);
  error = signal<string | null>(null);

  title = '';
  groupId = 0;
  jornadaId = 0;

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.queryParamMap.get('groupId')) || 0;
    this.jornadaId = Number(this.route.snapshot.queryParamMap.get('jornadaId')) || 0;

    if (!this.jornadaId) {
      // Entry points that only know the group (e.g. the group quinielas tab)
      // navigate here without a jornada, so fall back to the active one
      // instead of dead-ending on a missing-parameter error.
      this.jornadaService.getActive().subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.jornadaId = response.data.id;
            this.loadData();
          } else {
            this.error.set('No hay ninguna jornada activa en este momento.');
            this.loading.set(false);
          }
        },
        error: () => {
          this.error.set('No se pudo cargar la jornada activa.');
          this.loading.set(false);
        },
      });
      return;
    }

    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load groups if no groupId provided
    if (!this.groupId) {
      this.groupService.getMyGroups().subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.length > 0) {
            this.groups.set(response.data);
            // Auto-select if only one group
            if (response.data.length === 1) {
              this.groupId = response.data[0].id;
            }
            this.loadJornada();
          } else {
            this.error.set('No perteneces a ningun grupo. Unete a un grupo primero.');
            this.loading.set(false);
          }
        },
        error: () => {
          this.error.set('Error al cargar los grupos.');
          this.loading.set(false);
        },
      });
    } else {
      this.loadJornada();
    }
  }

  private loadJornada(): void {
    this.jornadaService.getById(this.jornadaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.jornada.set(response.data);
          this.predictions.set(
            response.data.matches.map((match) => ({
              match,
              prediction_1x2: null,
              home_score_prediction: null,
              away_score_prediction: null,
            }))
          );
          // Only one proposal per group and jornada can be active, so check now
          // rather than letting the user fill in 15 predictions and fail on save.
          this.checkExistingProposal();
          return;
        } else {
          this.error.set('Error al cargar los partidos de la jornada.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al cargar la jornada.');
        this.loading.set(false);
      },
    });
  }

  goToExisting(): void {
    const id = this.existingProposalId();
    if (id) {
      this.router.navigate(['/quiniela/groups', this.groupId, 'proposals', id]);
    }
  }

  private checkExistingProposal(): void {
    this.proposalService.getByGroup(this.groupId, 1, 100).subscribe({
      next: (response) => {
        const items = response?.data?.items ?? [];
        const active = items.find(
          (p: any) => p.jornada_id === this.jornadaId && (p.status === 'approved' || p.status === 'pending')
        );
        if (active) {
          this.existingProposalId.set(active.id);
          this.error.set(
            active.status === 'approved'
              ? 'Este grupo ya tiene una quiniela aprobada para esta jornada.'
              : 'Ya hay una propuesta en votacion para esta jornada.'
          );
        }
        this.loading.set(false);
      },
      error: () => {
        // A failed check must not block creating a proposal; the server
        // rejects duplicates anyway.
        this.loading.set(false);
      },
    });
  }

  togglePrediction(index: number, value: '1' | 'X' | '2'): void {
    this.predictions.update((preds) => {
      const updated = [...preds];
      const current = updated[index].prediction_1x2 || '';

      let newPred: string;
      if (current.includes(value)) {
        newPred = current.replace(value, '');
      } else {
        newPred = current + value;
      }

      // Normalize order: always 1, X, 2
      const ordered = ['1', 'X', '2'].filter(v => newPred.includes(v)).join('');
      updated[index] = { ...updated[index], prediction_1x2: (ordered || null) as any };
      return updated;
    });
  }

  setHomeScore(index: number, value: number | null): void {
    this.predictions.update((preds) => {
      const updated = [...preds];
      updated[index] = { ...updated[index], home_score_prediction: value };
      return updated;
    });
  }

  setAwayScore(index: number, value: number | null): void {
    this.predictions.update((preds) => {
      const updated = [...preds];
      updated[index] = { ...updated[index], away_score_prediction: value };
      return updated;
    });
  }

  submitProposal(): void {
    this.submitted.set(true);

    if (!this.groupId) {
      this.snackBar.open('Selecciona un grupo para enviar la propuesta.', 'OK', {
        duration: 4000,
        panelClass: 'snackbar-error',
      });
      return;
    }

    const currentPredictions = this.predictions();
    const allPredicted = currentPredictions.every((p) => p.prediction_1x2 && p.prediction_1x2.length > 0);

    if (!allPredicted) {
      this.snackBar.open('Selecciona una prediccion (1, X, o 2) para todos los partidos.', 'OK', {
        duration: 4000,
        panelClass: 'snackbar-error',
      });
      return;
    }

    const dto: CreateProposalDto = {
      jornada_id: this.jornadaId,
      title: this.title || undefined,
      predictions: currentPredictions.map((p) => ({
        match_id: p.match.id,
        prediction_1x2: p.prediction_1x2!,
        home_score_prediction: p.home_score_prediction ?? undefined,
        away_score_prediction: p.away_score_prediction ?? undefined,
      })),
    };

    this.submitting.set(true);

    this.proposalService.create(this.groupId, dto).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Propuesta creada correctamente!', 'OK', { duration: 3000 });
          this.router.navigate(['/quiniela/groups', this.groupId, 'proposals', response.data?.id]);
        } else {
          this.snackBar.open('Error al crear la propuesta.', 'OK', {
            duration: 4000,
            panelClass: 'snackbar-error',
          });
        }
        this.submitting.set(false);
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'Error al crear la propuesta.',
          'OK',
          { duration: 4000, panelClass: 'snackbar-error' }
        );
        this.submitting.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/quiniela/jornadas', this.jornadaId]);
  }
}
