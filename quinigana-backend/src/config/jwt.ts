import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from './environment';
import { TokenPayload } from '../types';

// Validate JWT secrets at module load time - fail fast if not configured
function validateJwtSecrets(): void {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'default-access-secret') {
    throw new Error(
      'FATAL: JWT_ACCESS_SECRET is not defined or uses the default value. ' +
      'Set a strong, unique JWT_ACCESS_SECRET in your environment variables before starting the server.'
    );
  }

  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'default-refresh-secret') {
    throw new Error(
      'FATAL: JWT_REFRESH_SECRET is not defined or uses the default value. ' +
      'Set a strong, unique JWT_REFRESH_SECRET in your environment variables before starting the server.'
    );
  }

  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error(
      'FATAL: JWT_ACCESS_SECRET must be at least 32 characters long for adequate security.'
    );
  }

  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error(
      'FATAL: JWT_REFRESH_SECRET must be at least 32 characters long for adequate security.'
    );
  }
}

// Run validation when this module is first imported
validateJwtSecrets();

export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiry as any,
  };
  return jwt.sign({ ...payload }, env.jwt.accessSecret, options);
}

export function generateRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwt.refreshExpiry as any,
  };
  return jwt.sign({ ...payload }, env.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
}
