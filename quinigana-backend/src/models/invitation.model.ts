import pool from '../config/database';
import { GroupInvitation, GroupInvitationWithDetails } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class InvitationModel {
  static async create(groupId: number, invitedBy: number, invitedUserId: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO group_invitations (group_id, invited_by, invited_user_id) VALUES (?, ?, ?)',
      [groupId, invitedBy, invitedUserId]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<GroupInvitation | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM group_invitations WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as GroupInvitation) : null;
  }

  static async findPendingByUser(userId: number): Promise<GroupInvitationWithDetails[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gi.*, g.name as group_name,
        CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as inviter_name,
        u.email as inviter_email
       FROM group_invitations gi
       INNER JOIN \`groups\` g ON gi.group_id = g.id
       INNER JOIN users u ON gi.invited_by = u.id
       WHERE gi.invited_user_id = ? AND gi.status = 'pending' AND g.is_active = TRUE
       ORDER BY gi.created_at DESC`,
      [userId]
    );
    return rows as GroupInvitationWithDetails[];
  }

  static async hasPendingInvitation(groupId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM group_invitations WHERE group_id = ? AND invited_user_id = ? AND status = 'pending'",
      [groupId, userId]
    );
    return rows.length > 0;
  }

  static async accept(id: number): Promise<void> {
    await pool.execute(
      "UPDATE group_invitations SET status = 'accepted', responded_at = NOW() WHERE id = ?",
      [id]
    );
  }

  static async reject(id: number): Promise<void> {
    await pool.execute(
      "UPDATE group_invitations SET status = 'rejected', responded_at = NOW() WHERE id = ?",
      [id]
    );
  }
}
