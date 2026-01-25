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

      // Soft delete: deactivate account
      await UserModel.deactivateAccount(userId);

      sendSuccess(res, null, 'Account deleted');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to delete account', 500);
    }
  }
}
