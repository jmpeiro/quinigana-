import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// Users
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/toggle-admin', AdminController.toggleAdmin);
router.patch('/users/:id/toggle-active', AdminController.toggleUserActive);

// Stats
router.get('/stats', AdminController.getGlobalStats);
router.get('/ops', AdminController.getOpsMetrics);

// Groups
router.get('/groups', AdminController.getAllGroups);
router.patch('/groups/:id/deactivate', AdminController.deactivateGroup);

// Jornada/Match management
router.patch('/matches/:id', AdminController.updateMatch);
router.patch('/jornadas/:id/reopen', AdminController.reopenJornada);

// Football Data API
router.get('/football-data/matches', AdminController.getFootballDataMatches);
router.get('/football-data/results', AdminController.getFootballDataResults);
router.get('/football-data/current-matchday', AdminController.getFootballDataCurrentMatchday);
router.get('/football-data/competitions', AdminController.getFootballDataCompetitions);

// Quiniela scraping
router.get('/quiniela/matches', AdminController.getQuinielaMatches);

export default router;
