import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import logger from '../config/logger';

export class DashboardModel {
  static async getActiveJornada(userId: number): Promise<{
    id: number;
    name: string;
    deadline: Date;
    matchCount: number;
    status: string;
  } | null> {
    try {
      // Only return jornada if user belongs to a group with an approved proposal for it
      // Show both 'open' and 'closed' jornadas (hide only 'finished')
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT j.id, j.name, j.deadline, j.status,
                (SELECT COUNT(*) FROM matches WHERE jornada_id = j.id) as matchCount
         FROM jornadas j
         WHERE j.status IN ('open', 'closed')
           AND EXISTS (
             SELECT 1 FROM quiniela_proposals qp
             INNER JOIN group_members gm ON qp.group_id = gm.group_id
             WHERE qp.jornada_id = j.id
               AND qp.status = 'approved'
               AND gm.user_id = ?
           )
         ORDER BY (j.status = 'open') DESC, j.deadline DESC
         LIMIT 1`,
        [userId]
      );
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        id: row.id,
        name: row.name,
        deadline: row.deadline,
        matchCount: row.matchCount,
        status: row.status,
      };
    } catch (error) {
      logger.error({ error }, 'Error in getActiveJornada');
      throw error;
    }
  }

  static async getUserGroupsWithScores(userId: number): Promise<Array<{
    id: number;
    name: string;
    totalPoints: number;
    rank: number;
    memberCount: number;
  }>> {
    try {
      const [groups] = await pool.execute<RowDataPacket[]>(
        `SELECT g.id, g.name,
                COALESCE(SUM(gs.total_points), 0) as totalPoints,
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as memberCount
         FROM \`groups\` g
         INNER JOIN group_members gm ON g.id = gm.group_id
         LEFT JOIN group_scores gs ON g.id = gs.group_id
         WHERE gm.user_id = ? AND g.is_active = TRUE
         GROUP BY g.id, g.name
         ORDER BY totalPoints DESC`,
        [userId]
      );
      return groups.map((row, index) => ({
        id: row.id,
        name: row.name,
        totalPoints: Number(row.totalPoints),
        rank: index + 1,
        memberCount: row.memberCount,
      }));
    } catch (error) {
      logger.error({ error }, 'Error in getUserGroupsWithScores');
      throw error;
    }
  }

  static async getLatestResults(userId: number, limit: number = 5): Promise<Array<{
    jornadaId: number;
    jornadaName: string;
    totalPoints: number;
    correct1x2: number;
    correctPleno: number;
    groupName: string;
  }>> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT gs.jornada_id as jornadaId, j.name as jornadaName,
                gs.total_points as totalPoints, gs.correct_1x2 as correct1x2,
                gs.correct_pleno as correctPleno, g.name as groupName
         FROM group_scores gs
         INNER JOIN jornadas j ON gs.jornada_id = j.id
         INNER JOIN \`groups\` g ON gs.group_id = g.id
         INNER JOIN group_members gm ON g.id = gm.group_id AND gm.user_id = ?
         WHERE j.status = 'finished'
         ORDER BY j.updated_at DESC
         LIMIT ?`,
        [userId, limit]
      );
      return rows.map(row => ({
        jornadaId: row.jornadaId,
        jornadaName: row.jornadaName,
        totalPoints: row.totalPoints,
        correct1x2: row.correct1x2,
        correctPleno: row.correctPleno,
        groupName: row.groupName,
      }));
    } catch (error) {
      logger.error({ error }, 'Error in getLatestResults');
      throw error;
    }
  }

  static async getUserStats(userId: number): Promise<{
    totalPoints: number;
    accuracy1x2Percent: number;
    accuracyPlenoPercent: number;
    groupCount: number;
    jornadasPlayed: number;
  }> {
    try {
      const [statsRows] = await pool.execute<RowDataPacket[]>(
        `SELECT
           COALESCE(SUM(gs.total_points), 0) as totalPoints,
           COALESCE(SUM(gs.correct_1x2), 0) as correct1x2,
           COALESCE(SUM(gs.correct_pleno), 0) as correctPleno,
           COUNT(DISTINCT gs.jornada_id) as jornadasPlayed
         FROM group_scores gs
         INNER JOIN group_members gm ON gs.group_id = gm.group_id
         WHERE gm.user_id = ?`,
        [userId]
      );
      const [groupCountRows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as groupCount
         FROM group_members gm
         INNER JOIN \`groups\` g ON gm.group_id = g.id
         WHERE gm.user_id = ? AND g.is_active = TRUE`,
        [userId]
      );
      // Calculate total predictions to get accuracy
      const [predCountRows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as totalPredictions
         FROM quiniela_results qr
         INNER JOIN quiniela_proposals qp ON qr.proposal_id = qp.id
         INNER JOIN group_members gm ON qp.group_id = gm.group_id
         WHERE gm.user_id = ? AND qp.status = 'approved'`,
        [userId]
      );
      const stats = statsRows[0];
      const totalPredictions = predCountRows[0]?.totalPredictions || 0;

      const result = {
        totalPoints: Number(stats.totalPoints),
        accuracy1x2Percent: totalPredictions > 0
          ? Math.round((Number(stats.correct1x2) / totalPredictions) * 100)
          : 0,
        accuracyPlenoPercent: totalPredictions > 0
          ? Math.round((Number(stats.correctPleno) / totalPredictions) * 100)
          : 0,
        groupCount: groupCountRows[0]?.groupCount || 0,
        jornadasPlayed: Number(stats.jornadasPlayed),
      };

      return result;
    } catch (error) {
      logger.error({ error }, 'Error in getUserStats');
      throw error;
    }
  }
}
