import { Request, Response } from 'express';
import { ExportService, ExportFormat, ExportType } from '../services/export.service';
import { sendError } from '../utils/response.util';
import logger from '../config/logger';

export class ExportController {
  /**
   * GET /api/v1/stats/export?format=csv|pdf&type=rankings|predictions&jornadaId=&groupId=
   */
  static async exportData(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const format = req.query.format as ExportFormat;
      const type = req.query.type as ExportType;
      const jornadaId = req.query.jornadaId ? parseInt(req.query.jornadaId as string, 10) : undefined;
      const groupId = req.query.groupId ? parseInt(req.query.groupId as string, 10) : undefined;

      const result = await ExportService.generateExport({
        format,
        type,
        userId,
        jornadaId,
        groupId,
      });

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

      if (Buffer.isBuffer(result.data)) {
        res.setHeader('Content-Length', result.data.length);
        res.end(result.data);
      } else {
        res.send(result.data);
      }
    } catch (err: any) {
      logger.error({ err }, 'Export failed');
      sendError(res, 'EXPORT_ERROR', err.message || 'Failed to generate export', 500);
    }
  }
}
