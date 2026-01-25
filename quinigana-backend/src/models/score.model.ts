import pool from '../config/database';
import { GroupScore, GroupScoreWithJornada, QuinielaResult } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ScoreModel {
  static async createResult(proposalId: number, matchId: number, points1x2: number, pointsPleno: number, isCorrect1x2: boolean, isCorrectPleno: boolean): Promise<void> {
    await pool.execute(
      'INSERT INTO quiniela_results (proposal_id, match_id, points_1x2, points_pleno, is_correct_1x2, is_correct_pleno) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE points_1x2 = ?, points_pleno = ?, is_correct_1x2 = ?, is_correct_pleno = ?',
      [proposalId, matchId, points1x2, pointsPleno, isCorrect1x2, isCorrectPleno, points1x2, pointsPleno, isCorrect1x2, isCorrectPleno]
    );
  }

  static async getResultsByProposal(proposalId: number): Promise<QuinielaResult[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM quiniela_results WHERE proposal_id = ?',
      [proposalId]
    );
    return rows as QuinielaResult[];
  }

  static async upsertGroupScore(groupId: number, jornadaId: number, proposalId: number | null, totalPoints: number, correct1x2: number, correctPleno: number): Promise<void> {
    await pool.execute(
      'INSERT INTO group_scores (group_id, jornada_id, proposal_id, total_points, correct_1x2, correct_pleno) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE proposal_id = ?, total_points = ?, correct_1x2 = ?, correct_pleno = ?',
      [groupId, jornadaId, proposalId, totalPoints, correct1x2, correctPleno, proposalId, totalPoints, correct1x2, correctPleno]
    );
  }

  static async getGroupScores(groupId: number): Promise<GroupScoreWithJornada[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gs.*, j.name as jornada_name, j.jornada_number
       FROM group_scores gs
       INNER JOIN jornadas j ON gs.jornada_id = j.id
       WHERE gs.group_id = ?
       ORDER BY j.season DESC, j.jornada_number DESC`,
      [groupId]
    );
    return rows as GroupScoreWithJornada[];
  }

  static async getGroupScoreByJornada(groupId: number, jornadaId: number): Promise<GroupScore | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM group_scores WHERE group_id = ? AND jornada_id = ?',
      [groupId, jornadaId]
    );
    return rows.length > 0 ? (rows[0] as GroupScore) : null;
  }

  static async getGroupTotalPoints(groupId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(total_points), 0) as total FROM group_scores WHERE group_id = ?',
      [groupId]
    );
    return (rows[0] as { total: number }).total;
  }
}
