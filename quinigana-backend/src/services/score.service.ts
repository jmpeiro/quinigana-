import { ScoreModel } from '../models/score.model';
import pool, { withTransaction } from '../config/database';
import { RowDataPacket } from 'mysql2';
import { ProposalModel } from '../models/proposal.model';
import { MatchModel } from '../models/match.model';
import { GroupModel } from '../models/group.model';
import { CacheService } from './cache.service';

export class ScoreService {
  static async calculateScoresForJornada(jornadaId: number) {
    const results = await MatchModel.getResultsByJornada(jornadaId);
    if (results.length === 0) return;

    const resultMap = new Map(results.map(r => [r.match_id, r]));

    // Find all approved proposals for this jornada across all groups
    const [proposals] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM quiniela_proposals WHERE jornada_id = ? AND status = 'approved'",
      [jornadaId]
    );

    // Wrap the entire scoring process in a transaction
    await withTransaction(async (conn) => {
      for (const proposal of proposals) {
        const predictions = await ProposalModel.getPredictions(proposal.id);
        let correct1x2 = 0;
        let correctPleno = 0;
        let totalPoints = 0;

        for (const pred of predictions) {
          const matchResult = resultMap.get(pred.match_id);
          if (!matchResult) continue;

          const predValue = pred.prediction_1x2;
          const resultValue = matchResult.result_1x2;
          const is1x2Correct = predValue.includes(resultValue);

          const isPlenoCorrect = pred.home_score_prediction !== null &&
            pred.away_score_prediction !== null &&
            pred.home_score_prediction === matchResult.home_score &&
            pred.away_score_prediction === matchResult.away_score;

          let points1x2 = 0;
          if (is1x2Correct) {
            if (predValue.length === 1) points1x2 = 1;
            else if (predValue.length === 2) points1x2 = 0.5;
            // Triple (length 3): 0 points
          }
          const pointsPleno = isPlenoCorrect ? 3 : 0;

          if (is1x2Correct) correct1x2++;
          if (isPlenoCorrect) correctPleno++;
          totalPoints += points1x2 + pointsPleno;

          // Use transaction connection for writes
          await conn.execute(
            `INSERT INTO quiniela_results (proposal_id, match_id, points_1x2, points_pleno, is_correct_1x2, is_correct_pleno)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE points_1x2 = VALUES(points_1x2), points_pleno = VALUES(points_pleno),
             is_correct_1x2 = VALUES(is_correct_1x2), is_correct_pleno = VALUES(is_correct_pleno)`,
            [proposal.id, pred.match_id, points1x2, pointsPleno, is1x2Correct, isPlenoCorrect]
          );
        }

        await conn.execute(
          `INSERT INTO group_scores (group_id, jornada_id, proposal_id, total_points, correct_1x2, correct_pleno)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE total_points = VALUES(total_points), correct_1x2 = VALUES(correct_1x2), correct_pleno = VALUES(correct_pleno)`,
          [proposal.group_id, jornadaId, proposal.id, totalPoints, correct1x2, correctPleno]
        );
      }
    });

    // Invalidate cache after scores update
    CacheService.invalidateScoresAndStandings();
  }

  static async getGroupScores(groupId: number) {
    const group = await GroupModel.findById(groupId);
    if (!group) throw new Error('Group not found');

    const scores = await ScoreModel.getGroupScores(groupId);
    const totalPoints = await ScoreModel.getGroupTotalPoints(groupId);

    return {
      group_id: groupId,
      group_name: group.name,
      total_points: totalPoints,
      jornadas: scores
    };
  }

  static async getGroupScoreByJornada(groupId: number, jornadaId: number) {
    const score = await ScoreModel.getGroupScoreByJornada(groupId, jornadaId);
    if (!score) return null;

    let details = null;
    if (score.proposal_id) {
      details = await ScoreModel.getResultsByProposal(score.proposal_id);
    }

    return { ...score, details };
  }
}
