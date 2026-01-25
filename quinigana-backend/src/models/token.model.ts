import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface TokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

interface ResetTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
}

export class TokenModel {
  static async saveRefreshToken(data: {
    user_id: number;
    token_hash: string;
    device_info?: string;
    expires_at: Date;
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_info, expires_at)
       VALUES (?, ?, ?, ?)`,
      [data.user_id, data.token_hash, data.device_info || null, data.expires_at]
    );
    return result.insertId;
  }

  static async findRefreshToken(tokenHash: string): Promise<TokenRow | null> {
    const [rows] = await pool.execute<TokenRow[]>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async revokeRefreshToken(tokenHash: string): Promise<void> {
    await pool.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
      [tokenHash]
    );
  }

  static async revokeAllUserTokens(userId: number): Promise<void> {
    await pool.execute(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }

  static async savePasswordResetToken(data: {
    user_id: number;
    token_hash: string;
    expires_at: Date;
  }): Promise<void> {
    await pool.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [data.user_id]
    );

    await pool.execute<ResultSetHeader>(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [data.user_id, data.token_hash, data.expires_at]
    );
  }

  static async findPasswordResetToken(tokenHash: string): Promise<ResetTokenRow | null> {
    const [rows] = await pool.execute<ResetTokenRow[]>(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  static async markResetTokenUsed(tokenHash: string): Promise<void> {
    await pool.execute(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?',
      [tokenHash]
    );
  }
}
