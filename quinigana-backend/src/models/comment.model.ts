import pool from '../config/database';
import { ProposalCommentWithUser } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class CommentModel {
  static async create(proposalId: number, userId: number, message: string): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO proposal_comments (proposal_id, user_id, message) VALUES (?, ?, ?)',
      [proposalId, userId, message]
    );
    return result.insertId;
  }

  static async findByProposal(proposalId: number, page: number, limit: number): Promise<ProposalCommentWithUser[]> {
    const offset = (page - 1) * limit;
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT pc.id, pc.proposal_id, pc.user_id, pc.message, pc.created_at,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_name,
              u.avatar_url
       FROM proposal_comments pc
       INNER JOIN users u ON pc.user_id = u.id
       WHERE pc.proposal_id = ?
       ORDER BY pc.created_at ASC
       LIMIT ? OFFSET ?`,
      [proposalId, limit, offset]
    );
    return rows as ProposalCommentWithUser[];
  }

  static async countByProposal(proposalId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM proposal_comments WHERE proposal_id = ?',
      [proposalId]
    );
    return (rows[0] as { total: number }).total;
  }

  static async findById(id: number): Promise<{ id: number; proposal_id: number; user_id: number } | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, proposal_id, user_id FROM proposal_comments WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as { id: number; proposal_id: number; user_id: number }) : null;
  }

  static async delete(id: number): Promise<void> {
    await pool.execute('DELETE FROM proposal_comments WHERE id = ?', [id]);
  }
}
