import crypto from 'crypto';
import pool from '../config/database';

export class ApiKeyService {
  static generateKey(): string {
    return `qg_${crypto.randomBytes(32).toString('hex')}`;
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  static async create(userId: number, name: string, permissions: string[] = ['read']): Promise<string> {
    const key = this.generateKey();
    const hash = this.hashKey(key);

    await pool.execute(
      'INSERT INTO api_keys (user_id, key_hash, name, permissions) VALUES (?, ?, ?, ?)',
      [userId, hash, name, JSON.stringify(permissions)]
    );

    return key; // Return unhashed key only once
  }

  static async validate(key: string): Promise<{ userId: number; permissions: string[] } | null> {
    const hash = this.hashKey(key);
    const [rows]: any = await pool.execute(
      'SELECT user_id, permissions FROM api_keys WHERE key_hash = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())',
      [hash]
    );

    if (!rows.length) return null;

    await pool.execute('UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = ?', [hash]);

    return {
      userId: rows[0].user_id,
      permissions: JSON.parse(rows[0].permissions || '["read"]'),
    };
  }

  static async listUserKeys(userId: number) {
    const [keys]: any = await pool.execute(
      'SELECT id, name, permissions, last_used_at, expires_at, is_active, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return keys;
  }

  static async revoke(keyId: number, userId: number) {
    await pool.execute(
      'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?',
      [keyId, userId]
    );
  }
}
