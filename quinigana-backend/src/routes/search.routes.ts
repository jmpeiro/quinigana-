import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import pool from '../config/database';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    const userId = req.authUser!.userId;

    if (query.length < 2) {
      sendSuccess(res, { groups: [], users: [], jornadas: [] });
      return;
    }

    const searchPattern = `%${query}%`;

    const [groups]: any = await pool.execute(
      `SELECT g.id, g.name, g.description,
        (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) as member_count
       FROM \`groups\` g
       JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
       WHERE g.name LIKE ? AND g.is_active = 1
       LIMIT 5`,
      [userId, searchPattern]
    );

    const [users]: any = await pool.execute(
      `SELECT id, first_name, last_name, avatar_url
       FROM users
       WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)
         AND is_active = 1 AND deleted_at IS NULL
       LIMIT 5`,
      [searchPattern, searchPattern, searchPattern]
    );

    const [jornadas]: any = await pool.execute(
      `SELECT id, name, status, deadline
       FROM jornadas
       WHERE name LIKE ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [searchPattern]
    );

    sendSuccess(res, { groups, users, jornadas });
  } catch (error) {
    logger.error({ error }, 'Search error');
    sendError(res, 'INTERNAL_ERROR', 'Error en la busqueda', 500);
  }
});

export default router;
