import pool from '../config/database';
import logger from '../config/logger';

export class TournamentService {
  static async create(groupId: number, name: string, bracketSize: number, createdBy: number) {
    const validSizes = [4, 8, 16, 32];
    if (!validSizes.includes(bracketSize)) throw { statusCode: 400, code: 'INVALID_SIZE', message: 'Bracket size must be 4, 8, 16, or 32' };
    const [result]: any = await pool.execute('INSERT INTO tournaments (group_id, name, bracket_size, created_by) VALUES (?, ?, ?, ?)', [groupId, name, bracketSize, createdBy]);
    return result.insertId;
  }

  static async join(tournamentId: number, userId: number) {
    const [tournament]: any = await pool.execute('SELECT * FROM tournaments WHERE id = ? AND status = ?', [tournamentId, 'registration']);
    if (!tournament.length) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Tournament not found or closed' };
    const [existing]: any = await pool.execute('SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?', [tournamentId]);
    if (existing[0].count >= tournament[0].bracket_size) throw { statusCode: 400, code: 'FULL', message: 'Tournament is full' };
    await pool.execute('INSERT IGNORE INTO tournament_participants (tournament_id, user_id, seed) VALUES (?, ?, ?)', [tournamentId, userId, existing[0].count + 1]);
  }

  static async getBracket(tournamentId: number) {
    const [tournament]: any = await pool.execute('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    if (!tournament.length) throw { statusCode: 404, code: 'NOT_FOUND', message: 'Tournament not found' };
    const [matches]: any = await pool.execute(
      `SELECT tm.*, u1.first_name as player1_name, u2.first_name as player2_name
       FROM tournament_matches tm LEFT JOIN users u1 ON u1.id = tm.player1_id LEFT JOIN users u2 ON u2.id = tm.player2_id
       WHERE tm.tournament_id = ? ORDER BY tm.round, tm.match_order`, [tournamentId]);
    const [participants]: any = await pool.execute(
      `SELECT tp.*, u.first_name FROM tournament_participants tp JOIN users u ON u.id = tp.user_id WHERE tp.tournament_id = ? ORDER BY tp.seed`, [tournamentId]);
    return { tournament: tournament[0], matches, participants };
  }

  static async getGroupTournaments(groupId: number) {
    const [tournaments]: any = await pool.execute(
      `SELECT t.*, u.first_name as creator_name, (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
       FROM tournaments t JOIN users u ON u.id = t.created_by WHERE t.group_id = ? ORDER BY t.created_at DESC`, [groupId]);
    return tournaments;
  }
}
