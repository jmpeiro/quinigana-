import { CorsOptions } from 'cors';
import { env } from './environment';

export const corsOptions: CorsOptions = {
  origin: env.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
