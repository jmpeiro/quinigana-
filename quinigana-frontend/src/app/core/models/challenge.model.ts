export type ChallengeStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface Challenge {
  id: number;
  challenger_id: number;
  challenged_id: number;
  jornada_id: number;
  status: ChallengeStatus;
  wager_points: number;
  winner_id: number | null;
  challenger_score: number | null;
  challenged_score: number | null;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  completed_at: string | null;
}

export interface ChallengeWithDetails extends Challenge {
  challenger_name: string;
  challenger_avatar: string | null;
  challenged_name: string;
  challenged_avatar: string | null;
  jornada_name: string;
  winner_name: string | null;
}

export interface ChallengeStats {
  totalChallenges: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  reputation: number;
}

export interface RivalryStats {
  opponent_id: number;
  opponent_name: string;
  opponent_avatar: string | null;
  total_challenges: number;
  wins: number;
  losses: number;
  draws: number;
  net_points: number;
}

export interface CreateChallengeDto {
  challenged_id: number;
  jornada_id: number;
  wager_points: number;
  message?: string;
}

export interface PaginatedChallenges {
  items: ChallengeWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
