import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { GroupController } from '../controllers/group.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { updateProfileValidator } from '../validators/user.validator';
import { userSearchValidator } from '../validators/group.validator';
import { avatarUpload } from '../config/upload';

const router = Router();

router.get('/me', authMiddleware, UserController.getProfile);
router.patch('/me', authMiddleware, updateProfileValidator, validateRequest, UserController.updateProfile);
router.post('/me/avatar', authMiddleware, avatarUpload.single('avatar'), UserController.uploadAvatar);
router.delete('/me/avatar', authMiddleware, UserController.deleteAvatar);
router.delete('/me', authMiddleware, UserController.deleteAccount);
router.get('/search', authMiddleware, userSearchValidator, validateRequest, GroupController.searchUsers);

export default router;
