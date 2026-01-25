import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  LeagueDivision,
  LeagueSeason,
  LeagueStanding,
  LeagueStandingWithUser,
  UserLeagueProfile,
} from '../types';

export class LeagueModel {
  // =====================================================
  // DIVISIONS
  // =====================================================

  static async getAllDivisions(): Promise<LeagueDivision[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM league_divisions ORDER BY tier ASC'
    );
    return rows as LeagueDivision[];
  }

  static async getDivisionById(id: number): Promise<LeagueDivision | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM league_divisions WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as LeagueDivision) : null;
  }

  static async getDivisionByTier(tier: number): Promise<LeagueDivision | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM league_divisions WHERE tier = ?',
      [tier]
    );
    return rows.length > 0 ? (rows[0] as LeagueDivision) : null;
  }

  // =====================================================
  // SEASONS
  // =====================================================

  static async createSeason(
    name: string,
    seasonId: number,
    startJornadaId?: number,
    endJornadaId?: number
  ): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO league_seasons (name, season_id, start_jornada_id, end_jornada_id, status)
       VALUES (?, ?, ?, ?, 'upcoming')`,
      [name, seasonId, startJornadaId || null, endJornadaId || null]
    );
    return result.insertId;
  }

  static async getActiveSeason(): Promise<LeagueSeason | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM league_seasons WHERE status = 'active' LIMIT 1`
    );
    return rows.length > 0 ? (rows[0] as LeagueSeason) : null;
  }

  static async getSeasonById(id: number): Promise<LeagueSeason | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM league_seasons WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as LeagueSeason) : null;
  }

  static async updateSeasonStatus(
    id: number,
    status: 'upcoming' | 'active' | 'completed'
  ): Promise<void> {
    await pool.execute('UPDATE league_seasons SET status = ? WHERE id = ?', [
      status,
      id,
    ]);
  }

  static async setSeasonJornadas(
    id: number,
    startJornadaId: number,
    endJornadaId: number
  ): Promise<void> {
    await pool.execute(
      'UPDATE league_seasons SET start_jornada_id = ?, end_jornada_id = ? WHERE id = ?',
      [startJornadaId, endJornadaId, id]
    );
  }

  // =====================================================
  // STANDINGS
  // =====================================================

  static async getUserStanding(
    userId: number,
    leagueSeasonId: number
  ): Promise<LeagueStanding | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM league_standings WHERE user_id = ? AND league_season_id = ?',
      [userId, leagueSeasonId]
    );
    return rows.length > 0 ? (rows[0] as LeagueStanding) : null;
  }

  static async createStanding(
    userId: number,
    leagueSeasonId: number,
    divisionId: number
  ): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO league_standings (user_id, league_season_id, division_id)
       VALUES (?, ?, ?)`,
      [userId, leagueSeasonId, divisionId]
    );
    return result.insertId;
  }

  static async ensureUserInSeason(
    userId: number,
    leagueSeasonId: number
  ): Promise<LeagueStanding> {
    const existing = await this.getUserStanding(userId, leagueSeasonId);
    if (existing) return existing;

    // New users start in the lowest division (Bronce, tier 4)
    const bronzeDivision = await this.getDivisionByTier(4);
    if (!bronzeDivision) throw new Error('Bronze division not found');

    await this.createStanding(userId, leagueSeasonId, bronzeDivision.id);
    return (await this.getUserStanding(userId, leagueSeasonId))!;
  }

  static async getDivisionStandings(
    leagueSeasonId: number,
    divisionId: number,
    limit = 50,
    offset = 0
  ): Promise<{ standings: LeagueStandingWithUser[]; total: number }> {
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM league_standings
       WHERE league_season_id = ? AND division_id = ?`,
      [leagueSeasonId, divisionId]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ls.*,
              u.first_name as user_name,
              u.avatar_url as user_avatar,
              ld.name as division_name,
              ld.icon as division_icon,
              ld.color as division_color
       FROM league_standings ls
       JOIN users u ON ls.user_id = u.id
       JOIN league_divisions ld ON ls.division_id = ld.id
       WHERE ls.league_season_id = ? AND ls.division_id = ?
       ORDER BY ls.points DESC, ls.correct_pleno DESC, ls.correct_1x2 DESC
       LIMIT ? OFFSET ?`,
      [leagueSeasonId, divisionId, limit, offset]
    );

    return {
      standings: rows as LeagueStandingWithUser[],
      total: (countRows[0] as RowDataPacket).total,
    };
  }

  static async updateStandingPoints(
    userId: number,
    leagueSeasonId: number,
    pointsToAdd: number,
    correct1x2ToAdd: number,
    correctPlenoToAdd: number
  ): Promise<void> {
    await pool.execute(
      `UPDATE league_standings
       SET points = points + ?,
           jornadas_played = jornadas_played + 1,
           correct_1x2 = correct_1x2 + ?,
           correct_pleno = correct_pleno + ?
       WHERE user_id = ? AND league_season_id = ?`,
      [pointsToAdd, correct1x2ToAdd, correctPlenoToAdd, userId, leagueSeasonId]
    );
  }

  static async recalculatePositions(
    leagueSeasonId: number,
    divisionId: number
  ): Promise<void> {
    // Get all standings for this division ordered by points
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, position FROM league_standings
       WHERE league_season_id = ? AND division_id = ?
       ORDER BY points DESC, correct_pleno DESC, correct_1x2 DESC`,
      [leagueSeasonId, divisionId]
    );

    // Update positions
    for (let i = 0; i < rows.length; i++) {
      const standing = rows[i] as RowDataPacket;
      const newPosition = i + 1;

      await pool.execute(
        `UPDATE league_standings
         SET previous_position = position, position = ?
         WHERE id = ?`,
        [newPosition, standing.id]
      );
    }
  }

  // =====================================================
  // USER PROFILE
  // =====================================================

  static async getUserLeagueProfile(userId: number): Promise<UserLeagueProfile | null> {
    const activeSeason = await this.getActiveSeason();
    if (!activeSeason) return null;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT ls.*,
              ld.name as division_name,
              ld.icon as division_icon,
              ld.color as division_color,
              ld.tier as division_tier,
              ld.promotion_slots,
              ld.relegation_slots
       FROM league_standings ls
       JOIN league_divisions ld ON ls.division_id = ld.id
       WHERE ls.user_id = ? AND ls.league_season_id = ?`,
      [userId, activeSeason.id]
    );

    if (rows.length === 0) return null;

    const standing = rows[0] as RowDataPacket;

    // Get total users in same division
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM league_standings
       WHERE league_season_id = ? AND division_id = ?`,
      [activeSeason.id, standing.division_id]
    );

    const totalInDivision = (countRows[0] as RowDataPacket).total;

    return {
      user_id: userId,
      league_season_id: activeSeason.id,
      division_id: standing.division_id,
      division_name: standing.division_name,
      division_icon: standing.division_icon,
      division_color: standing.division_color,
      division_tier: standing.division_tier,
      points: standing.points,
      position: standing.position,
      previous_position: standing.previous_position,
      jornadas_played: standing.jornadas_played,
      correct_1x2: standing.correct_1x2,
      correct_pleno: standing.correct_pleno,
      promotion_status: standing.promotion_status,
      total_in_division: totalInDivision,
      is_promotion_zone: standing.position <= standing.promotion_slots,
      is_relegation_zone:
        standing.position > totalInDivision - standing.relegation_slots,
    };
  }

  // =====================================================
  // PROMOTION / RELEGATION
  // =====================================================

  static async processSeasonEnd(leagueSeasonId: number): Promise<void> {
    const divisions = await this.getAllDivisions();

    for (const division of divisions) {
      const { standings } = await this.getDivisionStandings(
        leagueSeasonId,
        division.id,
        1000,
        0
      );

      const totalUsers = standings.length;

      for (const standing of standings) {
        let status: 'none' | 'promoted' | 'relegated' = 'none';

        // Check promotion (top N, except top tier)
        if (
          division.tier > 1 &&
          standing.position !== null &&
          standing.position <= division.promotion_slots
        ) {
          status = 'promoted';
        }

        // Check relegation (bottom N, except bottom tier)
        if (
          division.tier < 4 &&
          standing.position !== null &&
          standing.position > totalUsers - division.relegation_slots
        ) {
          status = 'relegated';
        }

        // Update status
        await pool.execute(
          `UPDATE league_standings SET promotion_status = ? WHERE id = ?`,
          [status, standing.id]
        );

        // Record in history
        let toDivisionId = division.id;
        if (status === 'promoted') {
          const upperDivision = await this.getDivisionByTier(division.tier - 1);
          if (upperDivision) toDivisionId = upperDivision.id;
        } else if (status === 'relegated') {
          const lowerDivision = await this.getDivisionByTier(division.tier + 1);
          if (lowerDivision) toDivisionId = lowerDivision.id;
        }

        await pool.execute(
          `INSERT INTO league_history
           (user_id, league_season_id, from_division_id, to_division_id, final_position, final_points, movement_type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            standing.user_id,
            leagueSeasonId,
            division.id,
            toDivisionId,
            standing.position,
            standing.points,
            status === 'none' ? 'maintained' : status,
          ]
        );
      }
    }
  }

  static async initializeNewSeason(
    newSeasonId: number,
    previousSeasonId: number
  ): Promise<void> {
    // Get all history records from previous season
    const [historyRows] = await pool.execute<RowDataPacket[]>(
      `SELECT user_id, to_division_id FROM league_history
       WHERE league_season_id = ?`,
      [previousSeasonId]
    );

    // Create standings for new season based on previous results
    for (const record of historyRows as RowDataPacket[]) {
      await this.createStanding(
        record.user_id,
        newSeasonId,
        record.to_division_id
      );
    }
  }

  // =====================================================
  // LEAGUE HISTORY
  // =====================================================

  static async getUserHistory(
    userId: number
  ): Promise<
    {
      season_name: string;
      division_name: string;
      final_position: number;
      final_points: number;
      movement_type: string;
    }[]
  > {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT lh.*, ls.name as season_name, ld.name as division_name
       FROM league_history lh
       JOIN league_seasons ls ON lh.league_season_id = ls.id
       JOIN league_divisions ld ON lh.from_division_id = ld.id
       WHERE lh.user_id = ?
       ORDER BY lh.created_at DESC`,
      [userId]
    );
    return rows as {
      season_name: string;
      division_name: string;
      final_position: number;
      final_points: number;
      movement_type: string;
    }[];
  }
}
