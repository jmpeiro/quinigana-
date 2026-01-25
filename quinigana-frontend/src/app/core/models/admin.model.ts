export interface UserAdmin {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
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
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
