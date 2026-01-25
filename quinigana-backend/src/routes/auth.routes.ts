import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { authLimiter } from '../config/rate-limiter';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, registerValidator, validateRequest, AuthController.register);
router.post('/login', authLimiter, loginValidator, validateRequest, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authMiddleware, AuthController.logout);

router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleCallback);

router.post('/password/forgot', authLimiter, forgotPasswordValidator, validateRequest, AuthController.forgotPassword);
router.post('/password/reset', resetPasswordValidator, validateRequest, AuthController.resetPassword);
router.post('/password/change', authMiddleware, changePasswordValidator, validateRequest, AuthController.changePassword);

export default router;
