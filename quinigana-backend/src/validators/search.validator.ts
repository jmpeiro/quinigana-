import { query } from 'express-validator';

// ───── Jornada search & filter validators ─────

export const jornadaSearchValidator = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Search query must be at most 200 characters'),
  query('status')
    .optional()
    .isIn(['open', 'closed', 'finished']).withMessage('Status must be open, closed, or finished'),
  query('season')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Season must be at most 20 characters'),
  query('dateFrom')
    .optional()
    .isISO8601().withMessage('dateFrom must be a valid ISO 8601 date'),
  query('dateTo')
    .optional()
    .isISO8601().withMessage('dateTo must be a valid ISO 8601 date'),
  query('cursor')
    .optional()
    .isString().withMessage('Cursor must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('direction')
    .optional()
    .isIn(['next', 'prev']).withMessage('Direction must be next or prev'),
];

// ───── Proposal search & filter validators ─────

export const proposalSearchValidator = [
  query('status')
    .optional()
    .isIn(['draft', 'pending', 'approved', 'rejected']).withMessage('Status must be draft, pending, approved, or rejected'),
  query('groupId')
    .optional()
    .isInt({ min: 1 }).withMessage('groupId must be a positive integer'),
  query('jornadaId')
    .optional()
    .isInt({ min: 1 }).withMessage('jornadaId must be a positive integer'),
  query('cursor')
    .optional()
    .isString().withMessage('Cursor must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('direction')
    .optional()
    .isIn(['next', 'prev']).withMessage('Direction must be next or prev'),
];
