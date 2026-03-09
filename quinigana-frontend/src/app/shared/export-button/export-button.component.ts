import { Component, input, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

export type ExportFormat = 'csv' | 'pdf';
export type ExportType = 'rankings' | 'predictions';

@Component({
  selector: 'app-export-button',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="export-wrapper">
      @if (exporting()) {
        <mat-spinner diameter="24"></mat-spinner>
      } @else {
        <button
          mat-stroked-button
          class="export-btn"
          [matMenuTriggerFor]="exportMenu"
          [disabled]="exporting()"
        >
          <mat-icon>download</mat-icon>
          Exportar
        </button>
        <mat-menu #exportMenu="matMenu">
          <button mat-menu-item (click)="exportData('csv')">
            <mat-icon>table_chart</mat-icon>
            <span>Exportar CSV</span>
          </button>
          <button mat-menu-item (click)="exportData('pdf')">
            <mat-icon>picture_as_pdf</mat-icon>
            <span>Exportar PDF</span>
          </button>
        </mat-menu>
      }
    </div>
  `,
  styles: [`
    .export-wrapper {
      display: inline-flex;
      align-items: center;
    }

    .export-btn {
      border-color: #e2e8f0 !important;
      color: #64748b !important;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;

      &:hover {
        border-color: #c8a84b !important;
        color: #c8a84b !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportButtonComponent {
  /** Type of export: 'rankings' or 'predictions' */
  exportType = input<ExportType>('rankings');

  /** Optional jornada ID filter */
  jornadaId = input<number | undefined>(undefined);

  /** Optional group ID filter */
  groupId = input<number | undefined>(undefined);

  exporting = signal(false);

  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private apiUrl = environment.apiUrl;

  exportData(format: ExportFormat): void {
    this.exporting.set(true);

    const params = new URLSearchParams();
    params.set('format', format);
    params.set('type', this.exportType());

    const jornadaId = this.jornadaId();
    if (jornadaId !== undefined) {
      params.set('jornadaId', jornadaId.toString());
    }

    const groupId = this.groupId();
    if (groupId !== undefined) {
      params.set('groupId', groupId.toString());
    }

    const url = `${this.apiUrl}/stats/export?${params.toString()}`;

    this.http.get(url, { responseType: 'blob', observe: 'response' }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          this.snackBar.open('Error al descargar el archivo', 'OK', { duration: 4000 });
          this.exporting.set(false);
          return;
        }

        // Extract filename from Content-Disposition header or generate default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `export-${this.exportType()}.${format}`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            filename = match[1].replace(/['"]/g, '');
          }
        }

        // Trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(blobUrl);

        this.snackBar.open('Archivo descargado correctamente', 'OK', { duration: 3000 });
        this.exporting.set(false);
      },
      error: (err) => {
        const message = err?.status === 404
          ? 'No hay datos disponibles para exportar'
          : 'Error al exportar los datos';
        this.snackBar.open(message, 'OK', { duration: 4000, panelClass: 'snackbar-error' });
        this.exporting.set(false);
      },
    });
  }
}
