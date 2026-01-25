import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../config/jwt';
import { env } from '../config/environment';
import { JornadaService } from './jornada.service';
import logger from '../config/logger';

interface ServerToClientEvents {
  'live-scores:update': (data: { jornadaId: number; matches: any[] }) => void;
  'live-scores:error': (data: { message: string }) => void;
}

interface ClientToServerEvents {
  'jornada:join': (jornadaId: number) => void;
  'jornada:leave': (jornadaId: number) => void;
}

interface SocketData {
  userId: number;
  email: string;
}

export class SocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
  private scrapeTimers: Map<number, NodeJS.Timeout> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.frontendUrl,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupAuthMiddleware();
    this.setupConnectionHandlers();
  }

  private setupAuthMiddleware(): void {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const payload = verifyAccessToken(token);
        socket.data.userId = payload.userId;
        socket.data.email = payload.email;
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    });
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info({ userId: socket.data.userId }, 'Socket connected');

      socket.on('jornada:join', (jornadaId: number) => {
        this.handleJoinRoom(socket, jornadaId);
      });

      socket.on('jornada:leave', (jornadaId: number) => {
        this.handleLeaveRoom(socket, jornadaId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoinRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>, jornadaId: number): void {
    if (!jornadaId || typeof jornadaId !== 'number') return;

    const roomName = `jornada:${jornadaId}`;
    socket.join(roomName);

    const room = this.io.sockets.adapter.rooms.get(roomName);
    const clientCount = room?.size || 0;

    logger.debug({ userId: socket.data.userId, jornadaId, clientCount }, 'Client joined jornada room');

    // Start scraping if this is the first client for this jornada
    if (clientCount === 1 && !this.scrapeTimers.has(jornadaId)) {
      this.startScraping(jornadaId);
    }
  }

  private handleLeaveRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>, jornadaId: number): void {
    if (!jornadaId || typeof jornadaId !== 'number') return;

    const roomName = `jornada:${jornadaId}`;
    socket.leave(roomName);

    // Check room size after leaving
    setTimeout(() => {
      const room = this.io.sockets.adapter.rooms.get(roomName);
      if (!room || room.size === 0) {
        this.stopScraping(jornadaId);
      }
    }, 0);
  }

  private handleDisconnect(socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>): void {
    logger.info({ userId: socket.data.userId }, 'Socket disconnected');

    // After disconnect, check all tracked jornada rooms
    setTimeout(() => {
      for (const [jornadaId] of this.scrapeTimers) {
        const roomName = `jornada:${jornadaId}`;
        const room = this.io.sockets.adapter.rooms.get(roomName);
        if (!room || room.size === 0) {
          this.stopScraping(jornadaId);
        }
      }
    }, 0);
  }

  private startScraping(jornadaId: number): void {
    if (this.scrapeTimers.has(jornadaId)) return;

    logger.info({ jornadaId }, 'Starting live score scraping');

    // Scrape immediately, then at interval
    this.scrapeAndBroadcast(jornadaId);

    const timer = setInterval(
      () => this.scrapeAndBroadcast(jornadaId),
      env.socket.scrapeIntervalMs,
    );
    this.scrapeTimers.set(jornadaId, timer);
  }

  private stopScraping(jornadaId: number): void {
    const timer = this.scrapeTimers.get(jornadaId);
    if (timer) {
      clearInterval(timer);
      this.scrapeTimers.delete(jornadaId);
      logger.info({ jornadaId }, 'Stopped live score scraping (no clients)');
    }
  }

  private async scrapeAndBroadcast(jornadaId: number): Promise<void> {
    try {
      const matches = await JornadaService.getLiveScores(jornadaId);
      const roomName = `jornada:${jornadaId}`;
      this.io.to(roomName).emit('live-scores:update', { jornadaId, matches });

      // If all matches are finished, stop scraping
      if (matches.every((m: any) => m.status === 'FINISHED')) {
        this.stopScraping(jornadaId);
        logger.info({ jornadaId }, 'All matches finished, stopping scrape');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scraping failed';
      logger.error({ jornadaId, error: message }, 'Live score scrape failed');
      const roomName = `jornada:${jornadaId}`;
      this.io.to(roomName).emit('live-scores:error', { message });
    }
  }

  shutdown(): void {
    for (const [jornadaId] of this.scrapeTimers) {
      this.stopScraping(jornadaId);
    }
    this.io.close();
  }
}
