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

export interface UserBadgeWithDetails {
  id: number;
  badge_id: number;
  earned_at: string;
  seen: boolean;
  badge: BadgeDefinition;
}

export interface UserGamificationData {
  xp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  badges: UserBadgeWithDetails[];
  unseenCount: number;
}
