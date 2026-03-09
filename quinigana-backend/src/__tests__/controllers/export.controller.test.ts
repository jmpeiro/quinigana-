jest.mock('../../config/environment', () => ({
  env: {
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
  },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../services/export.service');
jest.mock('../../utils/response.util');
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { ExportService } from '../../services/export.service';
import { sendError } from '../../utils/response.util';
import { ExportController } from '../../controllers/export.controller';

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}
function mockReq(overrides: any = {}): any {
  return { body: {}, params: {}, query: {}, cookies: {}, authUser: { userId: 1, email: 'test@test.com' }, ...overrides };
}

describe('ExportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportData', () => {
    it('should export CSV data with correct headers', async () => {
      const csvData = 'name,score\nAlice,10\nBob,8';
      (ExportService.generateExport as jest.Mock).mockResolvedValue({
        contentType: 'text/csv',
        fileName: 'rankings_jornada_1.csv',
        data: csvData,
      });

      const req = mockReq({ query: { format: 'csv', type: 'rankings', jornadaId: '1' } });
      const res = mockRes();
      await ExportController.exportData(req, res);

      expect(ExportService.generateExport).toHaveBeenCalledWith({
        format: 'csv',
        type: 'rankings',
        userId: 1,
        jornadaId: 1,
        groupId: undefined,
      });
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="rankings_jornada_1.csv"',
      );
      expect(res.send).toHaveBeenCalledWith(csvData);
    });

    it('should export PDF data with Content-Length and call res.end', async () => {
      const pdfBuffer = Buffer.from('fake-pdf-content');
      (ExportService.generateExport as jest.Mock).mockResolvedValue({
        contentType: 'application/pdf',
        fileName: 'rankings_jornada_1.pdf',
        data: pdfBuffer,
      });

      const req = mockReq({ query: { format: 'pdf', type: 'rankings', jornadaId: '1' } });
      const res = mockRes();
      await ExportController.exportData(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Length', pdfBuffer.length);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="rankings_jornada_1.pdf"',
      );
      expect(res.end).toHaveBeenCalledWith(pdfBuffer);
    });

    it('should handle errors and return 500 with EXPORT_ERROR', async () => {
      (ExportService.generateExport as jest.Mock).mockRejectedValue(new Error('Generation failed'));

      const req = mockReq({ query: { format: 'csv', type: 'rankings' } });
      const res = mockRes();
      await ExportController.exportData(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'EXPORT_ERROR', 'Generation failed', 500);
    });

    it('should handle errors without message gracefully', async () => {
      (ExportService.generateExport as jest.Mock).mockRejectedValue({});

      const req = mockReq({ query: { format: 'csv', type: 'rankings' } });
      const res = mockRes();
      await ExportController.exportData(req, res);

      expect(sendError).toHaveBeenCalledWith(res, 'EXPORT_ERROR', 'Failed to generate export', 500);
    });

    it('should pass groupId when provided', async () => {
      (ExportService.generateExport as jest.Mock).mockResolvedValue({
        contentType: 'text/csv',
        fileName: 'export.csv',
        data: 'data',
      });

      const req = mockReq({ query: { format: 'csv', type: 'predictions', jornadaId: '2', groupId: '5' } });
      const res = mockRes();
      await ExportController.exportData(req, res);

      expect(ExportService.generateExport).toHaveBeenCalledWith(
        expect.objectContaining({ jornadaId: 2, groupId: 5 }),
      );
    });
  });
});
