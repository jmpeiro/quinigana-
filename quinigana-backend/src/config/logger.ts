import pino from 'pino';
import { env } from './environment';

const logger = pino({
  level: process.env.LOG_LEVEL || (env.nodeEnv === 'production' ? 'info' : 'debug'),
  transport: env.nodeEnv !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
    : undefined,
});

export default logger;
