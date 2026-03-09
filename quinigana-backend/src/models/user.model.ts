import pool from '../config/database';
import { User } from '../types';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket, User {}

export class UserModel {
  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    return rows[0] || null;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE google_id = ? AND deleted_at IS NULL',
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

  // =====================================================
  // SOFT DELETE (Migration 020)
  // =====================================================

  /**
   * Deactivate a user account (admin action). Sets is_active = FALSE.
   */
  static async deactivateAccount(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [userId]
    );
  }

  /**
   * Reactivate a deactivated user account (admin action).
   */
  static async reactivateAccount(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET is_active = TRUE, deleted_at = NULL, deletion_requested_at = NULL WHERE id = ?',
      [userId]
    );
  }

  /**
   * Request account deletion (user-initiated). Sets deletion_requested_at
   * and schedules the soft delete. The actual deletion happens after a grace period.
   */
  static async requestDeletion(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET deletion_requested_at = NOW() WHERE id = ?',
      [userId]
    );
  }

  /**
   * Soft-delete a user account. Sets deleted_at and is_active = FALSE.
   * The user record is preserved for data integrity but excluded from all queries.
   */
  static async softDelete(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET is_active = FALSE, deleted_at = NOW() WHERE id = ?',
      [userId]
    );
  }

  /**
   * Cancel a pending deletion request.
   */
  static async cancelDeletion(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE users SET deletion_requested_at = NULL WHERE id = ?',
      [userId]
    );
  }

  /**
   * Find users with pending deletion requests older than the grace period.
   * Used by the scheduler to process deferred deletions.
   */
  static async findPendingDeletions(gracePeriodDays: number = 30): Promise<number[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM users
       WHERE deletion_requested_at IS NOT NULL
         AND deleted_at IS NULL
         AND deletion_requested_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [gracePeriodDays]
    );
    return rows.map(r => r.id);
  }

  /**
   * Find a user even if soft-deleted (for admin purposes).
   */
  static async findByIdIncludeDeleted(id: number): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async getAllActiveUserIds(): Promise<number[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE is_active = TRUE AND deleted_at IS NULL'
    );
    return rows.map(r => r.id);
  }

  // =====================================================
  // EMAIL VERIFICATION (Migration 018)
  // =====================================================

  /**
   * Store a hashed email verification token and its expiry.
   */
  static async setEmailVerificationToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.execute(
      `UPDATE users
       SET email_verification_token = ?, email_verification_expires = ?
       WHERE id = ?`,
      [tokenHash, expiresAt, userId]
    );
  }

  /**
   * Find a user by their email verification token (must be unexpired).
   */
  static async findByVerificationToken(tokenHash: string): Promise<User | null> {
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT * FROM users
       WHERE email_verification_token = ?
         AND email_verification_expires > NOW()
         AND email_verified = FALSE`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  /**
   * Mark a user's email as verified and clear the verification token.
   */
  static async markEmailVerified(userId: number): Promise<void> {
    await pool.execute(
      `UPDATE users
       SET email_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL
       WHERE id = ?`,
      [userId]
    );
  }
}
