import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { StatsService } from '../../core/services/stats.service';
import { GamificationService } from '../../core/services/gamification.service';
import { GroupQuinielaService } from '../../core/services/group-quiniela.service';
import { ComparisonService } from '../../core/services/comparison.service';
import { SocketService } from '../../core/services/socket.service';
import { DashboardData, LiveMatch, UserPrediction } from '../../core/models/dashboard.model';
import { GroupMemberLiveScore } from '../../core/models/comparison.model';
import { PersonalStats } from '../../core/models/stats.model';
import { UserGamificationData } from '../../core/models/gamification.model';
import { GroupQuinielaWithDetails, MembersPredictionsData, MemberSummary, MemberPredictionComparison } from '../../core/models/group-quiniela.model';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell.component';
import { ErrorCardComponent } from '../../shared/components/error-card/error-card.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { XpBarComponent } from '../../shared/components/xp-bar/xp-bar.component';
import { StandingsComponent } from '../../shared/components/standings/standings.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, NgApexchartsModule, NotificationBellComponent, ErrorCardComponent, SkeletonComponent, XpBarComponent, StandingsComponent, DatePipe],
  template: `
    <div class="page">
      <header class="topbar">
        <h1 class="page-title">Dashboard</h1>
        <div class="topbar-actions">
          <button mat-icon-button (click)="loadDashboard()" [class.spinning]="loading()"><mat-icon>sync</mat-icon></button>
          <app-notification-bell />
        </div>
      </header>

      @if (loading()) {
        <div class="skeleton-wrap">
          <app-skeleton variant="card" width="100%" height="120px" />
          <div class="sk-stats">
            <app-skeleton variant="card" width="100%" height="88px" />
            <app-skeleton variant="card" width="100%" height="88px" />
            <app-skeleton variant="card" width="100%" height="88px" />
            <app-skeleton variant="card" width="100%" height="88px" />
          </div>
          <div class="sk-cols">
            <app-skeleton variant="card" width="100%" height="200px" />
            <app-skeleton variant="card" width="100%" height="200px" />
          </div>
        </div>
      } @else if (error()) {
        <app-error-card (retry)="loadDashboard()" />
      } @else if (data()) {
        <div class="content-wrapper">
          <div class="content">
            <!-- Active Jornada -->
          @if (data()!.activeJornada; as jornada) {
            <section class="jornada" (click)="navigate('/quiniela/jornadas/' + jornada.id)">
              <div class="jornada-left">
                <span class="jornada-badge">Jornada activa</span>
                <h2 class="jornada-title">{{ jornada.name }}</h2>
                <div class="jornada-chips">
                  <span class="chip"><mat-icon>stadium</mat-icon>{{ jornada.matchCount }} partidos</span>
                  <span class="chip" [class.accent]="!deadlinePassed()" [class.closed]="deadlinePassed()">
                    <mat-icon>{{ deadlinePassed() ? 'lock' : 'schedule' }}</mat-icon>
                    {{ countdownText() }}
                  </span>
                </div>
              </div>
              <button mat-flat-button class="jornada-btn" [class.btn-closed]="deadlinePassed()">
                {{ deadlinePassed() ? 'Ver' : 'Jugar' }}
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </section>
          } @else {
            <section class="jornada empty-jornada">
              <mat-icon>event_busy</mat-icon>
              <span>No hay jornada activa</span>
            </section>
          }

          <!-- Group Quinielas -->
          @if (selectedQuiniela(); as q) {
            <section class="group-quiniela-card" (click)="navigate('/groups/' + q.group_id + '/quiniela/' + q.id)">
              <div class="quiniela-left">
                <span class="quiniela-badge">{{ q.group_name }}</span>
                <h2 class="quiniela-title">{{ q.name }}</h2>
                <div class="quiniela-chips">
                  <span class="chip"><mat-icon>sports_soccer</mat-icon>{{ q.match_count }} partidos</span>
                  <span class="chip" [class.accent]="!q.has_predicted" [class.predicted]="q.has_predicted">
                    <mat-icon>{{ q.has_predicted ? 'check_circle' : 'schedule' }}</mat-icon>
                    {{ q.has_predicted ? 'Jugada' : (q.deadline | date:'short') }}
                  </span>
                </div>
              </div>
              <div class="quiniela-right">
                @if (activeQuinielas().length > 1) {
                  <div class="quiniela-nav" (click)="$event.stopPropagation()">
                    <button mat-icon-button class="nav-btn" (click)="prevQuiniela()" [disabled]="selectedQuinielaIndex() === 0">
                      <mat-icon>chevron_left</mat-icon>
                    </button>
                    <span class="nav-dots">
                      @for (item of activeQuinielas(); track item.id; let i = $index) {
                        <span class="dot" [class.active]="i === selectedQuinielaIndex()" (click)="selectQuiniela(i)"></span>
                      }
                    </span>
                    <button mat-icon-button class="nav-btn" (click)="nextQuiniela()" [disabled]="selectedQuinielaIndex() === activeQuinielas().length - 1">
                      <mat-icon>chevron_right</mat-icon>
                    </button>
                  </div>
                }
                <button mat-flat-button class="quiniela-btn">
                  {{ q.has_predicted ? 'Ver' : 'Jugar' }}
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </section>
          }

          <!-- Live Scores -->
          @if (liveMatches().length > 0) {
            <section class="live-scores card">
              <div class="live-header">
                <h3 class="card-title">
                  <mat-icon>sports_score</mat-icon>Resultados en Vivo
                  @if (hasLiveMatch()) {
                    <span class="live-dot"></span>
                  }
                </h3>
                @if (liveAccuracy(); as acc) {
                  <div class="accuracy-summary">
                    <span class="acc-item acc-1x2"><mat-icon>check_circle</mat-icon>{{ acc.correct1x2 }}/{{ acc.totalResolved }}</span>
                    <span class="acc-item acc-pleno"><mat-icon>auto_awesome</mat-icon>{{ acc.correctPleno }}</span>
                  </div>
                }
                @if (groupRanking().length > 0) {
                  <button mat-stroked-button class="ranking-toggle" (click)="toggleRanking($event)">
                    <mat-icon>leaderboard</mat-icon>
                    {{ showRanking() ? 'Ocultar' : 'Ranking' }}
                  </button>
                }
              </div>
              @if (showRanking() && groupRanking().length > 0) {
                <div class="mini-ranking">
                  <div class="ranking-header">
                    <span class="ranking-title">Ranking del grupo</span>
                    <button mat-icon-button class="compare-btn" (click)="openComparison($event)" matTooltip="Ver comparativa detallada">
                      <mat-icon>compare_arrows</mat-icon>
                    </button>
                  </div>
                  @for (member of groupRanking(); track member.user_id; let i = $index) {
                    <div class="ranking-row" [class.is-me]="member.user_id === currentUserId()">
                      <span class="rank-pos">{{ i + 1 }}</span>
                      <span class="rank-name">{{ member.user_name }}</span>
                      <span class="rank-score">
                        <span class="score-1x2">{{ member.correct_1x2 }}</span>
                        <span class="score-pleno">{{ member.correct_pleno }}</span>
                      </span>
                    </div>
                  }
                </div>
              }
              @if (hasRenderableLiveMatches()) {
                <div class="matches-list">
                  @for (m of visibleLiveMatches(); track m.match_number) {
                    <div class="match-row" [class.match-live]="m.status === 'IN_PLAY'" [class.match-finished]="m.status === 'FINISHED'">
                      <span class="match-num">{{ m.match_number }}</span>
                      <span class="team home">{{ m.home_team }}</span>
                      <span class="score">{{ m.home_score ?? '-' }} - {{ m.away_score ?? '-' }}</span>
                      <span class="team away">{{ m.away_team }}</span>
                      <span class="sign" [class.sign-1]="m.sign === '1'" [class.sign-x]="m.sign === 'X'" [class.sign-2]="m.sign === '2'">{{ m.sign || '-' }}</span>
                      @if (getPrediction(m.match_number); as pred) {
                        <span class="my-pred" [class.pred-hit]="pred.prediction_1x2 === m.sign" [class.pred-miss]="m.sign && pred.prediction_1x2 !== m.sign">{{ pred.prediction_1x2 }}</span>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="live-empty">
                  AÃºn no hay resultados en vivo para esta jornada.
                </div>
              }
            </section>
          }

          <!-- Members Predictions Carousel -->
          @if (membersPredictions(); as mp) {
            @if (mp.members.length >= 1) {
              <section class="members-carousel card">
                <div class="carousel-header">
                  <h3 class="card-title"><mat-icon>group</mat-icon>Comparar predicciones</h3>
                  @if (viewingOtherMember()) {
                    <button mat-stroked-button class="back-to-me" (click)="goToMyPredictions()">
                      <mat-icon>person</mat-icon>Mis predicciones
                    </button>
                  }
                </div>
                <div class="member-selector">
                  <button mat-icon-button class="nav-btn" (click)="prevMember()">
                    <mat-icon>chevron_left</mat-icon>
                  </button>
                  @if (selectedMember(); as member) {
                    <div class="selected-member" [class.is-me]="member.user_id === currentUserId()">
                      <span class="member-name">{{ member.user_name }}</span>
                      <div class="member-stats">
                        <span class="stat-1x2"><mat-icon>check_circle</mat-icon>{{ member.correct_1x2 }}</span>
                        <span class="stat-pleno"><mat-icon>auto_awesome</mat-icon>{{ member.correct_pleno }}</span>
                        <span class="stat-pts">{{ member.total_points }} pts</span>
                      </div>
                    </div>
                  }
                  <button mat-icon-button class="nav-btn" (click)="nextMember()">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </div>
                <div class="member-dots">
                  @for (m of mp.members; track m.user_id; let i = $index) {
                    <span class="dot" [class.active]="i === selectedMemberIndex()" [class.is-me]="m.user_id === currentUserId()" (click)="selectMember(i)"></span>
                  }
                </div>
                <div class="member-matches">
                  @for (match of mp.matches; track match.match_id) {
                    @if (getMemberPrediction(match.match_id); as pred) {
                      <div class="member-match-row" [class.pred-hit]="pred.is_correct_1x2 === true" [class.pred-miss]="pred.is_correct_1x2 === false">
                        <span class="match-num">{{ match.match_number }}</span>
                        <span class="team home">{{ match.home_team }}</span>
                        <span class="result">{{ match.home_score ?? '-' }} - {{ match.away_score ?? '-' }}</span>
                        <span class="team away">{{ match.away_team }}</span>
                        <span class="member-pred" [class.pred-1]="pred.prediction_1x2 === '1'" [class.pred-x]="pred.prediction_1x2 === 'X'" [class.pred-2]="pred.prediction_1x2 === '2'">{{ pred.prediction_1x2 }}</span>
                        @if (pred.is_correct_pleno) {
                          <mat-icon class="pleno-icon">auto_awesome</mat-icon>
                        }
                      </div>
                    }
                  }
                </div>
              </section>
            }
          }

          <!-- XP Level -->
          @if (gamification()) {
            <app-xp-bar
              [level]="gamification()!.level"
              [xp]="gamification()!.xp"
              [xpForCurrentLevel]="gamification()!.xpForCurrentLevel"
              [xpForNextLevel]="gamification()!.xpForNextLevel" />
          }

          <!-- Quick Actions -->
          <section class="quick-actions">
            <div class="quick-card" (click)="navigate('/challenges')">
              <mat-icon>sports_kabaddi</mat-icon>
              <div class="quick-info">
                <span class="quick-title">Retos 1vs1</span>
                <span class="quick-desc">Desafia a otros jugadores</span>
              </div>
              <mat-icon class="quick-arrow">chevron_right</mat-icon>
            </div>
            <div class="quick-card" (click)="navigate('/leagues')">
              <mat-icon>emoji_events</mat-icon>
              <div class="quick-info">
                <span class="quick-title">Ligas</span>
                <span class="quick-desc">Divisiones y ascensos</span>
              </div>
              <mat-icon class="quick-arrow">chevron_right</mat-icon>
            </div>
          </section>

          <!-- Stats -->
          <section class="stats">
            <div class="stat">
              <mat-icon class="stat-icon gold">emoji_events</mat-icon>
              <span class="stat-val">{{ data()!.stats.totalPoints }}</span>
              <span class="stat-lbl">Puntos</span>
            </div>
            <div class="stat">
              <mat-icon class="stat-icon blue">check_circle</mat-icon>
              <span class="stat-val">{{ data()!.stats.accuracy1x2Percent }}%</span>
              <span class="stat-lbl">1X2</span>
            </div>
            <div class="stat">
              <mat-icon class="stat-icon purple">auto_awesome</mat-icon>
              <span class="stat-val">{{ data()!.stats.accuracyPlenoPercent }}%</span>
              <span class="stat-lbl">Plenos</span>
            </div>
            <div class="stat">
              <mat-icon class="stat-icon green">sports_soccer</mat-icon>
              <span class="stat-val">{{ data()!.stats.jornadasPlayed }}</span>
              <span class="stat-lbl">Jornadas</span>
            </div>
          </section>

          <!-- Charts -->
          <section class="charts">
            @if (evolutionChartOptions(); as opts) {
              <div class="card">
                <h3 class="card-title"><mat-icon>show_chart</mat-icon>Evolucion</h3>
                <apx-chart
                  [series]="opts.series"
                  [chart]="opts.chart"
                  [xaxis]="opts.xaxis"
                  [fill]="opts.fill"
                  [stroke]="opts.stroke"
                  [colors]="opts.colors"
                  [grid]="opts.grid"
                  [dataLabels]="opts.dataLabels"
                  [tooltip]="opts.tooltip"
                />
              </div>
            }
            @if (accuracyChartOptions(); as opts) {
              <div class="card">
                <h3 class="card-title"><mat-icon>pie_chart</mat-icon>Precision</h3>
                <apx-chart
                  [series]="opts.series"
                  [chart]="opts.chart"
                  [labels]="opts.labels"
                  [colors]="opts.colors"
                  [plotOptions]="opts.plotOptions"
                  [legend]="opts.legend"
                />
              </div>
            }
          </section>

          <!-- Lists -->
          <section class="lists">
            <div class="card">
              <div class="card-head">
                <h3 class="card-title"><mat-icon>group</mat-icon>Grupos</h3>
                <button mat-button class="link-btn" (click)="navigate('/groups')">Ver todos</button>
              </div>
              @if (data()!.myGroups.length > 0) {
                @for (g of data()!.myGroups; track g.id) {
                  <div class="row" (click)="navigate('/groups/' + g.id)">
                    <span class="row-rank">#{{ g.rank }}</span>
                    <div class="row-info">
                      <span class="row-name">{{ g.name }}</span>
                      <span class="row-sub">{{ g.memberCount }} miembros</span>
                    </div>
                    <span class="row-pts">{{ g.totalPoints }}</span>
                  </div>
                }
              } @else {
                <div class="empty">
                  <p>Sin grupos</p>
                  <button mat-stroked-button (click)="navigate('/groups/create')"><mat-icon>add</mat-icon>Crear</button>
                </div>
              }
            </div>
            <div class="card">
              <h3 class="card-title"><mat-icon>leaderboard</mat-icon>Resultados</h3>
              @if (data()!.latestResults.length > 0) {
                @for (r of data()!.latestResults; track r.jornadaId + r.groupName) {
                  <div class="row">
                    <div class="row-info">
                      <span class="row-name">{{ r.jornadaName }}</span>
                      <span class="row-sub">{{ r.groupName }}</span>
                    </div>
                    <div class="row-right">
                      <span class="row-pts">{{ r.totalPoints }}</span>
                      <span class="row-sub">{{ r.correct1x2 }}·1X2 {{ r.correctPleno }}·P</span>
                    </div>
                  </div>
                }
              } @else {
                <div class="empty"><p>Sin resultados</p></div>
              }
            </div>
          </section>

          </div>

          <!-- Standings Sidebar -->
          <aside class="standings-sidebar">
            <app-standings />
          </aside>
        </div>
      } @else {
        <div class="welcome">
          <img src="logoquinigana.png" alt="QuiniGana" />
          <h2>Bienvenido a QuiniGana</h2>
          <p>Tu panel de predicciones</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #f8f9fb;
      min-height: 100vh;
    }

    .page {
      min-height: 100vh;
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Content wrapper with sidebar */
    .content-wrapper {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
      align-items: start;

      @media (max-width: 1100px) {
        grid-template-columns: 1fr;
      }
    }

    .content {
      min-width: 0;
    }

    .standings-sidebar {
      position: sticky;
      top: 1.5rem;

      @media (max-width: 1100px) {
        position: static;
      }
    }

    /* Topbar */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      mat-icon, button { color: #64748b; }
    }
    .spinning mat-icon { animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Jornada */
    .jornada {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: box-shadow 180ms, border-color 180ms;
      margin-bottom: 1rem;

      &:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        border-color: #c8a84b;
      }

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
    .empty-jornada {
      justify-content: center;
      gap: 0.5rem;
      color: #94a3b8;
      cursor: default;
      &:hover { box-shadow: none; border-color: #e2e8f0; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .jornada-badge {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #c8a84b;
    }
    .jornada-title {
      margin: 0.2rem 0 0.5rem;
      font-size: 1.15rem;
      font-weight: 700;
      color: #1e293b;
    }
    .jornada-chips { display: flex; gap: 0.75rem; }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 500;
      mat-icon { font-size: 13px; width: 13px; height: 13px; color: #94a3b8; }
      &.accent { color: #b8943f; font-weight: 600; mat-icon { color: #c8a84b; } }
      &.closed { color: #ef4444; font-weight: 600; mat-icon { color: #ef4444; } }
    }
    .jornada-btn {
      background: #1e293b;
      color: #fff;
      font-weight: 600;
      font-size: 0.8rem;
      border-radius: 10px;
      padding: 0 20px;
      height: 38px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; margin-left: 4px; }
      &.btn-closed { background: #64748b; }
    }

    /* Group Quiniela Card */
    .group-quiniela-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: box-shadow 180ms, border-color 180ms;
      margin-bottom: 1rem;

      &:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        border-color: #c8a84b;
      }

      @media (max-width: 600px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
    .quiniela-left { flex: 1; }
    .quiniela-badge {
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #c8a84b;
    }
    .quiniela-title {
      margin: 0.2rem 0 0.5rem;
      font-size: 1.15rem;
      font-weight: 700;
      color: #1e293b;
    }
    .quiniela-chips { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .quiniela-chips .chip.predicted {
      color: #10b981;
      font-weight: 600;
      mat-icon { color: #10b981; }
    }
    .quiniela-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;

      @media (max-width: 600px) {
        flex-direction: row;
        align-items: center;
        width: 100%;
        justify-content: space-between;
      }
    }
    .quiniela-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .nav-btn {
      width: 28px;
      height: 28px;
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #64748b;
      }
      &:disabled mat-icon { color: #cbd5e1; }
    }
    .nav-dots {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 0 4px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e2e8f0;
      cursor: pointer;
      transition: all 150ms;

      &:hover { background: #cbd5e1; }
      &.active { background: #c8a84b; transform: scale(1.2); }
    }
    .quiniela-btn {
      background: #1e293b;
      color: #fff;
      font-weight: 600;
      font-size: 0.8rem;
      border-radius: 10px;
      padding: 0 20px;
      height: 38px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; margin-left: 4px; }
    }

    /* Live Scores */
    .live-scores { margin-bottom: 1rem; }
    .live-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      .card-title { margin-bottom: 0.5rem; }
    }
    .accuracy-summary {
      display: flex;
      gap: 0.6rem;
      align-items: center;
    }
    .acc-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
      &.acc-1x2 { color: #c8a84b; background: rgba(200,168,75,0.1); }
      &.acc-pleno { color: #8b5cf6; background: rgba(139,92,246,0.1); }
    }
    .ranking-toggle {
      font-size: 0.7rem;
      padding: 0 10px;
      height: 26px;
      line-height: 26px;
      border-color: #e2e8f0;
      color: #64748b;
      mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }
    }
    .mini-ranking {
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .ranking-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .ranking-title {
      font-size: 0.72rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .compare-btn {
      width: 24px;
      height: 24px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
      &:hover mat-icon { color: #c8a84b; }
    }
    .ranking-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      &:hover { background: #fff; }
      &.is-me { background: rgba(200,168,75,0.1); font-weight: 600; }
    }
    .rank-pos {
      font-weight: 800;
      color: #c8a84b;
      min-width: 18px;
      text-align: center;
    }
    .rank-name {
      flex: 1;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rank-score {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .score-1x2 {
      font-weight: 700;
      color: #c8a84b;
      background: rgba(200,168,75,0.15);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }
    .score-pleno {
      font-weight: 700;
      color: #8b5cf6;
      background: rgba(139,92,246,0.15);
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }
    .live-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      margin-left: 6px;
      animation: pulse-dot 1.5s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    .matches-list { display: flex; flex-direction: column; gap: 2px; }
    .live-empty {
      padding: 1rem 0.5rem;
      font-size: 0.8rem;
      color: #94a3b8;
      text-align: center;
      border: 1px dashed #e2e8f0;
      border-radius: 8px;
      background: #fafcff;
    }
    .match-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      transition: background 120ms;
      &:hover { background: #f8fafc; }
      &.match-live { background: #f0fdf4; }
      &.match-finished { opacity: 0.7; }
    }
    .match-num {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      min-width: 18px;
      text-align: center;
    }
    .team {
      flex: 1;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      &.home { text-align: right; }
      &.away { text-align: left; }
    }
    .score {
      font-weight: 800;
      color: #1e293b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      min-width: 42px;
      text-align: center;
      font-size: 0.78rem;
      .match-live & { background: #dcfce7; color: #166534; }
    }
    .sign {
      font-weight: 800;
      font-size: 0.72rem;
      min-width: 20px;
      text-align: center;
      padding: 2px 4px;
      border-radius: 4px;
      color: #94a3b8;
      &.sign-1 { color: #c8a84b; background: rgba(200,168,75,0.1); }
      &.sign-x { color: #3b82f6; background: rgba(59,130,246,0.1); }
      &.sign-2 { color: #ef4444; background: rgba(239,68,68,0.1); }
    }
    .my-pred {
      font-weight: 800;
      font-size: 0.68rem;
      min-width: 20px;
      text-align: center;
      padding: 2px 5px;
      border-radius: 4px;
      color: #94a3b8;
      border: 1px solid #e2e8f0;
      &.pred-hit { color: #10b981; border-color: #10b981; background: rgba(16,185,129,0.08); }
      &.pred-miss { color: #ef4444; border-color: #ef4444; background: rgba(239,68,68,0.08); }
    }

    /* Members Carousel */
    .members-carousel { margin-bottom: 1rem; }
    .carousel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .back-to-me {
      font-size: 0.7rem;
      padding: 0 10px;
      height: 26px;
      line-height: 26px;
      border-color: #c8a84b;
      color: #c8a84b;
      mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }
    }
    .member-selector {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .selected-member {
      flex: 1;
      max-width: 280px;
      text-align: center;
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      border: 2px solid transparent;
      transition: border-color 150ms;
      &.is-me { border-color: #c8a84b; background: rgba(200,168,75,0.08); }
    }
    .member-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
      display: block;
      margin-bottom: 0.3rem;
    }
    .member-stats {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .stat-1x2 {
      color: #c8a84b;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }
    .stat-pleno {
      color: #8b5cf6;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }
    .stat-pts {
      color: #10b981;
      font-weight: 700;
    }
    .member-dots {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 0.75rem;
    }
    .member-dots .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e2e8f0;
      cursor: pointer;
      transition: all 150ms;
      &:hover { background: #cbd5e1; }
      &.active { background: #c8a84b; transform: scale(1.3); }
      &.is-me { border: 2px solid #c8a84b; }
    }
    .member-matches { display: flex; flex-direction: column; gap: 2px; }
    .member-match-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      transition: background 120ms;
      &:hover { background: #f8fafc; }
      &.pred-hit { background: rgba(16,185,129,0.06); }
      &.pred-miss { background: rgba(239,68,68,0.04); }
    }
    .member-match-row .match-num {
      font-size: 0.65rem;
      font-weight: 700;
      color: #94a3b8;
      min-width: 18px;
      text-align: center;
    }
    .member-match-row .team {
      flex: 1;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      &.home { text-align: right; }
      &.away { text-align: left; }
    }
    .member-match-row .result {
      font-weight: 800;
      color: #1e293b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 6px;
      min-width: 42px;
      text-align: center;
      font-size: 0.78rem;
    }
    .member-pred {
      font-weight: 800;
      font-size: 0.72rem;
      min-width: 22px;
      text-align: center;
      padding: 2px 6px;
      border-radius: 5px;
      color: #64748b;
      background: #f1f5f9;
      &.pred-1 { color: #c8a84b; background: rgba(200,168,75,0.15); }
      &.pred-x { color: #3b82f6; background: rgba(59,130,246,0.15); }
      &.pred-2 { color: #ef4444; background: rgba(239,68,68,0.15); }
    }
    .pleno-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #8b5cf6;
      margin-left: 2px;
    }

    /* Quick Actions */
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;

      @media (max-width: 480px) { grid-template-columns: 1fr; }
    }
    .quick-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: border-color 180ms, box-shadow 180ms;

      &:hover {
        border-color: #c8a84b;
        box-shadow: 0 2px 8px rgba(200,168,75,0.15);
      }

      > mat-icon:first-child {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #c8a84b;
      }
    }
    .quick-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .quick-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }
    .quick-desc {
      font-size: 0.72rem;
      color: #64748b;
    }
    .quick-arrow {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #94a3b8;
    }

    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;

      @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
    }
    .stat {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.3rem;
    }
    .stat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      margin-bottom: 0.2rem;
      &.gold { color: #c8a84b; }
      &.blue { color: #3b82f6; }
      &.purple { color: #8b5cf6; }
      &.green { color: #10b981; }
    }
    .stat-val {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1;
    }
    .stat-lbl {
      font-size: 0.65rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    /* Charts */
    .charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;

      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }

    /* Card */
    .card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.1rem 1.25rem;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-title {
      margin: 0 0 0.75rem;
      font-size: 0.82rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    }
    .link-btn {
      color: #c8a84b;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0 6px;
      min-width: auto;
      height: 26px;
      line-height: 26px;
    }

    /* Lists */
    .lists {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 1rem;

      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }
    .row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 120ms;
      &:hover { background: #f1f5f9; }
      & + .row { border-top: 1px solid #f1f5f9; }
    }
    .row-rank {
      font-size: 0.72rem;
      font-weight: 800;
      color: #c8a84b;
      min-width: 22px;
    }
    .row-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .row-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row-sub { font-size: 0.68rem; color: #94a3b8; }
    .row-pts { font-size: 0.82rem; font-weight: 700; color: #10b981; }
    .row-right { display: flex; flex-direction: column; align-items: flex-end; }
    .empty {
      text-align: center;
      padding: 1rem 0;
      p { color: #94a3b8; font-size: 0.82rem; margin: 0 0 0.5rem; }
      button {
        font-size: 0.75rem;
        color: #475569;
        border-color: #e2e8f0;
        mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 3px; }
      }
    }

    /* Welcome */
    .welcome {
      text-align: center;
      padding: 4rem 2rem;
      img { width: 48px; height: 48px; object-fit: contain; margin-bottom: 1rem; }
      h2 { margin: 0 0 0.3rem; color: #1e293b; font-size: 1.15rem; font-weight: 700; }
      p { margin: 0; color: #94a3b8; font-size: 0.88rem; }
    }

    /* Skeletons */
    .skeleton-wrap { display: flex; flex-direction: column; gap: 0.75rem; }
    .sk-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
    }
    .sk-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private statsService = inject(StatsService);
  private gamificationService = inject(GamificationService);
  private groupQuinielaService = inject(GroupQuinielaService);
  private comparisonService = inject(ComparisonService);
  private socketService = inject(SocketService);
  private router = inject(Router);

  user = this.authService.currentUser;
  data = signal<DashboardData | null>(null);
  personalStats = signal<PersonalStats | null>(null);
  gamification = signal<UserGamificationData | null>(null);
  activeQuinielas = signal<(GroupQuinielaWithDetails & { has_predicted: boolean })[]>([]);
  selectedQuinielaIndex = signal(0);
  selectedQuiniela = computed(() => {
    const quinielas = this.activeQuinielas();
    const idx = this.selectedQuinielaIndex();
    return quinielas.length > 0 ? quinielas[idx] : null;
  });
  loading = signal(true);
  error = signal(false);
  countdownText = signal('');
  deadlinePassed = signal(false);
  liveMatches = signal<LiveMatch[]>([]);
  visibleLiveMatches = computed(() => this.liveMatches().filter((m) =>
    m.home_score !== null ||
    m.away_score !== null ||
    m.status === 'IN_PLAY' ||
    m.status === 'PAUSED' ||
    m.status === 'FINISHED'
  ));
  hasRenderableLiveMatches = computed(() => this.visibleLiveMatches().length > 0);
  myPredictions = signal<UserPrediction[]>([]);
  groupRanking = signal<GroupMemberLiveScore[]>([]);
  showRanking = signal(false);
  currentUserId = computed(() => this.user()?.id ?? 0);
  hasLiveMatch = computed(() => this.liveMatches().some(m => m.status === 'IN_PLAY'));

  // Members predictions carousel
  membersPredictions = signal<MembersPredictionsData | null>(null);
  selectedMemberIndex = signal(0);
  selectedMember = computed(() => {
    const data = this.membersPredictions();
    const idx = this.selectedMemberIndex();
    return data && data.members.length > 0 ? data.members[idx] : null;
  });
  viewingOtherMember = computed(() => {
    const member = this.selectedMember();
    return member && member.user_id !== this.currentUserId();
  });

  liveAccuracy = computed(() => {
    const matches = this.liveMatches();
    const preds = this.myPredictions();
    if (!preds.length || !matches.length) return null;

    let correct1x2 = 0;
    let correctPleno = 0;
    let totalResolved = 0;

    for (const match of matches) {
      if (!match.sign) continue; // No result yet
      totalResolved++;
      const pred = preds.find(p => p.match_number === match.match_number);
      if (!pred) continue;
      if (pred.prediction_1x2 === match.sign) correct1x2++;
      if (pred.home_score_prediction !== null && pred.away_score_prediction !== null &&
          pred.home_score_prediction === match.home_score && pred.away_score_prediction === match.away_score) {
        correctPleno++;
      }
    }

    return { correct1x2, correctPleno, totalResolved, totalPredictions: preds.length };
  });

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private liveInterval: ReturnType<typeof setInterval> | null = null;
  private socketSubs: Subscription[] = [];

  evolutionChartOptions = computed(() => {
    const stats = this.personalStats();
    if (!stats?.evolution?.length) return null;
    return {
      series: [{ name: 'Puntos', data: stats.evolution.map(e => e.points) }],
      chart: { type: 'area' as const, height: 170, toolbar: { show: false }, background: 'transparent', foreColor: '#94a3b8', fontFamily: 'inherit' },
      xaxis: { categories: stats.evolution.map(e => e.jornadaName.replace('Jornada ', 'J')), labels: { style: { fontSize: '9px' } } },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 95, 100] } },
      stroke: { curve: 'smooth' as const, width: 2.5 },
      colors: ['#c8a84b'],
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { left: 4, right: 4 } },
      dataLabels: { enabled: false },
      tooltip: { theme: 'light' as const },
    };
  });

  accuracyChartOptions = computed(() => {
    const d = this.data();
    if (!d) return null;
    return {
      series: [d.stats.accuracy1x2Percent, d.stats.accuracyPlenoPercent],
      chart: { type: 'radialBar' as const, height: 170, background: 'transparent', foreColor: '#94a3b8', fontFamily: 'inherit' },
      labels: ['1X2', 'Plenos'],
      colors: ['#c8a84b', '#3b82f6'],
      plotOptions: {
        radialBar: {
          hollow: { size: '40%' },
          track: { background: '#f1f5f9' },
          dataLabels: {
            name: { fontSize: '10px', color: '#94a3b8' },
            value: { fontSize: '18px', color: '#1e293b', fontWeight: '700' },
          }
        }
      },
      legend: { show: true, position: 'bottom' as const, fontSize: '11px', labels: { colors: '#64748b' }, markers: { size: 4, offsetX: -2 } },
    };
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.liveInterval) {
      clearInterval(this.liveInterval);
    }
    this.socketSubs.forEach(s => s.unsubscribe());
    this.socketService.disconnect();
  }

  loadDashboard(): void {
    console.log('[DASHBOARD COMPONENT] Loading dashboard...');
    this.loading.set(true);
    this.error.set(false);
    forkJoin({
      dashboard: this.dashboardService.getDashboardData().pipe(
        catchError((error) => {
          console.error('[DASHBOARD COMPONENT] Dashboard API error:', error);
          console.error('[DASHBOARD COMPONENT] Error details:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.error?.error?.message,
            fullError: error?.error
          });
          return of({ success: false, data: null });
        })
      ),
      stats: this.statsService.getPersonalStats().pipe(
        catchError((error) => {
          console.error('[DASHBOARD COMPONENT] Stats API error:', error);
          return of({ success: false, data: null });
        })
      ),
      gamification: this.gamificationService.getMyGamification().pipe(
        catchError((error) => {
          console.error('[DASHBOARD COMPONENT] Gamification API error:', error);
          return of({ success: false, data: null });
        })
      ),
      quinielas: this.groupQuinielaService.getMyActiveQuinielas().pipe(
        catchError((error) => {
          console.error('[DASHBOARD COMPONENT] Quinielas API error:', error);
          return of({ success: false, data: [] });
        })
      ),
    }).subscribe({
      next: ({ dashboard, stats, gamification, quinielas }) => {
        console.log('[DASHBOARD COMPONENT] All requests completed:', {
          dashboardSuccess: dashboard.success,
          statsSuccess: stats.success,
          gamificationSuccess: gamification.success,
          quinielasSuccess: quinielas.success
        });

        if (dashboard.success && dashboard.data) {
          console.log('[DASHBOARD COMPONENT] Dashboard data loaded successfully');
          this.data.set(dashboard.data);
          if (dashboard.data.activeJornada) {
            this.startCountdown(dashboard.data.activeJornada.deadline);
            this.startLiveScores(dashboard.data.activeJornada.id);
          }
        } else {
          console.warn('[DASHBOARD COMPONENT] Dashboard data failed or empty');
        }

        if (stats.success && stats.data) {
          this.personalStats.set(stats.data);
        }
        if (gamification.success && gamification.data) {
          this.gamification.set(gamification.data);
        }
        if (quinielas.success && quinielas.data) {
          this.activeQuinielas.set(quinielas.data);
          // Load members predictions for the first quiniela
          if (quinielas.data.length > 0) {
            this.loadMembersPredictions(quinielas.data[0].id);
          }
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('[DASHBOARD COMPONENT] ForkJoin error:', error);
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  private startCountdown(deadline: string): void {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        this.countdownText.set('Plazo cerrado');
        this.deadlinePassed.set(true);
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        return;
      }

      this.deadlinePassed.set(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        this.countdownText.set(`${days}d ${hours}h`);
      } else if (hours > 0) {
        this.countdownText.set(`${hours}h ${minutes}m`);
      } else {
        this.countdownText.set(`${minutes}m`);
      }
    };

    update();
    this.countdownInterval = setInterval(update, 60000);
  }

  private startLiveScores(jornadaId: number): void {
    if (this.liveInterval) {
      clearInterval(this.liveInterval);
    }

    // Initial load via HTTP for immediate render
    this.loadLiveScores(jornadaId);
    this.loadMyPredictions(jornadaId);
    this.loadGroupRanking();

    // Connect WebSocket and join jornada room
    this.socketService.connect();
    this.socketService.joinJornada(jornadaId);

    // Listen for real-time score updates
    this.socketSubs.push(
      this.socketService.liveScores$.subscribe((update) => {
        if (update.jornadaId === jornadaId) {
          this.liveMatches.set(update.matches);
          if (update.matches.every(m => m.status === 'FINISHED')) {
            this.socketService.leaveJornada(jornadaId);
          }
        }
      }),
      // Fallback: if WS disconnects, poll via HTTP; if reconnects, stop polling
      this.socketService.connected$.subscribe((connected) => {
        if (!connected && !this.liveInterval) {
          this.liveInterval = setInterval(() => this.loadLiveScores(jornadaId), 60000);
        } else if (connected && this.liveInterval) {
          clearInterval(this.liveInterval);
          this.liveInterval = null;
        }
      }),
    );
  }

  private loadMyPredictions(jornadaId: number): void {
    this.dashboardService.getMyPredictions(jornadaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.myPredictions.set(res.data);
        }
      },
      error: () => {}
    });
  }

  private loadLiveScores(jornadaId: number): void {
    this.dashboardService.getLiveScores(jornadaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.liveMatches.set(res.data);
          // Stop polling if all matches are finished
          if (res.data.every(m => m.status === 'FINISHED') && this.liveInterval) {
            clearInterval(this.liveInterval);
            this.liveInterval = null;
          }
        }
      },
      error: () => {} // Silently fail - don't show error for live scores
    });
  }

  getPrediction(matchNumber: number): UserPrediction | undefined {
    return this.myPredictions().find(p => p.match_number === matchNumber);
  }

  getMemberPrediction(matchId: number): MemberPredictionComparison | undefined {
    const data = this.membersPredictions();
    const member = this.selectedMember();
    if (!data || !member) return undefined;
    const match = data.matches.find(m => m.match_id === matchId);
    if (!match) return undefined;
    return match.predictions.find(p => p.user_id === member.user_id);
  }

  prevMember(): void {
    const idx = this.selectedMemberIndex();
    const data = this.membersPredictions();
    if (idx > 0) {
      this.selectedMemberIndex.set(idx - 1);
    } else if (data && data.members.length > 0) {
      this.selectedMemberIndex.set(data.members.length - 1);
    }
  }

  nextMember(): void {
    const idx = this.selectedMemberIndex();
    const data = this.membersPredictions();
    if (data && idx < data.members.length - 1) {
      this.selectedMemberIndex.set(idx + 1);
    } else {
      this.selectedMemberIndex.set(0);
    }
  }

  selectMember(index: number): void {
    this.selectedMemberIndex.set(index);
  }

  goToMyPredictions(): void {
    const data = this.membersPredictions();
    if (!data) return;
    const myIdx = data.members.findIndex(m => m.user_id === this.currentUserId());
    if (myIdx >= 0) {
      this.selectedMemberIndex.set(myIdx);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  prevQuiniela(): void {
    const idx = this.selectedQuinielaIndex();
    if (idx > 0) {
      this.selectedQuinielaIndex.set(idx - 1);
      const quiniela = this.activeQuinielas()[idx - 1];
      if (quiniela) this.loadMembersPredictions(quiniela.id);
    }
  }

  nextQuiniela(): void {
    const idx = this.selectedQuinielaIndex();
    if (idx < this.activeQuinielas().length - 1) {
      this.selectedQuinielaIndex.set(idx + 1);
      const quiniela = this.activeQuinielas()[idx + 1];
      if (quiniela) this.loadMembersPredictions(quiniela.id);
    }
  }

  selectQuiniela(index: number): void {
    this.selectedQuinielaIndex.set(index);
    const quiniela = this.activeQuinielas()[index];
    if (quiniela) this.loadMembersPredictions(quiniela.id);
  }

  toggleRanking(event: Event): void {
    event.stopPropagation();
    const show = !this.showRanking();
    this.showRanking.set(show);
    if (show && this.groupRanking().length === 0) {
      this.loadGroupRanking();
    }
  }

  openComparison(event: Event): void {
    event.stopPropagation();
    const d = this.data();
    if (d?.activeJornada && d.myGroups.length > 0) {
      this.router.navigate(['/groups', d.myGroups[0].id, 'comparison', d.activeJornada.id]);
    }
  }

  private loadGroupRanking(): void {
    const d = this.data();
    if (!d?.activeJornada || !d.myGroups.length) return;

    const groupId = d.myGroups[0].id;
    const jornadaId = d.activeJornada.id;

    this.comparisonService.getGroupJornadaRanking(groupId, jornadaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.groupRanking.set(res.data);
        }
      },
      error: () => {}
    });
  }

  loadMembersPredictions(quinielaId: number): void {
    this.groupQuinielaService.getMembersPredictions(quinielaId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.membersPredictions.set(res.data);
          // Set initial index to current user
          const myIdx = res.data.members.findIndex(m => m.user_id === this.currentUserId());
          this.selectedMemberIndex.set(myIdx >= 0 ? myIdx : 0);
        }
      },
      error: () => {}
    });
  }
}
