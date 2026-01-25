import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export class StatsModel {
  static async getPersonalStats(userId: number, seasonId?: number): Promise<{
    totalPoints: number;
    totalJornadas: number;
    totalPredictions: number;
    correct1x2: number;
    correctPleno: number;
  }> {
    const seasonFilter = seasonId ? 'AND j.season_id = ?' : '';
    const params = seasonId ? [userId, seasonId] : [userId];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(gs.total_points), 0) as totalPoints,
         COUNT(DISTINCT gs.jornada_id) as totalJornadas,
         COALESCE(SUM(gs.correct_1x2), 0) as correct1x2,
         COALESCE(SUM(gs.correct_pleno), 0) as correctPleno
       FROM group_scores gs
       INNER JOIN group_members gm ON gs.group_id = gm.group_id
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       WHERE gm.user_id = ? ${seasonFilter}`,
      params
    );

    const predParams = seasonId ? [userId, seasonId] : [userId];
    const [predRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as totalPredictions
       FROM quiniela_results qr
       INNER JOIN quiniela_proposals qp ON qr.proposal_id = qp.id
       INNER JOIN group_members gm ON qp.group_id = gm.group_id
       INNER JOIN jornadas j ON qp.jornada_id = j.id
       WHERE gm.user_id = ? AND qp.status = 'approved' ${seasonFilter}`,
      predParams
    );

    const stats = rows[0];
    return {
      totalPoints: Number(stats.totalPoints),
      totalJornadas: Number(stats.totalJornadas),
      totalPredictions: Number(predRows[0]?.totalPredictions || 0),
      correct1x2: Number(stats.correct1x2),
      correctPleno: Number(stats.correctPleno),
    };
  }

  static async getEvolution(userId: number, seasonId?: number): Promise<Array<{
    jornadaId: number;
    jornadaName: string;
    points: number;
    accuracy: number;
  }>> {
    const seasonFilter = seasonId ? 'AND j.season_id = ?' : '';
    const params = seasonId ? [userId, seasonId] : [userId];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gs.jornada_id as jornadaId, j.name as jornadaName,
              gs.total_points as points,
              gs.correct_1x2 as correct1x2,
              (SELECT COUNT(*) FROM matches WHERE jornada_id = gs.jornada_id) as matchCount
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       INNER JOIN group_members gm ON gs.group_id = gm.group_id
       WHERE gm.user_id = ? AND j.status = 'finished' ${seasonFilter}
       GROUP BY gs.jornada_id, j.name, gs.total_points, gs.correct_1x2
       ORDER BY j.jornada_number ASC
       LIMIT 50`,
      params
    );

    return rows.map(row => ({
      jornadaId: row.jornadaId,
      jornadaName: row.jornadaName,
      points: Number(row.points),
      accuracy: row.matchCount > 0 ? Math.round((Number(row.correct1x2) / Number(row.matchCount)) * 100) : 0,
    }));
  }

  static async getGroupComparison(userId: number, seasonId?: number): Promise<Array<{
    groupId: number;
    groupName: string;
    totalPoints: number;
    jornadasPlayed: number;
  }>> {
    const seasonFilter = seasonId ? 'AND j.season_id = ?' : '';
    const params = seasonId ? [userId, seasonId] : [userId];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT g.id as groupId, g.name as groupName,
              COALESCE(SUM(gs.total_points), 0) as totalPoints,
              COUNT(DISTINCT gs.jornada_id) as jornadasPlayed
       FROM \`groups\` g
       INNER JOIN group_members gm ON g.id = gm.group_id
       LEFT JOIN group_scores gs ON g.id = gs.group_id
       LEFT JOIN jornadas j ON gs.jornada_id = j.id
       WHERE gm.user_id = ? AND g.is_active = TRUE ${seasonFilter}
       GROUP BY g.id, g.name
       ORDER BY totalPoints DESC`,
      params
    );

    return rows.map(row => ({
      groupId: row.groupId,
      groupName: row.groupName,
      totalPoints: Number(row.totalPoints),
      jornadasPlayed: Number(row.jornadasPlayed),
    }));
  }

  static async getStreaks(userId: number, seasonId?: number): Promise<{ currentStreak: number; bestStreak: number }> {
    const seasonFilter = seasonId ? 'AND j.season_id = ?' : '';
    const params = seasonId ? [userId, seasonId] : [userId];

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gs.jornada_id, gs.correct_1x2,
              (SELECT COUNT(*) FROM matches WHERE jornada_id = gs.jornada_id) as matchCount
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       INNER JOIN group_members gm ON gs.group_id = gm.group_id
       WHERE gm.user_id = ? AND j.status = 'finished' ${seasonFilter}
       ORDER BY j.jornada_number DESC`,
      params
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 0;
    let countingCurrent = true;

    for (const row of rows) {
      const accuracy = Number(row.matchCount) > 0 ? Number(row.correct_1x2) / Number(row.matchCount) : 0;
      if (accuracy >= 0.5) {
        streak++;
        if (countingCurrent) currentStreak++;
        if (streak > bestStreak) bestStreak = streak;
      } else {
        countingCurrent = false;
        streak = 0;
      }
    }

    return { currentStreak, bestStreak };
  }

  static async getGroupHistory(groupId: number, page: number, limit: number): Promise<{
    items: Array<{
      jornadaId: number;
      jornadaName: string;
      jornadaNumber: number;
      season: string;
      totalPoints: number;
      correct1x2: number;
      correctPleno: number;
      finishedAt: Date;
    }>;
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       WHERE gs.group_id = ? AND j.status = 'finished'`,
      [groupId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gs.jornada_id as jornadaId, j.name as jornadaName,
              j.jornada_number as jornadaNumber, j.season,
              gs.total_points as totalPoints, gs.correct_1x2 as correct1x2,
              gs.correct_pleno as correctPleno, j.updated_at as finishedAt
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       WHERE gs.group_id = ? AND j.status = 'finished'
       ORDER BY j.jornada_number DESC
       LIMIT ? OFFSET ?`,
      [groupId, limit, offset]
    );

    return {
      items: rows.map(row => ({
        jornadaId: row.jornadaId,
        jornadaName: row.jornadaName,
        jornadaNumber: row.jornadaNumber,
        season: row.season,
        totalPoints: Number(row.totalPoints),
        correct1x2: Number(row.correct1x2),
        correctPleno: Number(row.correctPleno),
        finishedAt: row.finishedAt,
      })),
      total: countRows[0].total,
    };
  }

  static async getJornadaDetail(groupId: number, jornadaId: number): Promise<{
    jornadaName: string;
    totalPoints: number;
    matches: Array<{
      matchNumber: number;
      homeTeam: string;
      awayTeam: string;
      prediction1x2: string;
      actualResult1x2: string;
      homeScorePrediction: number | null;
      awayScorePrediction: number | null;
      homeScoreActual: number | null;
      awayScoreActual: number | null;
      points1x2: number;
      pointsPleno: number;
      isCorrect1x2: boolean;
      isCorrectPleno: boolean;
    }>;
  } | null> {
    const [jornadaRows] = await pool.execute<RowDataPacket[]>(
      `SELECT j.name as jornadaName, gs.total_points as totalPoints
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       WHERE gs.group_id = ? AND gs.jornada_id = ?`,
      [groupId, jornadaId]
    );

    if (jornadaRows.length === 0) return null;

    const [matchRows] = await pool.execute<RowDataPacket[]>(
      `SELECT m.match_number as matchNumber, m.home_team as homeTeam, m.away_team as awayTeam,
              pp.prediction_1x2 as prediction1x2,
              pp.home_score_prediction as homeScorePrediction,
              pp.away_score_prediction as awayScorePrediction,
              mr.result_1x2 as actualResult1x2,
              mr.home_score as homeScoreActual, mr.away_score as awayScoreActual,
              COALESCE(qr.points_1x2, 0) as points1x2,
              COALESCE(qr.points_pleno, 0) as pointsPleno,
              COALESCE(qr.is_correct_1x2, FALSE) as isCorrect1x2,
              COALESCE(qr.is_correct_pleno, FALSE) as isCorrectPleno
       FROM matches m
       LEFT JOIN quiniela_proposals qp ON qp.group_id = ? AND qp.jornada_id = ? AND qp.status = 'approved'
       LEFT JOIN proposal_predictions pp ON pp.proposal_id = qp.id AND pp.match_id = m.id
       LEFT JOIN match_results mr ON mr.match_id = m.id
       LEFT JOIN quiniela_results qr ON qr.proposal_id = qp.id AND qr.match_id = m.id
       WHERE m.jornada_id = ?
       ORDER BY m.match_number ASC`,
      [groupId, jornadaId, jornadaId]
    );

    return {
      jornadaName: jornadaRows[0].jornadaName,
      totalPoints: Number(jornadaRows[0].totalPoints),
      matches: matchRows.map(row => ({
        matchNumber: row.matchNumber,
        homeTeam: row.homeTeam,
        awayTeam: row.awayTeam,
        prediction1x2: row.prediction1x2 || '-',
        actualResult1x2: row.actualResult1x2 || '-',
        homeScorePrediction: row.homeScorePrediction,
        awayScorePrediction: row.awayScorePrediction,
        homeScoreActual: row.homeScoreActual,
        awayScoreActual: row.awayScoreActual,
        points1x2: Number(row.points1x2),
        pointsPleno: Number(row.pointsPleno),
        isCorrect1x2: Boolean(row.isCorrect1x2),
        isCorrectPleno: Boolean(row.isCorrectPleno),
      })),
    };
  }

  static async getGroupRankings(groupId: number): Promise<Array<{
    userId: number;
    userName: string;
    avatarUrl: string | null;
    totalPoints: number;
    correct1x2: number;
    correctPleno: number;
    jornadasPlayed: number;
  }>> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id as userId,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
              u.avatar_url as avatarUrl,
              COALESCE(SUM(gs.total_points), 0) as totalPoints,
              COALESCE(SUM(gs.correct_1x2), 0) as correct1x2,
              COALESCE(SUM(gs.correct_pleno), 0) as correctPleno,
              COUNT(DISTINCT gs.jornada_id) as jornadasPlayed
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       LEFT JOIN group_scores gs ON gs.group_id = gm.group_id
       WHERE gm.group_id = ?
       GROUP BY u.id, u.first_name, u.last_name, u.avatar_url
       ORDER BY totalPoints DESC`,
      [groupId]
    );

    return rows.map(row => ({
      userId: row.userId,
      userName: row.userName.trim(),
      avatarUrl: row.avatarUrl,
      totalPoints: Number(row.totalPoints),
      correct1x2: Number(row.correct1x2),
      correctPleno: Number(row.correctPleno),
      jornadasPlayed: Number(row.jornadasPlayed),
    }));
  }

  static async getPredictionHistory(userId: number, page: number, limit: number): Promise<{
    items: Array<{
      jornadaId: number;
      jornadaName: string;
      jornadaNumber: number;
      season: string;
      groupName: string;
      groupId: number;
      totalPoints: number;
      correct1x2: number;
      correctPleno: number;
      totalMatches: number;
      finishedAt: Date;
    }>;
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       INNER JOIN group_members gm ON gm.group_id = gs.group_id AND gm.user_id = ?
       WHERE j.status = 'finished'`,
      [userId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT j.id as jornadaId, j.name as jornadaName, j.jornada_number as jornadaNumber,
              COALESCE(j.season, '') as season,
              g.name as groupName, g.id as groupId,
              gs.total_points as totalPoints, gs.correct_1x2 as correct1x2,
              gs.correct_pleno as correctPleno,
              (SELECT COUNT(*) FROM matches WHERE jornada_id = j.id) as totalMatches,
              j.updated_at as finishedAt
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       INNER JOIN \`groups\` g ON gs.group_id = g.id
       INNER JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
       WHERE j.status = 'finished'
       ORDER BY j.jornada_number DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return {
      items: rows.map(row => ({
        jornadaId: row.jornadaId,
        jornadaName: row.jornadaName,
        jornadaNumber: row.jornadaNumber,
        season: row.season,
        groupName: row.groupName,
        groupId: row.groupId,
        totalPoints: Number(row.totalPoints),
        correct1x2: Number(row.correct1x2),
        correctPleno: Number(row.correctPleno),
        totalMatches: Number(row.totalMatches),
        finishedAt: row.finishedAt,
      })),
      total: Number(countRows[0].total),
    };
  }

  static async getGlobalRankings(page: number = 1, limit: number = 20): Promise<{ items: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT g.id as group_id, g.name as group_name,
        COUNT(DISTINCT gm.user_id) as member_count,
        COALESCE(SUM(gs.total_points), 0) as total_points,
        COUNT(DISTINCT gs.jornada_id) as total_jornadas,
        COALESCE(SUM(gs.correct_1x2), 0) as correct_1x2,
        COALESCE(SUM(gs.correct_pleno), 0) as correct_pleno
       FROM \`groups\` g
       LEFT JOIN group_scores gs ON gs.group_id = g.id
       LEFT JOIN group_members gm ON gm.group_id = g.id
       GROUP BY g.id, g.name
       HAVING total_jornadas > 0
       ORDER BY total_points DESC, correct_pleno DESC, correct_1x2 DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM (
        SELECT g.id
        FROM \`groups\` g
        INNER JOIN group_scores gs ON gs.group_id = g.id
        GROUP BY g.id
      ) sub`
    );

    return { items: rows as any[], total: Number((countRows[0] as any).total) };
  }

  static async getExportData(userId: number): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT
        j.name as jornadaName,
        g.name as groupName,
        j.updated_at as finishedAt,
        gs.total_points as totalPoints,
        gs.correct_1x2 as correct1x2,
        gs.correct_pleno as correctPleno
      FROM group_scores gs
      JOIN jornadas j ON gs.jornada_id = j.id
      JOIN \`groups\` g ON gs.group_id = g.id
      JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
      WHERE j.status = 'finished'
      ORDER BY j.updated_at DESC
    `, [userId]);
    return rows;
  }

  static async getPredictionsHeatmap(userId: number, limit: number = 10): Promise<Array<{
    jornadaId: number;
    jornadaName: string;
    matches: Array<{
      matchNumber: number;
      homeTeam: string;
      awayTeam: string;
      prediction1x2: string;
      actualResult1x2: string | null;
      homeScorePrediction: number | null;
      awayScorePrediction: number | null;
      homeScoreActual: number | null;
      awayScoreActual: number | null;
      isCorrect1x2: boolean;
      isCorrectPleno: boolean;
    }>;
  }>> {
    // Get recent jornadas the user has participated in
    const [jornadas] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT j.id, j.name, j.jornada_number
       FROM jornadas j
       INNER JOIN quiniela_proposals qp ON qp.jornada_id = j.id
       INNER JOIN group_members gm ON gm.group_id = qp.group_id
       WHERE gm.user_id = ? AND qp.status = 'approved'
       ORDER BY j.jornada_number DESC
       LIMIT ?`,
      [userId, limit]
    );

    if (jornadas.length === 0) return [];

    const result = [];

    for (const jornada of jornadas) {
      const [matches] = await pool.execute<RowDataPacket[]>(
        `SELECT m.match_number as matchNumber, m.home_team as homeTeam, m.away_team as awayTeam,
                pp.prediction_1x2 as prediction1x2,
                pp.home_score_prediction as homeScorePrediction,
                pp.away_score_prediction as awayScorePrediction,
                mr.result_1x2 as actualResult1x2,
                mr.home_score as homeScoreActual, mr.away_score as awayScoreActual,
                COALESCE(qr.is_correct_1x2, FALSE) as isCorrect1x2,
                COALESCE(qr.is_correct_pleno, FALSE) as isCorrectPleno
         FROM matches m
         LEFT JOIN quiniela_proposals qp ON qp.jornada_id = m.jornada_id AND qp.status = 'approved'
         LEFT JOIN group_members gm ON gm.group_id = qp.group_id AND gm.user_id = ?
         LEFT JOIN proposal_predictions pp ON pp.proposal_id = qp.id AND pp.match_id = m.id
         LEFT JOIN match_results mr ON mr.match_id = m.id
         LEFT JOIN quiniela_results qr ON qr.proposal_id = qp.id AND qr.match_id = m.id
         WHERE m.jornada_id = ? AND pp.prediction_1x2 IS NOT NULL
         ORDER BY m.match_number ASC`,
        [userId, jornada.id]
      );

      if (matches.length > 0) {
        result.push({
          jornadaId: jornada.id,
          jornadaName: jornada.name,
          matches: matches.map(row => ({
            matchNumber: row.matchNumber,
            homeTeam: row.homeTeam,
            awayTeam: row.awayTeam,
            prediction1x2: row.prediction1x2,
            actualResult1x2: row.actualResult1x2,
            homeScorePrediction: row.homeScorePrediction,
            awayScorePrediction: row.awayScorePrediction,
            homeScoreActual: row.homeScoreActual,
            awayScoreActual: row.awayScoreActual,
            isCorrect1x2: Boolean(row.isCorrect1x2),
            isCorrectPleno: Boolean(row.isCorrectPleno),
          })),
        });
      }
    }

    return result.reverse(); // Return in chronological order
  }
}
