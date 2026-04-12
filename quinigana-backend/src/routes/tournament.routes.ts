import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { TournamentService } from '../services/tournament.service';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

const router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { group_id, name, bracket_size } = req.body;
    const id = await TournamentService.create(group_id, name, bracket_size || 8, req.authUser!.userId);
    sendSuccess(res, { id }, 'Torneo creado', 201);
  } catch (err: any) {
    if (err.statusCode) { sendError(res, err.code, err.message, err.statusCode); return; }
    logger.error({ error: err }, 'Create tournament error');
    sendError(res, 'INTERNAL_ERROR', 'Error al crear torneo', 500);
  }
});

router.post('/:id/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    await TournamentService.join(parseInt(req.params.id as string), req.authUser!.userId);
    sendSuccess(res, null, 'Inscrito en el torneo');
  } catch (err: any) {
    if (err.statusCode) { sendError(res, err.code, err.message, err.statusCode); return; }
    logger.error({ error: err }, 'Join tournament error');
    sendError(res, 'INTERNAL_ERROR', 'Error al unirse al torneo', 500);
  }
});

router.get('/:id/bracket', authMiddleware, async (req: Request, res: Response) => {
  try {
    const bracket = await TournamentService.getBracket(parseInt(req.params.id as string));
    sendSuccess(res, bracket);
  } catch (err: any) {
    if (err.statusCode) { sendError(res, err.code, err.message, err.statusCode); return; }
    logger.error({ error: err }, 'Get bracket error');
    sendError(res, 'INTERNAL_ERROR', 'Error al obtener bracket', 500);
  }
});

router.get('/group/:groupId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tournaments = await TournamentService.getGroupTournaments(parseInt(req.params.groupId as string));
    sendSuccess(res, tournaments);
  } catch (err) {
    logger.error({ error: err }, 'Get group tournaments error');
    sendError(res, 'INTERNAL_ERROR', 'Error al obtener torneos', 500);
  }
});

export default router;
