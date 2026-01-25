export interface Group {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: string;
  member_count?: number;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'admin' | 'member';
  joined_at: string;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export interface GroupInvitation {
  id: number;
  group_id: number;
  invited_by: number;
  invited_user_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at: string | null;
  group_name: string;
  inviter_name: string;
  inviter_email: string;
}

export interface UserSearchResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
}
