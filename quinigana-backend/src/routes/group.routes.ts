import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { InvitationController } from '../controllers/invitation.controller';
import { ComparisonController } from '../controllers/comparison.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { groupMemberMiddleware, groupAdminMiddleware } from '../middlewares/group-role.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createGroupValidator, updateGroupValidator, inviteUserValidator } from '../validators/group.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Group CRUD
router.post('/', createGroupValidator, validateRequest, GroupController.create);
router.get('/', GroupController.getMyGroups);
router.get('/:id', groupMemberMiddleware, GroupController.getDetail);
router.patch('/:id', groupAdminMiddleware, updateGroupValidator, validateRequest, GroupController.update);
router.delete('/:id', groupAdminMiddleware, GroupController.delete);

// Members
router.get('/:id/members', groupMemberMiddleware, GroupController.getMembers);
router.delete('/:id/members/:userId', groupAdminMiddleware, GroupController.removeMember);
router.post('/:id/leave', groupMemberMiddleware, GroupController.leave);

// Activity
router.get('/:id/activity', groupMemberMiddleware, GroupController.getActivity);

// Invitations (from group context)
router.post('/:id/invitations', groupMemberMiddleware, inviteUserValidator, validateRequest, InvitationController.invite);

// Jornada comparison (live ranking and detailed comparison)
router.get('/:id/jornadas/:jornadaId/ranking', groupMemberMiddleware, ComparisonController.getGroupJornadaRanking);
router.get('/:id/jornadas/:jornadaId/comparison', groupMemberMiddleware, ComparisonController.getGroupJornadaComparison);

export default router;
