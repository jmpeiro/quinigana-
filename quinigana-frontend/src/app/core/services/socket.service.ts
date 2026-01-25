import { Injectable, inject, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { LiveMatch } from '../models/dashboard.model';

export interface LiveScoresUpdate {
  jornadaId: number;
  matches: LiveMatch[];
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private tokenService = inject(TokenService);
  private socket: Socket | null = null;
  private currentJornadaId: number | null = null;

  private liveScoresSubject = new Subject<LiveScoresUpdate>();
  private connectedSubject = new Subject<boolean>();

  liveScores$: Observable<LiveScoresUpdate> = this.liveScoresSubject.asObservable();
  connected$: Observable<boolean> = this.connectedSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.tokenService.getAccessToken();
    if (!token) return;

    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
      // Rejoin room after reconnection
      if (this.currentJornadaId !== null) {
        this.socket!.emit('jornada:join', this.currentJornadaId);
      }
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
    });

    this.socket.on('live-scores:update', (data: LiveScoresUpdate) => {
      this.liveScoresSubject.next(data);
    });

    this.socket.on('connect_error', () => {
      this.connectedSubject.next(false);
    });
  }

  joinJornada(jornadaId: number): void {
    this.currentJornadaId = jornadaId;
    if (this.socket?.connected) {
      this.socket.emit('jornada:join', jornadaId);
    }
  }

  leaveJornada(jornadaId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('jornada:leave', jornadaId);
    }
    if (this.currentJornadaId === jornadaId) {
      this.currentJornadaId = null;
    }
  }

  disconnect(): void {
    if (this.currentJornadaId !== null && this.socket?.connected) {
      this.socket.emit('jornada:leave', this.currentJornadaId);
    }
    this.currentJornadaId = null;
    this.socket?.disconnect();
    this.socket = null;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.liveScoresSubject.complete();
    this.connectedSubject.complete();
  }
}
