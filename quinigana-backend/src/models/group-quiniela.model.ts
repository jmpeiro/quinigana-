import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface GroupQuiniela {
  id: number;
  group_id: number;
  name: string;
  description: string | null;
  deadline: string;
  status: 'open' | 'closed' | 'finished';
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GroupQuinielaMatch {
  id: number;
  quiniela_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  match_date: string | null;
  home_score: number | null;
  away_score: number | null;
  result_1x2: '1' | 'X' | '2' | null;
}

export interface GroupQuinielaPrediction {
  id: number;
  quiniela_id: number;
  user_id: number;
  match_id: number;
  prediction_1x2: '1' | 'X' | '2';
  home_score_prediction: number | null;
  away_score_prediction: number | null;
}

export interface GroupQuinielaScore {
  id: number;
  quiniela_id: number;
  user_id: number;
  correct_1x2: number;
  correct_pleno: number;
  total_points: number;
}

export interface GroupQuinielaWithDetails extends GroupQuiniela {
  group_name: string;
  creator_name: string;
  match_count: number;
  participant_count: number;
}

export interface CreateGroupQuinielaDto {
  group_id: number;
  name: string;
  description?: string;
  deadline: string;
  matches: Array<{
    match_number: number;
    home_team: string;
    away_team: string;
    match_date?: string;
  }>;
}

export class GroupQuinielaModel {
  // Create a new group quiniela
  static async create(data: CreateGroupQuinielaDto, createdBy: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO group_quinielas (group_id, name, description, deadline, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [data.group_id, data.name, data.description || null, data.deadline, createdBy]
    );
    const quinielaId = result.insertId;

    // Insert matches
    for (const match of data.matches) {
      await pool.execute(
        `INSERT INTO group_quiniela_matches (quiniela_id, match_number, home_team, away_team, match_date)
         VALUES (?, ?, ?, ?, ?)`,
        [quinielaId, match.match_number, match.home_team, match.away_team, match.match_date || null]
      );
    }

    return quinielaId;
  }

  // Get quiniela by ID
  static async findById(id: number): Promise<GroupQuiniela | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM group_quinielas WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as GroupQuiniela) : null;
  }

  // Get quiniela with full details
  static async getWithDetails(id: number): Promise<GroupQuinielaWithDetails | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gq.*,
              g.name as group_name,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as creator_name,
              (SELECT COUNT(*) FROM group_quiniela_matches WHERE quiniela_id = gq.id) as match_count,
              (SELECT COUNT(DISTINCT user_id) FROM group_quiniela_predictions WHERE quiniela_id = gq.id) as participant_count
       FROM group_quinielas gq
       INNER JOIN \`groups\` g ON gq.group_id = g.id
       INNER JOIN users u ON gq.created_by = u.id
       WHERE gq.id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as GroupQuinielaWithDetails) : null;
  }

  // Get matches for a quiniela
  static async getMatches(quinielaId: number): Promise<GroupQuinielaMatch[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM group_quiniela_matches WHERE quiniela_id = ? ORDER BY match_number ASC',
      [quinielaId]
    );
    return rows as GroupQuinielaMatch[];
  }

  // Get all quinielas for a group
  static async findByGroup(groupId: number): Promise<GroupQuinielaWithDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gq.*,
              g.name as group_name,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as creator_name,
              (SELECT COUNT(*) FROM group_quiniela_matches WHERE quiniela_id = gq.id) as match_count,
              (SELECT COUNT(DISTINCT user_id) FROM group_quiniela_predictions WHERE quiniela_id = gq.id) as participant_count
       FROM group_quinielas gq
       INNER JOIN \`groups\` g ON gq.group_id = g.id
       INNER JOIN users u ON gq.created_by = u.id
       WHERE gq.group_id = ?
       ORDER BY gq.deadline DESC`,
      [groupId]
    );
    return rows as GroupQuinielaWithDetails[];
  }

  // Get active quinielas for user's groups
  static async getActiveForUser(userId: number): Promise<(GroupQuinielaWithDetails & { has_predicted: boolean })[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gq.*,
              g.name as group_name,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as creator_name,
              (SELECT COUNT(*) FROM group_quiniela_matches WHERE quiniela_id = gq.id) as match_count,
              (SELECT COUNT(DISTINCT user_id) FROM group_quiniela_predictions WHERE quiniela_id = gq.id) as participant_count,
              EXISTS(SELECT 1 FROM group_quiniela_predictions WHERE quiniela_id = gq.id AND user_id = ?) as has_predicted
       FROM group_quinielas gq
       INNER JOIN \`groups\` g ON gq.group_id = g.id
       INNER JOIN users u ON gq.created_by = u.id
       INNER JOIN group_members gm ON gm.group_id = gq.group_id AND gm.user_id = ?
       WHERE gq.status IN ('open', 'closed') AND gq.deadline > DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY gq.deadline DESC`,
      [userId, userId]
    );
    return rows as (GroupQuinielaWithDetails & { has_predicted: boolean })[];
  }

  // Save user predictions
  static async savePredictions(
    quinielaId: number,
    userId: number,
    predictions: Array<{ match_id: number; prediction_1x2: '1' | 'X' | '2'; home_score?: number; away_score?: number }>
  ): Promise<void> {
    // Delete existing predictions for this user/quiniela
    await pool.execute(
      'DELETE FROM group_quiniela_predictions WHERE quiniela_id = ? AND user_id = ?',
      [quinielaId, userId]
    );

    // Insert new predictions
    for (const pred of predictions) {
      await pool.execute(
        `INSERT INTO group_quiniela_predictions (quiniela_id, user_id, match_id, prediction_1x2, home_score_prediction, away_score_prediction)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [quinielaId, userId, pred.match_id, pred.prediction_1x2, pred.home_score ?? null, pred.away_score ?? null]
      );
    }
  }

  // Get user predictions for a quiniela
  static async getUserPredictions(quinielaId: number, userId: number): Promise<(GroupQuinielaPrediction & { match_number: number; home_team: string; away_team: string })[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT p.*, m.match_number, m.home_team, m.away_team
       FROM group_quiniela_predictions p
       INNER JOIN group_quiniela_matches m ON p.match_id = m.id
       WHERE p.quiniela_id = ? AND p.user_id = ?
       ORDER BY m.match_number ASC`,
      [quinielaId, userId]
    );
    return rows as (GroupQuinielaPrediction & { match_number: number; home_team: string; away_team: string })[];
  }

  // Submit results for matches
  static async submitResults(quinielaId: number, results: Array<{ match_id: number; home_score: number; away_score: number }>): Promise<void> {
    for (const result of results) {
      const result_1x2 = result.home_score > result.away_score ? '1' : (result.home_score < result.away_score ? '2' : 'X');
      await pool.execute(
        `UPDATE group_quiniela_matches SET home_score = ?, away_score = ?, result_1x2 = ? WHERE id = ?`,
        [result.home_score, result.away_score, result_1x2, result.match_id]
      );
    }
  }

  // Calculate scores for all participants
  static async calculateScores(quinielaId: number): Promise<void> {
    // Get all matches with results
    const [matches] = await pool.execute<RowDataPacket[]>(
      'SELECT id, result_1x2, home_score, away_score FROM group_quiniela_matches WHERE quiniela_id = ? AND result_1x2 IS NOT NULL',
      [quinielaId]
    );

    // Get all predictions
    const [predictions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM group_quiniela_predictions WHERE quiniela_id = ?',
      [quinielaId]
    );

    // Group predictions by user
    const userPredictions = new Map<number, RowDataPacket[]>();
    for (const pred of predictions as RowDataPacket[]) {
      if (!userPredictions.has(pred.user_id)) {
        userPredictions.set(pred.user_id, []);
      }
      userPredictions.get(pred.user_id)!.push(pred);
    }

    // Calculate scores for each user
    for (const [userId, preds] of userPredictions) {
      let correct_1x2 = 0;
      let correct_pleno = 0;

      for (const match of matches as RowDataPacket[]) {
        const pred = preds.find(p => p.match_id === match.id);
        if (!pred) continue;

        if (pred.prediction_1x2 === match.result_1x2) {
          correct_1x2++;
        }
        if (pred.home_score_prediction === match.home_score && pred.away_score_prediction === match.away_score) {
          correct_pleno++;
        }
      }

      const total_points = correct_1x2 + (correct_pleno * 3); // 1 punto por 1X2, 3 extra por pleno

      // Upsert score
      await pool.execute(
        `INSERT INTO group_quiniela_scores (quiniela_id, user_id, correct_1x2, correct_pleno, total_points)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE correct_1x2 = ?, correct_pleno = ?, total_points = ?, calculated_at = NOW()`,
        [quinielaId, userId, correct_1x2, correct_pleno, total_points, correct_1x2, correct_pleno, total_points]
      );
    }
  }

  // Get ranking for a quiniela
  static async getRanking(quinielaId: number): Promise<Array<{ user_id: number; first_name: string; last_name: string | null; correct_1x2: number; correct_pleno: number; total_points: number; position: number }>> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT s.user_id, u.first_name, u.last_name, s.correct_1x2, s.correct_pleno, s.total_points
       FROM group_quiniela_scores s
       INNER JOIN users u ON s.user_id = u.id
       WHERE s.quiniela_id = ?
       ORDER BY s.total_points DESC, s.correct_pleno DESC`,
      [quinielaId]
    );

    return (rows as any[]).map((row, index) => ({
      ...row,
      position: index + 1
    }));
  }

  // Update quiniela status
  static async updateStatus(id: number, status: 'open' | 'closed' | 'finished'): Promise<void> {
    await pool.execute(
      'UPDATE group_quinielas SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  // Delete quiniela
  static async delete(id: number): Promise<boolean> {
    // Check if has predictions
    const [preds] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM group_quiniela_predictions WHERE quiniela_id = ?',
      [id]
    );
    if (Number(preds[0].count) > 0) {
      throw { code: 'HAS_PREDICTIONS', message: 'No se puede eliminar una quiniela con predicciones', statusCode: 400 };
    }

    await pool.execute('DELETE FROM group_quiniela_matches WHERE quiniela_id = ?', [id]);
    const [result] = await pool.execute<ResultSetHeader>('DELETE FROM group_quinielas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // Check if user is member of group that owns the quiniela
  static async isUserMemberOfQuinielaGroup(quinielaId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM group_quinielas gq
       INNER JOIN group_members gm ON gm.group_id = gq.group_id
       WHERE gq.id = ? AND gm.user_id = ?`,
      [quinielaId, userId]
    );
    return rows.length > 0;
  }

  // Check if user is admin/creator of the quiniela
  static async canManageQuiniela(quinielaId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM group_quinielas gq
       LEFT JOIN group_members gm ON gm.group_id = gq.group_id AND gm.user_id = ?
       WHERE gq.id = ? AND (gq.created_by = ? OR gm.role = 'admin')`,
      [userId, quinielaId, userId]
    );
    return rows.length > 0;
  }

  // Get all members' predictions for comparison
  static async getMembersPredictions(quinielaId: number): Promise<{
    members: Array<{ user_id: number; user_name: string; avatar_url: string | null; correct_1x2: number; correct_pleno: number; total_points: number }>;
    matches: Array<{
      match_id: number;
      match_number: number;
      home_team: string;
      away_team: string;
      home_score: number | null;
      away_score: number | null;
      result_1x2: string | null;
      predictions: Array<{
        user_id: number;
        prediction_1x2: string;
        home_score_prediction: number | null;
        away_score_prediction: number | null;
        is_correct_1x2: boolean | null;
        is_correct_pleno: boolean | null;
      }>;
    }>;
  }> {
    // Get quiniela group_id
    const [quinielaRows] = await pool.execute<RowDataPacket[]>(
      'SELECT group_id FROM group_quinielas WHERE id = ?',
      [quinielaId]
    );
    if (quinielaRows.length === 0) {
      return { members: [], matches: [] };
    }
    const groupId = quinielaRows[0].group_id;

    // Get all group members who have made predictions
    const [members] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT u.id as user_id,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_name,
              u.avatar_url,
              COALESCE(s.correct_1x2, 0) as correct_1x2,
              COALESCE(s.correct_pleno, 0) as correct_pleno,
              COALESCE(s.total_points, 0) as total_points
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       LEFT JOIN group_quiniela_scores s ON s.quiniela_id = ? AND s.user_id = u.id
       WHERE gm.group_id = ?
         AND EXISTS (SELECT 1 FROM group_quiniela_predictions p WHERE p.quiniela_id = ? AND p.user_id = u.id)
       ORDER BY COALESCE(s.total_points, 0) DESC, u.first_name ASC`,
      [quinielaId, groupId, quinielaId]
    );

    // Get matches
    const [matchRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id as match_id, match_number, home_team, away_team, home_score, away_score, result_1x2
       FROM group_quiniela_matches
       WHERE quiniela_id = ?
       ORDER BY match_number ASC`,
      [quinielaId]
    );

    // Get all predictions
    const [allPredictions] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id, match_id, prediction_1x2, home_score_prediction, away_score_prediction
       FROM group_quiniela_predictions
       WHERE quiniela_id = ?`,
      [quinielaId]
    );

    // Build matches with predictions
    const matches = matchRows.map((match: RowDataPacket) => {
      const matchPredictions = allPredictions
        .filter((p: RowDataPacket) => p.match_id === match.match_id)
        .map((p: RowDataPacket) => {
          let isCorrect1x2: boolean | null = null;
          let isCorrectPleno: boolean | null = null;

          if (match.result_1x2) {
            isCorrect1x2 = p.prediction_1x2 === match.result_1x2;
            isCorrectPleno = p.home_score_prediction === match.home_score &&
                            p.away_score_prediction === match.away_score;
          }

          return {
            user_id: p.user_id,
            prediction_1x2: p.prediction_1x2,
            home_score_prediction: p.home_score_prediction,
            away_score_prediction: p.away_score_prediction,
            is_correct_1x2: isCorrect1x2,
            is_correct_pleno: isCorrectPleno
          };
        });

      return {
        match_id: match.match_id,
        match_number: match.match_number,
        home_team: match.home_team,
        away_team: match.away_team,
        home_score: match.home_score,
        away_score: match.away_score,
        result_1x2: match.result_1x2,
        predictions: matchPredictions
      };
    });

    return {
      members: members.map((m: RowDataPacket) => ({
        user_id: m.user_id,
        user_name: m.user_name.trim(),
        avatar_url: m.avatar_url,
        correct_1x2: m.correct_1x2,
        correct_pleno: m.correct_pleno,
        total_points: m.total_points
      })),
      matches
    };
  }
}
