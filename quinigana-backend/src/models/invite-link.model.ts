import pool from '../config/database';
import crypto from 'crypto';
import { InviteLink } from '../types';

export class InviteLinkModel {
  static async create(groupId: number, createdBy: number, expiresInHours = 48, maxUses = 0): Promise<InviteLink> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const [result] = await pool.execute(
      'INSERT INTO group_invite_links (group_id, created_by, token, expires_at, max_uses) VALUES (?, ?, ?, ?, ?)',
      [groupId, createdBy, token, expiresAt, maxUses]
    );

    return {
      id: (result as any).insertId,
      group_id: groupId,
      created_by: createdBy,
      token,
      expires_at: expiresAt,
      max_uses: maxUses,
      use_count: 0,
      is_active: true,
      created_at: new Date(),
    };
  }

  static async findByToken(token: string): Promise<InviteLink | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM group_invite_links WHERE token = ? AND is_active = TRUE',
      [token]
    );
    const results = rows as InviteLink[];
    return results[0] || null;
  }

  static async incrementUseCount(id: number): Promise<void> {
    await pool.execute(
      'UPDATE group_invite_links SET use_count = use_count + 1 WHERE id = ?',
      [id]
    );
  }

  static async deactivate(id: number): Promise<void> {
    await pool.execute(
      'UPDATE group_invite_links SET is_active = FALSE WHERE id = ?',
      [id]
    );
  }

  static async deactivateByGroup(groupId: number): Promise<void> {
    await pool.execute(
      'UPDATE group_invite_links SET is_active = FALSE WHERE group_id = ?',
      [groupId]
    );
  }
}
