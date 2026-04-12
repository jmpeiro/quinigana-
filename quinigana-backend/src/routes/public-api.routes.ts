import { Router, Request, Response } from 'express';
import { apiKeyMiddleware } from '../middlewares/api-key.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ApiKeyService } from '../services/api-key.service';
import pool from '../config/database';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

const router = Router();

// --- API Key Management (requires JWT auth) ---

router.get('/keys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const keys = await ApiKeyService.listUserKeys(req.authUser!.userId);
    sendSuccess(res, keys);
  } catch (error) {
    logger.error({ error }, 'Error listing API keys');
    sendError(res, 'INTERNAL_ERROR', 'Failed to list API keys', 500);
  }
});

router.post('/keys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, permissions } = req.body;
    if (!name || typeof name !== 'string' || name.length > 100) {
      sendError(res, 'VALIDATION_ERROR', 'Name is required and must be at most 100 characters');
      return;
    }

    const validPermissions = ['read'];
    const perms = Array.isArray(permissions)
      ? permissions.filter((p: string) => validPermissions.includes(p))
      : ['read'];

    const key = await ApiKeyService.create(req.authUser!.userId, name.trim(), perms);
    sendSuccess(res, { key }, 'API key created. Save this key securely, it will not be shown again.', 201);
  } catch (error) {
    logger.error({ error }, 'Error creating API key');
    sendError(res, 'INTERNAL_ERROR', 'Failed to create API key', 500);
  }
});

router.delete('/keys/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const keyId = parseInt(req.params.id as string, 10);
    if (isNaN(keyId)) {
      sendError(res, 'VALIDATION_ERROR', 'Invalid key ID');
      return;
    }
    await ApiKeyService.revoke(keyId, req.authUser!.userId);
    sendSuccess(res, null, 'API key revoked');
  } catch (error) {
    logger.error({ error }, 'Error revoking API key');
    sendError(res, 'INTERNAL_ERROR', 'Failed to revoke API key', 500);
  }
});

// --- Public Read-Only Endpoints (requires API key) ---

router.get('/standings', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT u.id, u.first_name, u.last_name, u.avatar_url,
              COALESCE(SUM(s.points), 0) as totalPoints,
              COUNT(s.id) as totalPredictions
       FROM users u
       LEFT JOIN scores s ON u.id = s.user_id
       WHERE u.is_active = 1 AND u.deleted_at IS NULL
       GROUP BY u.id
       ORDER BY totalPoints DESC
       LIMIT 100`
    );
    sendSuccess(res, rows);
  } catch (error) {
    logger.error({ error }, 'Public API standings error');
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch standings', 500);
  }
});

router.get('/jornadas', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT id, name, number, start_date, end_date, status, season_id
       FROM jornadas
       ORDER BY number DESC
       LIMIT 50`
    );
    sendSuccess(res, rows);
  } catch (error) {
    logger.error({ error }, 'Public API jornadas error');
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch jornadas', 500);
  }
});

router.get('/jornadas/:id/results', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const jornadaId = parseInt(req.params.id as string, 10);
    if (isNaN(jornadaId)) {
      sendError(res, 'VALIDATION_ERROR', 'Invalid jornada ID');
      return;
    }

    const [matches]: any = await pool.execute(
      `SELECT id, home_team, away_team, home_score, away_score, result, match_date
       FROM matches
       WHERE jornada_id = ?
       ORDER BY match_date ASC`,
      [jornadaId]
    );

    sendSuccess(res, matches);
  } catch (error) {
    logger.error({ error }, 'Public API jornada results error');
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch jornada results', 500);
  }
});

router.get('/users/:id/stats', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id as string, 10);
    if (isNaN(targetUserId)) {
      sendError(res, 'VALIDATION_ERROR', 'Invalid user ID');
      return;
    }

    const [user]: any = await pool.execute(
      'SELECT id, first_name, last_name, avatar_url FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL',
      [targetUserId]
    );

    if (!user.length) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }

    const [scores]: any = await pool.execute(
      `SELECT COUNT(*) as totalPredictions, COALESCE(SUM(points), 0) as totalPoints
       FROM scores WHERE user_id = ?`,
      [targetUserId]
    );

    const [gamification]: any = await pool.execute(
      'SELECT level, xp, streak FROM gamification_profiles WHERE user_id = ?',
      [targetUserId]
    );

    const [badges]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?',
      [targetUserId]
    );

    sendSuccess(res, {
      user: user[0],
      stats: {
        totalPoints: scores[0]?.totalPoints || 0,
        totalPredictions: scores[0]?.totalPredictions || 0,
        level: gamification[0]?.level || 1,
        xp: gamification[0]?.xp || 0,
        streak: gamification[0]?.streak || 0,
        badges: badges[0]?.count || 0,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Public API user stats error');
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch user stats', 500);
  }
});

router.get('/groups/:id/rankings', apiKeyMiddleware, async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(req.params.id as string, 10);
    const userId = req.authUser!.userId;

    if (isNaN(groupId)) {
      sendError(res, 'VALIDATION_ERROR', 'Invalid group ID');
      return;
    }

    // Check membership
    const [membership]: any = await pool.execute(
      'SELECT id FROM group_members WHERE group_id = ? AND user_id = ? AND status = ?',
      [groupId, userId, 'active']
    );

    if (!membership.length) {
      sendError(res, 'FORBIDDEN', 'You must be a member of this group', 403);
      return;
    }

    const [rankings]: any = await pool.execute(
      `SELECT u.id, u.first_name, u.last_name, u.avatar_url,
              COALESCE(SUM(s.points), 0) as totalPoints,
              COUNT(s.id) as totalPredictions
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       LEFT JOIN scores s ON u.id = s.user_id AND s.group_id = ?
       WHERE gm.group_id = ? AND gm.status = 'active'
       GROUP BY u.id
       ORDER BY totalPoints DESC`,
      [groupId, groupId]
    );

    sendSuccess(res, rankings);
  } catch (error) {
    logger.error({ error }, 'Public API group rankings error');
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch group rankings', 500);
  }
});

export default router;
