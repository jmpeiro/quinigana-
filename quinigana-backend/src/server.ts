import { createServer } from 'http';
import app from './app';
import { env } from './config/environment';
import { testConnection } from './config/database';
import { SocketService } from './services/socket.service';
import { SchedulerService } from './services/scheduler.service';
import logger from './config/logger';

let socketService: SocketService;

async function bootstrap(): Promise<void> {
  try {
    await testConnection();

    const httpServer = createServer(app);
    socketService = new SocketService(httpServer);

    httpServer.listen(env.port, () => {
      logger.info({ port: env.port, env: env.nodeEnv, frontend: env.frontendUrl }, 'QuiniGana API Server ready (WebSocket enabled)');

      // Initialize scheduler for automatic jornada status updates
      SchedulerService.init();
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down...');
      socketService.shutdown();
      httpServer.close();
    });
  } catch (error) {
    logger.fatal(error, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
