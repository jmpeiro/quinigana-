import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.util';

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: 'path' in err ? err.path : 'unknown',
      message: err.msg,
    }));

    sendError(res, 'VALIDATION_ERROR', 'Invalid input data', 422, details);
    return;
  }

  next();
}
