import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';

import { JornadaService } from '../../../core/services/jornada.service';
import { AdminService } from '../../../core/services/admin.service';
import { Jornada, JornadaWithMatches, Match } from '../../../core/models/jornada.model';

interface MatchRow {
  match_number: number;
  home_team: string;
  away_team: string;
}

interface ResultRow {
  match_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
}

interface EditMatchRow {
  match_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  saving: boolean;
}

@Component({
  selector: 'app-jornada-manage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTabsModule,
  ],
  template: `
    <div class="admin-container">
      <mat-tab-group class="admin-tabs" animationDuration="200ms">
        <!-- CREATE JORNADA TAB -->
        <mat-tab label="Crear Jornada">
          <div class="tab-content">
            <!-- Header banner -->
            <div class="quiniela-banner">
              <div class="banner-left">
                <mat-icon>sports_soccer</mat-icon>
                <span class="banner-title">LA QUINIELA JORNADA {{ createForm.jornada_number }}{{ createForm.jornada_number === 1 ? 'a' : 'a' }}</span>
              </div>
              <div class="banner-right">
                <mat-form-field appearance="outline" class="inline-field">
                  <mat-label>Fecha limite</mat-label>
                  <input matInput [matDatepicker]="picker" [(ngModel)]="createForm.deadline">
                  <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
              </div>
            </div>

            <!-- Auto-fill from API -->
            <div class="autofill-row">
              <button mat-raised-button class="btn-quiniela" (click)="autoFillQuiniela()" [disabled]="loadingQuiniela()">
                @if (loadingQuiniela()) {
                  <mat-spinner diameter="18"></mat-spinner>
                } @else {
                  <mat-icon>sports_soccer</mat-icon>
                  La Quiniela (15)
                }
              </button>
              <span class="autofill-separator">o</span>
              <mat-form-field appearance="outline" class="autofill-field">
                <mat-label>Liga</mat-label>
                <mat-select [(ngModel)]="selectedCompetition">
                  <mat-option value="PD">La Liga</mat-option>
                  <mat-option value="PL">Premier League</mat-option>
                  <mat-option value="BL1">Bundesliga</mat-option>
                  <mat-option value="SA">Serie A</mat-option>
                  <mat-option value="FL1">Ligue 1</mat-option>
                  <mat-option value="CL">Champions League</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="autofill-field num">
                <mat-label>Jornada API</mat-label>
                <input matInput type="number" [(ngModel)]="apiMatchday" min="1">
              </mat-form-field>
              <button mat-raised-button class="btn-autofill" (click)="autoFillMatches()" [disabled]="loadingAutoFill()">
                @if (loadingAutoFill()) {
                  <mat-spinner diameter="18"></mat-spinner>
                } @else {
                  <mat-icon>download</mat-icon>
                  Auto-rellenar
                }
              </button>
            </div>

            <!-- Meta fields -->
            <div class="meta-row">
              <mat-form-field appearance="outline" class="meta-field">
                <mat-label>Nombre</mat-label>
                <input matInput [(ngModel)]="createForm.name" placeholder="Jornada 36">
              </mat-form-field>
              <mat-form-field appearance="outline" class="meta-field">
                <mat-label>Temporada</mat-label>
                <input matInput [(ngModel)]="createForm.season" placeholder="2025-2026">
              </mat-form-field>
              <mat-form-field appearance="outline" class="meta-field num">
                <mat-label>N.º</mat-label>
                <input matInput type="number" [(ngModel)]="createForm.jornada_number">
              </mat-form-field>
            </div>

            <!-- Matches table -->
            <div class="quiniela-table">
              <div class="table-header">
                <span class="th-num"></span>
                <span class="th-home">Local</span>
                <span class="th-sep"></span>
                <span class="th-away">Visitante</span>
              </div>
              @for (match of matchRows; track match.match_number) {
                <div class="table-row" [class.alt]="match.match_number % 2 === 0" [class.pleno]="match.match_number === 15">
                  <span class="row-num" [class.pleno-num]="match.match_number === 15">{{ match.match_number === 15 ? 'P-15' : match.match_number }}</span>
                  <input class="row-home" [(ngModel)]="match.home_team" placeholder="Equipo local" />
                  <span class="row-sep">-</span>
                  <input class="row-away" [(ngModel)]="match.away_team" placeholder="Equipo visitante" />
                </div>
              }
            </div>

            <div class="form-actions">
              <button mat-raised-button class="btn-submit" (click)="createJornada()" [disabled]="creatingJornada()">
                @if (creatingJornada()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <mat-icon>save</mat-icon>
                  Crear Jornada
                }
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- SUBMIT RESULTS TAB -->
        <mat-tab label="Enviar Resultados">
          <div class="tab-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seleccionar Jornada</mat-label>
              <mat-select [(ngModel)]="selectedJornadaId" (selectionChange)="onJornadaSelect()">
                @for (jornada of jornadas(); track jornada.id) {
                  <mat-option [value]="jornada.id">{{ jornada.name }} - {{ jornada.season }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (loadingMatches()) {
              <div class="loading-container">
                <mat-spinner diameter="36"></mat-spinner>
              </div>
            } @else if (resultRows.length > 0) {
              <!-- Auto-fill results from API -->
              <div class="autofill-row">
                <mat-form-field appearance="outline" class="autofill-field">
                  <mat-label>Liga</mat-label>
                  <mat-select [(ngModel)]="resultsCompetition">
                    <mat-option value="PD">La Liga</mat-option>
                    <mat-option value="PL">Premier League</mat-option>
                    <mat-option value="BL1">Bundesliga</mat-option>
                    <mat-option value="SA">Serie A</mat-option>
                    <mat-option value="FL1">Ligue 1</mat-option>
                    <mat-option value="CL">Champions League</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="autofill-field num">
                  <mat-label>Jornada</mat-label>
                  <input matInput type="number" [(ngModel)]="resultsMatchday" min="1">
                </mat-form-field>
                <button mat-raised-button class="btn-autofill" (click)="autoFillResults()" [disabled]="loadingAutoFillResults()">
                  @if (loadingAutoFillResults()) {
                    <mat-spinner diameter="18"></mat-spinner>
                  } @else {
                    <mat-icon>download</mat-icon>
                    Auto-rellenar
                  }
                </button>
              </div>

              <div class="quiniela-table">
                <div class="table-header">
                  <span class="th-num"></span>
                  <span class="th-home">Local</span>
                  <span class="th-result">Resultado</span>
                  <span class="th-away">Visitante</span>
                  <span class="th-sign">1X2</span>
                </div>
                @for (result of resultRows; track result.match_id) {
                  <div class="table-row" [class.alt]="result.match_number % 2 === 0">
                    <span class="row-num">{{ result.match_number }}</span>
                    <span class="row-team home">{{ result.home_team }}</span>
                    <div class="row-scores">
                      <input class="score-input" type="number" [(ngModel)]="result.home_score" min="0" placeholder="-" />
                      <span class="score-sep">-</span>
                      <input class="score-input" type="number" [(ngModel)]="result.away_score" min="0" placeholder="-" />
                    </div>
                    <span class="row-team away">{{ result.away_team }}</span>
                    <span class="row-sign" [class.sign-filled]="getSign(result)">{{ getSign(result) || '-' }}</span>
                  </div>
                }
              </div>

              <div class="form-actions">
                <button mat-raised-button class="btn-submit" (click)="submitResults()" [disabled]="submittingResults()">
                  @if (submittingResults()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>send</mat-icon>
                    Enviar Resultados
                  }
                </button>
              </div>
            }
          </div>
        </mat-tab>

        <!-- EDIT MATCHES TAB -->
        <mat-tab label="Editar Partidos">
          <div class="tab-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seleccionar Jornada</mat-label>
              <mat-select [(ngModel)]="editJornadaId" (selectionChange)="onEditJornadaSelect()">
                @for (jornada of jornadas(); track jornada.id) {
                  <mat-option [value]="jornada.id">{{ jornada.name }} - {{ jornada.season }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (loadingEditMatches()) {
              <div class="loading-container">
                <mat-spinner diameter="36"></mat-spinner>
              </div>
            } @else if (editMatchRows.length > 0) {
              <div class="quiniela-table">
                <div class="table-header">
                  <span class="th-num"></span>
                  <span class="th-home">Local</span>
                  <span class="th-sep"></span>
                  <span class="th-away">Visitante</span>
                  <span class="th-action"></span>
                </div>
                @for (match of editMatchRows; track match.match_id) {
                  <div class="table-row" [class.alt]="match.match_number % 2 === 0">
                    <span class="row-num">{{ match.match_number }}</span>
                    <input class="row-home" [(ngModel)]="match.home_team" />
                    <span class="row-sep">-</span>
                    <input class="row-away" [(ngModel)]="match.away_team" />
                    <button mat-icon-button class="row-save" (click)="saveMatch(match)" [disabled]="match.saving">
                      @if (match.saving) {
                        <mat-spinner diameter="16"></mat-spinner>
                      } @else {
                        <mat-icon>save</mat-icon>
                      }
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>

        <!-- REOPEN JORNADA TAB -->
        <mat-tab label="Reabrir Jornada">
          <div class="tab-content">
            <p class="info-text">Selecciona una jornada cerrada o finalizada para reabrirla.</p>
            <div class="reopen-list">
              @for (jornada of closedJornadas(); track jornada.id) {
                <div class="reopen-row">
                  <div class="reopen-info">
                    <span class="reopen-name">{{ jornada.name }}</span>
                    <span class="reopen-meta">{{ jornada.season }} &middot; {{ jornada.status }}</span>
                  </div>
                  <button mat-raised-button color="warn" (click)="reopenJornada(jornada)" [disabled]="reopening()">
                    @if (reopening()) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <mat-icon>lock_open</mat-icon>
                      Reabrir
                    }
                  </button>
                </div>
              } @empty {
                <div class="empty-text">No hay jornadas cerradas o finalizadas.</div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- DELETE JORNADA TAB -->
        <mat-tab label="Eliminar Jornada">
          <div class="tab-content">
            <p class="info-text">Solo se pueden eliminar jornadas que no tengan predicciones asociadas.</p>
            <div class="reopen-list">
              @for (jornada of jornadas(); track jornada.id) {
                <div class="reopen-row">
                  <div class="reopen-info">
                    <span class="reopen-name">{{ jornada.name }}</span>
                    <span class="reopen-meta">{{ jornada.season }} &middot; {{ jornada.status }}</span>
                  </div>
                  <button mat-raised-button color="warn" (click)="deleteJornada(jornada)" [disabled]="deleting()">
                    @if (deleting()) {
                      <mat-spinner diameter="16"></mat-spinner>
                    } @else {
                      <mat-icon>delete</mat-icon>
                      Eliminar
                    }
                  </button>
                </div>
              } @empty {
                <div class="empty-text">No hay jornadas disponibles.</div>
              }
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 800px; margin: 0 auto; padding: 16px; }

    /* Tabs */
    ::ng-deep .admin-tabs .mat-mdc-tab-labels { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; }
    ::ng-deep .admin-tabs .mdc-tab { color: #64748b !important; }
    ::ng-deep .admin-tabs .mdc-tab--active { color: #c8a84b !important; }
    ::ng-deep .admin-tabs .mdc-tab-indicator__content--underline { border-color: #c8a84b !important; }

    .tab-content { padding: 20px 0; }

    /* Banner */
    .quiniela-banner {
      display: flex; align-items: center; justify-content: space-between;
      background: #c8a84b; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px;
    }
    .banner-left { display: flex; align-items: center; gap: 10px; }
    .banner-left mat-icon { color: #fff; font-size: 24px; width: 24px; height: 24px; }
    .banner-title { color: #fff; font-weight: 700; font-size: 0.95rem; letter-spacing: 0.5px; }
    .banner-right .inline-field { width: 160px; }
    ::ng-deep .banner-right .mat-mdc-form-field { margin-bottom: -1.25em; }
    ::ng-deep .banner-right .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .banner-right .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .banner-right .mdc-text-field--outlined .mdc-notched-outline__trailing { border-color: rgba(255,255,255,0.5) !important; }
    ::ng-deep .banner-right .mat-mdc-input-element { color: #fff !important; font-size: 0.8rem; }
    ::ng-deep .banner-right .mat-mdc-floating-label { color: rgba(255,255,255,0.8) !important; }
    ::ng-deep .banner-right .mat-datepicker-toggle button { color: #fff !important; }

    /* Auto-fill row */
    .autofill-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding: 12px 16px; background: #f8f9fb; border: 1px solid #e2e8f0; border-radius: 8px; }
    .autofill-field { flex: 1; max-width: 180px; }
    .autofill-field.num { max-width: 100px; }
    .btn-quiniela { background: #c8102e !important; color: #fff !important; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
    .autofill-separator { color: #94a3b8; font-size: 0.8rem; font-weight: 600; }
    .btn-autofill { background: #1e293b !important; color: #fff !important; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; white-space: nowrap; }

    /* Meta row */
    .meta-row { display: flex; gap: 12px; margin-bottom: 8px; }
    .meta-field { flex: 1; }
    .meta-field.num { max-width: 80px; }

    /* Quiniela Table */
    .quiniela-table {
      border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff;
    }
    .table-header {
      display: flex; align-items: center; padding: 8px 12px;
      background: #f8f9fb; border-bottom: 1px solid #e2e8f0;
      font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .th-num { width: 40px; text-align: center; }
    .th-home { flex: 1; text-align: right; padding-right: 8px; }
    .th-sep { width: 20px; text-align: center; }
    .th-away { flex: 1; padding-left: 8px; }
    .th-result { width: 100px; text-align: center; }
    .th-sign { width: 40px; text-align: center; }
    .th-action { width: 40px; }

    .table-row {
      display: flex; align-items: center; padding: 0 12px; min-height: 42px;
      border-bottom: 1px solid #f1f5f9; transition: background 100ms ease;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row.alt { background: #fafbfc; }
    .table-row:hover { background: #f1f5f9; }
    .table-row.pleno { background: rgba(200, 168, 75, 0.06); border-top: 2px solid #c8a84b; }

    .row-num {
      width: 40px; text-align: center; font-size: 0.78rem; font-weight: 600; color: #64748b; flex-shrink: 0;
    }
    .row-num.pleno-num { color: #c8a84b; font-weight: 700; }

    .row-home, .row-away {
      flex: 1; border: none; background: transparent; padding: 8px;
      font-size: 0.85rem; color: #1e293b; outline: none;
      font-family: inherit;
    }
    .row-home { text-align: right; }
    .row-away { text-align: left; }
    .row-home:focus, .row-away:focus { background: rgba(200, 168, 75, 0.06); border-radius: 4px; }
    .row-home::placeholder, .row-away::placeholder { color: #cbd5e1; }

    .row-sep { width: 20px; text-align: center; color: #94a3b8; font-weight: 500; font-size: 0.8rem; }

    .row-team { font-size: 0.85rem; color: #1e293b; }
    .row-team.home { flex: 1; text-align: right; padding-right: 12px; }
    .row-team.away { flex: 1; text-align: left; padding-left: 12px; }

    .row-scores { display: flex; align-items: center; gap: 4px; width: 100px; justify-content: center; }
    .score-input {
      width: 36px; height: 30px; border: 1px solid #e2e8f0; border-radius: 6px;
      text-align: center; font-size: 0.85rem; font-weight: 600; color: #1e293b;
      background: #f8f9fb; outline: none; font-family: inherit;
      -moz-appearance: textfield;
    }
    .score-input::-webkit-inner-spin-button, .score-input::-webkit-outer-spin-button { -webkit-appearance: none; }
    .score-input:focus { border-color: #c8a84b; background: #fff; }
    .score-sep { color: #94a3b8; font-weight: 600; }

    .row-sign { width: 40px; text-align: center; font-size: 0.8rem; font-weight: 700; color: #94a3b8; }
    .row-sign.sign-filled { color: #c8a84b; }

    .row-save { flex-shrink: 0; }
    .row-save mat-icon { font-size: 18px; width: 18px; height: 18px; color: #c8a84b; }

    /* Actions */
    .form-actions { display: flex; justify-content: center; margin-top: 20px; }
    .btn-submit { background: #c8a84b !important; color: #fff !important; font-weight: 600; display: flex; align-items: center; gap: 8px; padding: 0 24px; }

    /* Reopen */
    .reopen-list { display: flex; flex-direction: column; gap: 10px; }
    .reopen-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8f9fb; border-radius: 8px; border: 1px solid #e2e8f0; }
    .reopen-info { display: flex; flex-direction: column; gap: 2px; }
    .reopen-name { color: #1e293b; font-weight: 600; font-size: 0.9rem; }
    .reopen-meta { color: #94a3b8; font-size: 0.78rem; }

    /* Common */
    .full-width { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 40px 0; }
    .info-text { color: #64748b; font-size: 0.88rem; margin-bottom: 16px; }
    .empty-text { text-align: center; color: #94a3b8; padding: 2rem; }

    @media (max-width: 600px) {
      .meta-row { flex-wrap: wrap; }
      .quiniela-banner { flex-direction: column; gap: 10px; align-items: flex-start; }
      .autofill-row { flex-wrap: wrap; }
      .autofill-field { max-width: 100% !important; }
      .row-home, .row-away { font-size: 0.78rem; padding: 6px 4px; }
      .row-num { width: 30px; font-size: 0.72rem; }
    }
  `]
})
export class JornadaManageComponent implements OnInit {
  private jornadaService = inject(JornadaService);
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);

  // Auto-fill from API
  selectedCompetition = 'PD';
  apiMatchday = 1;
  loadingAutoFill = signal(false);
  loadingQuiniela = signal(false);

  // Create Jornada form
  createForm = {
    name: '',
    season: '',
    jornada_number: 1,
    deadline: null as Date | null,
  };

  matchRows: MatchRow[] = Array.from({ length: 15 }, (_, i) => ({
    match_number: i + 1,
    home_team: '',
    away_team: '',
  }));

  creatingJornada = signal(false);

  // Submit Results
  jornadas = signal<Jornada[]>([]);
  selectedJornadaId: number | null = null;
  resultRows: ResultRow[] = [];
  loadingMatches = signal(false);
  submittingResults = signal(false);
  resultsCompetition = 'PD';
  resultsMatchday = 1;
  loadingAutoFillResults = signal(false);

  // Edit Matches
  editJornadaId: number | null = null;
  editMatchRows: EditMatchRow[] = [];
  loadingEditMatches = signal(false);

  // Reopen Jornada
  closedJornadas = signal<Jornada[]>([]);
  reopening = signal(false);

  // Delete Jornada
  deleting = signal(false);

  ngOnInit(): void {
    this.loadJornadas();
    this.loadCurrentMatchday();
  }

  private loadCurrentMatchday(): void {
    this.adminService.getFootballDataCurrentMatchday(this.selectedCompetition).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.apiMatchday = response.data.matchday;
          this.resultsMatchday = response.data.matchday > 1 ? response.data.matchday - 1 : 1;
        }
      },
    });
  }

  private loadJornadas(): void {
    this.jornadaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.jornadas.set(response.data);
          this.closedJornadas.set(response.data.filter(j => j.status === 'closed' || j.status === 'finished'));
        }
      },
      error: () => {
        this.showSnackbar('Error al cargar las jornadas', true);
      }
    });
  }

  createJornada(): void {
    if (!this.createForm.name || !this.createForm.season || !this.createForm.deadline) {
      this.showSnackbar('Completa nombre, temporada y fecha limite', true);
      return;
    }

    const emptyMatches = this.matchRows.filter(m => !m.home_team || !m.away_team);
    if (emptyMatches.length > 0) {
      const nums = emptyMatches.map(m => m.match_number).join(', ');
      this.showSnackbar(`Faltan equipos en partidos: ${nums}`, true);
      return;
    }

    this.creatingJornada.set(true);

    const deadline = this.createForm.deadline instanceof Date
      ? this.createForm.deadline.toISOString()
      : String(this.createForm.deadline);

    this.jornadaService.create({
      name: this.createForm.name,
      season: this.createForm.season,
      jornada_number: this.createForm.jornada_number,
      deadline,
      matches: this.matchRows.map(m => ({
        match_number: m.match_number,
        home_team: m.home_team,
        away_team: m.away_team,
      })),
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar('Jornada creada exitosamente', false);
          this.resetCreateForm();
          this.loadJornadas();
        } else {
          this.showSnackbar(response.message || 'Error al crear la jornada', true);
        }
        this.creatingJornada.set(false);
      },
      error: () => {
        this.showSnackbar('Error al crear la jornada', true);
        this.creatingJornada.set(false);
      }
    });
  }

  onJornadaSelect(): void {
    if (!this.selectedJornadaId) return;

    this.loadingMatches.set(true);
    this.resultRows = [];

    this.jornadaService.getById(this.selectedJornadaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resultRows = response.data.matches.map(m => ({
            match_id: m.id,
            match_number: m.match_number,
            home_team: m.home_team,
            away_team: m.away_team,
            home_score: m.result?.home_score ?? null,
            away_score: m.result?.away_score ?? null,
          }));
        }
        this.loadingMatches.set(false);
      },
      error: () => {
        this.showSnackbar('Error al cargar los partidos', true);
        this.loadingMatches.set(false);
      }
    });
  }

  submitResults(): void {
    if (!this.selectedJornadaId) return;

    const hasIncomplete = this.resultRows.some(r => r.home_score === null || r.away_score === null);
    if (hasIncomplete) {
      this.showSnackbar('Por favor completa todos los resultados', true);
      return;
    }

    this.submittingResults.set(true);

    this.jornadaService.submitResults(this.selectedJornadaId, {
      results: this.resultRows.map(r => ({
        match_id: r.match_id,
        home_score: r.home_score!,
        away_score: r.away_score!,
      })),
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar('Resultados enviados exitosamente', false);
          this.resultRows = [];
          this.selectedJornadaId = null;
          this.loadJornadas();
        } else {
          this.showSnackbar(response.message || 'Error al enviar resultados', true);
        }
        this.submittingResults.set(false);
      },
      error: () => {
        this.showSnackbar('Error al enviar resultados', true);
        this.submittingResults.set(false);
      }
    });
  }

  onEditJornadaSelect(): void {
    if (!this.editJornadaId) return;

    this.loadingEditMatches.set(true);
    this.editMatchRows = [];

    this.jornadaService.getById(this.editJornadaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.editMatchRows = response.data.matches.map(m => ({
            match_id: m.id,
            match_number: m.match_number,
            home_team: m.home_team,
            away_team: m.away_team,
            saving: false,
          }));
        }
        this.loadingEditMatches.set(false);
      },
      error: () => {
        this.showSnackbar('Error al cargar los partidos', true);
        this.loadingEditMatches.set(false);
      }
    });
  }

  saveMatch(match: EditMatchRow): void {
    match.saving = true;
    this.adminService.updateMatch(match.match_id, {
      home_team: match.home_team,
      away_team: match.away_team,
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar('Partido actualizado', false);
        } else {
          this.showSnackbar(response.message || 'Error al actualizar', true);
        }
        match.saving = false;
      },
      error: () => {
        this.showSnackbar('Error al actualizar partido', true);
        match.saving = false;
      }
    });
  }

  reopenJornada(jornada: Jornada): void {
    this.reopening.set(true);
    this.adminService.reopenJornada(jornada.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar(`Jornada "${jornada.name}" reabierta`, false);
          this.loadJornadas();
        } else {
          this.showSnackbar(response.message || 'Error al reabrir', true);
        }
        this.reopening.set(false);
      },
      error: () => {
        this.showSnackbar('Error al reabrir jornada', true);
        this.reopening.set(false);
      }
    });
  }

  deleteJornada(jornada: Jornada): void {
    if (!confirm(`¿Eliminar la jornada "${jornada.name}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    this.deleting.set(true);
    this.jornadaService.delete(jornada.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSnackbar(`Jornada "${jornada.name}" eliminada`, false);
          this.loadJornadas();
        } else {
          this.showSnackbar(response.message || 'Error al eliminar', true);
        }
        this.deleting.set(false);
      },
      error: (err) => {
        this.showSnackbar(err.error?.error?.message || 'Error al eliminar jornada', true);
        this.deleting.set(false);
      }
    });
  }

  getSign(result: ResultRow): string | null {
    if (result.home_score === null || result.away_score === null) return null;
    if (result.home_score > result.away_score) return '1';
    if (result.home_score === result.away_score) return 'X';
    return '2';
  }

  autoFillResults(): void {
    if (!this.resultsMatchday || this.resultsMatchday < 1) {
      this.showSnackbar('Introduce un numero de jornada valido', true);
      return;
    }

    this.loadingAutoFillResults.set(true);

    this.adminService.getFootballDataResults(this.resultsCompetition, this.resultsMatchday).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const apiResults = response.data;
          let filled = 0;
          for (let i = 0; i < this.resultRows.length && i < apiResults.length; i++) {
            if (apiResults[i].home_score !== null && apiResults[i].away_score !== null) {
              this.resultRows[i].home_score = apiResults[i].home_score;
              this.resultRows[i].away_score = apiResults[i].away_score;
              filled++;
            }
          }
          if (filled > 0) {
            this.showSnackbar(`${filled} resultados rellenados automaticamente`, false);
          } else {
            this.showSnackbar('No hay resultados disponibles aun (partidos no finalizados)', true);
          }
        } else {
          this.showSnackbar('No se encontraron resultados', true);
        }
        this.loadingAutoFillResults.set(false);
      },
      error: (err) => {
        this.showSnackbar(err?.error?.message || 'Error al obtener resultados de la API', true);
        this.loadingAutoFillResults.set(false);
      }
    });
  }

  autoFillMatches(): void {
    if (!this.apiMatchday || this.apiMatchday < 1) {
      this.showSnackbar('Introduce un numero de jornada valido', true);
      return;
    }

    this.loadingAutoFill.set(true);

    this.adminService.getFootballDataMatches(this.selectedCompetition, this.apiMatchday).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const apiMatches = response.data;
          const count = Math.min(apiMatches.length, this.matchRows.length);
          for (let i = 0; i < count; i++) {
            this.matchRows[i].home_team = apiMatches[i].home_team;
            this.matchRows[i].away_team = apiMatches[i].away_team;
          }
          this.showSnackbar(`${count} partidos rellenados (de ${this.matchRows.length})`, false);
        } else {
          this.showSnackbar('No se encontraron partidos', true);
        }
        this.loadingAutoFill.set(false);
      },
      error: (err) => {
        this.showSnackbar(err?.error?.message || 'Error al obtener partidos de la API', true);
        this.loadingAutoFill.set(false);
      }
    });
  }

  autoFillQuiniela(): void {
    this.loadingQuiniela.set(true);

    this.adminService.getQuinielaMatches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const apiMatches = response.data;
          this.matchRows = apiMatches.map((m, i) => ({
            match_number: i + 1,
            home_team: m.home_team,
            away_team: m.away_team,
          }));
          this.showSnackbar(`${apiMatches.length} partidos de La Quiniela rellenados`, false);
        } else {
          this.showSnackbar('No se pudieron obtener los partidos de La Quiniela', true);
        }
        this.loadingQuiniela.set(false);
      },
      error: (err) => {
        this.showSnackbar(err?.error?.message || 'Error al obtener partidos de La Quiniela', true);
        this.loadingQuiniela.set(false);
      }
    });
  }

  private resetCreateForm(): void {
    this.createForm = {
      name: '',
      season: '',
      jornada_number: 1,
      deadline: null,
    };
    this.matchRows = Array.from({ length: 15 }, (_, i) => ({
      match_number: i + 1,
      home_team: '',
      away_team: '',
    }));
  }

  private showSnackbar(message: string, isError: boolean): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: isError ? 'snackbar-error' : 'snackbar-success',
    });
  }
}
