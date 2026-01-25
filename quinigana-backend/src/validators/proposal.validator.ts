import { body } from 'express-validator';

export const createProposalValidator = [
  body('jornada_id')
    .notEmpty().withMessage('Jornada ID is required')
    .isInt({ min: 1 }).withMessage('Invalid jornada ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('predictions')
    .isArray({ min: 15, max: 15 }).withMessage('Exactly 15 predictions are required'),
  body('predictions.*.match_id')
    .isInt({ min: 1 }).withMessage('Invalid match ID'),
  body('predictions.*.prediction_1x2')
    .isIn(['1', 'X', '2', '1X', '12', 'X2', '1X2']).withMessage('Prediction must be 1, X, 2, 1X, 12, X2, or 1X2'),
  body('predictions.*.home_score_prediction')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('Score prediction must be 0-99'),
  body('predictions.*.away_score_prediction')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('Score prediction must be 0-99')
];

export const updateProposalValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('predictions')
    .optional()
    .isArray({ min: 15, max: 15 }).withMessage('Exactly 15 predictions are required'),
  body('predictions.*.match_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Invalid match ID'),
  body('predictions.*.prediction_1x2')
    .optional()
    .isIn(['1', 'X', '2', '1X', '12', 'X2', '1X2']).withMessage('Prediction must be 1, X, 2, 1X, 12, X2, or 1X2'),
  body('predictions.*.home_score_prediction')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('Score prediction must be 0-99'),
  body('predictions.*.away_score_prediction')
    .optional()
    .isInt({ min: 0, max: 99 }).withMessage('Score prediction must be 0-99')
];

export const voteValidator = [
  body('vote')
    .notEmpty().withMessage('Vote is required')
    .isIn(['approve', 'reject']).withMessage('Vote must be approve or reject')
];
