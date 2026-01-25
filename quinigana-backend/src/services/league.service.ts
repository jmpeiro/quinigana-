import { LeagueModel } from '../models/league.model';
import { NotificationService } from './notification.service';

export class LeagueService {
  /**
   * Process league standings after a jornada is scored.
   * Updates user standings based on their scores.
   */
  static async processJornadaScores(
    jornadaId: number,
    userScores: Array<{
      userId: number;
      points: number;
      correct1x2: number;
      correctPleno: number;
    }>
  ): Promise<void> {
    const season = await LeagueModel.getActiveSeason();
    if (!season) return; // No active league season

    // Check if this jornada is within the league season range
    if (season.start_jornada_id && jornadaId < season.start_jornada_id) return;
    if (season.end_jornada_id && jornadaId > season.end_jornada_id) return;

    const divisions = await LeagueModel.getAllDivisions();
    const affectedDivisions = new Set<number>();

    for (const userScore of userScores) {
      // Ensure user is in the season
      const standing = await LeagueModel.ensureUserInSeason(
        userScore.userId,
        season.id
      );

      // Update their points
      await LeagueModel.updateStandingPoints(
        userScore.userId,
        season.id,
        userScore.points,
        userScore.correct1x2,
        userScore.correctPleno
      );

      affectedDivisions.add(standing.division_id);
    }

    // Recalculate positions for affected divisions
    for (const divisionId of affectedDivisions) {
      await LeagueModel.recalculatePositions(season.id, divisionId);
    }
  }

  /**
   * Check for promotion/relegation zone changes and notify users
   */
  static async checkAndNotifyZoneChanges(userId: number): Promise<void> {
    const profile = await LeagueModel.getUserLeagueProfile(userId);
    if (!profile || profile.previous_position === null) return;

    const wasInPromotionZone =
      profile.previous_position <= (profile.promotion_status === 'promoted' ? 3 : 0);
    const wasInRelegationZone =
      profile.previous_position >
      profile.total_in_division - (profile.promotion_status === 'relegated' ? 3 : 0);

    // Entered promotion zone
    if (profile.is_promotion_zone && !wasInPromotionZone) {
      await NotificationService.notify(
        userId,
        'league_update',
        'Zona de ascenso!',
        `Has entrado en zona de ascenso en ${profile.division_name}`,
        '/leagues'
      );
    }

    // Entered relegation zone
    if (profile.is_relegation_zone && !wasInRelegationZone) {
      await NotificationService.notify(
        userId,
        'league_update',
        'Zona de descenso',
        `Has entrado en zona de descenso en ${profile.division_name}`,
        '/leagues'
      );
    }
  }
}
