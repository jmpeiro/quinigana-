export interface Season {
  id: number;
  name: string;
  display_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonWithStats extends Season {
  jornadasCount: number;
  finishedCount: number;
}

export interface CreateSeasonDto {
  name: string;
  display_name: string;
  start_date: string;
  end_date: string;
  is_current?: boolean;
}

export interface UpdateSeasonDto {
  name?: string;
  display_name?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

export interface SeasonStats {
  totalJornadas: number;
  finishedJornadas: number;
  totalPoints: number;
  totalPredictions: number;
}
