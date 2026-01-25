import { Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

jest.mock('../config/environment', () => ({
  env: {
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test', refreshSecret: 'test', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
  },
}));
jest.mock('../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn() },
  testConnection: jest.fn(),
}));
jest.mock('../services/auth.service');
jest.mock('../services/email.service');

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(body: any = {}, cookies: any = {}): Request {
  return { body, cookies, authUser: { userId: 1 } } as unknown as Request;
}

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user and set refresh cookie', async () => {
      const mockResult = {
        user: { id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User' },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      };
      (AuthService.register as jest.Mock).mockResolvedValue(mockResult);

      const req = mockReq({ email: 'test@test.com', password: 'Pass1234!', first_name: 'Test', last_name: 'User' });
      const res = mockRes();

      await AuthController.register(req, res);

      expect(AuthService.register).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'Pass1234!',
        first_name: 'Test',
        last_name: 'User',
      });
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { user: mockResult.user, accessToken: 'access-token' },
      }));
    });

    it('should handle registration errors with statusCode', async () => {
      (AuthService.register as jest.Mock).mockRejectedValue({
        statusCode: 409,
        code: 'EMAIL_EXISTS',
        message: 'Email already registered',
      });

      const req = mockReq({ email: 'exists@test.com', password: 'Pass1234!', first_name: 'A', last_name: 'B' });
      const res = mockRes();

      await AuthController.register(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'EMAIL_EXISTS' }),
      }));
    });
  });

  describe('login', () => {
    it('should login and set refresh cookie', async () => {
      const mockResult = {
        user: { id: 1, email: 'test@test.com' },
        tokens: { accessToken: 'access-123', refreshToken: 'refresh-123' },
      };
      (AuthService.login as jest.Mock).mockResolvedValue(mockResult);

      const req = mockReq({ email: 'test@test.com', password: 'Pass1234!' });
      const res = mockRes();

      await AuthController.login(req, res);

      expect(AuthService.login).toHaveBeenCalledWith('test@test.com', 'Pass1234!');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-123', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { user: mockResult.user, accessToken: 'access-123' },
      }));
    });

    it('should handle invalid credentials', async () => {
      (AuthService.login as jest.Mock).mockRejectedValue({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });

      const req = mockReq({ email: 'wrong@test.com', password: 'wrong' });
      const res = mockRes();

      await AuthController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVALID_CREDENTIALS' }),
      }));
    });
  });

  describe('refresh', () => {
    it('should refresh token when valid cookie exists', async () => {
      (AuthService.refreshAccessToken as jest.Mock).mockResolvedValue({
        accessToken: 'new-access',
        newRefreshToken: 'new-refresh',
      });

      const req = mockReq({}, { refreshToken: 'old-refresh' });
      const res = mockRes();

      await AuthController.refresh(req, res);

      expect(AuthService.refreshAccessToken).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { accessToken: 'new-access' },
      }));
    });

    it('should return error when no refresh token cookie', async () => {
      const req = mockReq({}, {});
      const res = mockRes();

      await AuthController.refresh(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NO_REFRESH_TOKEN' }),
      }));
    });
  });

  describe('logout', () => {
    it('should clear cookie and call AuthService.logout', async () => {
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({}, { refreshToken: 'token-to-revoke' });
      const res = mockRes();

      await AuthController.logout(req, res);

      expect(AuthService.logout).toHaveBeenCalledWith('token-to-revoke');
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should still clear cookie even without token', async () => {
      const req = mockReq({}, {});
      const res = mockRes();

      await AuthController.logout(req, res);

      expect(AuthService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('changePassword', () => {
    it('should change password for authenticated user', async () => {
      (AuthService.changePassword as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ currentPassword: 'Old1234!', newPassword: 'New1234!' });
      const res = mockRes();

      await AuthController.changePassword(req, res);

      expect(AuthService.changePassword).toHaveBeenCalledWith(1, 'Old1234!', 'New1234!');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
