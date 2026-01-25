import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

export interface GroupMemberLiveScore {
  user_id: number;
  user_name: string;
  avatar_url: string | null;
  correct_1x2: number;
  correct_pleno: number;
  total_points: number;
}

export interface MemberPrediction {
  user_id: number;
  user_name: string;
  avatar_url: string | null;
  prediction_1x2: string;
  home_score_prediction: number | null;
  away_score_prediction: number | null;
  is_correct_1x2: boolean | null;
  is_correct_pleno: boolean | null;
}

export interface MatchComparison {
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  result_1x2: string | null;
  status: string;
  predictions: MemberPrediction[];
}

export class ComparisonModel {
  /**
   * Get live ranking for a group in a specific jornada
   * Uses live match results to calculate current scores
   */
  static async getGroupLiveRanking(
    groupId: number,
    jornadaId: number,
    liveResults: Map<string, { home_score: number; away_score: number; status: string }> | null
  ): Promise<GroupMemberLiveScore[]> {
    // Get the approved proposal for this group/jornada
    const [proposalRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM quiniela_proposals
       WHERE group_id = ? AND jornada_id = ? AND status = 'approved'
       LIMIT 1`,
      [groupId, jornadaId]
    );

    if (proposalRows.length === 0) {
      return [];
    }

    const proposalId = proposalRows[0].id;

    // Get all group members
    const [members] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id as user_id,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_name,
              u.avatar_url
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?`,
      [groupId]
    );

    // Get predictions for this proposal
    const [predictions] = await pool.execute<RowDataPacket[]>(
      `SELECT pp.*, m.match_number, m.home_team, m.away_team,
              mr.home_score, mr.away_score, mr.result_1x2
       FROM proposal_predictions pp
       INNER JOIN matches m ON pp.match_id = m.id
       LEFT JOIN match_results mr ON m.id = mr.match_id
       WHERE pp.proposal_id = ?`,
      [proposalId]
    );

    // Calculate scores for each member
    // Note: In proposals, all members share the same predictions
    // So we calculate scores based on the proposal's predictions
    const scores: GroupMemberLiveScore[] = [];

    for (const member of members) {
      let correct_1x2 = 0;
      let correct_pleno = 0;

      for (const pred of predictions) {
        let actualHomeScore = pred.home_score;
        let actualAwayScore = pred.away_score;
        let actualResult: string | null = pred.result_1x2;

        // Try to get live result
        if (liveResults) {
          const dbName = pred.home_team.toLowerCase().replace(/\./g, '').trim();
          let live = liveResults.get(dbName);
          if (!live) {
            for (const [key, val] of liveResults) {
              if (key.startsWith(dbName) || dbName.startsWith(key.replace(/\./g, ''))) {
                live = val;
                break;
              }
            }
          }
          if (live && (live.status === 'IN_PLAY' || live.status === 'FINISHED')) {
            actualHomeScore = live.home_score;
            actualAwayScore = live.away_score;
            if (actualHomeScore > actualAwayScore) actualResult = '1';
            else if (actualHomeScore === actualAwayScore) actualResult = 'X';
            else actualResult = '2';
          }
        }

        // Check if prediction is correct
        if (actualResult !== null) {
          // Handle double/triple predictions
          const predParts = pred.prediction_1x2.split('');
          if (predParts.includes(actualResult)) {
            correct_1x2++;
          }

          // Check pleno (exact score)
          if (pred.home_score_prediction === actualHomeScore &&
              pred.away_score_prediction === actualAwayScore) {
            correct_pleno++;
          }
        }
      }

      const total_points = correct_1x2 + (correct_pleno * 3);

      scores.push({
        user_id: member.user_id,
        user_name: member.user_name.trim(),
        avatar_url: member.avatar_url,
        correct_1x2,
        correct_pleno,
        total_points
      });
    }

    // Sort by total_points desc, then correct_pleno desc
    scores.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      return b.correct_pleno - a.correct_pleno;
    });

    return scores;
  }

  /**
   * Get detailed comparison of all predictions for a group/jornada
   */
  static async getGroupComparison(
    groupId: number,
    jornadaId: number,
    liveResults: Map<string, { home_score: number; away_score: number; status: string }> | null
  ): Promise<{ members: { user_id: number; user_name: string; avatar_url: string | null }[]; matches: MatchComparison[] }> {
    // Get the approved proposal
    const [proposalRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM quiniela_proposals
       WHERE group_id = ? AND jornada_id = ? AND status = 'approved'
       LIMIT 1`,
      [groupId, jornadaId]
    );

    if (proposalRows.length === 0) {
      return { members: [], matches: [] };
    }

    const proposalId = proposalRows[0].id;

    // Get group members
    const [members] = await pool.execute<RowDataPacket[]>(
      `SELECT u.id as user_id,
              CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_name,
              u.avatar_url
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?
       ORDER BY u.first_name ASC`,
      [groupId]
    );

    // Get matches with predictions
    const [matchRows] = await pool.execute<RowDataPacket[]>(
      `SELECT m.id, m.match_number, m.home_team, m.away_team,
              mr.home_score, mr.away_score, mr.result_1x2,
              pp.prediction_1x2, pp.home_score_prediction, pp.away_score_prediction
       FROM matches m
       LEFT JOIN match_results mr ON m.id = mr.match_id
       LEFT JOIN proposal_predictions pp ON m.id = pp.match_id AND pp.proposal_id = ?
       WHERE m.jornada_id = ?
       ORDER BY m.match_number ASC`,
      [proposalId, jornadaId]
    );

    const matches: MatchComparison[] = [];

    for (const match of matchRows) {
      let homeScore = match.home_score;
      let awayScore = match.away_score;
      let result1x2: string | null = match.result_1x2;
      let status = 'SCHEDULED';

      // Try live data
      if (liveResults) {
        const dbName = match.home_team.toLowerCase().replace(/\./g, '').trim();
        let live = liveResults.get(dbName);
        if (!live) {
          for (const [key, val] of liveResults) {
            if (key.startsWith(dbName) || dbName.startsWith(key.replace(/\./g, ''))) {
              live = val;
              break;
            }
          }
        }
        if (live) {
          homeScore = live.home_score;
          awayScore = live.away_score;
          status = live.status;
          if (homeScore > awayScore) result1x2 = '1';
          else if (homeScore === awayScore) result1x2 = 'X';
          else result1x2 = '2';
        }
      } else if (homeScore !== null) {
        status = 'FINISHED';
      }

      // Since all group members share the same proposal prediction,
      // we create a prediction entry for each member with the same values
      const predictions: MemberPrediction[] = members.map((m: RowDataPacket) => {
        let isCorrect1x2: boolean | null = null;
        let isCorrectPleno: boolean | null = null;

        if (result1x2 !== null && match.prediction_1x2) {
          const predParts = match.prediction_1x2.split('');
          isCorrect1x2 = predParts.includes(result1x2);
          isCorrectPleno = match.home_score_prediction === homeScore &&
                          match.away_score_prediction === awayScore;
        }

        return {
          user_id: m.user_id,
          user_name: m.user_name.trim(),
          avatar_url: m.avatar_url,
          prediction_1x2: match.prediction_1x2 || '-',
          home_score_prediction: match.home_score_prediction,
          away_score_prediction: match.away_score_prediction,
          is_correct_1x2: isCorrect1x2,
          is_correct_pleno: isCorrectPleno
        };
      });

      matches.push({
        match_number: match.match_number,
        home_team: match.home_team,
        away_team: match.away_team,
        home_score: homeScore,
        away_score: awayScore,
        result_1x2: result1x2,
        status,
        predictions
      });
    }

    return {
      members: members.map((m: RowDataPacket) => ({
        user_id: m.user_id,
        user_name: m.user_name.trim(),
        avatar_url: m.avatar_url
      })),
      matches
    };
  }
}
