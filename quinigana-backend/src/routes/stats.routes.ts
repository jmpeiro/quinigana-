import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', StatsController.getPersonalStats);
router.get('/me/streaks', StatsController.getStreaks);
router.get('/me/predictions', StatsController.getPredictionHistory);
router.get('/me/heatmap', StatsController.getPredictionsHeatmap);
router.get('/export/csv', StatsController.exportCsv);
router.get('/groups/:id/history', StatsController.getGroupHistory);
router.get('/groups/:id/jornadas/:jornadaId', StatsController.getJornadaDetail);
router.get('/groups/:id/rankings', StatsController.getGroupRankings);
router.get('/global-rankings', StatsController.getGlobalRankings);

export default router;
