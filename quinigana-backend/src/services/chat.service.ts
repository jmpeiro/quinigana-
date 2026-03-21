import pool from '../config/database';

export class ChatService {
  static async saveMessage(groupId: number, userId: number, message: string) {
    const [result]: any = await pool.execute(
      'INSERT INTO chat_messages (group_id, user_id, message) VALUES (?, ?, ?)',
      [groupId, userId, message.trim().substring(0, 500)]
    );
    return result.insertId;
  }

  static async getRecentMessages(groupId: number, limit = 50, before?: number) {
    const query = before
      ? `SELECT cm.*, u.first_name, u.avatar_url FROM chat_messages cm JOIN users u ON u.id = cm.user_id WHERE cm.group_id = ? AND cm.id < ? ORDER BY cm.created_at DESC LIMIT ?`
      : `SELECT cm.*, u.first_name, u.avatar_url FROM chat_messages cm JOIN users u ON u.id = cm.user_id WHERE cm.group_id = ? ORDER BY cm.created_at DESC LIMIT ?`;
    const params = before ? [groupId, before, limit] : [groupId, limit];
    const [messages]: any = await pool.execute(query, params);
    return messages.reverse();
  }
}
