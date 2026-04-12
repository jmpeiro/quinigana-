import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service';
import logger from '../config/logger';

export async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ success: false, error: { code: 'MISSING_API_KEY', message: 'API key required' } });
    return;
  }

  try {
    const result = await ApiKeyService.validate(apiKey);
    if (!result) {
      res.status(401).json({ success: false, error: { code: 'INVALID_API_KEY', message: 'Invalid or expired API key' } });
      return;
    }

    req.authUser = { userId: result.userId, email: 'api-key', provider: 'api-key' };
    (req as any).apiPermissions = result.permissions;
    next();
  } catch (error) {
    logger.error({ error }, 'API key validation error');
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'API key validation failed' } });
  }
}
