import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export class DashboardModel {
  static async getActiveJornada(userId: number): Promise<{
    id: number;
    name: string;
    deadline: Date;
    matchCount: number;
    status: string;
  } | null> {
    try {
      console.log('[DASHBOARD MODEL] Querying active jornada for user:', userId);
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
         ORDER BY j.deadline ASC
         LIMIT 1`,
        [userId]
      );
      console.log('[DASHBOARD MODEL] Active jornada query result:', rows.length, 'rows');
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
      console.error('[DASHBOARD MODEL] Error in getActiveJornada:', error);
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
      console.log('[DASHBOARD MODEL] Querying user groups for user:', userId);
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
      console.log('[DASHBOARD MODEL] User groups query result:', groups.length, 'groups');

      return groups.map((row, index) => ({
        id: row.id,
        name: row.name,
        totalPoints: Number(row.totalPoints),
        rank: index + 1,
        memberCount: row.memberCount,
      }));
    } catch (error) {
      console.error('[DASHBOARD MODEL] Error in getUserGroupsWithScores:', error);
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
      console.log('[DASHBOARD MODEL] Querying latest results for user:', userId, 'limit:', limit);
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
      console.log('[DASHBOARD MODEL] Latest results query result:', rows.length, 'results');

      return rows.map(row => ({
        jornadaId: row.jornadaId,
        jornadaName: row.jornadaName,
        totalPoints: row.totalPoints,
        correct1x2: row.correct1x2,
        correctPleno: row.correctPleno,
        groupName: row.groupName,
      }));
    } catch (error) {
      console.error('[DASHBOARD MODEL] Error in getLatestResults:', error);
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
      console.log('[DASHBOARD MODEL] Querying user stats for user:', userId);

      console.log('[DASHBOARD MODEL] Query 1/3: Stats from group_scores...');
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
      console.log('[DASHBOARD MODEL] Stats query result:', statsRows[0]);

      console.log('[DASHBOARD MODEL] Query 2/3: Group count...');
      const [groupCountRows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as groupCount
         FROM group_members gm
         INNER JOIN \`groups\` g ON gm.group_id = g.id
         WHERE gm.user_id = ? AND g.is_active = TRUE`,
        [userId]
      );
      console.log('[DASHBOARD MODEL] Group count query result:', groupCountRows[0]);

      console.log('[DASHBOARD MODEL] Query 3/3: Total predictions...');
      // Calculate total predictions to get accuracy
      const [predCountRows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as totalPredictions
         FROM quiniela_results qr
         INNER JOIN quiniela_proposals qp ON qr.proposal_id = qp.id
         INNER JOIN group_members gm ON qp.group_id = gm.group_id
         WHERE gm.user_id = ? AND qp.status = 'approved'`,
        [userId]
      );
      console.log('[DASHBOARD MODEL] Predictions count query result:', predCountRows[0]);

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

      console.log('[DASHBOARD MODEL] User stats computed successfully:', result);
      return result;
    } catch (error) {
      console.error('[DASHBOARD MODEL] Error in getUserStats:', error);
      throw error;
    }
  }
}
