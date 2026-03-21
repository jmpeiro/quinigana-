import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { PredictionAnalysisService } from '../services/prediction-analysis.service';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

const router = Router();

router.get('/jornada/:jornadaId/suggestions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const jornadaId = parseInt(req.params.jornadaId);
    if (isNaN(jornadaId)) { sendError(res, 'INVALID_ID', 'ID de jornada invalido', 400); return; }
    const suggestions = await PredictionAnalysisService.getJornadaSuggestions(jornadaId);
    sendSuccess(res, suggestions);
  } catch (error) {
    logger.error({ error }, 'Error getting prediction suggestions');
    sendError(res, 'INTERNAL_ERROR', 'Error al obtener sugerencias', 500);
  }
});

export default router;
