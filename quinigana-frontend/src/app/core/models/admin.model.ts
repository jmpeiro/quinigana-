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

export interface OpsRouteMetric {
  route: string;
  method: string;
  requests: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
  lastSeenAt: string;
}

export interface OpsErrorEvent {
  timestamp: string;
  requestId: string | null;
  route: string;
  method: string;
  status: number;
  durationMs: number;
}

export interface OpsSnapshot {
  service: {
    startedAt: string;
    uptimeSeconds: number;
  };
  totals: {
    requests: number;
    status2xx: number;
    status4xx: number;
    status5xx: number;
  };
  topSlowRoutes: OpsRouteMetric[];
  topErrorRoutes: OpsRouteMetric[];
  recentErrors: OpsErrorEvent[];
}
