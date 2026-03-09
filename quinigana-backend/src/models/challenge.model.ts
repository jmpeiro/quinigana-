import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Challenge, ChallengeWithDetails, ChallengeStats, RivalryStats } from '../types';

const CHALLENGE_EXPIRY_HOURS = 48;

export class ChallengeModel {
  static async create(
    challengerId: number,
    challengedId: number,
    jornadaId: number,
    wagerPoints: number,
    message?: string
  ): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO challenges (challenger_id, challenged_id, jornada_id, wager_points, message)
       VALUES (?, ?, ?, ?, ?)`,
      [challengerId, challengedId, jornadaId, wagerPoints, message || null]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<Challenge | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Challenge) : null;
  }

  static async findByIdWithDetails(id: number): Promise<ChallengeWithDetails | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*,
              u1.first_name as challenger_name, u1.avatar_url as challenger_avatar,
              u2.first_name as challenged_name, u2.avatar_url as challenged_avatar,
              j.name as jornada_name,
              u3.first_name as winner_name
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN jornadas j ON c.jornada_id = j.id
       LEFT JOIN users u3 ON c.winner_id = u3.id
       WHERE c.id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as ChallengeWithDetails) : null;
  }

  static async getUserChallenges(
    userId: number,
    status?: string,
    limit = 20,
    offset = 0
  ): Promise<{ challenges: ChallengeWithDetails[]; total: number }> {
    let whereClause = '(c.challenger_id = ? OR c.challenged_id = ?)';
    const params: (number | string)[] = [userId, userId];

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM challenges c WHERE ${whereClause}`,
      params
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*,
              u1.first_name as challenger_name, u1.avatar_url as challenger_avatar,
              u2.first_name as challenged_name, u2.avatar_url as challenged_avatar,
              j.name as jornada_name,
              u3.first_name as winner_name
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN jornadas j ON c.jornada_id = j.id
       LEFT JOIN users u3 ON c.winner_id = u3.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      challenges: rows as ChallengeWithDetails[],
      total: (countRows[0] as RowDataPacket).total,
    };
  }

  /**
   * Cursor-based pagination for challenge history (API spec compliant).
   */
  static async getUserChallengeHistory(
    userId: number,
    cursor?: string,
    limit = 20,
    direction: 'next' | 'prev' = 'next'
  ): Promise<{ data: ChallengeWithDetails[]; nextCursor: string | null; prevCursor: string | null; total: number }> {
    const params: (number | string)[] = [userId, userId];
    let cursorClause = '';

    if (cursor) {
      const cursorId = parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10);
      if (!isNaN(cursorId)) {
        if (direction === 'next') {
          cursorClause = ' AND c.id < ?';
        } else {
          cursorClause = ' AND c.id > ?';
        }
        params.push(cursorId);
      }
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM challenges c
       WHERE (c.challenger_id = ? OR c.challenged_id = ?)`,
      [userId, userId]
    );

    const orderDir = direction === 'prev' ? 'ASC' : 'DESC';

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*,
              u1.first_name as challenger_name, u1.avatar_url as challenger_avatar,
              u2.first_name as challenged_name, u2.avatar_url as challenged_avatar,
              j.name as jornada_name,
              u3.first_name as winner_name
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN jornadas j ON c.jornada_id = j.id
       LEFT JOIN users u3 ON c.winner_id = u3.id
       WHERE (c.challenger_id = ? OR c.challenged_id = ?)${cursorClause}
       ORDER BY c.id ${orderDir}
       LIMIT ?`,
      [...params, limit + 1]
    );

    let data = rows as ChallengeWithDetails[];
    const hasMore = data.length > limit;
    if (hasMore) data = data.slice(0, limit);
    if (direction === 'prev') data.reverse();

    const nextCursor = hasMore && data.length > 0
      ? Buffer.from(String(data[data.length - 1].id)).toString('base64')
      : null;
    const prevCursor = data.length > 0
      ? Buffer.from(String(data[0].id)).toString('base64')
      : null;

    return {
      data,
      nextCursor,
      prevCursor,
      total: (countRows[0] as RowDataPacket).total,
    };
  }

  static async getPendingChallengesForUser(userId: number): Promise<ChallengeWithDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.*,
              u1.first_name as challenger_name, u1.avatar_url as challenger_avatar,
              u2.first_name as challenged_name, u2.avatar_url as challenged_avatar,
              j.name as jornada_name,
              NULL as winner_name
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN jornadas j ON c.jornada_id = j.id
       WHERE c.challenged_id = ? AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return rows as ChallengeWithDetails[];
  }

  static async updateStatus(
    id: number,
    status: string,
    respondedAt?: Date
  ): Promise<void> {
    if (respondedAt) {
      await pool.execute(
        'UPDATE challenges SET status = ?, responded_at = ? WHERE id = ?',
        [status, respondedAt, id]
      );
    } else {
      await pool.execute(
        'UPDATE challenges SET status = ? WHERE id = ?',
        [status, id]
      );
    }
  }

  static async completeChallenge(
    id: number,
    challengerScore: number,
    challengedScore: number,
    winnerId: number | null
  ): Promise<void> {
    await pool.execute(
      `UPDATE challenges
       SET status = 'completed',
           challenger_score = ?,
           challenged_score = ?,
           winner_id = ?,
           completed_at = NOW()
       WHERE id = ?`,
      [challengerScore, challengedScore, winnerId, id]
    );
  }

  static async getActiveChallengesForJornada(jornadaId: number): Promise<Challenge[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM challenges
       WHERE jornada_id = ? AND status = 'accepted'`,
      [jornadaId]
    );
    return rows as Challenge[];
  }

  static async existsForJornada(
    challengerId: number,
    challengedId: number,
    jornadaId: number
  ): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM challenges
       WHERE challenger_id = ? AND challenged_id = ? AND jornada_id = ?
       AND status NOT IN ('cancelled', 'expired', 'rejected')`,
      [challengerId, challengedId, jornadaId]
    );
    return rows.length > 0;
  }

  // =====================================================
  // EXPIRATION LOGIC
  // =====================================================

  /**
   * Find all pending challenges older than 48 hours.
   */
  static async findExpiredPendingChallenges(): Promise<Challenge[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM challenges
       WHERE status = 'pending'
         AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [CHALLENGE_EXPIRY_HOURS]
    );
    return rows as Challenge[];
  }

  /**
   * Mark a single challenge as expired.
   */
  static async expireChallenge(id: number): Promise<void> {
    await pool.execute(
      `UPDATE challenges SET status = 'expired', expired_at = NOW() WHERE id = ? AND status = 'pending'`,
      [id]
    );
  }

  /**
   * Bulk-expire all pending challenges older than 48h. Returns count of expired.
   */
  static async expireOldPendingChallenges(): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE challenges
       SET status = 'expired', expired_at = NOW()
       WHERE status = 'pending'
         AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [CHALLENGE_EXPIRY_HOURS]
    );
    return result.affectedRows;
  }

  /**
   * Check-on-access: if a specific challenge is pending and expired, auto-expire it.
   */
  static async checkAndExpireIfNeeded(challenge: Challenge): Promise<Challenge> {
    if (challenge.status !== 'pending') return challenge;

    const createdAt = new Date(challenge.created_at);
    const expiryTime = new Date(createdAt.getTime() + CHALLENGE_EXPIRY_HOURS * 60 * 60 * 1000);

    if (new Date() > expiryTime) {
      await this.expireChallenge(challenge.id);
      return { ...challenge, status: 'expired', expired_at: new Date() } as Challenge;
    }

    return challenge;
  }

  // =====================================================
  // CHALLENGE STATS
  // =====================================================

  static async getOrCreateStats(userId: number, opponentId: number): Promise<ChallengeStats> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM challenge_stats WHERE user_id = ? AND opponent_id = ?',
      [userId, opponentId]
    );

    if (rows.length > 0) {
      return rows[0] as ChallengeStats;
    }

    await pool.execute(
      'INSERT INTO challenge_stats (user_id, opponent_id) VALUES (?, ?)',
      [userId, opponentId]
    );

    return {
      user_id: userId,
      opponent_id: opponentId,
      total_challenges: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      points_won: 0,
      points_lost: 0,
      last_challenge_at: null,
    };
  }

  static async updateStats(
    userId: number,
    opponentId: number,
    isWin: boolean,
    isDraw: boolean,
    pointsChange: number
  ): Promise<void> {
    let updateQuery = `
      UPDATE challenge_stats
      SET total_challenges = total_challenges + 1,
          last_challenge_at = NOW(),
    `;

    if (isDraw) {
      updateQuery += 'draws = draws + 1';
    } else if (isWin) {
      updateQuery += `wins = wins + 1, points_won = points_won + ${pointsChange}`;
    } else {
      updateQuery += `losses = losses + 1, points_lost = points_lost + ${pointsChange}`;
    }

    updateQuery += ' WHERE user_id = ? AND opponent_id = ?';

    await pool.execute(updateQuery, [userId, opponentId]);
  }

  static async getUserRivalries(userId: number, limit = 10): Promise<RivalryStats[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT cs.opponent_id,
              u.first_name as opponent_name,
              u.avatar_url as opponent_avatar,
              cs.total_challenges, cs.wins, cs.losses, cs.draws,
              (cs.points_won - cs.points_lost) as net_points
       FROM challenge_stats cs
       JOIN users u ON cs.opponent_id = u.id
       WHERE cs.user_id = ? AND cs.total_challenges > 0
       ORDER BY cs.total_challenges DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows as RivalryStats[];
  }

  static async getHeadToHead(userId: number, opponentId: number): Promise<RivalryStats | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT cs.opponent_id,
              u.first_name as opponent_name,
              u.avatar_url as opponent_avatar,
              cs.total_challenges, cs.wins, cs.losses, cs.draws,
              (cs.points_won - cs.points_lost) as net_points
       FROM challenge_stats cs
       JOIN users u ON cs.opponent_id = u.id
       WHERE cs.user_id = ? AND cs.opponent_id = ?`,
      [userId, opponentId]
    );
    return rows.length > 0 ? (rows[0] as RivalryStats) : null;
  }

  static async getHeadToHeadRecent(userId: number, opponentId: number, limit: number = 10): Promise<any[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.status, c.winner_id, c.points, c.created_at, c.resolved_at,
              j.name as jornada_name
       FROM challenges c
       LEFT JOIN jornadas j ON c.jornada_id = j.id
       WHERE (c.challenger_id = ? AND c.challenged_id = ?)
          OR (c.challenger_id = ? AND c.challenged_id = ?)
       ORDER BY c.created_at DESC
       LIMIT ?`,
      [userId, opponentId, opponentId, userId, limit]
    );
    return rows as any[];
  }

  static async existsBetweenUsersForJornada(userId1: number, userId2: number, jornadaId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM challenges
       WHERE jornada_id = ?
         AND ((challenger_id = ? AND challenged_id = ?) OR (challenger_id = ? AND challenged_id = ?))
       LIMIT 1`,
      [jornadaId, userId1, userId2, userId2, userId1]
    );
    return rows.length > 0;
  }

  static async getUserJornadaPerformance(userId: number, jornadaId: number): Promise<{ correctPredictions: number; totalPoints: number }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COALESCE(SUM(CASE WHEN p.points > 0 THEN 1 ELSE 0 END), 0) as correctPredictions,
        COALESCE(SUM(p.points), 0) as totalPoints
       FROM proposals p
       WHERE p.user_id = ? AND p.jornada_id = ?`,
      [userId, jornadaId]
    );
    const row = rows[0] as any;
    return {
      correctPredictions: Number(row?.correctPredictions || 0),
      totalPoints: Number(row?.totalPoints || 0),
    };
  }

  // Reputation points
  static async getUserReputation(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT reputation_points FROM users WHERE id = ?',
      [userId]
    );
    return rows.length > 0 ? (rows[0] as RowDataPacket).reputation_points : 0;
  }

  static async updateUserReputation(userId: number, change: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET reputation_points = GREATEST(0, reputation_points + ?) WHERE id = ?',
      [change, userId]
    );
  }

  static async getUserChallengeStats(userId: number): Promise<{
    totalChallenges: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    currentStreak: number;
  }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != ? THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN winner_id IS NULL AND status = 'completed' THEN 1 ELSE 0 END) as draws
       FROM challenges
       WHERE (challenger_id = ? OR challenged_id = ?) AND status = 'completed'`,
      [userId, userId, userId, userId]
    );

    const stats = rows[0] as RowDataPacket;
    const total = stats.total || 0;
    const wins = stats.wins || 0;
    const losses = stats.losses || 0;
    const draws = stats.draws || 0;

    // Calculate current win streak
    const [streakRows] = await pool.execute<RowDataPacket[]>(
      `SELECT winner_id
       FROM challenges
       WHERE (challenger_id = ? OR challenged_id = ?) AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 20`,
      [userId, userId]
    );

    let currentStreak = 0;
    for (const row of streakRows as RowDataPacket[]) {
      if (row.winner_id === userId) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalChallenges: total,
      wins,
      losses,
      draws,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      currentStreak,
    };
  }

  /**
   * Get the number of completed challenge wins for a user (for badges).
   */
  static async getUserWinCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as wins FROM challenges
       WHERE winner_id = ? AND status = 'completed'`,
      [userId]
    );
    return Number((rows[0] as RowDataPacket).wins || 0);
  }

  /**
   * Get the user's current win streak (for undefeated badge).
   */
  static async getUserWinStreak(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT winner_id
       FROM challenges
       WHERE (challenger_id = ? OR challenged_id = ?) AND status = 'completed'
       ORDER BY completed_at DESC
       LIMIT 20`,
      [userId, userId]
    );

    let streak = 0;
    for (const row of rows as RowDataPacket[]) {
      if (row.winner_id === userId) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * Get total completed challenges for a user (for first_challenge badge).
   */
  static async getUserCompletedCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM challenges
       WHERE (challenger_id = ? OR challenged_id = ?) AND status = 'completed'`,
      [userId, userId]
    );
    return Number((rows[0] as RowDataPacket).count || 0);
  }
}
