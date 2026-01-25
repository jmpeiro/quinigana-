import { Router } from 'express';
import { ProposalController } from '../controllers/proposal.controller';
import { ScoreController } from '../controllers/score.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { groupMemberMiddleware } from '../middlewares/group-role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProposalValidator, updateProposalValidator, voteValidator } from '../validators/proposal.validator';

const router = Router();

router.use(authMiddleware);

// Proposals
router.post('/:groupId/proposals', groupMemberMiddleware, createProposalValidator, validateRequest, ProposalController.create);
router.get('/:groupId/proposals', groupMemberMiddleware, ProposalController.getByGroup);
router.get('/:groupId/proposals/:id', groupMemberMiddleware, ProposalController.getDetail);
router.patch('/:groupId/proposals/:id', groupMemberMiddleware, updateProposalValidator, validateRequest, ProposalController.update);
router.delete('/:groupId/proposals/:id', groupMemberMiddleware, ProposalController.delete);
router.post('/:groupId/proposals/:id/submit', groupMemberMiddleware, ProposalController.submit);
router.post('/:groupId/proposals/:id/vote', groupMemberMiddleware, voteValidator, validateRequest, ProposalController.vote);

// Comments
router.get('/:groupId/proposals/:id/comments', groupMemberMiddleware, ProposalController.getComments);
router.post('/:groupId/proposals/:id/comments', groupMemberMiddleware, ProposalController.addComment);
router.delete('/:groupId/proposals/:id/comments/:commentId', groupMemberMiddleware, ProposalController.deleteComment);

// Scores
router.get('/:id/scores', groupMemberMiddleware, ScoreController.getGroupScores);
router.get('/:id/scores/:jornadaId', groupMemberMiddleware, ScoreController.getGroupScoreByJornada);

export default router;
