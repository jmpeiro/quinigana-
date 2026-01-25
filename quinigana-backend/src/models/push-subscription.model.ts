import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface PushSubscriptionRecord {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: Date;
}

export interface CreatePushSubscriptionDto {
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

export class PushSubscriptionModel {
  static async upsert(data: CreatePushSubscriptionDto): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), user_agent = VALUES(user_agent)`,
      [data.user_id, data.endpoint, data.p256dh, data.auth, data.user_agent || null]
    );
  }

  static async findByUserIds(userIds: number[]): Promise<PushSubscriptionRecord[]> {
    if (userIds.length === 0) return [];
    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM push_subscriptions WHERE user_id IN (${placeholders})`,
      userIds
    );
    return rows as PushSubscriptionRecord[];
  }

  static async deleteByEndpoint(endpoint: string): Promise<void> {
    await pool.execute('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  }

  static async deleteByUserId(userId: number): Promise<void> {
    await pool.execute('DELETE FROM push_subscriptions WHERE user_id = ?', [userId]);
  }

  static async hasSubscriptions(userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );
    return (rows[0] as { count: number }).count > 0;
  }
}
