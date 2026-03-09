import { createServer } from 'http';
import app from './app';
import { env } from './config/environment';
import { testConnection } from './config/database';
import { redisClient } from './config/redis.config';
import { RedisService } from './services/redis.service';
import { SocketService } from './services/socket.service';
import { SchedulerService } from './services/scheduler.service';
import logger from './config/logger';

let socketService: SocketService;

async function bootstrap(): Promise<void> {
  try {
    // Verify database and Redis connectivity
    await testConnection();

    const redisHealthy = await RedisService.isHealthy();
    if (redisHealthy) {
      logger.info('Redis connection verified');
    } else {
      logger.warn('Redis is not responding — the server will start but some features may be degraded');
    }

    const httpServer = createServer(app);
    socketService = new SocketService(httpServer);

    httpServer.listen(env.port, () => {
      logger.info({ port: env.port, env: env.nodeEnv, frontend: env.frontendUrl }, 'QuiniGana API Server ready (WebSocket + Redis enabled)');

      // Initialize scheduler for automatic jornada status updates
      SchedulerService.init();
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      socketService.shutdown();
      await RedisService.disconnect();
      httpServer.close();
    });
  } catch (error) {
    logger.fatal(error, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
