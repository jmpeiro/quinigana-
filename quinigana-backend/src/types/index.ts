export interface User {
  id: number;
  email: string;
  password_hash: string | null;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  auth_provider: 'local' | 'google' | 'both';
  email_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  auth_provider: 'local' | 'google' | 'both';
  email_verified: boolean;
  is_admin: boolean;
  created_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  device_info: string | null;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface TokenPayload {
  userId: number;
  email: string;
  provider: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export interface RegisterDto {
  email: string;
  password: string;
  first_name: string;
  last_name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified: boolean }>;
  displayName: string;
  name: { givenName: string; familyName: string };
  photos: Array<{ value: string }>;
}

// ===== Module 2: Groups, Jornadas, Proposals =====

export interface Group {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: Date;
}

export interface GroupMemberWithUser extends GroupMember {
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export interface InviteLink {
  id: number;
  group_id: number;
  created_by: number;
  token: string;
  expires_at: Date;
  max_uses: number;
  use_count: number;
  is_active: boolean;
  created_at: Date;
}

export interface GroupInvitation {
  id: number;
  group_id: number;
  invited_by: number;
  invited_user_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: Date;
  responded_at: Date | null;
}

export interface GroupInvitationWithDetails extends GroupInvitation {
  group_name: string;
  inviter_name: string;
  inviter_email: string;
}

export interface Season {
  id: number;
  name: string;
  display_name: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  created_at: Date;
  updated_at: Date;
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

export interface Jornada {
  id: number;
  name: string;
  season: string;
  season_id: number | null;
  jornada_number: number;
  status: 'open' | 'closed' | 'finished';
  deadline: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Match {
  id: number;
  jornada_id: number;
  match_number: number;
  home_team: string;
  away_team: string;
  match_date: Date | null;
  created_at: Date;
}

export interface MatchResult {
  id: number;
  match_id: number;
  home_score: number;
  away_score: number;
  result_1x2: '1' | 'X' | '2';
  created_at: Date;
}

export interface MatchWithResult extends Match {
  result?: MatchResult;
}

export interface JornadaWithMatches extends Jornada {
  matches: MatchWithResult[];
}

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
  created_at: Date;
  updated_at: Date;
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

export interface ProposalVote {
  id: number;
  proposal_id: number;
  user_id: number;
  vote: 'approve' | 'reject';
  created_at: Date;
}

export interface ProposalComment {
  id: number;
  proposal_id: number;
  user_id: number;
  message: string;
  created_at: Date;
}

export interface ProposalCommentWithUser extends ProposalComment {
  user_name: string;
  avatar_url: string | null;
}

export interface ProposalWithDetails extends QuinielaProposal {
  predictions: ProposalPrediction[];
  proposer_name: string;
  proposer_email: string;
  user_vote?: 'approve' | 'reject' | null;
}

export interface QuinielaResult {
  id: number;
  proposal_id: number;
  match_id: number;
  points_1x2: number;
  points_pleno: number;
  is_correct_1x2: boolean;
  is_correct_pleno: boolean;
}

export interface GroupScore {
  id: number;
  group_id: number;
  jornada_id: number;
  proposal_id: number | null;
  total_points: number;
  correct_1x2: number;
  correct_pleno: number;
  created_at: Date;
}

export interface GroupScoreWithJornada extends GroupScore {
  jornada_name: string;
  jornada_number: number;
}

export interface GroupRanking {
  group_id: number;
  group_name: string;
  total_points: number;
  total_jornadas: number;
  correct_1x2: number;
  correct_pleno: number;
}

// DTOs for Module 2
export interface CreateGroupDto {
  name: string;
  description?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
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

export interface VoteDto {
  vote: 'approve' | 'reject';
}

export interface UserSearchResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

// ===== Module 7: Admin =====

export interface UserAdmin {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: Date;
  groupCount: number;
}

export interface GlobalStats {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  activeGroups: number;
  totalJornadas: number;
  openJornadas: number;
  closedJornadas: number;
  finishedJornadas: number;
  totalProposals: number;
  approvedProposals: number;
}

export interface GroupAdmin {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  creator_name: string;
  is_active: boolean;
  member_count: number;
  created_at: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== Module 6: Notifications =====

export type NotificationType = 'new_jornada' | 'proposal_submitted' | 'vote_needed' | 'results_published' | 'invitation_received' | 'badge_unlocked' | 'challenge_received' | 'challenge_accepted' | 'challenge_result' | 'league_update';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: Date;
}

export interface CreateNotificationDto {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

// ===== Module 4: Dashboard =====

export interface DashboardData {
  activeJornada: {
    id: number;
    name: string;
    deadline: Date;
    matchCount: number;
    status: string;
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

// ===== Module 5: Stats & History =====

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
  finishedAt: Date;
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

// ===== Module 9: Gamification =====

export interface BadgeDefinition {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: 'prediction' | 'streak' | 'volume' | 'social' | 'ranking';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xp_reward: number;
  sort_order: number;
}

export interface UserBadge {
  id: number;
  user_id: number;
  badge_id: number;
  earned_at: string;
  seen: boolean;
}

export interface UserBadgeWithDetails extends UserBadge {
  badge: BadgeDefinition;
}

export interface UserXp {
  user_id: number;
  total_xp: number;
  level: number;
}

export interface UserGamificationData {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  badges: UserBadgeWithDetails[];
  unseenCount: number;
}

// ===== Module 10: Challenges (1vs1) =====

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
  created_at: Date;
  responded_at: Date | null;
  completed_at: Date | null;
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
  user_id: number;
  opponent_id: number;
  total_challenges: number;
  wins: number;
  losses: number;
  draws: number;
  points_won: number;
  points_lost: number;
  last_challenge_at: Date | null;
}

export interface CreateChallengeDto {
  challenged_id: number;
  jornada_id: number;
  wager_points: number;
  message?: string;
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

// ===== Module 11: Leagues & Divisions =====

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
  created_at: Date;
}

export interface LeagueStanding {
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
}

export interface LeagueStandingWithUser extends LeagueStanding {
  user_name: string;
  avatar_url: string | null;
  division_name: string;
  division_icon: string;
  division_color: string;
  position_change: number;
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
