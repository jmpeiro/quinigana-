import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Season, SeasonWithStats, CreateSeasonDto, UpdateSeasonDto } from '../types';

export class SeasonModel {
  static async getAll(): Promise<SeasonWithStats[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT s.*,
              COUNT(j.id) as jornadasCount,
              SUM(CASE WHEN j.status = 'finished' THEN 1 ELSE 0 END) as finishedCount
       FROM seasons s
       LEFT JOIN jornadas j ON j.season_id = s.id
       GROUP BY s.id
       ORDER BY s.start_date DESC`
    );
    return rows.map(row => ({
      ...row,
      jornadasCount: Number(row.jornadasCount),
      finishedCount: Number(row.finishedCount),
    })) as SeasonWithStats[];
  }

  static async getById(id: number): Promise<Season | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM seasons WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Season) : null;
  }

  static async getByName(name: string): Promise<Season | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM seasons WHERE name = ?',
      [name]
    );
    return rows.length > 0 ? (rows[0] as Season) : null;
  }

  static async getCurrent(): Promise<Season | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM seasons WHERE is_current = TRUE LIMIT 1'
    );
    return rows.length > 0 ? (rows[0] as Season) : null;
  }

  static async create(data: CreateSeasonDto): Promise<number> {
    // If this season is set as current, unset all others first
    if (data.is_current) {
      await pool.execute('UPDATE seasons SET is_current = FALSE');
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO seasons (name, display_name, start_date, end_date, is_current)
       VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.display_name, data.start_date, data.end_date, data.is_current || false]
    );
    return result.insertId;
  }

  static async update(id: number, data: UpdateSeasonDto): Promise<boolean> {
    // If setting this season as current, unset all others first
    if (data.is_current) {
      await pool.execute('UPDATE seasons SET is_current = FALSE WHERE id != ?', [id]);
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.display_name !== undefined) {
      fields.push('display_name = ?');
      values.push(data.display_name);
    }
    if (data.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(data.end_date);
    }
    if (data.is_current !== undefined) {
      fields.push('is_current = ?');
      values.push(data.is_current);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE seasons SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  static async delete(id: number): Promise<boolean> {
    // Check if there are jornadas linked to this season
    const [jornadas] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM jornadas WHERE season_id = ?',
      [id]
    );
    if (Number(jornadas[0].count) > 0) {
      throw { code: 'SEASON_HAS_JORNADAS', message: 'Cannot delete season with jornadas', statusCode: 400 };
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'DELETE FROM seasons WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async setAsCurrent(id: number): Promise<boolean> {
    await pool.execute('UPDATE seasons SET is_current = FALSE');
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE seasons SET is_current = TRUE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  static async getSeasonStats(seasonId: number): Promise<{
    totalJornadas: number;
    finishedJornadas: number;
    totalPoints: number;
    totalPredictions: number;
  }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(DISTINCT j.id) as totalJornadas,
         SUM(CASE WHEN j.status = 'finished' THEN 1 ELSE 0 END) as finishedJornadas,
         COALESCE(SUM(gs.total_points), 0) as totalPoints,
         COALESCE(SUM(gs.correct_1x2 + gs.correct_pleno), 0) as totalPredictions
       FROM jornadas j
       LEFT JOIN group_scores gs ON gs.jornada_id = j.id
       WHERE j.season_id = ?`,
      [seasonId]
    );
    return {
      totalJornadas: Number(rows[0].totalJornadas),
      finishedJornadas: Number(rows[0].finishedJornadas),
      totalPoints: Number(rows[0].totalPoints),
      totalPredictions: Number(rows[0].totalPredictions),
    };
  }
}
