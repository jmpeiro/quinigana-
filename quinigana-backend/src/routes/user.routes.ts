import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { GroupController } from '../controllers/group.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { updateProfileValidator } from '../validators/user.validator';
import { userSearchValidator } from '../validators/group.validator';
import { avatarUpload } from '../config/upload';

const router = Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/me', authMiddleware, UserController.getProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     description: Updates the authenticated user's profile fields such as first name and last name.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: User's first name
 *               last_name:
 *                 type: string
 *                 maxLength: 100
 *                 description: User's last name
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       422:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.patch('/me', authMiddleware, updateProfileValidator, validateRequest, UserController.updateProfile);

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     tags:
 *       - Users
 *     summary: Upload user avatar
 *     description: Uploads a new avatar image for the authenticated user. Replaces any existing avatar.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Avatar updated
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *       400:
 *         description: No image file provided
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/me/avatar', authMiddleware, avatarUpload.single('avatar'), UserController.uploadAvatar);

/**
 * @swagger
 * /users/me/avatar:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user avatar
 *     description: Removes the authenticated user's avatar image and deletes the file from storage.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Avatar removed
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete('/me/avatar', authMiddleware, UserController.deleteAvatar);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user account
 *     description: Soft-deletes the authenticated user's account, revokes all refresh tokens, and removes the avatar file if present.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Account deleted
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Internal server error
 */
router.delete('/me', authMiddleware, UserController.deleteAccount);

/**
 * @swagger
 * /users/me/cancel-deletion:
 *   post:
 *     tags:
 *       - Users
 *     summary: Cancel pending account deletion
 *     description: Cancels a previously requested account deletion and reactivates the account.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deletion cancelled, account reactivated
 *       400:
 *         description: No pending deletion request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/me/cancel-deletion', authMiddleware, UserController.cancelDeletion);

/**
 * @swagger
 * /users/search:
 *   get:
 *     tags:
 *       - Users
 *     summary: Search users
 *     description: Searches for users by name or email. The authenticated user is excluded from results.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       avatar_url:
 *                         type: string
 *                         nullable: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       422:
 *         description: Validation error - query too short or missing
 *       500:
 *         description: Internal server error
 */
router.get('/search', authMiddleware, userSearchValidator, validateRequest, GroupController.searchUsers);

export default router;
