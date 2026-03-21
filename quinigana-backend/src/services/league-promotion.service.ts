import pool from '../config/database';
import logger from '../config/logger';

export class LeaguePromotionService {
  private static readonly PROMOTION_SLOTS = 3;
  private static readonly RELEGATION_SLOTS = 3;

  static async processSeasonEnd(seasonId: number) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = { promoted: [] as any[], relegated: [] as any[], maintained: 0 };
      const [divisions]: any = await conn.execute(
        `SELECT d.id, d.name, d.level FROM divisions d JOIN leagues l ON l.id = d.league_id WHERE l.season_id = ? ORDER BY d.level ASC`, [seasonId]);

      for (const division of divisions) {
        const [standings]: any = await conn.execute(
          `SELECT user_id, total_points FROM league_standings WHERE division_id = ? AND season_id = ? ORDER BY total_points DESC`, [division.id, seasonId]);
        if (!standings.length) continue;

        if (division.level > 1) {
          const higherDiv = divisions.find((d: any) => d.level === division.level - 1);
          if (higherDiv) {
            for (const user of standings.slice(0, this.PROMOTION_SLOTS)) {
              await conn.execute('INSERT INTO league_movements (user_id, from_division_id, to_division_id, season_id, type) VALUES (?, ?, ?, ?, ?)', [user.user_id, division.id, higherDiv.id, seasonId, 'promotion']);
              result.promoted.push({ userId: user.user_id, from: division.name, to: higherDiv.name });
            }
          }
        }

        const maxLevel = Math.max(...divisions.map((d: any) => d.level));
        if (division.level < maxLevel) {
          const lowerDiv = divisions.find((d: any) => d.level === division.level + 1);
          if (lowerDiv) {
            for (const user of standings.slice(-this.RELEGATION_SLOTS)) {
              await conn.execute('INSERT INTO league_movements (user_id, from_division_id, to_division_id, season_id, type) VALUES (?, ?, ?, ?, ?)', [user.user_id, division.id, lowerDiv.id, seasonId, 'relegation']);
              result.relegated.push({ userId: user.user_id, from: division.name, to: lowerDiv.name });
            }
          }
        }
      }
      await conn.commit();
      logger.info({ result }, 'Season promotion/relegation processed');
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
