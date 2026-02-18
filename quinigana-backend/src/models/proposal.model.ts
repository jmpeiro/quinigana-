import pool from '../config/database';
import { QuinielaProposal, ProposalPrediction, ProposalWithDetails, Prediction1x2 } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class ProposalModel {
  static async create(groupId: number, jornadaId: number, proposedBy: number, title: string | null, totalMembers: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO quiniela_proposals (group_id, jornada_id, proposed_by, title, total_members_at_creation) VALUES (?, ?, ?, ?, ?)',
      [groupId, jornadaId, proposedBy, title, totalMembers]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<QuinielaProposal | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM quiniela_proposals WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as QuinielaProposal) : null;
  }

  static async findByGroupAndJornada(groupId: number, jornadaId: number): Promise<QuinielaProposal[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM quiniela_proposals WHERE group_id = ? AND jornada_id = ? ORDER BY created_at DESC',
      [groupId, jornadaId]
    );
    return rows as QuinielaProposal[];
  }

  static async findByGroup(groupId: number, page: number = 1, limit: number = 20): Promise<{ items: (QuinielaProposal & { proposer_name: string; jornada_name: string })[]; total: number }> {
    const offset = (page - 1) * limit;
    let rows: RowDataPacket[];
    try {
      const [queryRows] = await pool.execute<RowDataPacket[]>(
        `SELECT qp.*,
          CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as proposer_name,
          j.name as jornada_name
         FROM quiniela_proposals qp
         INNER JOIN users u ON qp.proposed_by = u.id
         INNER JOIN jornadas j ON qp.jornada_id = j.id
         WHERE qp.group_id = ?
         ORDER BY qp.created_at DESC
         LIMIT ? OFFSET ?`,
        [groupId, limit, offset]
      );
      rows = queryRows;
    } catch (error: any) {
      // Backward-compatible fallback for databases without qp.created_at.
      if (error?.code !== 'ER_BAD_FIELD_ERROR') {
        throw error;
      }

      const [queryRows] = await pool.execute<RowDataPacket[]>(
        `SELECT qp.*,
          CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as proposer_name,
          j.name as jornada_name
         FROM quiniela_proposals qp
         INNER JOIN users u ON qp.proposed_by = u.id
         INNER JOIN jornadas j ON qp.jornada_id = j.id
         WHERE qp.group_id = ?
         ORDER BY qp.id DESC
         LIMIT ? OFFSET ?`,
        [groupId, limit, offset]
      );
      rows = queryRows;
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM quiniela_proposals WHERE group_id = ?',
      [groupId]
    );
    const total = (countRows[0] as any).total;
    return { items: rows as (QuinielaProposal & { proposer_name: string; jornada_name: string })[], total };
  }

  static async findApprovedByGroupAndJornada(groupId: number, jornadaId: number): Promise<QuinielaProposal | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM quiniela_proposals WHERE group_id = ? AND jornada_id = ? AND status = 'approved' LIMIT 1",
      [groupId, jornadaId]
    );
    return rows.length > 0 ? (rows[0] as QuinielaProposal) : null;
  }

  static async findPendingByGroupAndJornada(groupId: number, jornadaId: number): Promise<QuinielaProposal | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM quiniela_proposals WHERE group_id = ? AND jornada_id = ? AND status = 'pending' LIMIT 1",
      [groupId, jornadaId]
    );
    return rows.length > 0 ? (rows[0] as QuinielaProposal) : null;
  }

  static async findActiveByGroupAndJornada(groupId: number, jornadaId: number): Promise<QuinielaProposal | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM quiniela_proposals WHERE group_id = ? AND jornada_id = ? AND status IN ('pending', 'approved') LIMIT 1",
      [groupId, jornadaId]
    );
    return rows.length > 0 ? (rows[0] as QuinielaProposal) : null;
  }

  static async getWithDetails(id: number, userId?: number): Promise<ProposalWithDetails | null> {
    const proposal = await this.findById(id);
    if (!proposal) return null;

    const [userRows] = await pool.execute<RowDataPacket[]>(
      'SELECT first_name, last_name, email FROM users WHERE id = ?',
      [proposal.proposed_by]
    );
    const user = userRows[0] as RowDataPacket;

    const predictions = await this.getPredictions(id);

    let userVote: 'approve' | 'reject' | null = null;
    if (userId) {
      const [voteRows] = await pool.execute<RowDataPacket[]>(
        'SELECT vote FROM proposal_votes WHERE proposal_id = ? AND user_id = ?',
        [id, userId]
      );
      if (voteRows.length > 0) {
        userVote = (voteRows[0] as { vote: 'approve' | 'reject' }).vote;
      }
    }

    return {
      ...proposal,
      predictions,
      proposer_name: `${user.first_name} ${user.last_name || ''}`.trim(),
      proposer_email: user.email,
      user_vote: userVote
    };
  }

  static async addPredictions(proposalId: number, predictions: Array<{ match_id: number; prediction_1x2: Prediction1x2; home_score_prediction?: number; away_score_prediction?: number }>): Promise<void> {
    for (const pred of predictions) {
      await pool.execute(
        'INSERT INTO proposal_predictions (proposal_id, match_id, prediction_1x2, home_score_prediction, away_score_prediction) VALUES (?, ?, ?, ?, ?)',
        [proposalId, pred.match_id, pred.prediction_1x2, pred.home_score_prediction ?? null, pred.away_score_prediction ?? null]
      );
    }
  }

  static async updatePredictions(proposalId: number, predictions: Array<{ match_id: number; prediction_1x2: Prediction1x2; home_score_prediction?: number; away_score_prediction?: number }>): Promise<void> {
    await pool.execute('DELETE FROM proposal_predictions WHERE proposal_id = ?', [proposalId]);
    await this.addPredictions(proposalId, predictions);
  }

  static async getPredictions(proposalId: number): Promise<ProposalPrediction[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM proposal_predictions WHERE proposal_id = ? ORDER BY match_id ASC',
      [proposalId]
    );
    return rows as ProposalPrediction[];
  }

  static async updateStatus(id: number, status: 'draft' | 'pending' | 'approved' | 'rejected'): Promise<void> {
    await pool.execute(
      'UPDATE quiniela_proposals SET status = ? WHERE id = ?',
      [status, id]
    );
  }

  static async updateVoteCounts(id: number, votesFor: number, votesAgainst: number): Promise<void> {
    await pool.execute(
      'UPDATE quiniela_proposals SET votes_for = ?, votes_against = ? WHERE id = ?',
      [votesFor, votesAgainst, id]
    );
  }

  static async updateTitle(id: number, title: string): Promise<void> {
    await pool.execute(
      'UPDATE quiniela_proposals SET title = ? WHERE id = ?',
      [title, id]
    );
  }

  static async delete(id: number): Promise<void> {
    // Delete predictions first (foreign key constraint)
    await pool.execute('DELETE FROM proposal_predictions WHERE proposal_id = ?', [id]);
    // Delete votes
    await pool.execute('DELETE FROM proposal_votes WHERE proposal_id = ?', [id]);
    // Delete comments
    await pool.execute('DELETE FROM proposal_comments WHERE proposal_id = ?', [id]);
    // Delete proposal
    await pool.execute('DELETE FROM quiniela_proposals WHERE id = ?', [id]);
  }

  static async getUserPredictionsForJornada(userId: number, jornadaId: number): Promise<{ match_number: number; prediction_1x2: Prediction1x2; home_score_prediction: number | null; away_score_prediction: number | null }[]> {
    // First try: approved proposal from any group the user belongs to
    const [approved] = await pool.execute<RowDataPacket[]>(
      `SELECT m.match_number, pp.prediction_1x2, pp.home_score_prediction, pp.away_score_prediction
       FROM proposal_predictions pp
       INNER JOIN quiniela_proposals qp ON pp.proposal_id = qp.id
       INNER JOIN matches m ON pp.match_id = m.id
       INNER JOIN group_members gm ON gm.group_id = qp.group_id AND gm.user_id = ?
       WHERE qp.jornada_id = ? AND qp.status = 'approved'
       ORDER BY m.match_number ASC
       LIMIT 15`,
      [userId, jornadaId]
    );
    if (approved.length > 0) {
      return approved as { match_number: number; prediction_1x2: Prediction1x2; home_score_prediction: number | null; away_score_prediction: number | null }[];
    }

    // Fallback: user's own draft/pending proposal
    const [own] = await pool.execute<RowDataPacket[]>(
      `SELECT m.match_number, pp.prediction_1x2, pp.home_score_prediction, pp.away_score_prediction
       FROM proposal_predictions pp
       INNER JOIN quiniela_proposals qp ON pp.proposal_id = qp.id
       INNER JOIN matches m ON pp.match_id = m.id
       WHERE qp.proposed_by = ? AND qp.jornada_id = ? AND qp.status IN ('draft', 'pending')
       ORDER BY m.match_number ASC
       LIMIT 15`,
      [userId, jornadaId]
    );
    return own as { match_number: number; prediction_1x2: Prediction1x2; home_score_prediction: number | null; away_score_prediction: number | null }[];
  }
}
