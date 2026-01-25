import pool from '../config/database';
import { Match, MatchResult } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class MatchModel {
  static async createMany(jornadaId: number, matches: Array<{ match_number: number; home_team: string; away_team: string; match_date?: string }>): Promise<void> {
    for (const match of matches) {
      await pool.execute(
        'INSERT INTO matches (jornada_id, match_number, home_team, away_team, match_date) VALUES (?, ?, ?, ?, ?)',
        [jornadaId, match.match_number, match.home_team, match.away_team, match.match_date || null]
      );
    }
  }

  static async findByJornada(jornadaId: number): Promise<Match[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM matches WHERE jornada_id = ? ORDER BY match_number ASC',
      [jornadaId]
    );
    return rows as Match[];
  }

  static async findById(id: number): Promise<Match | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM matches WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Match) : null;
  }

  static async addResult(matchId: number, homeScore: number, awayScore: number): Promise<number> {
    let result1x2: '1' | 'X' | '2';
    if (homeScore > awayScore) result1x2 = '1';
    else if (homeScore === awayScore) result1x2 = 'X';
    else result1x2 = '2';

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO match_results (match_id, home_score, away_score, result_1x2) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE home_score = ?, away_score = ?, result_1x2 = ?',
      [matchId, homeScore, awayScore, result1x2, homeScore, awayScore, result1x2]
    );
    return result.insertId;
  }

  static async getResult(matchId: number): Promise<MatchResult | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM match_results WHERE match_id = ?',
      [matchId]
    );
    return rows.length > 0 ? (rows[0] as MatchResult) : null;
  }

  static async getResultsByJornada(jornadaId: number): Promise<MatchResult[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT mr.* FROM match_results mr
       INNER JOIN matches m ON mr.match_id = m.id
       WHERE m.jornada_id = ?`,
      [jornadaId]
    );
    return rows as MatchResult[];
  }
}
