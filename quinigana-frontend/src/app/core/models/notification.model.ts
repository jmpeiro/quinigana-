export type NotificationType =
  | 'new_jornada'
  | 'proposal_submitted'
  | 'vote_needed'
  | 'results_published'
  | 'invitation_received'
  | 'badge_unlocked'
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_result'
  | 'league_update';
export type NotificationActionType = 'open_proposal' | 'open_jornada' | 'open_invite' | 'open_challenge';

export interface NotificationActionTarget {
  groupId?: number;
  jornadaId?: number;
  proposalId?: number;
  challengeId?: number;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  actionType?: NotificationActionType | null;
  actionTarget?: NotificationActionTarget | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
