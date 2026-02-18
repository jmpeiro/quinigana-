import pool from '../config/database';
import { Jornada, JornadaWithMatches, Match, MatchWithResult } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class JornadaModel {
  static async create(name: string, season: string, jornadaNumber: number, deadline: string): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO jornadas (name, season, jornada_number, deadline) VALUES (?, ?, ?, ?)',
      [name, season, jornadaNumber, deadline]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<Jornada | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM jornadas WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Jornada) : null;
  }

  static async findBySeasonAndNumber(season: string, jornadaNumber: number): Promise<Jornada | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM jornadas WHERE season = ? AND jornada_number = ? LIMIT 1',
      [season, jornadaNumber]
    );
    return rows.length > 0 ? (rows[0] as Jornada) : null;
  }

  static async findAll(): Promise<Jornada[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM jornadas ORDER BY season DESC, jornada_number DESC'
    );
    return rows as Jornada[];
  }

  static async findForUser(userId: number): Promise<Jornada[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT j.* FROM jornadas j
       INNER JOIN quiniela_proposals qp ON qp.jornada_id = j.id
       INNER JOIN group_members gm ON gm.group_id = qp.group_id
       WHERE gm.user_id = ? AND qp.status = 'approved'
       ORDER BY j.season DESC, j.jornada_number DESC`,
      [userId]
    );
    return rows as Jornada[];
  }

  static async findActive(): Promise<Jornada | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM jornadas WHERE status = 'open' ORDER BY deadline ASC LIMIT 1"
    );
    return rows.length > 0 ? (rows[0] as Jornada) : null;
  }

  static async findByIdWithMatches(id: number): Promise<JornadaWithMatches | null> {
    const jornada = await this.findById(id);
    if (!jornada) return null;

    const [matchRows] = await pool.execute<RowDataPacket[]>(
      `SELECT m.*, mr.id as result_id, mr.home_score, mr.away_score, mr.result_1x2
       FROM matches m
       LEFT JOIN match_results mr ON m.id = mr.match_id
       WHERE m.jornada_id = ?
       ORDER BY m.match_number ASC`,
      [id]
    );

    const matches: MatchWithResult[] = (matchRows as RowDataPacket[]).map(row => ({
      id: row.id,
      jornada_id: row.jornada_id,
      match_number: row.match_number,
      home_team: row.home_team,
      away_team: row.away_team,
      match_date: row.match_date,
      created_at: row.created_at,
      result: row.result_id ? {
        id: row.result_id,
        match_id: row.id,
        home_score: row.home_score,
        away_score: row.away_score,
        result_1x2: row.result_1x2,
        created_at: row.created_at
      } : undefined
    }));

    return { ...jornada, matches };
  }

  static async updateStatus(id: number, status: 'open' | 'closed' | 'finished'): Promise<void> {
    await pool.execute(
      'UPDATE jornadas SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async delete(id: number): Promise<boolean> {
    // Check if jornada has predictions (via matches -> proposal_predictions)
    const [predictions] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM proposal_predictions pp
       INNER JOIN matches m ON pp.match_id = m.id
       WHERE m.jornada_id = ?`,
      [id]
    );
    if (Number(predictions[0].count) > 0) {
      throw { code: 'JORNADA_HAS_PREDICTIONS', message: 'No se puede eliminar una jornada con predicciones', statusCode: 400 };
    }

    // Delete match results first
    await pool.execute('DELETE FROM match_results WHERE match_id IN (SELECT id FROM matches WHERE jornada_id = ?)', [id]);
    // Delete matches
    await pool.execute('DELETE FROM matches WHERE jornada_id = ?', [id]);
    // Delete jornada
    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM jornadas WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async canDelete(id: number): Promise<{ canDelete: boolean; reason?: string }> {
    const [predictions] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM proposal_predictions pp
       INNER JOIN matches m ON pp.match_id = m.id
       WHERE m.jornada_id = ?`,
      [id]
    );
    const predCount = Number(predictions[0].count);
    if (predCount > 0) {
      return { canDelete: false, reason: `Tiene ${predCount} predicciones` };
    }
    return { canDelete: true };
  }

  // Scheduler methods
  static async findOpenPastDeadline(): Promise<Jornada[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM jornadas WHERE status = 'open' AND deadline < NOW()"
    );
    return rows as Jornada[];
  }

  static async findClosedWithAllResults(): Promise<Jornada[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT j.* FROM jornadas j
       WHERE j.status = 'closed'
         AND NOT EXISTS (
           SELECT 1 FROM matches m
           LEFT JOIN match_results mr ON m.id = mr.match_id
           WHERE m.jornada_id = j.id AND mr.id IS NULL
         )
         AND EXISTS (SELECT 1 FROM matches WHERE jornada_id = j.id)`
    );
    return rows as Jornada[];
  }
}
