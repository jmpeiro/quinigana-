import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { authLimiter, lockoutMiddleware } from '../config/rate-limiter';
import { setCsrfToken, validateCsrfToken } from '../middlewares/csrf.middleware';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/auth.validator';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account with the provided credentials. Subject to rate limiting and lockout policies.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       429:
 *         description: Too many requests - rate limit exceeded
 */
router.post('/register', authLimiter, lockoutMiddleware, registerValidator, validateRequest, setCsrfToken, AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user
 *     description: Authenticates a user with email and password, returning access and refresh tokens. Subject to rate limiting and lockout policies.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful, returns tokens
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many requests - rate limit exceeded
 */
router.post('/login', authLimiter, lockoutMiddleware, loginValidator, validateRequest, setCsrfToken, AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Issues a new access token using a valid refresh token. Requires a valid CSRF token.
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validateCsrfToken, setCsrfToken, AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     description: Invalidates the current session and refresh token. Requires authentication and a valid CSRF token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', authMiddleware, validateCsrfToken, AuthController.logout);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate Google OAuth login
 *     description: Redirects the user to Google's OAuth consent screen to begin the authentication flow.
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
router.get('/google', AuthController.googleAuth);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Google OAuth callback
 *     description: Handles the callback from Google after the user has authenticated. Exchanges the authorization code for tokens.
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code returned by Google
 *     responses:
 *       200:
 *         description: Google authentication successful, returns tokens
 *       400:
 *         description: Invalid or missing authorization code
 *       401:
 *         description: Google authentication failed
 */
router.get('/google/callback', setCsrfToken, AuthController.googleCallback);

/**
 * @swagger
 * /auth/password/forgot:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset
 *     description: Sends a password reset email to the provided address if a matching account exists. Subject to rate limiting.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset email sent (returned even if email is not found, for security)
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests - rate limit exceeded
 */
router.post('/password/forgot', authLimiter, forgotPasswordValidator, validateRequest, AuthController.forgotPassword);

/**
 * @swagger
 * /auth/password/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     description: Resets the user's password using a valid reset token received via email.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Validation error or invalid/expired token
 */
router.post('/password/reset', resetPasswordValidator, validateRequest, AuthController.resetPassword);

/**
 * @swagger
 * /auth/password/change:
 *   post:
 *     tags: [Auth]
 *     summary: Change current password
 *     description: Allows an authenticated user to change their password by providing the current password and a new one.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or current password is incorrect
 *       401:
 *         description: Not authenticated
 */
router.post('/password/change', authMiddleware, changePasswordValidator, validateRequest, AuthController.changePassword);

// =====================================================
// EMAIL VERIFICATION (Migration 018)
// =====================================================

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address
 *     description: Verifies a user's email address using the token sent via email during registration.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The verification token from the email link
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired verification token
 */
router.post('/verify-email', AuthController.verifyEmail);

/**
 * @swagger
 * /auth/verify-email/resend:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     description: Resends the email verification link to the authenticated user. Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email resent
 *       400:
 *         description: Email already verified
 *       401:
 *         description: Not authenticated
 */
router.post('/verify-email/resend', authMiddleware, AuthController.resendVerificationEmail);

export default router;
