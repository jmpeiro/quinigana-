import pool from '../config/database';

export interface ActivityEntry {
  type: 'proposal_created' | 'vote_cast' | 'results_published' | 'member_joined' | 'proposal_approved';
  userName: string;
  detail: string;
  createdAt: Date;
}

export class ActivityModel {
  static async getGroupActivity(groupId: number, page: number, limit: number): Promise<{ items: ActivityEntry[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(`
      (
        SELECT 'proposal_created' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Propuesta: ', COALESCE(p.title, CONCAT('Jornada ', j.name))) as detail,
               p.created_at as createdAt
        FROM quiniela_proposals p
        JOIN users u ON p.proposed_by = u.id
        JOIN jornadas j ON p.jornada_id = j.id
        WHERE p.group_id = ?
      )
      UNION ALL
      (
        SELECT 'vote_cast' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Voto en propuesta #', pv.proposal_id) as detail,
               pv.created_at as createdAt
        FROM proposal_votes pv
        JOIN users u ON pv.user_id = u.id
        JOIN quiniela_proposals p ON pv.proposal_id = p.id
        WHERE p.group_id = ?
      )
      UNION ALL
      (
        SELECT 'member_joined' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               'Se unio al grupo' as detail,
               gm.joined_at as createdAt
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
      )
      UNION ALL
      (
        SELECT 'proposal_approved' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Propuesta aprobada: ', COALESCE(p.title, CONCAT('Jornada ', j.name))) as detail,
               p.updated_at as createdAt
        FROM quiniela_proposals p
        JOIN users u ON p.proposed_by = u.id
        JOIN jornadas j ON p.jornada_id = j.id
        WHERE p.group_id = ? AND p.status = 'approved'
      )
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `, [groupId, groupId, groupId, groupId, limit, offset]);

    const [countRows] = await pool.execute(`
      SELECT (
        (SELECT COUNT(*) FROM quiniela_proposals WHERE group_id = ?) +
        (SELECT COUNT(*) FROM proposal_votes pv JOIN quiniela_proposals p ON pv.proposal_id = p.id WHERE p.group_id = ?) +
        (SELECT COUNT(*) FROM group_members WHERE group_id = ?) +
        (SELECT COUNT(*) FROM quiniela_proposals WHERE group_id = ? AND status = 'approved')
      ) as total
    `, [groupId, groupId, groupId, groupId]);

    const total = (countRows as any[])[0]?.total || 0;

    return { items: rows as ActivityEntry[], total };
  }
}
