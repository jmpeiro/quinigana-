import { Router } from 'express';
import { LeagueController } from '../controllers/league.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// Public routes (require auth)
router.use(authMiddleware);

router.get('/divisions', LeagueController.getDivisions);
router.get('/season', LeagueController.getActiveSeason);
router.get('/me', LeagueController.getMyProfile);
router.get('/history', LeagueController.getMyHistory);
router.get('/standings/:divisionId', LeagueController.getDivisionStandings);

// Admin routes
router.post('/seasons', adminMiddleware, LeagueController.createSeason);
router.post('/seasons/:seasonId/activate', adminMiddleware, LeagueController.activateSeason);
router.post('/seasons/:seasonId/end', adminMiddleware, LeagueController.endSeason);
router.post(
  '/seasons/:newSeasonId/initialize-from/:previousSeasonId',
  adminMiddleware,
  LeagueController.initializeFromPrevious
);

export default router;
