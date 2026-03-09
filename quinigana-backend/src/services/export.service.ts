import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { StatsModel } from '../models/stats.model';
import logger from '../config/logger';

export type ExportFormat = 'csv' | 'pdf';
export type ExportType = 'rankings' | 'predictions';

export interface ExportRequest {
  format: ExportFormat;
  type: ExportType;
  userId: number;
  jornadaId?: number;
  groupId?: number;
}

// ───── CSV generation ─────

function generateRankingsCsv(rows: any[]): string {
  if (rows.length === 0) return 'No data available';
  const fields = [
    { label: 'Grupo', value: 'groupName' },
    { label: 'Miembros', value: 'memberCount' },
    { label: 'Puntos Totales', value: 'totalPoints' },
    { label: 'Jornadas', value: 'totalJornadas' },
    { label: 'Aciertos 1X2', value: 'correct1x2' },
    { label: 'Plenos', value: 'correctPleno' },
  ];
  const parser = new Parser({ fields });
  return parser.parse(rows);
}

function generatePredictionsCsv(rows: any[]): string {
  if (rows.length === 0) return 'No data available';
  const fields = [
    { label: 'Jornada', value: 'jornadaName' },
    { label: 'Grupo', value: 'groupName' },
    { label: 'Fecha', value: 'finishedAt' },
    { label: 'Puntos', value: 'totalPoints' },
    { label: 'Aciertos 1X2', value: 'correct1x2' },
    { label: 'Plenos', value: 'correctPleno' },
  ];
  const parser = new Parser({ fields });
  return parser.parse(rows);
}

// ───── PDF generation ─────

function generateRankingsPdf(rows: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('QuiniGana - Rankings', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(1);

    if (rows.length === 0) {
      doc.fontSize(12).text('No hay datos disponibles.', { align: 'center' });
      doc.end();
      return;
    }

    // Table header
    const colWidths = [30, 140, 60, 70, 70, 60, 60];
    const headers = ['#', 'Grupo', 'Miembros', 'Puntos', 'Jornadas', '1X2', 'Plenos'];
    const startX = 40;
    let y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(header, x, y, { width: colWidths[i], align: 'left' });
    });
    y += 18;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
    y += 6;

    // Table rows
    doc.font('Helvetica').fontSize(9);
    rows.forEach((row, idx) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
      const values = [
        String(idx + 1),
        String(row.groupName || row.group_name || '-'),
        String(row.memberCount || row.member_count || '-'),
        String(row.totalPoints || row.total_points || 0),
        String(row.totalJornadas || row.total_jornadas || 0),
        String(row.correct1x2 || row.correct_1x2 || 0),
        String(row.correctPleno || row.correct_pleno || 0),
      ];
      values.forEach((val, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(val, x, y, { width: colWidths[i], align: 'left' });
      });
      y += 16;
    });

    doc.end();
  });
}

function generatePredictionsPdf(rows: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text('QuiniGana - Historial de Predicciones', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
    doc.moveDown(1);

    if (rows.length === 0) {
      doc.fontSize(12).text('No hay datos disponibles.', { align: 'center' });
      doc.end();
      return;
    }

    // Table header
    const colWidths = [30, 150, 120, 100, 70, 70, 70];
    const headers = ['#', 'Jornada', 'Grupo', 'Fecha', 'Puntos', '1X2', 'Plenos'];
    const startX = 40;
    let y = doc.y;

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(header, x, y, { width: colWidths[i], align: 'left' });
    });
    y += 18;
    doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
    y += 6;

    // Table rows
    doc.font('Helvetica').fontSize(9);
    rows.forEach((row, idx) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
      }
      const dateStr = row.finishedAt
        ? new Date(row.finishedAt).toLocaleDateString('es-ES')
        : '-';
      const values = [
        String(idx + 1),
        String(row.jornadaName || '-'),
        String(row.groupName || '-'),
        dateStr,
        String(row.totalPoints || 0),
        String(row.correct1x2 || 0),
        String(row.correctPleno || 0),
      ];
      values.forEach((val, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(val, x, y, { width: colWidths[i], align: 'left' });
      });
      y += 16;
    });

    doc.end();
  });
}

// ───── Public API ─────

export class ExportService {
  /**
   * Generate an export in the requested format.
   * Returns { contentType, fileName, data } where data is a string (CSV) or Buffer (PDF).
   */
  static async generateExport(request: ExportRequest): Promise<{
    contentType: string;
    fileName: string;
    data: string | Buffer;
  }> {
    const { format, type, userId, groupId } = request;

    let rows: any[];

    if (type === 'rankings') {
      // Use global rankings or group rankings
      if (groupId) {
        rows = await StatsModel.getGroupRankings(groupId);
      } else {
        const result = await StatsModel.getGlobalRankings(1, 500);
        rows = result.items.map((item: any) => ({
          groupName: item.group_name,
          memberCount: Number(item.member_count),
          totalPoints: Number(item.total_points),
          totalJornadas: Number(item.total_jornadas),
          correct1x2: Number(item.correct_1x2),
          correctPleno: Number(item.correct_pleno),
        }));
      }
    } else {
      // predictions
      const result = await StatsModel.getPredictionHistory(userId, 1, 500);
      rows = result.items.map((item: any) => ({
        jornadaName: item.jornadaName,
        groupName: item.groupName,
        finishedAt: item.finishedAt,
        totalPoints: Number(item.totalPoints),
        correct1x2: Number(item.correct1x2),
        correctPleno: Number(item.correctPleno),
      }));
    }

    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      const csvData = type === 'rankings'
        ? generateRankingsCsv(rows)
        : generatePredictionsCsv(rows);
      return {
        contentType: 'text/csv; charset=utf-8',
        fileName: `quinigana-${type}-${timestamp}.csv`,
        data: csvData,
      };
    }

    // PDF
    const pdfBuffer = type === 'rankings'
      ? await generateRankingsPdf(rows)
      : await generatePredictionsPdf(rows);

    return {
      contentType: 'application/pdf',
      fileName: `quinigana-${type}-${timestamp}.pdf`,
      data: pdfBuffer,
    };
  }
}
