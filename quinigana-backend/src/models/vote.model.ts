import pool from '../config/database';
import { ProposalVote } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class VoteModel {
  static async create(proposalId: number, userId: number, vote: 'approve' | 'reject'): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO proposal_votes (proposal_id, user_id, vote) VALUES (?, ?, ?)',
      [proposalId, userId, vote]
    );
    return result.insertId;
  }

  static async findByProposalAndUser(proposalId: number, userId: number): Promise<ProposalVote | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM proposal_votes WHERE proposal_id = ? AND user_id = ?',
      [proposalId, userId]
    );
    return rows.length > 0 ? (rows[0] as ProposalVote) : null;
  }

  static async getVotesByProposal(proposalId: number): Promise<ProposalVote[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM proposal_votes WHERE proposal_id = ?',
      [proposalId]
    );
    return rows as ProposalVote[];
  }

  static async countVotes(proposalId: number): Promise<{ votesFor: number; votesAgainst: number }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        SUM(CASE WHEN vote = 'approve' THEN 1 ELSE 0 END) as votes_for,
        SUM(CASE WHEN vote = 'reject' THEN 1 ELSE 0 END) as votes_against
       FROM proposal_votes WHERE proposal_id = ?`,
      [proposalId]
    );
    const row = rows[0] as { votes_for: number; votes_against: number };
    return {
      votesFor: row.votes_for || 0,
      votesAgainst: row.votes_against || 0
    };
  }
}
