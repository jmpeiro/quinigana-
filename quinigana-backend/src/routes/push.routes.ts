import { Router } from 'express';
import { PushSubscriptionController } from '../controllers/push-subscription.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public: frontend needs VAPID key before subscribing

/**
 * @swagger
 * /api/push/vapid-public-key:
 *   get:
 *     tags: [Push]
 *     summary: Get VAPID public key
 *     description: Returns the server's VAPID public key needed by the frontend to create a push subscription. This endpoint is public and does not require authentication.
 *     security: []
 *     responses:
 *       200:
 *         description: VAPID public key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publicKey:
 *                   type: string
 */
router.get('/vapid-public-key', PushSubscriptionController.getVapidPublicKey);

// Protected endpoints
router.use(authMiddleware);

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     tags: [Push]
 *     summary: Subscribe to push notifications
 *     description: Registers a push subscription for the authenticated user's device, enabling them to receive push notifications.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: The push service endpoint URL
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       200:
 *         description: Push subscription created successfully
 *       400:
 *         description: Bad request - invalid subscription data
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.post('/subscribe', PushSubscriptionController.subscribe);

/**
 * @swagger
 * /api/push/unsubscribe:
 *   delete:
 *     tags: [Push]
 *     summary: Unsubscribe from push notifications
 *     description: Removes the push subscription for the authenticated user's current device.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: The push service endpoint URL to unsubscribe
 *     responses:
 *       200:
 *         description: Push subscription removed successfully
 *       400:
 *         description: Bad request - invalid endpoint
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.delete('/unsubscribe', PushSubscriptionController.unsubscribe);

/**
 * @swagger
 * /api/push/status:
 *   get:
 *     tags: [Push]
 *     summary: Get push subscription status
 *     description: Returns whether the authenticated user has an active push subscription on the platform.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Push subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribed:
 *                   type: boolean
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/status', PushSubscriptionController.getStatus);

export default router;
