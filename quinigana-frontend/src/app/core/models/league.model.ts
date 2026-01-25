export interface LeagueDivision {
  id: number;
  name: string;
  tier: number;
  icon: string;
  color: string;
  min_players: number;
  max_players: number | null;
  promotion_slots: number;
  relegation_slots: number;
}

export interface LeagueSeason {
  id: number;
  name: string;
  season_id: number;
  start_jornada_id: number | null;
  end_jornada_id: number | null;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
}

export interface LeagueStandingWithUser {
  id: number;
  user_id: number;
  league_season_id: number;
  division_id: number;
  points: number;
  jornadas_played: number;
  correct_1x2: number;
  correct_pleno: number;
  position: number | null;
  previous_position: number | null;
  promotion_status: 'none' | 'promoted' | 'relegated';
  user_name: string;
  user_avatar: string | null;
  division_name: string;
  division_icon: string;
  division_color: string;
}

export interface UserLeagueProfile {
  user_id: number;
  league_season_id: number;
  division_id: number;
  division_name: string;
  division_icon: string;
  division_color: string;
  division_tier: number;
  points: number;
  position: number | null;
  previous_position: number | null;
  jornadas_played: number;
  correct_1x2: number;
  correct_pleno: number;
  promotion_status: 'none' | 'promoted' | 'relegated';
  total_in_division: number;
  is_promotion_zone: boolean;
  is_relegation_zone: boolean;
}

export interface DivisionStandingsResponse {
  division: LeagueDivision;
  items: LeagueStandingWithUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeagueHistory {
  season_name: string;
  division_name: string;
  final_position: number;
  final_points: number;
  movement_type: 'initial' | 'promoted' | 'relegated' | 'maintained';
}
