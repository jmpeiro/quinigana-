export interface QuinielaProposal {
  id: number;
  group_id: number;
  jornada_id: number;
  proposed_by: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  title: string | null;
  votes_for: number;
  votes_against: number;
  total_members_at_creation: number;
  created_at: string;
  updated_at: string;
  proposer_name?: string;
  jornada_name?: string;
}

export type Prediction1x2 = '1' | 'X' | '2' | '1X' | '12' | 'X2' | '1X2';

export interface ProposalPrediction {
  id: number;
  proposal_id: number;
  match_id: number;
  prediction_1x2: Prediction1x2;
  home_score_prediction: number | null;
  away_score_prediction: number | null;
}

export interface ProposalWithDetails extends QuinielaProposal {
  predictions: ProposalPrediction[];
  proposer_name: string;
  proposer_email: string;
  user_vote?: 'approve' | 'reject' | null;
}

export interface CreateProposalDto {
  jornada_id: number;
  title?: string;
  predictions: Array<{
    match_id: number;
    prediction_1x2: Prediction1x2;
    home_score_prediction?: number;
    away_score_prediction?: number;
  }>;
}

export interface PaginatedProposals {
  items: QuinielaProposal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GroupScore {
  id: number;
  group_id: number;
  jornada_id: number;
  proposal_id: number | null;
  total_points: number;
  correct_1x2: number;
  correct_pleno: number;
  created_at: string;
  jornada_name?: string;
  jornada_number?: number;
}

export interface GroupScoresResponse {
  group_id: number;
  group_name: string;
  total_points: number;
  jornadas: GroupScore[];
}

export interface ProposalComment {
  id: number;
  proposalId: number;
  userId: number;
  userName: string;
  avatarUrl: string | null;
  message: string;
  createdAt: string;
}

export interface PaginatedComments {
  items: ProposalComment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
