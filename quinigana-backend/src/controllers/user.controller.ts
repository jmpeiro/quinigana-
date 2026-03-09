import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { UserModel } from '../models/user.model';
import { TokenModel } from '../models/token.model';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class UserController {
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const user = await UserModel.findById(userId);

      if (!user) {
        sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
        return;
      }

      sendSuccess(res, AuthService.sanitizeUser(user));
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch profile', 500);
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { first_name, last_name } = req.body;

      await UserModel.updateProfile(userId, { first_name, last_name });
      const updatedUser = await UserModel.findById(userId);

      if (!updatedUser) {
        sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
        return;
      }

      sendSuccess(res, AuthService.sanitizeUser(updatedUser), 'Profile updated');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to update profile', 500);
    }
  }

  static async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;

      if (!req.file) {
        sendError(res, 'NO_FILE', 'No image file provided', 400);
        return;
      }

      // Delete old avatar if it's a local file
      const user = await UserModel.findById(userId);
      if (user?.avatar_url?.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(__dirname, '../..', user.avatar_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await UserModel.updateAvatar(userId, avatarUrl);

      const updatedUser = await UserModel.findById(userId);
      if (!updatedUser) {
        sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
        return;
      }

      sendSuccess(res, AuthService.sanitizeUser(updatedUser), 'Avatar updated');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to upload avatar', 500);
    }
  }

  static async deleteAvatar(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;

      const user = await UserModel.findById(userId);
      if (user?.avatar_url?.startsWith('/uploads/avatars/')) {
        const filePath = path.join(__dirname, '../..', user.avatar_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await UserModel.updateAvatar(userId, null);

      const updatedUser = await UserModel.findById(userId);
      if (!updatedUser) {
        sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
        return;
      }

      sendSuccess(res, AuthService.sanitizeUser(updatedUser), 'Avatar removed');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to delete avatar', 500);
    }
  }

  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;

      // Delete local avatar file if exists
      const user = await UserModel.findById(userId);
      if (user?.avatar_url?.startsWith('/uploads/avatars/')) {
        const filePath = path.join(__dirname, '../..', user.avatar_url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Revoke all refresh tokens
      await TokenModel.revokeAllUserTokens(userId);

      // Soft-delete: request deletion with 30-day grace period (migration 020).
      // The scheduler processes pending deletions after the grace period.
      await UserModel.requestDeletion(userId);
      await UserModel.deactivateAccount(userId);

      sendSuccess(res, null, 'Account deletion requested. Your data will be removed after 30 days.');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to delete account', 500);
    }
  }

  /**
   * POST /users/me/cancel-deletion - Cancel a pending account deletion
   */
  static async cancelDeletion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;

      // Use findByIdIncludeDeleted since user might be deactivated
      const user = await UserModel.findByIdIncludeDeleted(userId);
      if (!user) {
        sendError(res, 'USER_NOT_FOUND', 'User not found', 404);
        return;
      }

      if (!user.deletion_requested_at) {
        sendError(res, 'NO_PENDING_DELETION', 'No pending deletion request', 400);
        return;
      }

      await UserModel.cancelDeletion(userId);
      await UserModel.reactivateAccount(userId);

      sendSuccess(res, null, 'Account deletion cancelled. Your account is active again.');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to cancel deletion', 500);
    }
  }
}
