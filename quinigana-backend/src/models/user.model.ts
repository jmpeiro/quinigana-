import pool from '../config/database';
import { User } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket, User {}

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE google_id = ?',
      [googleId]
    );
    return rows[0] || null;
  }

  static async create(data: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name?: string | null;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, password_hash, first_name, last_name, auth_provider, is_admin)
       VALUES (?, ?, ?, ?, 'local', FALSE)`,
      [data.email, data.password_hash, data.first_name, data.last_name || null]
    );
    return result.insertId;
  }

  static async createGoogleUser(data: {
    email: string;
    google_id: string;
    first_name: string;
    last_name?: string | null;
    avatar_url?: string | null;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (email, google_id, first_name, last_name, avatar_url, auth_provider, email_verified, is_admin)
       VALUES (?, ?, ?, ?, ?, 'google', TRUE, FALSE)`,
      [data.email, data.google_id, data.first_name, data.last_name || null, data.avatar_url || null]
    );
    return result.insertId;
  }

  static async linkGoogle(userId: number, googleId: string, avatarUrl: string | null): Promise<void> {
    await pool.execute(
      `UPDATE users SET google_id = ?, auth_provider = 'both', avatar_url = COALESCE(avatar_url, ?), email_verified = TRUE
       WHERE id = ?`,
      [googleId, avatarUrl, userId]
    );
  }

  static async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  }

  static async updateProfile(userId: number, data: { first_name?: string; last_name?: string }): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.first_name) {
      fields.push('first_name = ?');
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      fields.push('last_name = ?');
      values.push(data.last_name);
    }

    if (fields.length === 0) return;

    values.push(userId);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  static async updateAvatar(userId: number, avatarUrl: string | null): Promise<void> {
    await pool.execute(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarUrl, userId]
    );
  }

  static async deactivateAccount(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [userId]
    );
  }

  static async getAllActiveUserIds(): Promise<number[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE is_active = TRUE'
    );
    return rows.map(r => r.id);
  }
}
