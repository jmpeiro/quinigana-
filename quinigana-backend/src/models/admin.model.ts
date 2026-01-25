import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { UserAdmin, GlobalStats, GroupAdmin } from '../types';

export class AdminModel {
  static async getAllUsers(page: number, limit: number, search?: string): Promise<{ users: UserAdmin[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url,
              u.auth_provider, u.is_active, u.is_admin, u.created_at,
              (SELECT COUNT(*) FROM group_members WHERE user_id = u.id) as groupCount
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      users: rows.map(row => ({
        id: row.id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        avatar_url: row.avatar_url,
        auth_provider: row.auth_provider,
        is_active: Boolean(row.is_active),
        is_admin: Boolean(row.is_admin),
        created_at: row.created_at,
        groupCount: row.groupCount,
      })),
      total: countRows[0].total,
    };
  }

  static async toggleAdmin(userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT is_admin FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) throw new Error('User not found');

    const newValue = !rows[0].is_admin;
    await pool.execute('UPDATE users SET is_admin = ? WHERE id = ?', [newValue, userId]);
    return newValue;
  }

  static async toggleUserActive(userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT is_active FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) throw new Error('User not found');

    const newValue = !rows[0].is_active;
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [newValue, userId]);
    return newValue;
  }

  static async getGlobalStats(): Promise<GlobalStats> {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as activeUsers,
        (SELECT COUNT(*) FROM \`groups\`) as totalGroups,
        (SELECT COUNT(*) FROM \`groups\` WHERE is_active = TRUE) as activeGroups,
        (SELECT COUNT(*) FROM jornadas) as totalJornadas,
        (SELECT COUNT(*) FROM jornadas WHERE status = 'open') as openJornadas,
        (SELECT COUNT(*) FROM jornadas WHERE status = 'closed') as closedJornadas,
        (SELECT COUNT(*) FROM jornadas WHERE status = 'finished') as finishedJornadas,
        (SELECT COUNT(*) FROM quiniela_proposals) as totalProposals,
        (SELECT COUNT(*) FROM quiniela_proposals WHERE status = 'approved') as approvedProposals
    `);

    const row = rows[0];
    return {
      totalUsers: row.totalUsers,
      activeUsers: row.activeUsers,
      totalGroups: row.totalGroups,
      activeGroups: row.activeGroups,
      totalJornadas: row.totalJornadas,
      openJornadas: row.openJornadas,
      closedJornadas: row.closedJornadas,
      finishedJornadas: row.finishedJornadas,
      totalProposals: row.totalProposals,
      approvedProposals: row.approvedProposals,
    };
  }

  static async getAllGroups(page: number, limit: number, search?: string): Promise<{ groups: GroupAdmin[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: unknown[] = [];

    if (search) {
      whereClause = 'WHERE g.name LIKE ?';
      params.push(`%${search}%`);
    }

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM \`groups\` g ${whereClause}`,
      params
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT g.id, g.name, g.description, g.created_by, g.is_active, g.created_at,
              u.first_name as creator_name,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM \`groups\` g
       LEFT JOIN users u ON g.created_by = u.id
       ${whereClause}
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      groups: rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        created_by: row.created_by,
        creator_name: row.creator_name || 'Unknown',
        is_active: Boolean(row.is_active),
        member_count: row.member_count,
        created_at: row.created_at,
      })),
      total: countRows[0].total,
    };
  }

  static async deactivateGroup(groupId: number): Promise<void> {
    await pool.execute('UPDATE `groups` SET is_active = FALSE WHERE id = ?', [groupId]);
  }

  static async updateMatch(matchId: number, data: { home_team?: string; away_team?: string; match_date?: string }): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.home_team) { fields.push('home_team = ?'); values.push(data.home_team); }
    if (data.away_team) { fields.push('away_team = ?'); values.push(data.away_team); }
    if (data.match_date) { fields.push('match_date = ?'); values.push(data.match_date); }

    if (fields.length === 0) return;

    values.push(matchId);
    await pool.execute(`UPDATE matches SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async reopenJornada(jornadaId: number): Promise<void> {
    await pool.execute("UPDATE jornadas SET status = 'open' WHERE id = ?", [jornadaId]);
  }
}
