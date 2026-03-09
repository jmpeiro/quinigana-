import { Router } from 'express';
import authRoutes from '../auth.routes';
import userRoutes from '../user.routes';
import groupRoutes from '../group.routes';
import invitationRoutes from '../invitation.routes';
import inviteLinkRoutes from '../invite-link.routes';
import jornadaRoutes from '../jornada.routes';
import proposalRoutes from '../proposal.routes';
import dashboardRoutes from '../dashboard.routes';
import adminRoutes from '../admin.routes';
import notificationRoutes from '../notification.routes';
import statsRoutes from '../stats.routes';
import pushRoutes from '../push.routes';
import gamificationRoutes from '../gamification.routes';
import seasonRoutes from '../season.routes';
import challengeRoutes from '../challenge.routes';
import leagueRoutes from '../league.routes';
import groupQuinielaRoutes from '../group-quiniela.routes';
import healthRoutes from '../health.routes';
import exportRoutes from '../export.routes';
import proposalSearchRoutes from '../proposal-search.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/invitations', invitationRoutes);
router.use('/invite-links', inviteLinkRoutes);
router.use('/jornadas', jornadaRoutes);
router.use('/proposals', proposalSearchRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);
router.use('/stats', statsRoutes);
router.use('/stats', exportRoutes);
router.use('/push', pushRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/seasons', seasonRoutes);
router.use('/challenges', challengeRoutes);
router.use('/leagues', leagueRoutes);
router.use('/group-quinielas', groupQuinielaRoutes);
// Proposals and scores are nested under /groups
router.use('/groups', proposalRoutes);

export default router;
