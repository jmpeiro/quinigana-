import { query } from 'express-validator';

export const exportValidator = [
  query('format')
    .notEmpty().withMessage('Export format is required')
    .isIn(['csv', 'pdf']).withMessage('Format must be csv or pdf'),
  query('type')
    .notEmpty().withMessage('Export type is required')
    .isIn(['rankings', 'predictions']).withMessage('Type must be rankings or predictions'),
  query('jornadaId')
    .optional()
    .isInt({ min: 1 }).withMessage('jornadaId must be a positive integer'),
  query('groupId')
    .optional()
    .isInt({ min: 1 }).withMessage('groupId must be a positive integer'),
];
