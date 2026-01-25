export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  auth_provider: 'local' | 'google' | 'both';
  email_verified: boolean;
  is_admin?: boolean;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
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
  rememberMe?: boolean;
}
