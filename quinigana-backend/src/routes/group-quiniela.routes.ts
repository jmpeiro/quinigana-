import { Router } from 'express';
import { GroupQuinielaController } from '../controllers/group-quiniela.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Get user's active quinielas from all groups
router.get('/active', GroupQuinielaController.getMyActiveQuinielas);

// Get all quinielas for a group
router.get('/group/:groupId', GroupQuinielaController.getByGroup);

// Get quiniela details with matches
router.get('/:id', GroupQuinielaController.getById);

// Get ranking for a quiniela
router.get('/:id/ranking', GroupQuinielaController.getRanking);

// Get all members' predictions for comparison
router.get('/:id/members-predictions', GroupQuinielaController.getMembersPredictions);

// Create a new quiniela
router.post('/', GroupQuinielaController.create);

// Save predictions
router.post('/:id/predictions', GroupQuinielaController.savePredictions);

// Submit results (admin/creator)
router.post('/:id/results', GroupQuinielaController.submitResults);

// Close quiniela (admin/creator)
router.patch('/:id/close', GroupQuinielaController.close);

// Delete quiniela (admin/creator)
router.delete('/:id', GroupQuinielaController.delete);

export default router;
