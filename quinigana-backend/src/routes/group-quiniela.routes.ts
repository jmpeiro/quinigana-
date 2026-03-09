import { Router } from 'express';
import { GroupQuinielaController } from '../controllers/group-quiniela.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /group-quinielas/active:
 *   get:
 *     tags: [GroupQuinielas]
 *     summary: Get my active quinielas
 *     description: Returns all active quinielas from all groups the authenticated user belongs to.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active quinielas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
// Get user's active quinielas from all groups
router.get('/active', GroupQuinielaController.getMyActiveQuinielas);

/**
 * @swagger
 * /group-quinielas/group/{groupId}:
 *   get:
 *     tags: [GroupQuinielas]
 *     summary: Get quinielas by group
 *     description: Returns all quinielas for a specific group.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The group ID
 *     responses:
 *       200:
 *         description: List of quinielas for the group retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Group not found
 */
// Get all quinielas for a group
router.get('/group/:groupId', GroupQuinielaController.getByGroup);

/**
 * @swagger
 * /group-quinielas/{id}:
 *   get:
 *     tags: [GroupQuinielas]
 *     summary: Get quiniela details
 *     description: Returns the details of a specific group quiniela including its matches.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     responses:
 *       200:
 *         description: Quiniela details retrieved successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Quiniela not found
 */
// Get quiniela details with matches
router.get('/:id', GroupQuinielaController.getById);

/**
 * @swagger
 * /group-quinielas/{id}/ranking:
 *   get:
 *     tags: [GroupQuinielas]
 *     summary: Get quiniela ranking
 *     description: Returns the ranking of all participants in a specific group quiniela.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     responses:
 *       200:
 *         description: Quiniela ranking retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rank:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   score:
 *                     type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Quiniela not found
 */
// Get ranking for a quiniela
router.get('/:id/ranking', GroupQuinielaController.getRanking);

/**
 * @swagger
 * /group-quinielas/{id}/members-predictions:
 *   get:
 *     tags: [GroupQuinielas]
 *     summary: Get members predictions
 *     description: Returns all members' predictions for a specific quiniela, allowing comparison between participants.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     responses:
 *       200:
 *         description: Members predictions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Quiniela not found
 */
// Get all members' predictions for comparison
router.get('/:id/members-predictions', GroupQuinielaController.getMembersPredictions);

/**
 * @swagger
 * /group-quinielas:
 *   post:
 *     tags: [GroupQuinielas]
 *     summary: Create a new quiniela
 *     description: Creates a new group quiniela with a set of matches for group members to predict.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - name
 *               - matches
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: The group ID this quiniela belongs to
 *               name:
 *                 type: string
 *                 description: Name of the quiniela
 *               matches:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Array of matches to include in the quiniela
 *     responses:
 *       201:
 *         description: Quiniela created successfully
 *       400:
 *         description: Bad request - invalid data
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
// Create a new quiniela
router.post('/', GroupQuinielaController.create);

/**
 * @swagger
 * /group-quinielas/{id}/predictions:
 *   post:
 *     tags: [GroupQuinielas]
 *     summary: Save predictions
 *     description: Saves or updates the authenticated user's predictions for a specific quiniela.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - predictions
 *             properties:
 *               predictions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     matchId:
 *                       type: integer
 *                     prediction:
 *                       type: string
 *                       enum: ['1', 'X', '2']
 *                 description: Array of match predictions
 *     responses:
 *       200:
 *         description: Predictions saved successfully
 *       400:
 *         description: Bad request - invalid predictions or quiniela is closed
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Quiniela not found
 */
// Save predictions
router.post('/:id/predictions', GroupQuinielaController.savePredictions);

/**
 * @swagger
 * /group-quinielas/{id}/results:
 *   post:
 *     tags: [GroupQuinielas]
 *     summary: Submit results
 *     description: Submits the actual match results for a quiniela. Only the group admin or quiniela creator can submit results.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - results
 *             properties:
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     matchId:
 *                       type: integer
 *                     result:
 *                       type: string
 *                       enum: ['1', 'X', '2']
 *                 description: Array of match results
 *     responses:
 *       200:
 *         description: Results submitted successfully
 *       400:
 *         description: Bad request - invalid results
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only admin or creator can submit results
 *       404:
 *         description: Quiniela not found
 */
// Submit results (admin/creator)
router.post('/:id/results', GroupQuinielaController.submitResults);

/**
 * @swagger
 * /group-quinielas/{id}/close:
 *   patch:
 *     tags: [GroupQuinielas]
 *     summary: Close a quiniela
 *     description: Closes a quiniela so no more predictions can be submitted. Only the group admin or quiniela creator can close it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     responses:
 *       200:
 *         description: Quiniela closed successfully
 *       400:
 *         description: Bad request - quiniela is already closed
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only admin or creator can close the quiniela
 *       404:
 *         description: Quiniela not found
 */
// Close quiniela (admin/creator)
router.patch('/:id/close', GroupQuinielaController.close);

/**
 * @swagger
 * /group-quinielas/{id}:
 *   delete:
 *     tags: [GroupQuinielas]
 *     summary: Delete a quiniela
 *     description: Deletes a group quiniela. Only the group admin or quiniela creator can delete it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The quiniela ID
 *     responses:
 *       200:
 *         description: Quiniela deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       403:
 *         description: Forbidden - only admin or creator can delete the quiniela
 *       404:
 *         description: Quiniela not found
 */
// Delete quiniela (admin/creator)
router.delete('/:id', GroupQuinielaController.delete);

export default router;
