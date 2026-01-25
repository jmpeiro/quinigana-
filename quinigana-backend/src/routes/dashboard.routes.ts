import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, DashboardController.getDashboard);
router.get('/standings', authMiddleware, DashboardController.getStandings);

export default router;
