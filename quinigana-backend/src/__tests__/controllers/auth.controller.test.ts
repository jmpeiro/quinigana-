jest.mock('../../config/environment', () => ({
  env: {
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
  },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../services/auth.service');
jest.mock('../../services/email.service');

import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { EmailService } from '../../services/email.service';

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    cookies: {},
    authUser: { userId: 1, email: 'test@test.com' },
    ...overrides,
  };
}

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // REGISTER
  // =====================================================
  describe('register', () => {
    it('should register successfully and set refresh cookie', async () => {
      const registerResult = {
        user: { id: 1, email: 'new@test.com', first_name: 'New' },
        tokens: { accessToken: 'access-123', refreshToken: 'refresh-456' },
      };
      mockAuthService.register.mockResolvedValue(registerResult as any);

      const req = mockReq({
        body: { email: 'new@test.com', password: 'Pass123!', first_name: 'New', rememberMe: true },
      });
      const res = mockRes();

      await AuthController.register(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-456',
        expect.objectContaining({ httpOnly: true })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ accessToken: 'access-123' }),
        })
      );
    });

    it('should return 201 on successful registration', async () => {
      mockAuthService.register.mockResolvedValue({
        user: { id: 1 },
        tokens: { accessToken: 'at', refreshToken: 'rt' },
      } as any);

      const req = mockReq({ body: { email: 'a@b.com', password: 'P1!', first_name: 'A' } });
      const res = mockRes();
      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle 409 EMAIL_EXISTS error', async () => {
      mockAuthService.register.mockRejectedValue({ statusCode: 409, code: 'EMAIL_EXISTS', message: 'Email already registered' });

      const req = mockReq({ body: { email: 'dup@test.com', password: 'Pass123!', first_name: 'Dup' } });
      const res = mockRes();
      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, code: 'EMAIL_EXISTS' })
      );
    });

    it('should set short cookie when rememberMe is false', async () => {
      mockAuthService.register.mockResolvedValue({
        user: { id: 1 },
        tokens: { accessToken: 'at', refreshToken: 'rt' },
      } as any);

      const req = mockReq({ body: { email: 'a@b.com', password: 'P1!', first_name: 'A', rememberMe: false } });
      const res = mockRes();
      await AuthController.register(req, res);

      const cookieOptions = res.cookie.mock.calls[0][2];
      expect(cookieOptions.maxAge).toBe(24 * 60 * 60 * 1000); // 1 day
    });
  });

  // =====================================================
  // LOGIN
  // =====================================================
  describe('login', () => {
    it('should login and set refresh cookie', async () => {
      mockAuthService.login.mockResolvedValue({
        user: { id: 1, email: 'test@test.com' },
        tokens: { accessToken: 'at-login', refreshToken: 'rt-login' },
      } as any);

      const req = mockReq({ body: { email: 'test@test.com', password: 'Pass123!' } });
      const res = mockRes();
      await AuthController.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt-login', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ accessToken: 'at-login' }) })
      );
    });

    it('should return 401 on invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue({ statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });

      const req = mockReq({ body: { email: 'wrong@test.com', password: 'wrong' } });
      const res = mockRes();
      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when account is disabled', async () => {
      mockAuthService.login.mockRejectedValue({ statusCode: 403, code: 'ACCOUNT_DISABLED', message: 'Account is disabled' });

      const req = mockReq({ body: { email: 'disabled@test.com', password: 'Pass123!' } });
      const res = mockRes();
      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // =====================================================
  // REFRESH
  // =====================================================
  describe('refresh', () => {
    it('should refresh access token and rotate refresh cookie', async () => {
      mockAuthService.refreshAccessToken.mockResolvedValue({ accessToken: 'new-at', newRefreshToken: 'new-rt' });

      const req = mockReq({ cookies: { refreshToken: 'old-rt' } });
      const res = mockRes();
      await AuthController.refresh(req, res);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-rt', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { accessToken: 'new-at' } })
      );
    });

    it('should return 401 when no refresh token cookie', async () => {
      const req = mockReq({ cookies: {} });
      const res = mockRes();
      await AuthController.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NO_REFRESH_TOKEN' })
      );
    });

    it('should return 401 when refresh token is invalid', async () => {
      mockAuthService.refreshAccessToken.mockRejectedValue({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid' });

      const req = mockReq({ cookies: { refreshToken: 'expired-rt' } });
      const res = mockRes();
      await AuthController.refresh(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // =====================================================
  // LOGOUT
  // =====================================================
  describe('logout', () => {
    it('should clear cookie and call service logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const req = mockReq({ cookies: { refreshToken: 'rt' } });
      const res = mockRes();
      await AuthController.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('rt');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should clear cookie even if no refresh token', async () => {
      const req = mockReq({ cookies: {} });
      const res = mockRes();
      await AuthController.logout(req, res);

      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
    });

    it('should still clear cookie on service error', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('fail'));

      const req = mockReq({ cookies: { refreshToken: 'rt' } });
      const res = mockRes();
      await AuthController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================
  describe('forgotPassword', () => {
    it('should always return success regardless of email existence', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined);
      mockAuthService.getLastResetData.mockReturnValue(null);

      const req = mockReq({ body: { email: 'nonexistent@test.com' } });
      const res = mockRes();
      await AuthController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should send password reset email when user exists', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined);
      mockAuthService.getLastResetData.mockReturnValue({
        token: 'reset-token',
        user: { id: 1, email: 'user@test.com', first_name: 'User' } as any,
      });
      mockEmailService.sendPasswordReset.mockResolvedValue(undefined);

      const req = mockReq({ body: { email: 'user@test.com' } });
      const res = mockRes();
      await AuthController.forgotPassword(req, res);

      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        'user@test.com', 'User', 'reset-token'
      );
    });

    it('should not fail even if email send fails', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined);
      mockAuthService.getLastResetData.mockReturnValue({
        token: 'token',
        user: { id: 1, email: 'u@t.com', first_name: 'U' } as any,
      });
      mockEmailService.sendPasswordReset.mockRejectedValue(new Error('SMTP error'));

      const req = mockReq({ body: { email: 'u@t.com' } });
      const res = mockRes();
      await AuthController.forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  // =====================================================
  // RESET PASSWORD
  // =====================================================
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const req = mockReq({ body: { token: 'valid-token', password: 'NewPass123!' } });
      const res = mockRes();
      await AuthController.resetPassword(req, res);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPass123!');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 on invalid token', async () => {
      mockAuthService.resetPassword.mockRejectedValue({ statusCode: 400, code: 'INVALID_TOKEN', message: 'Invalid' });

      const req = mockReq({ body: { token: 'bad', password: 'NewPass' } });
      const res = mockRes();
      await AuthController.resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  describe('changePassword', () => {
    it('should change password for authenticated user', async () => {
      mockAuthService.changePassword.mockResolvedValue(undefined);

      const req = mockReq({ body: { currentPassword: 'old', newPassword: 'new' } });
      const res = mockRes();
      await AuthController.changePassword(req, res);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(1, 'old', 'new');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 on wrong current password', async () => {
      mockAuthService.changePassword.mockRejectedValue({ statusCode: 401, code: 'WRONG_PASSWORD', message: 'Wrong' });

      const req = mockReq({ body: { currentPassword: 'wrong', newPassword: 'new' } });
      const res = mockRes();
      await AuthController.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // =====================================================
  // VERIFY EMAIL
  // =====================================================
  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ user: { id: 1, email: 'v@t.com' } } as any);

      const req = mockReq({ body: { token: 'valid-token' } });
      const res = mockRes();
      await AuthController.verifyEmail(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 if no token provided', async () => {
      const req = mockReq({ body: {} });
      const res = mockRes();
      await AuthController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'MISSING_TOKEN' }));
    });

    it('should return 400 on invalid verification token', async () => {
      mockAuthService.verifyEmail.mockRejectedValue({ statusCode: 400, code: 'INVALID_TOKEN', message: 'Invalid' });

      const req = mockReq({ body: { token: 'bad' } });
      const res = mockRes();
      await AuthController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockAuthService.verifyEmail.mockRejectedValue(new Error('unexpected'));

      const req = mockReq({ body: { token: 'token' } });
      const res = mockRes();
      await AuthController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // =====================================================
  // RESEND VERIFICATION EMAIL
  // =====================================================
  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      mockAuthService.resendVerificationEmail.mockResolvedValue(undefined);

      const req = mockReq();
      const res = mockRes();
      await AuthController.resendVerificationEmail(req, res);

      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 if already verified', async () => {
      mockAuthService.resendVerificationEmail.mockRejectedValue({ statusCode: 400, code: 'ALREADY_VERIFIED', message: 'Already verified' });

      const req = mockReq();
      const res = mockRes();
      await AuthController.resendVerificationEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
