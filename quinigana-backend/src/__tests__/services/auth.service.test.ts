jest.mock('../../config/environment', () => ({
  env: {
    port: 3000,
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
    footballData: { apiKey: 'test-api-key' },
    webPush: { publicKey: '', privateKey: '', subject: 'mailto:test@test.com' },
    socket: { scrapeIntervalMs: 30000 },
    redis: { host: 'localhost', port: 6379, password: '' },
    scraper: { proxyUrl: '', minDelayMs: 300, maxDelayMs: 800, cacheTtlMs: 25000, timeoutMs: 15000, maxRetries: 2 },
  },
}));
jest.mock('../../config/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));
jest.mock('../../services/web-push.service', () => ({
  WebPushService: { sendToUser: jest.fn().mockResolvedValue(undefined), sendToUsers: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

jest.mock('../../models/user.model');
jest.mock('../../models/token.model');
jest.mock('../../utils/crypto.util');
jest.mock('../../services/email.service');

import bcrypt from 'bcryptjs';
import { AuthService } from '../../services/auth.service';
import { UserModel } from '../../models/user.model';
import { TokenModel } from '../../models/token.model';
import { generateAccessToken, generateRefreshToken } from '../../config/jwt';
import { hashToken, generateRandomToken } from '../../utils/crypto.util';
import { EmailService } from '../../services/email.service';

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTokenModel = TokenModel as jest.Mocked<typeof TokenModel>;
const mockGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;
const mockHashToken = hashToken as jest.MockedFunction<typeof hashToken>;
const mockGenerateRandomToken = generateRandomToken as jest.MockedFunction<typeof generateRandomToken>;
const mockEmailService = EmailService as jest.Mocked<typeof EmailService>;

const baseUser = {
  id: 1,
  email: 'test@example.com',
  password_hash: '$2a$12$hashedpassword',
  first_name: 'Test',
  last_name: 'User',
  avatar_url: null,
  google_id: null,
  auth_provider: 'local' as const,
  email_verified: false,
  is_active: true,
  is_admin: false,
  deleted_at: null,
  deletion_requested_at: null,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockHashToken.mockReturnValue('hashed-token');
  mockGenerateRandomToken.mockReturnValue('random-token-value');
  mockGenerateAccessToken.mockReturnValue('access-token');
});

// =====================================================
// REGISTRATION
// =====================================================
describe('AuthService', () => {
  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      password: 'Password123!',
      first_name: 'New',
      last_name: 'User',
    };

    it('should register a new user successfully', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(1);
      mockUserModel.findById.mockResolvedValue({ ...baseUser, email: registerData.email });
      mockTokenModel.saveRefreshToken.mockResolvedValue(undefined as any);
      mockEmailService.sendEmailVerification.mockResolvedValue(undefined);
      mockUserModel.setEmailVerificationToken.mockResolvedValue(undefined);

      const result = await AuthService.register(registerData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerData.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('random-token-value');
      expect(result.user).not.toHaveProperty('password_hash');
      expect(mockUserModel.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerData.email,
          first_name: registerData.first_name,
          last_name: registerData.last_name,
        })
      );
    });

    it('should throw 409 if email already exists', async () => {
      mockUserModel.findByEmail.mockResolvedValue(baseUser);

      await expect(AuthService.register(registerData)).rejects.toEqual(
        expect.objectContaining({ statusCode: 409, code: 'EMAIL_EXISTS' })
      );
    });

    it('should throw 500 if user creation fails', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(1);
      mockUserModel.findById.mockResolvedValue(null);

      await expect(AuthService.register(registerData)).rejects.toEqual(
        expect.objectContaining({ statusCode: 500, code: 'CREATE_FAILED' })
      );
    });
  });

  // =====================================================
  // LOGIN
  // =====================================================
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPw = await bcrypt.hash('Password123!', 4);
      const user = { ...baseUser, password_hash: hashedPw, is_active: true };
      mockUserModel.findByEmail.mockResolvedValue(user);
      mockTokenModel.saveRefreshToken.mockResolvedValue(undefined as any);

      const result = await AuthService.login('test@example.com', 'Password123!');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw 401 if user not found', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      await expect(AuthService.login('no@example.com', 'pass')).rejects.toEqual(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_CREDENTIALS' })
      );
    });

    it('should throw 401 if password is wrong', async () => {
      const hashedPw = await bcrypt.hash('CorrectPassword', 4);
      mockUserModel.findByEmail.mockResolvedValue({ ...baseUser, password_hash: hashedPw, is_active: true });

      await expect(AuthService.login('test@example.com', 'WrongPassword')).rejects.toEqual(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_CREDENTIALS' })
      );
    });

    it('should throw 403 if account is disabled', async () => {
      const hashedPw = await bcrypt.hash('Password123!', 4);
      mockUserModel.findByEmail.mockResolvedValue({ ...baseUser, password_hash: hashedPw, is_active: false });

      await expect(AuthService.login('test@example.com', 'Password123!')).rejects.toEqual(
        expect.objectContaining({ statusCode: 403, code: 'ACCOUNT_DISABLED' })
      );
    });
  });

  // =====================================================
  // TOKEN REFRESH
  // =====================================================
  describe('refreshAccessToken', () => {
    it('should refresh token successfully with rotation', async () => {
      mockTokenModel.findRefreshToken.mockResolvedValue({ id: 1, user_id: 1, token_hash: 'hashed', expires_at: new Date(), revoked_at: null } as any);
      mockUserModel.findById.mockResolvedValue(baseUser);
      mockTokenModel.revokeRefreshToken.mockResolvedValue(undefined);
      mockTokenModel.saveRefreshToken.mockResolvedValue(undefined as any);

      const result = await AuthService.refreshAccessToken('old-refresh-token');

      expect(result.accessToken).toBe('access-token');
      expect(result.newRefreshToken).toBe('random-token-value');
      expect(mockTokenModel.revokeRefreshToken).toHaveBeenCalledWith('hashed-token');
      expect(mockTokenModel.saveRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1, token_hash: 'hashed-token' })
      );
    });

    it('should throw 401 if refresh token is invalid', async () => {
      mockTokenModel.findRefreshToken.mockResolvedValue(null);

      await expect(AuthService.refreshAccessToken('bad-token')).rejects.toEqual(
        expect.objectContaining({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' })
      );
    });

    it('should throw 401 if user not found', async () => {
      mockTokenModel.findRefreshToken.mockResolvedValue({ id: 2, user_id: 999, token_hash: 'h', expires_at: new Date(), revoked_at: null } as any);
      mockUserModel.findById.mockResolvedValue(null);

      await expect(AuthService.refreshAccessToken('some-token')).rejects.toEqual(
        expect.objectContaining({ statusCode: 401, code: 'USER_NOT_FOUND' })
      );
    });
  });

  // =====================================================
  // LOGOUT
  // =====================================================
  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      mockTokenModel.revokeRefreshToken.mockResolvedValue(undefined);

      await AuthService.logout('refresh-token');

      expect(mockHashToken).toHaveBeenCalledWith('refresh-token');
      expect(mockTokenModel.revokeRefreshToken).toHaveBeenCalledWith('hashed-token');
    });
  });

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================
  describe('forgotPassword', () => {
    it('should save reset token when user exists', async () => {
      mockUserModel.findByEmail.mockResolvedValue(baseUser);
      mockTokenModel.savePasswordResetToken.mockResolvedValue(undefined);

      await AuthService.forgotPassword('test@example.com');

      expect(mockTokenModel.savePasswordResetToken).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1, token_hash: 'hashed-token' })
      );
    });

    it('should return silently when user does not exist', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      await expect(AuthService.forgotPassword('nope@example.com')).resolves.toBeUndefined();
      expect(mockTokenModel.savePasswordResetToken).not.toHaveBeenCalled();
    });
  });

  // =====================================================
  // RESET PASSWORD
  // =====================================================
  describe('resetPassword', () => {
    it('should reset password and revoke all tokens', async () => {
      mockTokenModel.findPasswordResetToken.mockResolvedValue({ id: 1, user_id: 1, token_hash: 'h', expires_at: new Date(), used_at: null } as any);
      mockUserModel.updatePassword.mockResolvedValue(undefined);
      mockTokenModel.markResetTokenUsed.mockResolvedValue(undefined);
      mockTokenModel.revokeAllUserTokens.mockResolvedValue(undefined);

      await AuthService.resetPassword('reset-token', 'NewPassword123!');

      expect(mockUserModel.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
      expect(mockTokenModel.markResetTokenUsed).toHaveBeenCalledWith('hashed-token');
      expect(mockTokenModel.revokeAllUserTokens).toHaveBeenCalledWith(1);
    });

    it('should throw 400 if reset token is invalid', async () => {
      mockTokenModel.findPasswordResetToken.mockResolvedValue(null);

      await expect(AuthService.resetPassword('bad-token', 'NewPass')).rejects.toEqual(
        expect.objectContaining({ statusCode: 400, code: 'INVALID_TOKEN' })
      );
    });
  });

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPw = await bcrypt.hash('OldPassword', 4);
      mockUserModel.findById.mockResolvedValue({ ...baseUser, password_hash: hashedPw });
      mockUserModel.updatePassword.mockResolvedValue(undefined);
      mockTokenModel.revokeAllUserTokens.mockResolvedValue(undefined);

      await AuthService.changePassword(1, 'OldPassword', 'NewPassword123!');

      expect(mockUserModel.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
      expect(mockTokenModel.revokeAllUserTokens).toHaveBeenCalledWith(1);
    });

    it('should throw 400 if no password is set on account', async () => {
      mockUserModel.findById.mockResolvedValue({ ...baseUser, password_hash: null });

      await expect(AuthService.changePassword(1, 'old', 'new')).rejects.toEqual(
        expect.objectContaining({ statusCode: 400, code: 'NO_PASSWORD' })
      );
    });

    it('should throw 401 if current password is wrong', async () => {
      const hashedPw = await bcrypt.hash('CorrectPassword', 4);
      mockUserModel.findById.mockResolvedValue({ ...baseUser, password_hash: hashedPw });

      await expect(AuthService.changePassword(1, 'WrongPassword', 'NewPassword')).rejects.toEqual(
        expect.objectContaining({ statusCode: 401, code: 'WRONG_PASSWORD' })
      );
    });
  });

  // =====================================================
  // EMAIL VERIFICATION
  // =====================================================
  describe('sendVerificationEmail', () => {
    it('should send verification email for unverified user', async () => {
      mockUserModel.setEmailVerificationToken.mockResolvedValue(undefined);
      mockEmailService.sendEmailVerification.mockResolvedValue(undefined);

      await AuthService.sendVerificationEmail({ ...baseUser, email_verified: false });

      expect(mockUserModel.setEmailVerificationToken).toHaveBeenCalledWith(1, 'hashed-token', expect.any(Date));
      expect(mockEmailService.sendEmailVerification).toHaveBeenCalledWith(
        baseUser.email,
        baseUser.first_name,
        'random-token-value'
      );
    });

    it('should skip if user is already verified', async () => {
      await AuthService.sendVerificationEmail({ ...baseUser, email_verified: true });

      expect(mockUserModel.setEmailVerificationToken).not.toHaveBeenCalled();
      expect(mockEmailService.sendEmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      mockUserModel.findByVerificationToken.mockResolvedValue(baseUser);
      mockUserModel.markEmailVerified.mockResolvedValue(undefined);
      mockUserModel.findById.mockResolvedValue({ ...baseUser, email_verified: true });

      const result = await AuthService.verifyEmail('verification-token');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(baseUser.email);
      expect(result.user).not.toHaveProperty('password_hash');
      expect(mockUserModel.markEmailVerified).toHaveBeenCalledWith(1);
    });

    it('should throw 400 if verification token is invalid', async () => {
      mockUserModel.findByVerificationToken.mockResolvedValue(null);

      await expect(AuthService.verifyEmail('bad-token')).rejects.toEqual(
        expect.objectContaining({ statusCode: 400, code: 'INVALID_TOKEN' })
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      mockUserModel.findById.mockResolvedValue({ ...baseUser, email_verified: false });
      mockUserModel.setEmailVerificationToken.mockResolvedValue(undefined);
      mockEmailService.sendEmailVerification.mockResolvedValue(undefined);

      await AuthService.resendVerificationEmail(1);

      expect(mockUserModel.setEmailVerificationToken).toHaveBeenCalled();
      expect(mockEmailService.sendEmailVerification).toHaveBeenCalled();
    });

    it('should throw 400 if email is already verified', async () => {
      mockUserModel.findById.mockResolvedValue({ ...baseUser, email_verified: true });

      await expect(AuthService.resendVerificationEmail(1)).rejects.toEqual(
        expect.objectContaining({ statusCode: 400, code: 'ALREADY_VERIFIED' })
      );
    });
  });

  // =====================================================
  // SANITIZE USER
  // =====================================================
  describe('sanitizeUser', () => {
    it('should remove password_hash and keep public fields', () => {
      const sanitized = AuthService.sanitizeUser(baseUser);

      expect(sanitized).not.toHaveProperty('password_hash');
      expect(sanitized).not.toHaveProperty('is_active');
      expect(sanitized).toEqual({
        id: baseUser.id,
        email: baseUser.email,
        first_name: baseUser.first_name,
        last_name: baseUser.last_name,
        avatar_url: baseUser.avatar_url,
        auth_provider: baseUser.auth_provider,
        email_verified: baseUser.email_verified,
        is_admin: baseUser.is_admin,
        created_at: baseUser.created_at,
      });
    });
  });
});
