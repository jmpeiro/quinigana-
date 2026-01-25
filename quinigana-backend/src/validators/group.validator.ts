import { body, param, query } from 'express-validator';

export const createGroupValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Group name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters')
];

export const updateGroupValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description must be at most 500 characters')
];

export const inviteUserValidator = [
  body('user_id')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID')
];

export const userSearchValidator = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
];
