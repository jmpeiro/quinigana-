export type NotificationType = 'new_jornada' | 'proposal_submitted' | 'vote_needed' | 'results_published' | 'invitation_received';

export interface AppNotification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
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
