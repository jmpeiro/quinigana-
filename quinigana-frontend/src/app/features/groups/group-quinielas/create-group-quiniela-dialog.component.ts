import { Component, Inject, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { GroupQuinielaService } from '../../../core/services/group-quiniela.service';
import { JornadaService } from '../../../core/services/jornada.service';
import { AdminService } from '../../../core/services/admin.service';
import { Jornada, JornadaWithMatches } from '../../../core/models/jornada.model';

interface DialogData {
  groupId: number;
}

interface MatchRow {
  match_number: number;
  home_team: string;
  away_team: string;
}

@Component({
  selector: 'app-create-group-quiniela-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatRadioModule,
  ],
  template: `
    <h2 mat-dialog-title>Nueva Quiniela</h2>
    <mat-dialog-content>
      <!-- Mode Selection -->
      <div class="mode-selection">
        <mat-radio-group [(ngModel)]="mode" class="mode-group">
          <mat-radio-button value="jornada">Usar jornada existente</mat-radio-button>
          <mat-radio-button value="custom">Crear personalizada</mat-radio-button>
        </mat-radio-group>
      </div>

      @if (mode === 'jornada') {
        <!-- USE EXISTING JORNADA -->
        <div class="jornada-mode">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seleccionar Jornada</mat-label>
            <mat-select [(ngModel)]="selectedJornadaId" (selectionChange)="onJornadaSelected()">
              @for (jornada of jornadas(); track jornada.id) {
                <mat-option [value]="jornada.id">
                  {{ jornada.name }} - {{ jornada.season }}
                  @if (jornada.status === 'open') {
                    <span class="jornada-status open">(Abierta)</span>
                  }
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          @if (loadingJornada()) {
            <div class="loading-jornada">
              <mat-spinner diameter="24"></mat-spinner>
              <span>Cargando partidos...</span>
            </div>
          } @else if (selectedJornadaData) {
            <div class="jornada-preview">
              <div class="preview-header">
                <span class="preview-title">{{ selectedJornadaData.name }}</span>
                <span class="preview-meta">{{ selectedJornadaData.matches.length }} partidos</span>
              </div>
              <div class="preview-matches">
                @for (match of selectedJornadaData.matches; track match.id; let i = $index) {
                  <div class="preview-match">
                    <span class="match-num">{{ i + 1 }}</span>
                    <span class="match-teams">{{ match.home_team }} vs {{ match.away_team }}</span>
                  </div>
                }
              </div>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre de la quiniela</mat-label>
              <input matInput [(ngModel)]="jornadaQuinielaName" placeholder="Ej: Liga Jornada 21" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Fecha limite</mat-label>
              <input matInput [matDatepicker]="pickerJornada" [(ngModel)]="jornadaDeadline" />
              <mat-datepicker-toggle matIconSuffix [for]="pickerJornada"></mat-datepicker-toggle>
              <mat-datepicker #pickerJornada></mat-datepicker>
            </mat-form-field>
          }
        </div>
      } @else {
        <!-- CUSTOM MODE -->
        <div class="custom-mode">
          <!-- Auto-fill from API -->
          <div class="autofill-section">
            <div class="autofill-row">
              <button mat-stroked-button class="btn-quiniela" (click)="autoFillQuiniela()" [disabled]="loadingQuiniela()">
                @if (loadingQuiniela()) {
                  <mat-spinner diameter="16"></mat-spinner>
                }
                @if (!loadingQuiniela()) {
                  <mat-icon>sports_soccer</mat-icon>
                }
                <span>La Quiniela</span>
              </button>
              <span class="autofill-sep">o</span>
              <mat-form-field appearance="outline" class="league-field">
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
              <mat-form-field appearance="outline" class="num-field">
                <mat-label>Jornada</mat-label>
                <input matInput type="number" [(ngModel)]="apiMatchday" min="1" />
              </mat-form-field>
              <button mat-stroked-button class="btn-autofill" (click)="autoFillMatches()" [disabled]="loadingAutoFill()">
                @if (loadingAutoFill()) {
                  <mat-spinner diameter="16"></mat-spinner>
                }
                @if (!loadingAutoFill()) {
                  <mat-icon>download</mat-icon>
                }
                <span>Auto-rellenar</span>
              </button>
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre de la quiniela</mat-label>
            <input matInput [(ngModel)]="customName" placeholder="Ej: Liga Jornada 21" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripcion (opcional)</mat-label>
            <textarea matInput [(ngModel)]="customDescription" rows="2"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Fecha limite</mat-label>
            <input matInput [matDatepicker]="pickerCustom" [(ngModel)]="customDeadline" />
            <mat-datepicker-toggle matIconSuffix [for]="pickerCustom"></mat-datepicker-toggle>
            <mat-datepicker #pickerCustom></mat-datepicker>
          </mat-form-field>

          <div class="matches-section">
            <div class="matches-header">
              <h3>Partidos</h3>
              <button mat-stroked-button type="button" (click)="addMatch()">
                <mat-icon>add</mat-icon>
                Añadir
              </button>
            </div>

            <div class="matches-list">
              @for (match of matchRows; track match.match_number; let i = $index) {
                <div class="match-row">
                  <span class="match-num">{{ match.match_number }}</span>
                  <input class="team-input" [(ngModel)]="match.home_team" placeholder="Local" />
                  <span class="vs">-</span>
                  <input class="team-input" [(ngModel)]="match.away_team" placeholder="Visitante" />
                  @if (matchRows.length > 1) {
                    <button mat-icon-button type="button" (click)="removeMatch(i)" class="btn-remove">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="create()" [disabled]="!canCreate() || saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Crear Quiniela
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
    }

    .mode-selection {
      margin-bottom: 1.25rem;
      padding: 0.75rem;
      background: #f8f9fb;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    .mode-group {
      display: flex;
      gap: 1.5rem;
    }

    ::ng-deep .mode-group .mdc-radio__outer-circle { border-color: #c8a84b !important; }
    ::ng-deep .mode-group .mdc-radio__inner-circle { border-color: #c8a84b !important; }
    ::ng-deep .mode-group .mat-mdc-radio-button.mat-mdc-radio-checked .mdc-form-field { color: #c8a84b; }

    .full-width { width: 100%; }

    /* Jornada mode */
    .jornada-mode {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .jornada-status {
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 8px;
      &.open { color: #10b981; }
    }

    .loading-jornada {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1rem;
      color: #64748b;
      font-size: 0.85rem;
    }

    .jornada-preview {
      background: #f8f9fb;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      margin-bottom: 0.5rem;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .preview-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9rem;
    }

    .preview-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .preview-matches {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 200px;
      overflow-y: auto;
    }

    .preview-match {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 0.8rem;
    }

    .preview-match .match-num {
      min-width: 20px;
      font-weight: 600;
      color: #c8a84b;
      font-size: 0.75rem;
    }

    .preview-match .match-teams {
      color: #475569;
    }

    /* Custom mode */
    .custom-mode {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .autofill-section {
      background: #f8f9fb;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .autofill-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-quiniela {
      color: #c8102e !important;
      border-color: #c8102e !important;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .autofill-sep {
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .league-field {
      flex: 1;
      min-width: 120px;
      max-width: 150px;
    }

    .num-field {
      width: 80px;
    }

    .btn-autofill {
      color: #1e293b !important;
      border-color: #1e293b !important;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    ::ng-deep .autofill-row .mat-mdc-form-field-subscript-wrapper { display: none; }

    .matches-section {
      margin-top: 0.5rem;
    }

    .matches-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      h3 {
        margin: 0;
        font-size: 0.85rem;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }

    .match-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; }
      &:nth-child(even) { background: #fafbfc; }
    }

    .match-row .match-num {
      min-width: 24px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #c8a84b;
      text-align: center;
    }

    .team-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 6px 8px;
      font-size: 0.85rem;
      color: #1e293b;
      outline: none;
      font-family: inherit;

      &:focus {
        background: rgba(200, 168, 75, 0.06);
        border-radius: 4px;
      }

      &::placeholder { color: #cbd5e1; }
    }

    .vs {
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .btn-remove {
      width: 28px;
      height: 28px;
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #94a3b8;
      }
      &:hover mat-icon { color: #ef4444; }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ef4444;
      font-size: 0.85rem;
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: rgba(239, 68, 68, 0.08);
      border-radius: 8px;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }

      .autofill-row {
        flex-direction: column;
        align-items: stretch;
      }

      .league-field, .num-field {
        max-width: 100%;
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateGroupQuinielaDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateGroupQuinielaDialogComponent>);
  private quinielaService = inject(GroupQuinielaService);
  private jornadaService = inject(JornadaService);
  private adminService = inject(AdminService);

  // Mode selection
  mode: 'jornada' | 'custom' = 'jornada';

  // Jornada mode
  jornadas = signal<Jornada[]>([]);
  selectedJornadaId: number | null = null;
  selectedJornadaData: JornadaWithMatches | null = null;
  loadingJornada = signal(false);
  jornadaQuinielaName = '';
  jornadaDeadline: Date | null = null;

  // Custom mode
  customName = '';
  customDescription = '';
  customDeadline: Date | null = null;
  matchRows: MatchRow[] = [];

  // Auto-fill
  selectedCompetition = 'PD';
  apiMatchday = 1;
  loadingAutoFill = signal(false);
  loadingQuiniela = signal(false);

  // Common
  saving = signal(false);
  error = signal('');

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    // Start with 5 empty matches for custom mode
    for (let i = 0; i < 5; i++) {
      this.matchRows.push({ match_number: i + 1, home_team: '', away_team: '' });
    }
  }

  ngOnInit(): void {
    this.loadJornadas();
    this.loadCurrentMatchday();
  }

  private loadJornadas(): void {
    this.jornadaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Show only open jornadas first, then others
          const sorted = [...response.data].sort((a, b) => {
            if (a.status === 'open' && b.status !== 'open') return -1;
            if (a.status !== 'open' && b.status === 'open') return 1;
            return b.id - a.id;
          });
          this.jornadas.set(sorted);
        }
      }
    });
  }

  private loadCurrentMatchday(): void {
    this.adminService.getFootballDataCurrentMatchday(this.selectedCompetition).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.apiMatchday = response.data.matchday;
        }
      },
    });
  }

  onJornadaSelected(): void {
    if (!this.selectedJornadaId) {
      this.selectedJornadaData = null;
      return;
    }

    this.loadingJornada.set(true);
    this.selectedJornadaData = null;

    this.jornadaService.getById(this.selectedJornadaId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedJornadaData = response.data;
          // Pre-fill name with jornada name
          this.jornadaQuinielaName = response.data.name;
          // Pre-fill deadline if jornada has one
          if (response.data.deadline) {
            this.jornadaDeadline = new Date(response.data.deadline);
          }
        }
        this.loadingJornada.set(false);
      },
      error: () => {
        this.loadingJornada.set(false);
        this.error.set('Error al cargar la jornada');
      }
    });
  }

  addMatch(): void {
    const nextNum = this.matchRows.length + 1;
    this.matchRows.push({ match_number: nextNum, home_team: '', away_team: '' });
  }

  removeMatch(index: number): void {
    this.matchRows.splice(index, 1);
    // Renumber
    this.matchRows.forEach((m, i) => m.match_number = i + 1);
  }

  autoFillQuiniela(): void {
    this.loadingQuiniela.set(true);
    this.error.set('');

    this.adminService.getQuinielaMatches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.matchRows = response.data.map((m, i) => ({
            match_number: i + 1,
            home_team: m.home_team,
            away_team: m.away_team,
          }));
        } else {
          this.error.set('No se pudieron obtener los partidos de La Quiniela');
        }
        this.loadingQuiniela.set(false);
      },
      error: () => {
        this.error.set('Error al obtener partidos de La Quiniela');
        this.loadingQuiniela.set(false);
      }
    });
  }

  autoFillMatches(): void {
    if (!this.apiMatchday || this.apiMatchday < 1) {
      this.error.set('Introduce un numero de jornada valido');
      return;
    }

    this.loadingAutoFill.set(true);
    this.error.set('');

    this.adminService.getFootballDataMatches(this.selectedCompetition, this.apiMatchday).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.matchRows = response.data.map((m, i) => ({
            match_number: i + 1,
            home_team: m.home_team,
            away_team: m.away_team,
          }));
        } else {
          this.error.set('No se encontraron partidos');
        }
        this.loadingAutoFill.set(false);
      },
      error: () => {
        this.error.set('Error al obtener partidos de la API');
        this.loadingAutoFill.set(false);
      }
    });
  }

  canCreate(): boolean {
    if (this.mode === 'jornada') {
      return !!(this.selectedJornadaData && this.jornadaQuinielaName.trim() && this.jornadaDeadline);
    } else {
      const validMatches = this.matchRows.filter(m => m.home_team.trim() && m.away_team.trim());
      return !!(this.customName.trim() && this.customDeadline && validMatches.length > 0);
    }
  }

  create(): void {
    if (!this.canCreate()) return;

    this.saving.set(true);
    this.error.set('');

    if (this.mode === 'jornada') {
      this.createFromJornada();
    } else {
      this.createCustom();
    }
  }

  private createFromJornada(): void {
    if (!this.selectedJornadaData || !this.jornadaDeadline) return;

    const deadlineStr = this.jornadaDeadline instanceof Date
      ? this.jornadaDeadline.toISOString()
      : String(this.jornadaDeadline);

    this.quinielaService.create({
      group_id: this.data.groupId,
      name: this.jornadaQuinielaName.trim(),
      deadline: deadlineStr,
      matches: this.selectedJornadaData.matches.map((m, i) => ({
        match_number: i + 1,
        home_team: m.home_team,
        away_team: m.away_team,
      })),
    }).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.dialogRef.close(true);
        } else {
          this.error.set(response.message || 'Error al crear la quiniela');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.error?.message || 'Error al crear la quiniela');
      }
    });
  }

  private createCustom(): void {
    if (!this.customDeadline) return;

    const matches = this.matchRows.filter(m => m.home_team.trim() && m.away_team.trim());

    const deadlineStr = this.customDeadline instanceof Date
      ? this.customDeadline.toISOString()
      : String(this.customDeadline);

    this.quinielaService.create({
      group_id: this.data.groupId,
      name: this.customName.trim(),
      description: this.customDescription.trim() || undefined,
      deadline: deadlineStr,
      matches: matches.map((m, i) => ({
        match_number: i + 1,
        home_team: m.home_team.trim(),
        away_team: m.away_team.trim(),
      })),
    }).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.dialogRef.close(true);
        } else {
          this.error.set(response.message || 'Error al crear la quiniela');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.error?.message || 'Error al crear la quiniela');
      }
    });
  }
}
