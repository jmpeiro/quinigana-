import pool from '../config/database';
import { JornadaModel } from '../models/jornada.model';
import { ChallengeModel } from '../models/challenge.model';
import { NotificationService } from './notification.service';

interface GroupMembersRow {
  group_id: number;
  user_id: number;
}

export class ChallengeAutoService {
  static async autoGenerateForOpenJornadas(): Promise<{
    created: number;
    skippedExisting: number;
    skippedInsufficientMembers: number;
    jornadasProcessed: number;
  }> {
    const jornadas = (await JornadaModel.findAll()).filter((j) => j.status === 'open');

    if (jornadas.length === 0) {
      return { created: 0, skippedExisting: 0, skippedInsufficientMembers: 0, jornadasProcessed: 0 };
    }

    const [rows] = await pool.execute(
      `SELECT gm.group_id, gm.user_id
       FROM group_members gm
       INNER JOIN \`groups\` g ON g.id = gm.group_id
       WHERE g.is_active = TRUE
       ORDER BY gm.group_id ASC, gm.user_id ASC`
    );

    const membersByGroup = new Map<number, number[]>();
    for (const row of rows as GroupMembersRow[]) {
      const current = membersByGroup.get(row.group_id) ?? [];
      current.push(row.user_id);
      membersByGroup.set(row.group_id, current);
    }

    let created = 0;
    let skippedExisting = 0;
    let skippedInsufficientMembers = 0;

    for (const jornada of jornadas) {
      for (const [, members] of membersByGroup) {
        if (members.length < 2) {
          skippedInsufficientMembers++;
          continue;
        }

        for (let i = 0; i + 1 < members.length; i += 2) {
          const challengerId = members[i];
          const challengedId = members[i + 1];

          const exists = await ChallengeModel.existsBetweenUsersForJornada(challengerId, challengedId, jornada.id);
          if (exists) {
            skippedExisting++;
            continue;
          }

          await ChallengeModel.create(
            challengerId,
            challengedId,
            jornada.id,
            0,
            `Reto semanal automatico - ${jornada.name}`
          );

          await NotificationService.notifyChallengeReceived(challengedId, challengerId, jornada.name);
          created++;
        }
      }
    }

    return {
      created,
      skippedExisting,
      skippedInsufficientMembers,
      jornadasProcessed: jornadas.length,
    };
  }
}
