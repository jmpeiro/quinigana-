import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { env } from '../config/environment';
import { User } from '../types';

const COOKIE_MAX_AGE_SHORT = 24 * 60 * 60 * 1000; // 1 day (session)
const COOKIE_MAX_AGE_LONG = 30 * 24 * 60 * 60 * 1000; // 30 days (remember me)

const getRefreshCookieOptions = (rememberMe: boolean) => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth/refresh',
  maxAge: rememberMe ? COOKIE_MAX_AGE_LONG : COOKIE_MAX_AGE_SHORT,
});

const LOGOUT_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth/refresh',
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name, rememberMe } = req.body;
      const result = await AuthService.register({ email, password, first_name, last_name });

      res.cookie('refreshToken', result.tokens.refreshToken, getRefreshCookieOptions(!!rememberMe));
      sendSuccess(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
      }, 'Registration successful', 201);
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
      } else {
        throw error;
      }
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;
      const result = await AuthService.login(email, password);

      res.cookie('refreshToken', result.tokens.refreshToken, getRefreshCookieOptions(!!rememberMe));
      sendSuccess(res, {
        user: result.user,
        accessToken: result.tokens.accessToken,
      }, 'Login successful');
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
      } else {
        throw error;
      }
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        sendError(res, 'NO_REFRESH_TOKEN', 'Refresh token not found', 401);
        return;
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      // Keep the same cookie duration on refresh (use long duration as default for refresh)
      res.cookie('refreshToken', result.newRefreshToken, getRefreshCookieOptions(true));
      sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
      } else {
        throw error;
      }
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', LOGOUT_COOKIE_OPTIONS);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error: any) {
      res.clearCookie('refreshToken', LOGOUT_COOKIE_OPTIONS);
      sendSuccess(res, null, 'Logged out');
    }
  }

  static googleAuth(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('google', { scope: ['email', 'profile'], session: false })(req, res, next);
  }

  static googleCallback(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('google', { session: false, failureRedirect: `${env.frontendUrl}/auth/login?error=google_failed` },
      async (err: Error | null, user: User | undefined) => {
        if (err || !user) {
          res.redirect(`${env.frontendUrl}/auth/login?error=google_failed`);
          return;
        }

        try {
          const tokens = await AuthService['generateTokens'](user);
          res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions(true));
          res.redirect(`${env.frontendUrl}/auth/google-callback?token=${tokens.accessToken}`);
        } catch {
          res.redirect(`${env.frontendUrl}/auth/login?error=token_failed`);
        }
      }
    )(req, res, next);
  }

  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);

      const resetData = AuthService.getLastResetData();
      if (resetData) {
        try {
          await EmailService.sendPasswordReset(
            resetData.user.email,
            resetData.user.first_name,
            resetData.token
          );
        } catch (emailError) {
          console.error('Failed to send reset email:', emailError);
        }
      }

      // Always return success to not reveal if email exists
      sendSuccess(res, null, 'If the email exists, a reset link has been sent');
    } catch (error: any) {
      sendSuccess(res, null, 'If the email exists, a reset link has been sent');
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);
      sendSuccess(res, null, 'Password has been reset successfully');
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
      } else {
        throw error;
      }
    }
  }

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.authUser!.userId;
      await AuthService.changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (error: any) {
      if (error.statusCode) {
        sendError(res, error.code, error.message, error.statusCode);
      } else {
        throw error;
      }
    }
  }
}
