export interface LiveMatch {
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  sign: string | null;
}

export interface UserPrediction {
  match_number: number;
  prediction_1x2: '1' | 'X' | '2';
  home_score_prediction: number | null;
  away_score_prediction: number | null;
}

export interface DashboardData {
  activeJornada: {
    id: number;
    name: string;
    deadline: string;
    matchCount: number;
    status: string;
    groupId?: number | null;
  } | null;
  myGroups: Array<{
    id: number;
    name: string;
    totalPoints: number;
    rank: number;
    memberCount: number;
  }>;
  latestResults: Array<{
    jornadaId: number;
    jornadaName: string;
    totalPoints: number;
    correct1x2: number;
    correctPleno: number;
    groupName: string;
  }>;
  stats: {
    totalPoints: number;
    accuracy1x2Percent: number;
    accuracyPlenoPercent: number;
    groupCount: number;
    jornadasPlayed: number;
  };
}
