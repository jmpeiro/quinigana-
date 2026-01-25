import pool from '../config/database';
import { BadgeDefinition, UserBadgeWithDetails, UserXp } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class GamificationModel {
  static async getAllBadgeDefinitions(): Promise<BadgeDefinition[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM badge_definitions ORDER BY sort_order ASC'
    );
    return rows as BadgeDefinition[];
  }

  static async getBadgeByCode(code: string): Promise<BadgeDefinition | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM badge_definitions WHERE code = ?',
      [code]
    );
    return rows.length > 0 ? (rows[0] as BadgeDefinition) : null;
  }

  static async getUserBadges(userId: number): Promise<UserBadgeWithDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ub.id, ub.user_id, ub.badge_id, ub.earned_at, ub.seen,
        bd.id as b_id, bd.code as b_code, bd.name as b_name, bd.description as b_description,
        bd.icon as b_icon, bd.category as b_category, bd.tier as b_tier,
        bd.xp_reward as b_xp_reward, bd.sort_order as b_sort_order
       FROM user_badges ub
       INNER JOIN badge_definitions bd ON ub.badge_id = bd.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );
    return rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      badge_id: row.badge_id,
      earned_at: row.earned_at,
      seen: !!row.seen,
      badge: {
        id: row.b_id,
        code: row.b_code,
        name: row.b_name,
        description: row.b_description,
        icon: row.b_icon,
        category: row.b_category,
        tier: row.b_tier,
        xp_reward: row.b_xp_reward,
        sort_order: row.b_sort_order,
      },
    }));
  }

  static async getUserBadgeCodes(userId: number): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT bd.code FROM user_badges ub
       INNER JOIN badge_definitions bd ON ub.badge_id = bd.id
       WHERE ub.user_id = ?`,
      [userId]
    );
    return rows.map((r: any) => r.code);
  }

  static async awardBadge(userId: number, badgeId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badgeId]
      );
      return result.affectedRows > 0;
    } catch {
      return false;
    }
  }

  static async getUnseenCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM user_badges WHERE user_id = ? AND seen = FALSE',
      [userId]
    );
    return (rows[0] as any).count;
  }

  static async markAllSeen(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE user_badges SET seen = TRUE WHERE user_id = ? AND seen = FALSE',
      [userId]
    );
  }

  static async getUserXp(userId: number): Promise<UserXp> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM user_xp WHERE user_id = ?',
      [userId]
    );
    if (rows.length > 0) {
      return rows[0] as UserXp;
    }
    return { user_id: userId, total_xp: 0, level: 1 };
  }

  static async ensureUserXp(userId: number): Promise<void> {
    await pool.execute(
      'INSERT IGNORE INTO user_xp (user_id, total_xp, level) VALUES (?, 0, 1)',
      [userId]
    );
  }

  static async addXp(userId: number, amount: number, source: string, referenceId: number | null, newLevel: number): Promise<void> {
    await pool.execute(
      'INSERT INTO xp_log (user_id, xp_amount, source, reference_id) VALUES (?, ?, ?, ?)',
      [userId, amount, source, referenceId]
    );
    await pool.execute(
      'UPDATE user_xp SET total_xp = total_xp + ?, level = ? WHERE user_id = ?',
      [amount, newLevel, userId]
    );
  }

  static async getProposalCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM quiniela_proposals WHERE proposed_by = ?',
      [userId]
    );
    return Number((rows[0] as any).count);
  }

  static async getVoteCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM proposal_votes WHERE user_id = ?',
      [userId]
    );
    return Number((rows[0] as any).count);
  }

  static async getJornadaParticipants(jornadaId: number): Promise<number[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT gm.user_id
       FROM group_members gm
       INNER JOIN quiniela_proposals qp ON qp.group_id = gm.group_id
       WHERE qp.jornada_id = ? AND qp.status = 'approved'`,
      [jornadaId]
    );
    return rows.map((r: any) => r.user_id);
  }

  static async getJornadaCorrects(jornadaId: number, userId: number): Promise<{ correct1x2: number; correctPleno: number; doubles1x2: number }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        SUM(CASE WHEN qr.points_1x2 > 0 AND LENGTH(pp.prediction_1x2) = 1 THEN 1 ELSE 0 END) as correct1x2,
        SUM(CASE WHEN qr.points_1x2 > 0 AND LENGTH(pp.prediction_1x2) = 2 THEN 1 ELSE 0 END) as doubles1x2,
        SUM(CASE WHEN qr.points_pleno > 0 THEN 1 ELSE 0 END) as correctPleno
       FROM quiniela_results qr
       INNER JOIN proposal_predictions pp ON pp.proposal_id = qr.proposal_id AND pp.match_id = qr.match_id
       INNER JOIN quiniela_proposals qp ON qp.id = qr.proposal_id
       INNER JOIN group_members gm ON gm.group_id = qp.group_id AND gm.user_id = ?
       WHERE qr.jornada_id = ? AND qp.status = 'approved'`,
      [userId, jornadaId]
    );
    const row = rows[0] as any;
    return {
      correct1x2: Number(row?.correct1x2 || 0),
      correctPleno: Number(row?.correctPleno || 0),
      doubles1x2: Number(row?.doubles1x2 || 0),
    };
  }

  static async isGroupChampion(userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gm.group_id FROM group_members gm
       WHERE gm.user_id = ?`,
      [userId]
    );
    for (const row of rows) {
      const groupId = (row as any).group_id;
      const [rankRows] = await pool.execute<RowDataPacket[]>(
        `SELECT gm.user_id,
          COALESCE(SUM(gs.total_points), 0) as total_points
         FROM group_members gm
         LEFT JOIN group_scores gs ON gs.group_id = gm.group_id
           AND EXISTS (
             SELECT 1 FROM quiniela_proposals qp
             WHERE qp.group_id = gm.group_id AND qp.jornada_id = gs.jornada_id AND qp.status = 'approved'
             AND EXISTS (SELECT 1 FROM group_members gm2 WHERE gm2.group_id = qp.group_id AND gm2.user_id = gm.user_id)
           )
         WHERE gm.group_id = ?
         GROUP BY gm.user_id
         HAVING total_points > 0
         ORDER BY total_points DESC
         LIMIT 1`,
        [groupId]
      );
      if (rankRows.length > 0 && (rankRows[0] as any).user_id === userId) {
        return true;
      }
    }
    return false;
  }
}
