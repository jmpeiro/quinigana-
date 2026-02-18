import pool from '../config/database';

export interface ActivityEntry {
  type: 'proposal_created' | 'vote_cast' | 'results_published' | 'member_joined' | 'proposal_approved' | 'badge_unlocked' | 'challenge_won';
  userName: string;
  detail: string;
  actionType: 'open_proposal' | 'open_jornada' | 'open_invite' | 'open_challenge' | null;
  actionTarget: {
    groupId?: number;
    jornadaId?: number;
    proposalId?: number;
    challengeId?: number;
  } | null;
  createdAt: Date;
}

export class ActivityModel {
  static async getGroupActivity(
    groupId: number,
    page: number,
    limit: number,
    type?: ActivityEntry['type'],
    from?: string,
    to?: string
  ): Promise<{ items: ActivityEntry[]; total: number }> {
    const offset = (page - 1) * limit;
    const filterConditions: string[] = [];
    const filterParams: unknown[] = [];

    if (type) {
      filterConditions.push('activity.type = ?');
      filterParams.push(type);
    }
    if (from) {
      filterConditions.push('activity.createdAt >= ?');
      filterParams.push(from);
    }
    if (to) {
      filterConditions.push('activity.createdAt <= ?');
      filterParams.push(to);
    }

    const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

    const baseSql = `
      SELECT *
      FROM (
        SELECT 'proposal_created' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Propuesta: ', COALESCE(p.title, CONCAT('Jornada ', j.name))) as detail,
               'open_proposal' as actionType,
               p.group_id as actionGroupId,
               p.jornada_id as actionJornadaId,
               p.id as actionProposalId,
               NULL as actionChallengeId,
               p.created_at as createdAt
        FROM quiniela_proposals p
        JOIN users u ON p.proposed_by = u.id
        JOIN jornadas j ON p.jornada_id = j.id
        WHERE p.group_id = ?

        UNION ALL

        SELECT 'vote_cast' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Voto en propuesta #', pv.proposal_id) as detail,
               'open_proposal' as actionType,
               p.group_id as actionGroupId,
               p.jornada_id as actionJornadaId,
               pv.proposal_id as actionProposalId,
               NULL as actionChallengeId,
               pv.created_at as createdAt
        FROM proposal_votes pv
        JOIN users u ON pv.user_id = u.id
        JOIN quiniela_proposals p ON pv.proposal_id = p.id
        WHERE p.group_id = ?

        UNION ALL

        SELECT 'member_joined' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               'Se unio al grupo' as detail,
               NULL as actionType,
               gm.group_id as actionGroupId,
               NULL as actionJornadaId,
               NULL as actionProposalId,
               NULL as actionChallengeId,
               gm.joined_at as createdAt
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?

        UNION ALL

        SELECT 'proposal_approved' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Propuesta aprobada: ', COALESCE(p.title, CONCAT('Jornada ', j.name))) as detail,
               'open_proposal' as actionType,
               p.group_id as actionGroupId,
               p.jornada_id as actionJornadaId,
               p.id as actionProposalId,
               NULL as actionChallengeId,
               p.updated_at as createdAt
        FROM quiniela_proposals p
        JOIN users u ON p.proposed_by = u.id
        JOIN jornadas j ON p.jornada_id = j.id
        WHERE p.group_id = ? AND p.status = 'approved'

        UNION ALL

        SELECT 'results_published' as type,
               'Sistema' as userName,
               CONCAT('Resultados publicados para ', j.name) as detail,
               'open_jornada' as actionType,
               gs.group_id as actionGroupId,
               gs.jornada_id as actionJornadaId,
               NULL as actionProposalId,
               NULL as actionChallengeId,
               gs.created_at as createdAt
        FROM group_scores gs
        JOIN jornadas j ON gs.jornada_id = j.id
        WHERE gs.group_id = ?

        UNION ALL

        SELECT 'badge_unlocked' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Desbloqueo insignia: ', bd.name) as detail,
               NULL as actionType,
               gm.group_id as actionGroupId,
               NULL as actionJornadaId,
               NULL as actionProposalId,
               NULL as actionChallengeId,
               ub.earned_at as createdAt
        FROM user_badges ub
        JOIN users u ON ub.user_id = u.id
        JOIN badge_definitions bd ON ub.badge_id = bd.id
        JOIN group_members gm ON gm.user_id = ub.user_id
        WHERE gm.group_id = ?

        UNION ALL

        SELECT 'challenge_won' as type,
               CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as userName,
               CONCAT('Gano un reto 1vs1 en ', j.name) as detail,
               'open_challenge' as actionType,
               gm1.group_id as actionGroupId,
               c.jornada_id as actionJornadaId,
               NULL as actionProposalId,
               c.id as actionChallengeId,
               c.completed_at as createdAt
        FROM challenges c
        JOIN users u ON c.winner_id = u.id
        JOIN jornadas j ON c.jornada_id = j.id
        JOIN group_members gm1 ON gm1.user_id = c.challenger_id
        JOIN group_members gm2 ON gm2.user_id = c.challenged_id AND gm2.group_id = gm1.group_id
        WHERE gm1.group_id = ? AND c.status = 'completed' AND c.winner_id IS NOT NULL
      ) activity
    `;

    const baseParams: unknown[] = [groupId, groupId, groupId, groupId, groupId, groupId, groupId];

    const [rows] = await pool.execute(
      `${baseSql}
       ${whereClause}
       ORDER BY activity.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, ...filterParams, limit, offset]
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM (${baseSql} ${whereClause}) t`,
      [...baseParams, ...filterParams]
    );

    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const items = (rows as Array<any>).map((row) => ({
      type: row.type,
      userName: row.userName?.trim() || '',
      detail: row.detail,
      actionType: row.actionType,
      actionTarget: row.actionType
        ? {
            groupId: row.actionGroupId ?? undefined,
            jornadaId: row.actionJornadaId ?? undefined,
            proposalId: row.actionProposalId ?? undefined,
            challengeId: row.actionChallengeId ?? undefined,
          }
        : null,
      createdAt: row.createdAt,
    })) as ActivityEntry[];

    return { items, total };
  }
}
