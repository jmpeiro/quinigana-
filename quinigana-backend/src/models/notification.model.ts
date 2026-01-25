import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Notification, CreateNotificationDto } from '../types';

export class NotificationModel {
  static async create(data: CreateNotificationDto): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)`,
      [data.user_id, data.type, data.title, data.message, data.link || null]
    );
    return result.insertId;
  }

  static async createBulk(notifications: CreateNotificationDto[]): Promise<void> {
    if (notifications.length === 0) return;

    const values = notifications.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const params = notifications.flatMap(n => [n.user_id, n.type, n.title, n.message, n.link || null]);

    await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, link) VALUES ${values}`,
      params
    );
  }

  static async findByUser(userId: number, page: number, limit: number): Promise<{ items: Notification[]; total: number }> {
    const offset = (page - 1) * limit;

    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`,
      [userId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return {
      items: rows as Notification[],
      total: countRows[0].total,
    };
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return rows[0].count;
  }

  static async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId: number): Promise<void> {
    await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
  }
}
