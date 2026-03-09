import { Router } from 'express';
import { ProposalController } from '../controllers/proposal.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { proposalSearchValidator } from '../validators/search.validator';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/proposals:
 *   get:
 *     tags: [Proposals]
 *     summary: Search proposals
 *     description: >
 *       Search and filter proposals across all groups. Supports cursor-based pagination
 *       and filtering by status, groupId, and jornadaId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, approved, rejected]
 *         description: Filter by proposal status.
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Filter by group ID.
 *       - in: query
 *         name: jornadaId
 *         schema:
 *           type: integer
 *         description: Filter by jornada ID.
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for cursor-based pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [next, prev]
 *           default: next
 *     responses:
 *       200:
 *         description: List of matching proposals returned successfully.
 *       401:
 *         description: Unauthorized – missing or invalid token.
 *       422:
 *         description: Validation error – invalid query parameters.
 */
router.get('/', proposalSearchValidator, validateRequest, ProposalController.search);

export default router;
