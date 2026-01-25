import { Router } from 'express';
import { SeasonController } from '../controllers/season.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// Public routes (authenticated users can view seasons)
router.use(authMiddleware);
router.get('/', SeasonController.getAll);
router.get('/current', SeasonController.getCurrent);
router.get('/:id', SeasonController.getById);
router.get('/:id/stats', SeasonController.getStats);

// Admin routes
router.post('/', adminMiddleware, SeasonController.create);
router.put('/:id', adminMiddleware, SeasonController.update);
router.delete('/:id', adminMiddleware, SeasonController.delete);
router.post('/:id/set-current', adminMiddleware, SeasonController.setAsCurrent);

export default router;
