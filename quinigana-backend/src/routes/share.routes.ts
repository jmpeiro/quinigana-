import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import pool from '../config/database';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

const router = Router();

// Get shareable stats card data
router.get('/stats-card', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser!.userId;

    const [user]: any = await pool.execute(
      'SELECT first_name, last_name, avatar_url FROM users WHERE id = ?',
      [userId]
    );

    if (!user.length) {
      sendError(res, 'NOT_FOUND', 'User not found', 404);
      return;
    }

    const [scores]: any = await pool.execute(
      `SELECT COUNT(*) as totalPredictions, COALESCE(SUM(points), 0) as totalPoints
       FROM scores WHERE user_id = ?`,
      [userId]
    );

    const [gamification]: any = await pool.execute(
      'SELECT level, xp, streak FROM gamification_profiles WHERE user_id = ?',
      [userId]
    );

    const [badges]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ?',
      [userId]
    );

    const [rank]: any = await pool.execute(
      `SELECT COUNT(*) + 1 as userRank FROM (
         SELECT user_id, SUM(points) as total
         FROM scores
         GROUP BY user_id
         HAVING total > (SELECT COALESCE(SUM(points), 0) FROM scores WHERE user_id = ?)
       ) as ranked`,
      [userId]
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
        rank: rank[0]?.userRank || 1,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching stats card');
    sendError(res, 'INTERNAL_ERROR', 'Failed to fetch stats card data', 500);
  }
});

export default router;
