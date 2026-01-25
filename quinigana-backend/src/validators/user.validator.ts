import { body } from 'express-validator';

export const updateProfileValidator = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1-100 characters')
    .escape(),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Last name must be max 100 characters')
    .escape(),
];
