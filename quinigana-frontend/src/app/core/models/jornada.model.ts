export interface Jornada {
  id: number;
  name: string;
  season: string;
  jornada_number: number;
  status: 'open' | 'closed' | 'finished';
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  jornada_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  match_date: string | null;
  created_at: string;
  result?: MatchResult;
}

export interface MatchResult {
  id: number;
  match_id: number;
  home_score: number;
  away_score: number;
  result_1x2: '1' | 'X' | '2';
  created_at: string;
}

export interface JornadaWithMatches extends Jornada {
  matches: Match[];
}

export interface CreateJornadaDto {
  name: string;
  season: string;
  jornada_number: number;
  deadline: string;
  matches: Array<{
    match_number: number;
    home_team: string;
    away_team: string;
    match_date?: string;
  }>;
}

export interface SubmitResultsDto {
  results: Array<{
    match_id: number;
    home_score: number;
    away_score: number;
  }>;
}
