export interface PersonalStats {
  totalPoints: number;
  totalJornadas: number;
  totalPredictions: number;
  correct1x2: number;
  correctPleno: number;
  accuracy1x2Percent: number;
  accuracyPlenoPercent: number;
  currentStreak: number;
  bestStreak: number;
  evolution: Array<{
    jornadaId: number;
    jornadaName: string;
    points: number;
    accuracy: number;
  }>;
  groupComparison: Array<{
    groupId: number;
    groupName: string;
    totalPoints: number;
    jornadasPlayed: number;
  }>;
}

export interface GroupHistoryEntry {
  jornadaId: number;
  jornadaName: string;
  jornadaNumber: number;
  season: string;
  totalPoints: number;
  correct1x2: number;
  correctPleno: number;
  finishedAt: string;
}

export interface JornadaDetailResult {
  jornadaName: string;
  totalPoints: number;
  matches: Array<{
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    prediction1x2: string;
    actualResult1x2: string;
    homeScorePrediction: number | null;
    awayScorePrediction: number | null;
    homeScoreActual: number | null;
    awayScoreActual: number | null;
    points1x2: number;
    pointsPleno: number;
    isCorrect1x2: boolean;
    isCorrectPleno: boolean;
  }>;
}

export interface GroupRankingEntry {
  userId: number;
  userName: string;
  avatarUrl: string | null;
  totalPoints: number;
  correct1x2: number;
  correctPleno: number;
  jornadasPlayed: number;
}

export interface GroupHistoryResponse {
  items: GroupHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PredictionHistoryEntry {
  jornadaId: number;
  jornadaName: string;
  jornadaNumber: number;
  season: string;
  groupName: string;
  groupId: number;
  totalPoints: number;
  correct1x2: number;
  correctPleno: number;
  totalMatches: number;
  accuracy1x2Percent: number;
  finishedAt: string;
}

export interface PredictionHistoryResponse {
  items: PredictionHistoryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GlobalRankingEntry {
  groupId: number;
  groupName: string;
  memberCount: number;
  totalPoints: number;
  totalJornadas: number;
  correct1x2: number;
  correctPleno: number;
}

export interface GlobalRankingResponse {
  items: GlobalRankingEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HeatmapMatch {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  prediction1x2: string;
  actualResult1x2: string | null;
  homeScorePrediction: number | null;
  awayScorePrediction: number | null;
  homeScoreActual: number | null;
  awayScoreActual: number | null;
  isCorrect1x2: boolean;
  isCorrectPleno: boolean;
}

export interface HeatmapJornada {
  jornadaId: number;
  jornadaName: string;
  matches: HeatmapMatch[];
}
