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

export interface GroupComparisonData {
  members: { user_id: number; user_name: string; avatar_url: string | null }[];
  matches: MatchComparison[];
}
