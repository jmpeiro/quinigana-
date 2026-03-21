import pool from '../config/database';

export class PredictionAnalysisService {
  static async getJornadaSuggestions(jornadaId: number) {
    const [matches]: any = await pool.execute(
      'SELECT id, home_team, away_team FROM matches WHERE jornada_id = ? ORDER BY match_number', [jornadaId]
    );

    const suggestions = [];
    for (const match of matches) {
      const [rows]: any = await pool.execute(
        `SELECT COUNT(*) as total,
          SUM(CASE WHEN prediction_1x2 = '1' THEN 1 ELSE 0 END) as home_wins,
          SUM(CASE WHEN prediction_1x2 = 'x' THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN prediction_1x2 = '2' THEN 1 ELSE 0 END) as away_wins,
          AVG(home_score_prediction) as avg_home,
          AVG(away_score_prediction) as avg_away
         FROM proposal_predictions WHERE match_id = ?`, [match.id]
      );
      const row = rows[0];
      const total = Number(row.total) || 0;
      const dist = {
        home: total > 0 ? Math.round((Number(row.home_wins) / total) * 100) : 33,
        draw: total > 0 ? Math.round((Number(row.draws) / total) * 100) : 34,
        away: total > 0 ? Math.round((Number(row.away_wins) / total) * 100) : 33,
      };

      let communityPrediction = '1';
      let confidence = dist.home;
      if (dist.draw > confidence) { communityPrediction = 'x'; confidence = dist.draw; }
      if (dist.away > confidence) { communityPrediction = '2'; confidence = dist.away; }

      suggestions.push({
        matchId: match.id, homeTeam: match.home_team, awayTeam: match.away_team,
        communityPrediction, confidence, distribution: dist,
        averageScore: `${Math.round(Number(row.avg_home) || 0)}-${Math.round(Number(row.avg_away) || 0)}`,
      });
    }
    return suggestions;
  }
}
