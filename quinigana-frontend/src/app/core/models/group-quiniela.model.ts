export interface GroupQuiniela {
  id: number;
  group_id: number;
  name: string;
  description: string | null;
  deadline: string;
  status: 'open' | 'closed' | 'finished';
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface GroupQuinielaMatch {
  id: number;
  quiniela_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  match_date: string | null;
  home_score: number | null;
  away_score: number | null;
  result_1x2: '1' | 'X' | '2' | null;
}

export interface GroupQuinielaPrediction {
  id: number;
  quiniela_id: number;
  user_id: number;
  match_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  prediction_1x2: '1' | 'X' | '2';
  home_score_prediction: number | null;
  away_score_prediction: number | null;
}

export interface GroupQuinielaWithDetails extends GroupQuiniela {
  group_name: string;
  creator_name: string;
  match_count: number;
  participant_count: number;
  has_predicted?: boolean;
  matches?: GroupQuinielaMatch[];
  myPredictions?: GroupQuinielaPrediction[];
}

export interface GroupQuinielaRanking {
  user_id: number;
  first_name: string;
  last_name: string | null;
  correct_1x2: number;
  correct_pleno: number;
  total_points: number;
  position: number;
}

export interface CreateGroupQuinielaDto {
  group_id: number;
  name: string;
  description?: string;
  deadline: string;
  matches: Array<{
    match_number: number;
    home_team: string;
    away_team: string;
    match_date?: string;
  }>;
}

export interface SavePredictionsDto {
  predictions: Array<{
    match_id: number;
    prediction_1x2: '1' | 'X' | '2';
    home_score?: number;
    away_score?: number;
  }>;
}

export interface SubmitResultsDto {
  results: Array<{
    match_id: number;
    home_score: number;
    away_score: number;
  }>;
}

export interface MemberPredictionComparison {
  user_id: number;
  prediction_1x2: string;
  home_score_prediction: number | null;
  away_score_prediction: number | null;
  is_correct_1x2: boolean | null;
  is_correct_pleno: boolean | null;
}

export interface MatchWithPredictions {
  match_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  result_1x2: string | null;
  predictions: MemberPredictionComparison[];
}

export interface MemberSummary {
  user_id: number;
  user_name: string;
  avatar_url: string | null;
  correct_1x2: number;
  correct_pleno: number;
  total_points: number;
}

export interface MembersPredictionsData {
  members: MemberSummary[];
  matches: MatchWithPredictions[];
}
