import pool from '../config/database';
import { Group, GroupMember, GroupMemberWithUser } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class GroupModel {
  static async create(name: string, description: string | null, createdBy: number): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO `groups` (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, createdBy]
    );
    return result.insertId;
  }

  static async findById(id: number): Promise<Group | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM `groups` WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? (rows[0] as Group) : null;
  }

  static async findByUser(userId: number): Promise<(Group & { role: string; member_count: number })[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT g.*, gm.role,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM \`groups\` g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ? AND g.is_active = TRUE
       ORDER BY g.updated_at DESC`,
      [userId]
    );
    return rows as (Group & { role: string; member_count: number })[];
  }

  static async update(id: number, data: { name?: string; description?: string }): Promise<void> {
    const fields: string[] = [];
    const values: (string | undefined)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (fields.length === 0) return;

    values.push(String(id));
    await pool.execute(
      `UPDATE \`groups\` SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async delete(id: number): Promise<void> {
    await pool.execute(
      'UPDATE `groups` SET is_active = FALSE WHERE id = ?',
      [id]
    );
  }

  static async addMember(groupId: number, userId: number, role: 'admin' | 'member' = 'member'): Promise<void> {
    await pool.execute(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, userId, role]
    );
  }

  static async removeMember(groupId: number, userId: number): Promise<void> {
    await pool.execute(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
  }

  static async getMembers(groupId: number): Promise<GroupMemberWithUser[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT gm.*, u.email, u.first_name, u.last_name, u.avatar_url
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.role ASC, gm.joined_at ASC`,
      [groupId]
    );
    return rows as GroupMemberWithUser[];
  }

  static async getMember(groupId: number, userId: number): Promise<GroupMember | null> {
    console.log('[GROUP MODEL] getMember called with:', { groupId, userId });
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    console.log('[GROUP MODEL] getMember query result:', {
      rowCount: rows.length,
      rows: rows,
    });
    const result = rows.length > 0 ? (rows[0] as GroupMember) : null;
    console.log('[GROUP MODEL] getMember returning:', result);
    return result;
  }

  static async getMemberCount(groupId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
      [groupId]
    );
    return (rows[0] as { count: number }).count;
  }

  static async isAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = await this.getMember(groupId, userId);
    return member?.role === 'admin';
  }

  static async isMember(groupId: number, userId: number): Promise<boolean> {
    const member = await this.getMember(groupId, userId);
    return member !== null;
  }
}
