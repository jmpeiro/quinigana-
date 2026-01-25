import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from './environment';
import { TokenPayload } from '../types';

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
