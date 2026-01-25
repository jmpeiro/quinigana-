import { body } from 'express-validator';

export const createJornadaValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Jornada name is required')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('season')
    .trim()
    .notEmpty().withMessage('Season is required')
    .isLength({ max: 20 }).withMessage('Season must be at most 20 characters'),
  body('jornada_number')
    .notEmpty().withMessage('Jornada number is required')
    .isInt({ min: 1 }).withMessage('Jornada number must be a positive integer'),
  body('deadline')
    .notEmpty().withMessage('Deadline is required')
    .isISO8601().withMessage('Deadline must be a valid date'),
  body('matches')
    .isArray({ min: 15, max: 15 }).withMessage('Exactly 15 matches are required'),
  body('matches.*.match_number')
    .isInt({ min: 1, max: 15 }).withMessage('Match number must be between 1 and 15'),
  body('matches.*.home_team')
    .trim()
    .notEmpty().withMessage('Home team is required')
    .isLength({ max: 100 }).withMessage('Team name must be at most 100 characters'),
  body('matches.*.away_team')
    .trim()
    .notEmpty().withMessage('Away team is required')
    .isLength({ max: 100 }).withMessage('Team name must be at most 100 characters'),
  body('matches.*.match_date')
    .optional()
    .isISO8601().withMessage('Match date must be a valid date')
];

export const updateJornadaStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['open', 'closed', 'finished']).withMessage('Status must be open, closed, or finished')
];

export const submitResultsValidator = [
  body('results')
    .isArray({ min: 1 }).withMessage('At least one result is required'),
  body('results.*.match_id')
    .isInt({ min: 1 }).withMessage('Invalid match ID'),
  body('results.*.home_score')
    .isInt({ min: 0 }).withMessage('Home score must be a non-negative integer'),
  body('results.*.away_score')
    .isInt({ min: 0 }).withMessage('Away score must be a non-negative integer')
];
