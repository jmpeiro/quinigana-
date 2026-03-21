import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { TokenModel } from '../models/token.model';
import { generateAccessToken, generateRefreshToken } from '../config/jwt';
import { hashToken, generateRandomToken } from '../utils/crypto.util';
import { AuthTokens, TokenPayload, User, UserPublic } from '../types';
import { EmailService } from './email.service';
import logger from '../config/logger';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_DAYS = 7;
const EMAIL_VERIFICATION_HOURS = 24;

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name?: string;
  }): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw { statusCode: 409, code: 'EMAIL_EXISTS', message: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const userId = await UserModel.create({
      email: data.email,
      password_hash: passwordHash,
      first_name: data.first_name,
      last_name: data.last_name,
    });

    const user = await UserModel.findById(userId);
    if (!user) throw { statusCode: 500, code: 'CREATE_FAILED', message: 'Failed to create user' };

    // Send email verification (non-blocking)
    this.sendVerificationEmail(user).catch((err) => {
      logger.error({ error: err }, 'Failed to send verification email');
    });

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), tokens };
  }

  static async login(email: string, password: string): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password_hash) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    if (!user.is_active) {
      throw { statusCode: 403, code: 'ACCOUNT_DISABLED', message: 'Account is disabled' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
    }

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), tokens };
  }

  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string }> {
    const tokenHash = hashToken(refreshToken);
    const storedToken = await TokenModel.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw { statusCode: 401, code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' };
    }

    const user = await UserModel.findById(storedToken.user_id);
    if (!user) {
      throw { statusCode: 401, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    // Rotate refresh token
    await TokenModel.revokeRefreshToken(tokenHash);

    const payload: TokenPayload = { userId: user.id, email: user.email, provider: user.auth_provider };
    const accessToken = generateAccessToken(payload);

    const newRefreshTokenRaw = generateRandomToken();
    const newTokenHash = hashToken(newRefreshTokenRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await TokenModel.saveRefreshToken({
      user_id: user.id,
      token_hash: newTokenHash,
      expires_at: expiresAt,
    });

    return { accessToken, newRefreshToken: newRefreshTokenRaw };
  }

  static async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await TokenModel.revokeRefreshToken(tokenHash);
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await UserModel.findByEmail(email);
    // Don't reveal if email exists
    if (!user) return;

    const token = generateRandomToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await TokenModel.savePasswordResetToken({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Return the token so the controller can send the email
    (this as any)._lastResetToken = token;
    (this as any)._lastResetUser = user;
  }

  static getLastResetData(): { token: string; user: User } | null {
    const token = (this as any)._lastResetToken;
    const user = (this as any)._lastResetUser;
    if (token && user) {
      delete (this as any)._lastResetToken;
      delete (this as any)._lastResetUser;
      return { token, user };
    }
    return null;
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const resetToken = await TokenModel.findPasswordResetToken(tokenHash);

    if (!resetToken) {
      throw { statusCode: 400, code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' };
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword(resetToken.user_id, passwordHash);
    await TokenModel.markResetTokenUsed(tokenHash);
    await TokenModel.revokeAllUserTokens(resetToken.user_id);
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user || !user.password_hash) {
      throw { statusCode: 400, code: 'NO_PASSWORD', message: 'Account does not have a password set' };
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      throw { statusCode: 401, code: 'WRONG_PASSWORD', message: 'Current password is incorrect' };
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword(userId, passwordHash);
    await TokenModel.revokeAllUserTokens(userId);
  }

  // =====================================================
  // EMAIL VERIFICATION (Migration 018)
  // =====================================================

  /**
   * Send a verification email to a user. Generates a token, stores it in the DB,
   * and sends the email with a verification link.
   */
  static async sendVerificationEmail(user: User): Promise<void> {
    if (user.email_verified) return;

    const token = generateRandomToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000);

    await UserModel.setEmailVerificationToken(user.id, tokenHash, expiresAt);
    await EmailService.sendEmailVerification(user.email, user.first_name, token);
  }

  /**
   * Verify a user's email using the token sent via email.
   */
  static async verifyEmail(token: string): Promise<{ user: UserPublic }> {
    const tokenHash = hashToken(token);
    const user = await UserModel.findByVerificationToken(tokenHash);

    if (!user) {
      throw { statusCode: 400, code: 'INVALID_TOKEN', message: 'Invalid or expired verification token' };
    }

    await UserModel.markEmailVerified(user.id);

    const updatedUser = await UserModel.findById(user.id);
    if (!updatedUser) {
      throw { statusCode: 500, code: 'USER_NOT_FOUND', message: 'User not found after verification' };
    }

    return { user: this.sanitizeUser(updatedUser) };
  }

  /**
   * Resend the verification email to the authenticated user.
   */
  static async resendVerificationEmail(userId: number): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    if (user.email_verified) {
      throw { statusCode: 400, code: 'ALREADY_VERIFIED', message: 'Email is already verified' };
    }

    await this.sendVerificationEmail(user);
  }

  private static async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = { userId: user.id, email: user.email, provider: user.auth_provider };

    const accessToken = generateAccessToken(payload);
    const refreshTokenRaw = generateRandomToken();
    const tokenHash = hashToken(refreshTokenRaw);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await TokenModel.saveRefreshToken({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  static sanitizeUser(user: User): UserPublic {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      auth_provider: user.auth_provider,
      email_verified: user.email_verified,
      is_admin: user.is_admin,
      created_at: user.created_at,
    };
  }
}
