import { Router } from 'express';
import { JornadaController } from '../controllers/jornada.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createJornadaValidator, updateJornadaStatusValidator, submitResultsValidator } from '../validators/jornada.validator';

const router = Router();

// Public routes (authenticated)
router.use(authMiddleware);
router.get('/', JornadaController.getAll);
router.get('/active', JornadaController.getActive);
router.get('/:id/live-scores', JornadaController.getLiveScores);
router.get('/:id/my-predictions', JornadaController.getMyPredictions);
router.get('/:id', JornadaController.getById);

// Admin routes
router.post('/', adminMiddleware, createJornadaValidator, validateRequest, JornadaController.create);
router.patch('/:id', adminMiddleware, updateJornadaStatusValidator, validateRequest, JornadaController.updateStatus);
router.post('/:id/results', adminMiddleware, submitResultsValidator, validateRequest, JornadaController.submitResults);
router.delete('/:id', adminMiddleware, JornadaController.delete);

export default router;
