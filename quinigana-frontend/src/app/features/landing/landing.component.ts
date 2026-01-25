import { Component, ChangeDetectionStrategy, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="landing-page">
      <!-- Navbar -->
      <nav class="landing-nav">
        <div class="nav-inner">
          <div class="nav-brand">
            <img src="logoquinigana.png" alt="QuiniGana" class="nav-logo" />
            <span class="nav-title">QuiniGana</span>
          </div>
          <div class="nav-actions">
            <a routerLink="/auth/login" mat-stroked-button class="btn-login">Iniciar Sesion</a>
            <a routerLink="/auth/register" mat-flat-button class="btn-register">Registrarse</a>
          </div>
        </div>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-content">
            <div class="hero-badge">La mejor app de quinielas</div>
            <h1 class="hero-title">Predice, compite y <span class="gold">gana</span> con tus amigos</h1>
            <p class="hero-subtitle">Crea grupos privados, rellena quinielas de La Liga, sube de nivel con logros y demuestra quien es el mejor pronosticador</p>
            <div class="hero-buttons">
              <a routerLink="/auth/register" mat-flat-button class="hero-cta">
                Empezar Gratis
                <mat-icon>arrow_forward</mat-icon>
              </a>
              <a href="#como-funciona" mat-stroked-button class="hero-secondary">
                Ver como funciona
              </a>
            </div>
            <div class="hero-stats">
              <div class="hero-stat">
                <span class="stat-value">15</span>
                <span class="stat-label">partidos/jornada</span>
              </div>
              <div class="hero-stat">
                <span class="stat-value">1X2</span>
                <span class="stat-label">+ plenos</span>
              </div>
              <div class="hero-stat">
                <span class="stat-value">XP</span>
                <span class="stat-label">y badges</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="phone-mockup">
              <div class="phone-screen">
                <div class="mock-header">
                  <span class="mock-title">Dashboard</span>
                  <mat-icon>notifications</mat-icon>
                </div>
                <div class="mock-xp">
                  <span class="xp-level">Nivel 3</span>
                  <div class="xp-bar"><div class="xp-fill" style="width: 65%"></div></div>
                  <span class="xp-text">325 / 500 XP</span>
                </div>
                <div class="mock-card">
                  <span class="mock-badge">Jornada 18</span>
                  <span class="mock-deadline">2h 30m restantes</span>
                </div>
                <div class="mock-matches">
                  <div class="mock-match">
                    <span>Real Madrid</span>
                    <span class="mock-score">2-1</span>
                    <span>Barcelona</span>
                    <span class="mock-pred hit">1</span>
                  </div>
                  <div class="mock-match">
                    <span>Atletico</span>
                    <span class="mock-score">0-0</span>
                    <span>Sevilla</span>
                    <span class="mock-pred hit">X</span>
                  </div>
                  <div class="mock-match">
                    <span>Valencia</span>
                    <span class="mock-score">1-2</span>
                    <span>Betis</span>
                    <span class="mock-pred miss">1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="features">
        <div class="section-inner">
          <h2 class="section-title">Todo lo que necesitas para dominar la quiniela</h2>
          <p class="section-subtitle">Una plataforma completa con todas las herramientas para competir con tus amigos</p>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>group</mat-icon>
              </div>
              <h3>Grupos Privados</h3>
              <p>Crea grupos con amigos, familia o companeros. Invita por enlace o email y gestiona los miembros</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>sports_soccer</mat-icon>
              </div>
              <h3>Quinielas Oficiales</h3>
              <p>15 partidos de La Liga cada jornada. Predice 1X2 y resultados exactos para ganar puntos extra</p>
            </div>
            <div class="feature-card featured">
              <div class="feature-icon-wrap">
                <mat-icon>auto_awesome</mat-icon>
              </div>
              <h3>Sistema de Niveles</h3>
              <p>Gana XP con cada acierto, sube de nivel y desbloquea badges exclusivos por tus logros</p>
              <div class="feature-preview">
                <div class="badge-row">
                  <span class="mini-badge gold"><mat-icon>emoji_events</mat-icon></span>
                  <span class="mini-badge silver"><mat-icon>local_fire_department</mat-icon></span>
                  <span class="mini-badge bronze"><mat-icon>sports_soccer</mat-icon></span>
                </div>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>leaderboard</mat-icon>
              </div>
              <h3>Rankings en Vivo</h3>
              <p>Sigue tu posicion en tiempo real. Ve como subes o bajas con cada resultado</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>compare_arrows</mat-icon>
              </div>
              <h3>Comparar Predicciones</h3>
              <p>Mira que han apostado los demas del grupo y compara tus predicciones partido a partido</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>sports_kabaddi</mat-icon>
              </div>
              <h3>Retos 1vs1</h3>
              <p>Desafia a cualquier usuario a un duelo directo y demuestra quien predice mejor</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>trending_up</mat-icon>
              </div>
              <h3>Estadisticas Detalladas</h3>
              <p>Graficos de evolucion, rachas, porcentajes de acierto y todo tu historial</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>edit_note</mat-icon>
              </div>
              <h3>Propuestas de Grupo</h3>
              <p>Propone cambios de reglas y vota democraticamente con los miembros del grupo</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>notifications_active</mat-icon>
              </div>
              <h3>Notificaciones</h3>
              <p>Recibe alertas de nuevas jornadas, deadlines proximos y resultados de tus predicciones</p>
            </div>
          </div>
        </div>
      </section>

      <!-- App Carousel -->
      <section class="app-carousel" id="como-funciona">
        <div class="section-inner">
          <h2 class="section-title">Asi funciona QuiniGana</h2>
          <p class="section-subtitle">Navega por las pantallas de la app y descubre todas sus funciones</p>

          <div class="carousel-container">
            <button class="carousel-nav prev" (click)="prevSlide()" [disabled]="currentSlide() === 0">
              <mat-icon>chevron_left</mat-icon>
            </button>

            <div class="carousel-content">
              <div class="carousel-phone">
                <div class="phone-frame">
                  @switch (currentSlide()) {
                    @case (0) {
                      <!-- Dashboard -->
                      <div class="screen-content dashboard-screen">
                        <div class="app-header">
                          <span>Dashboard</span>
                          <mat-icon>sync</mat-icon>
                        </div>
                        <div class="xp-section">
                          <div class="level-badge">Nivel 5</div>
                          <div class="xp-progress">
                            <div class="xp-bar-bg">
                              <div class="xp-bar-fill" style="width: 72%"></div>
                            </div>
                            <span>520 / 730 XP</span>
                          </div>
                        </div>
                        <div class="jornada-card">
                          <span class="jornada-tag">Jornada activa</span>
                          <h4>Jornada 21</h4>
                          <div class="jornada-info">
                            <span><mat-icon>stadium</mat-icon>15 partidos</span>
                            <span class="countdown"><mat-icon>schedule</mat-icon>4h 25m</span>
                          </div>
                          <button class="play-btn">Jugar <mat-icon>arrow_forward</mat-icon></button>
                        </div>
                        <div class="quick-stats">
                          <div class="qs-item"><span class="qs-val">847</span><span class="qs-lbl">Puntos</span></div>
                          <div class="qs-item"><span class="qs-val">68%</span><span class="qs-lbl">1X2</span></div>
                          <div class="qs-item"><span class="qs-val">12%</span><span class="qs-lbl">Plenos</span></div>
                        </div>
                      </div>
                    }
                    @case (1) {
                      <!-- Quiniela -->
                      <div class="screen-content quiniela-screen">
                        <div class="app-header">
                          <mat-icon>arrow_back</mat-icon>
                          <span>Jornada 21</span>
                          <span class="deadline-badge">4h 25m</span>
                        </div>
                        <div class="matches-scroll">
                          <div class="match-item">
                            <span class="match-num">1</span>
                            <div class="match-teams">
                              <span>Real Madrid</span>
                              <span>vs</span>
                              <span>Getafe</span>
                            </div>
                            <div class="prediction-btns">
                              <span class="pred-btn active">1</span>
                              <span class="pred-btn">X</span>
                              <span class="pred-btn">2</span>
                            </div>
                          </div>
                          <div class="match-item">
                            <span class="match-num">2</span>
                            <div class="match-teams">
                              <span>Barcelona</span>
                              <span>vs</span>
                              <span>Sevilla</span>
                            </div>
                            <div class="prediction-btns">
                              <span class="pred-btn active">1</span>
                              <span class="pred-btn">X</span>
                              <span class="pred-btn">2</span>
                            </div>
                          </div>
                          <div class="match-item">
                            <span class="match-num">3</span>
                            <div class="match-teams">
                              <span>Atletico</span>
                              <span>vs</span>
                              <span>Valencia</span>
                            </div>
                            <div class="prediction-btns">
                              <span class="pred-btn">1</span>
                              <span class="pred-btn active">X</span>
                              <span class="pred-btn">2</span>
                            </div>
                          </div>
                          <div class="match-item">
                            <span class="match-num">4</span>
                            <div class="match-teams">
                              <span>Betis</span>
                              <span>vs</span>
                              <span>Villarreal</span>
                            </div>
                            <div class="prediction-btns">
                              <span class="pred-btn">1</span>
                              <span class="pred-btn">X</span>
                              <span class="pred-btn active">2</span>
                            </div>
                          </div>
                        </div>
                        <button class="save-btn">Guardar Predicciones</button>
                      </div>
                    }
                    @case (2) {
                      <!-- Live Scores -->
                      <div class="screen-content live-screen">
                        <div class="app-header">
                          <span>Resultados en Vivo</span>
                          <span class="live-indicator"></span>
                        </div>
                        <div class="accuracy-bar">
                          <span class="acc-tag green"><mat-icon>check_circle</mat-icon>8/12</span>
                          <span class="acc-tag purple"><mat-icon>auto_awesome</mat-icon>2</span>
                        </div>
                        <div class="live-matches">
                          <div class="live-match finished correct">
                            <span class="lm-num">1</span>
                            <span class="lm-team">R. Madrid</span>
                            <span class="lm-score">3-1</span>
                            <span class="lm-team">Getafe</span>
                            <span class="lm-sign s1">1</span>
                            <span class="lm-pred hit">1</span>
                          </div>
                          <div class="live-match finished correct">
                            <span class="lm-num">2</span>
                            <span class="lm-team">Barcelona</span>
                            <span class="lm-score">2-0</span>
                            <span class="lm-team">Sevilla</span>
                            <span class="lm-sign s1">1</span>
                            <span class="lm-pred hit">1</span>
                          </div>
                          <div class="live-match live">
                            <span class="lm-num">3</span>
                            <span class="lm-team">Atletico</span>
                            <span class="lm-score live-score">1-1</span>
                            <span class="lm-team">Valencia</span>
                            <span class="lm-sign sx">X</span>
                            <span class="lm-pred hit">X</span>
                          </div>
                          <div class="live-match finished wrong">
                            <span class="lm-num">4</span>
                            <span class="lm-team">Betis</span>
                            <span class="lm-score">2-2</span>
                            <span class="lm-team">Villarreal</span>
                            <span class="lm-sign sx">X</span>
                            <span class="lm-pred miss">2</span>
                          </div>
                        </div>
                      </div>
                    }
                    @case (3) {
                      <!-- Group Ranking -->
                      <div class="screen-content ranking-screen">
                        <div class="app-header">
                          <mat-icon>arrow_back</mat-icon>
                          <span>Ranking - Amigos</span>
                        </div>
                        <div class="ranking-tabs">
                          <span class="tab active">Jornada</span>
                          <span class="tab">Total</span>
                        </div>
                        <div class="ranking-list">
                          <div class="rank-item gold">
                            <span class="rank-pos">1</span>
                            <span class="rank-avatar">JM</span>
                            <div class="rank-info">
                              <span class="rank-name">Juan Martinez</span>
                              <span class="rank-detail">12 aciertos - 2 plenos</span>
                            </div>
                            <span class="rank-pts">38 pts</span>
                          </div>
                          <div class="rank-item silver me">
                            <span class="rank-pos">2</span>
                            <span class="rank-avatar">TU</span>
                            <div class="rank-info">
                              <span class="rank-name">Tu (jose peiro)</span>
                              <span class="rank-detail">11 aciertos - 1 pleno</span>
                            </div>
                            <span class="rank-pts">33 pts</span>
                          </div>
                          <div class="rank-item bronze">
                            <span class="rank-pos">3</span>
                            <span class="rank-avatar">PG</span>
                            <div class="rank-info">
                              <span class="rank-name">Pedro Garcia</span>
                              <span class="rank-detail">10 aciertos - 1 pleno</span>
                            </div>
                            <span class="rank-pts">30 pts</span>
                          </div>
                          <div class="rank-item">
                            <span class="rank-pos">4</span>
                            <span class="rank-avatar">ML</span>
                            <div class="rank-info">
                              <span class="rank-name">Maria Lopez</span>
                              <span class="rank-detail">9 aciertos - 0 plenos</span>
                            </div>
                            <span class="rank-pts">27 pts</span>
                          </div>
                        </div>
                      </div>
                    }
                    @case (4) {
                      <!-- Badges -->
                      <div class="screen-content badges-screen">
                        <div class="app-header">
                          <mat-icon>arrow_back</mat-icon>
                          <span>Mis Logros</span>
                        </div>
                        <div class="badges-xp">
                          <div class="bxp-level">Nivel 5</div>
                          <div class="bxp-bar"><div class="bxp-fill" style="width: 72%"></div></div>
                          <span class="bxp-text">520 / 730 XP</span>
                        </div>
                        <div class="badges-grid">
                          <div class="badge-item earned gold">
                            <mat-icon>auto_awesome</mat-icon>
                            <span>Primer Pleno</span>
                          </div>
                          <div class="badge-item earned silver">
                            <mat-icon>local_fire_department</mat-icon>
                            <span>Racha de 5</span>
                          </div>
                          <div class="badge-item earned bronze">
                            <mat-icon>sports_soccer</mat-icon>
                            <span>Veterano</span>
                          </div>
                          <div class="badge-item earned gold">
                            <mat-icon>emoji_events</mat-icon>
                            <span>500 Puntos</span>
                          </div>
                          <div class="badge-item locked">
                            <mat-icon>military_tech</mat-icon>
                            <span>Campeon</span>
                          </div>
                          <div class="badge-item locked">
                            <mat-icon>diamond</mat-icon>
                            <span>Leyenda</span>
                          </div>
                        </div>
                      </div>
                    }
                    @case (5) {
                      <!-- Compare -->
                      <div class="screen-content compare-screen">
                        <div class="app-header">
                          <span>Comparar Predicciones</span>
                        </div>
                        <div class="compare-selector">
                          <mat-icon>chevron_left</mat-icon>
                          <div class="compare-user">
                            <span class="cu-name">Pedro Garcia</span>
                            <div class="cu-stats">
                              <span><mat-icon>check_circle</mat-icon>8</span>
                              <span><mat-icon>auto_awesome</mat-icon>1</span>
                              <span>24 pts</span>
                            </div>
                          </div>
                          <mat-icon>chevron_right</mat-icon>
                        </div>
                        <div class="compare-dots">
                          <span class="dot"></span>
                          <span class="dot me"></span>
                          <span class="dot active"></span>
                          <span class="dot"></span>
                        </div>
                        <div class="compare-matches">
                          <div class="cm-row hit">
                            <span>1</span>
                            <span>R. Madrid</span>
                            <span class="cm-score">3-1</span>
                            <span>Getafe</span>
                            <span class="cm-pred p1">1</span>
                          </div>
                          <div class="cm-row hit">
                            <span>2</span>
                            <span>Barcelona</span>
                            <span class="cm-score">2-0</span>
                            <span>Sevilla</span>
                            <span class="cm-pred p1">1</span>
                          </div>
                          <div class="cm-row miss">
                            <span>3</span>
                            <span>Atletico</span>
                            <span class="cm-score">1-1</span>
                            <span>Valencia</span>
                            <span class="cm-pred p1">1</span>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>

              <div class="carousel-info">
                <div class="slide-indicator">
                  @for (slide of slides; track slide.id; let i = $index) {
                    <span class="indicator-dot" [class.active]="i === currentSlide()" (click)="goToSlide(i)"></span>
                  }
                </div>
                <h3 class="slide-title">{{ slides[currentSlide()].title }}</h3>
                <p class="slide-desc">{{ slides[currentSlide()].description }}</p>
              </div>
            </div>

            <button class="carousel-nav next" (click)="nextSlide()" [disabled]="currentSlide() === slides.length - 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      </section>

      <!-- Social Proof -->
      <section class="social-proof">
        <div class="section-inner">
          <div class="proof-grid">
            <div class="proof-item">
              <div class="proof-icon"><mat-icon>verified</mat-icon></div>
              <div class="proof-value">100% Gratis</div>
              <div class="proof-label">Sin pagos ni suscripciones</div>
            </div>
            <div class="proof-item">
              <div class="proof-icon"><mat-icon>speed</mat-icon></div>
              <div class="proof-value">Tiempo Real</div>
              <div class="proof-label">Resultados al instante</div>
            </div>
            <div class="proof-item">
              <div class="proof-icon"><mat-icon>devices</mat-icon></div>
              <div class="proof-value">Multiplataforma</div>
              <div class="proof-label">Web y movil</div>
            </div>
            <div class="proof-item">
              <div class="proof-icon"><mat-icon>lock</mat-icon></div>
              <div class="proof-value">Privado</div>
              <div class="proof-label">Solo tu y tu grupo</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Final -->
      <section class="cta-final">
        <div class="section-inner">
          <div class="cta-content">
            <h2>Listo para demostrar que sabes de futbol?</h2>
            <p>Unete a QuiniGana, crea tu grupo y empieza a competir esta misma jornada</p>
            <div class="cta-buttons">
              <a routerLink="/auth/register" mat-flat-button class="hero-cta">
                Crear Cuenta Gratis
                <mat-icon>arrow_forward</mat-icon>
              </a>
            </div>
            <span class="cta-note">Sin tarjeta de credito. Siempre gratis.</span>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <img src="logoquinigana.png" alt="QuiniGana" />
            <span>QuiniGana</span>
          </div>
          <span class="footer-copy">&copy; 2025 QuiniGana. Todos los derechos reservados.</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #080e1a;
    }

    .landing-page {
      min-height: 100vh;
      background: linear-gradient(180deg, #080e1a 0%, #0d0d1a 100%);
      overflow-x: hidden;
    }

    /* Navbar */
    .landing-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: rgba(8, 14, 26, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(200, 168, 75, 0.08);
    }

    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-logo {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .nav-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #c8a84b;
    }

    .nav-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .btn-login {
      color: #c8a84b;
      border-color: rgba(200, 168, 75, 0.4);
      font-size: 0.82rem;
    }

    .btn-register {
      background: linear-gradient(135deg, #c8a84b, #b8943f);
      color: #0d0d1a;
      font-weight: 600;
      font-size: 0.82rem;
    }

    /* Hero */
    .hero {
      padding: 7rem 1.5rem 4rem;
    }

    .hero-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 400px;
      align-items: center;
      gap: 4rem;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 2rem;
      }
    }

    .hero-badge {
      display: inline-block;
      background: rgba(200, 168, 75, 0.1);
      color: #c8a84b;
      padding: 0.4rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
      border: 1px solid rgba(200, 168, 75, 0.2);
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      color: #f5f5f5;
      line-height: 1.15;
      margin: 0 0 1.25rem;

      .gold { color: #c8a84b; }

      @media (max-width: 768px) {
        font-size: 2rem;
      }
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: #9e9e9e;
      margin: 0 0 2rem;
      line-height: 1.7;
      max-width: 520px;

      @media (max-width: 900px) {
        max-width: none;
      }
    }

    .hero-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 2.5rem;

      @media (max-width: 900px) {
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .hero-cta {
      background: linear-gradient(135deg, #c8a84b, #b8943f);
      color: #0d0d1a;
      font-weight: 600;
      font-size: 0.95rem;
      padding: 0 28px;
      height: 48px;
      border-radius: 12px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-left: 6px;
      }
    }

    .hero-secondary {
      color: #c8a84b;
      border-color: rgba(200, 168, 75, 0.4);
      font-size: 0.95rem;
      padding: 0 24px;
      height: 48px;
      border-radius: 12px;
    }

    .hero-stats {
      display: flex;
      gap: 2.5rem;

      @media (max-width: 900px) {
        justify-content: center;
      }
    }

    .hero-stat {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #c8a84b;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #757575;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Phone Mockup */
    .hero-visual {
      @media (max-width: 900px) {
        order: -1;
      }
    }

    .phone-mockup {
      background: #1a1a2e;
      border-radius: 32px;
      padding: 12px;
      border: 3px solid #2a2a40;
      box-shadow: 0 25px 80px rgba(0,0,0,0.5);
      max-width: 280px;
      margin: 0 auto;
    }

    .phone-screen {
      background: #f8f9fb;
      border-radius: 22px;
      padding: 16px;
      min-height: 400px;
    }

    .mock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .mock-title {
        font-weight: 700;
        color: #1e293b;
        font-size: 1.1rem;
      }

      mat-icon {
        color: #64748b;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .mock-xp {
      background: #fff;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
    }

    .xp-level {
      font-weight: 700;
      color: #c8a84b;
      font-size: 0.8rem;
    }

    .xp-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      margin: 6px 0;
      overflow: hidden;
    }

    .xp-fill {
      height: 100%;
      background: linear-gradient(90deg, #c8a84b, #dbb960);
      border-radius: 3px;
    }

    .xp-text {
      font-size: 0.65rem;
      color: #64748b;
    }

    .mock-card {
      background: #fff;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
    }

    .mock-badge {
      background: rgba(200, 168, 75, 0.1);
      color: #c8a84b;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.6rem;
      font-weight: 700;
    }

    .mock-deadline {
      float: right;
      color: #10b981;
      font-size: 0.65rem;
      font-weight: 600;
    }

    .mock-matches {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mock-match {
      background: #fff;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.65rem;
      color: #1e293b;
      border: 1px solid #e2e8f0;

      span:first-child, span:last-of-type:not(.mock-pred) {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      span:first-child { text-align: right; }
    }

    .mock-score {
      font-weight: 700;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .mock-pred {
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.6rem;

      &.hit { color: #10b981; background: rgba(16,185,129,0.1); }
      &.miss { color: #ef4444; background: rgba(239,68,68,0.1); }
    }

    /* Sections */
    .section-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .section-title {
      text-align: center;
      color: #f5f5f5;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.75rem;

      @media (max-width: 768px) {
        font-size: 1.5rem;
      }
    }

    .section-subtitle {
      text-align: center;
      color: #757575;
      font-size: 1rem;
      margin: 0 0 3rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    /* Features */
    .features {
      padding: 5rem 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .feature-card {
      background: #0f1a2e;
      border-radius: 16px;
      padding: 1.75rem 1.5rem;
      border: 1px solid rgba(200, 168, 75, 0.1);
      transition: border-color 200ms, transform 200ms;

      &:hover {
        border-color: rgba(200, 168, 75, 0.3);
        transform: translateY(-4px);
      }

      &.featured {
        border-color: rgba(200, 168, 75, 0.3);
        background: linear-gradient(135deg, rgba(200, 168, 75, 0.08), transparent);
      }

      .feature-icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(200, 168, 75, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          color: #c8a84b;
        }
      }

      h3 {
        color: #f5f5f5;
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
      }

      p {
        color: #9e9e9e;
        font-size: 0.85rem;
        margin: 0;
        line-height: 1.55;
      }
    }

    .feature-preview {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(200, 168, 75, 0.15);
    }

    .badge-row {
      display: flex;
      gap: 0.5rem;
    }

    .mini-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &.gold { background: rgba(255, 193, 7, 0.2); mat-icon { color: #ffc107; } }
      &.silver { background: rgba(158, 158, 158, 0.2); mat-icon { color: #9e9e9e; } }
      &.bronze { background: rgba(205, 127, 50, 0.2); mat-icon { color: #cd7f32; } }
    }

    /* App Carousel */
    .app-carousel {
      padding: 5rem 0;
      background: rgba(15, 26, 46, 0.5);
    }

    .carousel-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      margin-top: 2rem;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .carousel-nav {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(200, 168, 75, 0.1);
      border: 1px solid rgba(200, 168, 75, 0.3);
      color: #c8a84b;
      cursor: pointer;
      transition: all 200ms;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        background: rgba(200, 168, 75, 0.2);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      @media (max-width: 768px) {
        display: none;
      }
    }

    .carousel-content {
      display: flex;
      align-items: center;
      gap: 3rem;

      @media (max-width: 900px) {
        flex-direction: column;
        gap: 2rem;
      }
    }

    .carousel-phone {
      flex-shrink: 0;
    }

    .phone-frame {
      width: 280px;
      min-height: 500px;
      background: #1a1a2e;
      border-radius: 32px;
      padding: 12px;
      border: 3px solid #2a2a40;
      box-shadow: 0 25px 80px rgba(0,0,0,0.5);
    }

    .screen-content {
      background: #f8f9fb;
      border-radius: 22px;
      min-height: 476px;
      overflow: hidden;
    }

    .app-header {
      background: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;

      span {
        font-weight: 700;
        color: #1e293b;
        font-size: 0.95rem;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #64748b;
      }
    }

    /* Dashboard Screen */
    .dashboard-screen {
      .xp-section {
        padding: 12px 16px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
      }

      .level-badge {
        display: inline-block;
        background: linear-gradient(135deg, #c8a84b, #dbb960);
        color: #1e293b;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .xp-progress {
        display: flex;
        align-items: center;
        gap: 10px;

        span {
          font-size: 0.7rem;
          color: #64748b;
          white-space: nowrap;
        }
      }

      .xp-bar-bg {
        flex: 1;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .xp-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #c8a84b, #dbb960);
        border-radius: 4px;
      }

      .jornada-card {
        margin: 12px;
        background: #fff;
        border-radius: 12px;
        padding: 14px;
        border: 1px solid #e2e8f0;
      }

      .jornada-tag {
        display: inline-block;
        background: rgba(200, 168, 75, 0.1);
        color: #c8a84b;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      h4 {
        margin: 6px 0 10px;
        color: #1e293b;
        font-size: 1rem;
      }

      .jornada-info {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          color: #64748b;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }

        .countdown {
          color: #10b981;
          font-weight: 600;
        }
      }

      .play-btn {
        width: 100%;
        background: #1e293b;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      .quick-stats {
        display: flex;
        gap: 8px;
        padding: 0 12px 12px;
      }

      .qs-item {
        flex: 1;
        background: #fff;
        border-radius: 10px;
        padding: 12px 8px;
        text-align: center;
        border: 1px solid #e2e8f0;
      }

      .qs-val {
        display: block;
        font-size: 1.1rem;
        font-weight: 800;
        color: #1e293b;
      }

      .qs-lbl {
        font-size: 0.6rem;
        color: #64748b;
        text-transform: uppercase;
      }
    }

    /* Quiniela Screen */
    .quiniela-screen {
      .app-header {
        mat-icon:first-child {
          cursor: pointer;
        }

        .deadline-badge {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
        }
      }

      .matches-scroll {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 360px;
        overflow-y: auto;
      }

      .match-item {
        background: #fff;
        border-radius: 10px;
        padding: 12px;
        border: 1px solid #e2e8f0;
      }

      .match-num {
        display: inline-block;
        width: 20px;
        height: 20px;
        background: #f1f5f9;
        border-radius: 50%;
        text-align: center;
        line-height: 20px;
        font-size: 0.65rem;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 8px;
      }

      .match-teams {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 0.8rem;
        color: #1e293b;
        font-weight: 600;

        span:nth-child(2) {
          color: #94a3b8;
          font-weight: 400;
          font-size: 0.7rem;
        }
      }

      .prediction-btns {
        display: flex;
        gap: 6px;
      }

      .pred-btn {
        flex: 1;
        text-align: center;
        padding: 8px;
        border-radius: 8px;
        background: #f1f5f9;
        color: #64748b;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 150ms;

        &.active {
          background: #1e293b;
          color: #fff;
        }
      }

      .save-btn {
        margin: 12px;
        width: calc(100% - 24px);
        background: linear-gradient(135deg, #c8a84b, #b8943f);
        color: #1e293b;
        border: none;
        border-radius: 10px;
        padding: 14px;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
      }
    }

    /* Live Screen */
    .live-screen {
      .app-header {
        .live-indicator {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
      }

      .accuracy-bar {
        display: flex;
        gap: 8px;
        padding: 10px 16px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
      }

      .acc-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }

        &.green {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        &.purple {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
      }

      .live-matches {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .live-match {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border-radius: 8px;
        padding: 10px;
        font-size: 0.7rem;
        border: 1px solid #e2e8f0;

        &.live {
          background: #f0fdf4;
        }

        &.correct {
          border-left: 3px solid #10b981;
        }

        &.wrong {
          border-left: 3px solid #ef4444;
        }
      }

      .lm-num {
        width: 18px;
        text-align: center;
        color: #94a3b8;
        font-weight: 700;
      }

      .lm-team {
        flex: 1;
        color: #1e293b;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &:first-of-type { text-align: right; }
      }

      .lm-score {
        font-weight: 800;
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 4px;
        color: #1e293b;

        &.live-score {
          background: #dcfce7;
          color: #166534;
        }
      }

      .lm-sign {
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        min-width: 20px;
        text-align: center;

        &.s1 { color: #c8a84b; background: rgba(200, 168, 75, 0.1); }
        &.sx { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        &.s2 { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
      }

      .lm-pred {
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        min-width: 20px;
        text-align: center;
        border: 1px solid;

        &.hit {
          color: #10b981;
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.08);
        }

        &.miss {
          color: #ef4444;
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }

    /* Ranking Screen */
    .ranking-screen {
      .ranking-tabs {
        display: flex;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
      }

      .tab {
        flex: 1;
        text-align: center;
        padding: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        border-bottom: 2px solid transparent;

        &.active {
          color: #c8a84b;
          border-color: #c8a84b;
        }
      }

      .ranking-list {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .rank-item {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fff;
        border-radius: 10px;
        padding: 12px;
        border: 1px solid #e2e8f0;

        &.me {
          border: 2px solid #c8a84b;
          background: rgba(200, 168, 75, 0.05);
        }
      }

      .rank-pos {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 800;

        .gold & { background: #fef3c7; color: #d97706; }
        .silver & { background: #f3f4f6; color: #6b7280; }
        .bronze & { background: #fed7aa; color: #c2410c; }
      }

      .rank-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
        color: #64748b;
      }

      .rank-info {
        flex: 1;
      }

      .rank-name {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: #1e293b;
      }

      .rank-detail {
        font-size: 0.65rem;
        color: #64748b;
      }

      .rank-pts {
        font-size: 0.9rem;
        font-weight: 800;
        color: #10b981;
      }
    }

    /* Badges Screen */
    .badges-screen {
      .badges-xp {
        padding: 16px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
        text-align: center;
      }

      .bxp-level {
        display: inline-block;
        background: linear-gradient(135deg, #c8a84b, #dbb960);
        color: #1e293b;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .bxp-bar {
        height: 10px;
        background: #e2e8f0;
        border-radius: 5px;
        overflow: hidden;
        margin-bottom: 6px;
      }

      .bxp-fill {
        height: 100%;
        background: linear-gradient(90deg, #c8a84b, #dbb960);
        border-radius: 5px;
      }

      .bxp-text {
        font-size: 0.75rem;
        color: #64748b;
      }

      .badges-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        padding: 16px;
      }

      .badge-item {
        background: #fff;
        border-radius: 12px;
        padding: 14px 8px;
        text-align: center;
        border: 1px solid #e2e8f0;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          margin-bottom: 6px;
        }

        span {
          display: block;
          font-size: 0.6rem;
          color: #64748b;
          font-weight: 500;
        }

        &.earned {
          &.gold {
            border-color: #fbbf24;
            background: rgba(251, 191, 36, 0.08);
            mat-icon { color: #fbbf24; }
          }

          &.silver {
            border-color: #9ca3af;
            background: rgba(156, 163, 175, 0.08);
            mat-icon { color: #9ca3af; }
          }

          &.bronze {
            border-color: #d97706;
            background: rgba(217, 119, 6, 0.08);
            mat-icon { color: #d97706; }
          }
        }

        &.locked {
          opacity: 0.4;
          mat-icon { color: #94a3b8; }
        }
      }
    }

    /* Compare Screen */
    .compare-screen {
      .compare-selector {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;

        mat-icon {
          color: #64748b;
          cursor: pointer;
        }
      }

      .compare-user {
        flex: 1;
        text-align: center;
        background: #f8fafc;
        border-radius: 10px;
        padding: 12px;
        border: 1px solid #e2e8f0;
      }

      .cu-name {
        display: block;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 6px;
      }

      .cu-stats {
        display: flex;
        justify-content: center;
        gap: 12px;
        font-size: 0.7rem;
        color: #64748b;
        font-weight: 600;

        span {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        mat-icon {
          font-size: 12px;
          width: 12px;
          height: 12px;
        }

        span:first-child { color: #c8a84b; }
        span:nth-child(2) { color: #8b5cf6; }
        span:last-child { color: #10b981; }
      }

      .compare-dots {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e2e8f0;

        &.active { background: #c8a84b; transform: scale(1.3); }
        &.me { border: 2px solid #c8a84b; }
      }

      .compare-matches {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .cm-row {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        border-radius: 8px;
        padding: 10px;
        font-size: 0.7rem;
        border: 1px solid #e2e8f0;

        &.hit { background: rgba(16, 185, 129, 0.04); }
        &.miss { background: rgba(239, 68, 68, 0.04); }

        span:first-child {
          width: 18px;
          text-align: center;
          color: #94a3b8;
          font-weight: 700;
        }

        span:nth-child(2), span:nth-child(4) {
          flex: 1;
          color: #1e293b;
          font-weight: 600;
        }

        span:nth-child(2) { text-align: right; }
      }

      .cm-score {
        font-weight: 800;
        background: #f1f5f9;
        padding: 3px 8px;
        border-radius: 4px;
        color: #1e293b;
      }

      .cm-pred {
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 4px;
        min-width: 24px;
        text-align: center;

        &.p1 { color: #c8a84b; background: rgba(200, 168, 75, 0.15); }
        &.px { color: #3b82f6; background: rgba(59, 130, 246, 0.15); }
        &.p2 { color: #ef4444; background: rgba(239, 68, 68, 0.15); }
      }
    }

    /* Carousel Info */
    .carousel-info {
      max-width: 350px;

      @media (max-width: 900px) {
        text-align: center;
        max-width: none;
      }
    }

    .slide-indicator {
      display: flex;
      gap: 8px;
      margin-bottom: 1.5rem;

      @media (max-width: 900px) {
        justify-content: center;
      }
    }

    .indicator-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(200, 168, 75, 0.2);
      cursor: pointer;
      transition: all 200ms;

      &:hover { background: rgba(200, 168, 75, 0.4); }
      &.active { background: #c8a84b; transform: scale(1.2); }
    }

    .slide-title {
      color: #f5f5f5;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.75rem;
    }

    .slide-desc {
      color: #9e9e9e;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
    }

    /* Social Proof */
    .social-proof {
      padding: 4rem 0;
    }

    .proof-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .proof-item {
      text-align: center;
      padding: 1.5rem;
      background: #0f1a2e;
      border-radius: 14px;
      border: 1px solid rgba(200, 168, 75, 0.1);

      .proof-icon {
        margin-bottom: 0.75rem;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: #c8a84b;
        }
      }

      .proof-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #f5f5f5;
        margin-bottom: 0.25rem;
      }

      .proof-label {
        font-size: 0.8rem;
        color: #757575;
      }
    }

    /* CTA Final */
    .cta-final {
      padding: 5rem 0;
      text-align: center;

      .cta-content {
        max-width: 600px;
        margin: 0 auto;
      }

      h2 {
        color: #f5f5f5;
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.75rem;

        @media (max-width: 768px) {
          font-size: 1.5rem;
        }
      }

      p {
        color: #9e9e9e;
        font-size: 1.1rem;
        margin: 0 0 2rem;
      }

      .cta-buttons {
        margin-bottom: 1rem;
      }

      .cta-note {
        display: block;
        font-size: 0.8rem;
        color: #616161;
      }
    }

    /* Footer */
    .landing-footer {
      border-top: 1px solid rgba(200, 168, 75, 0.08);
      padding: 2rem 1.5rem;
    }

    .footer-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;

      @media (max-width: 600px) {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      img {
        width: 24px;
        height: 24px;
      }

      span {
        font-weight: 600;
        color: #c8a84b;
        font-size: 0.9rem;
      }
    }

    .footer-copy {
      font-size: 0.75rem;
      color: #616161;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, OnDestroy {
  currentSlide = signal(0);
  private autoplayInterval: ReturnType<typeof setInterval> | null = null;

  slides = [
    {
      id: 'dashboard',
      title: 'Dashboard Personalizado',
      description: 'Tu centro de control con XP, nivel, jornada activa, estadisticas rapidas y acceso a todas las funciones de un vistazo.'
    },
    {
      id: 'quiniela',
      title: 'Rellena tu Quiniela',
      description: 'Selecciona 1, X o 2 para cada partido. Tambien puedes predecir el resultado exacto para ganar puntos extra con los plenos.'
    },
    {
      id: 'live',
      title: 'Resultados en Vivo',
      description: 'Sigue los partidos en tiempo real y ve como van tus predicciones. Verde si aciertas, rojo si fallas.'
    },
    {
      id: 'ranking',
      title: 'Rankings del Grupo',
      description: 'Compite con los miembros de tu grupo. Ve tu posicion actual y cuantos puntos te separan del primero.'
    },
    {
      id: 'badges',
      title: 'Sistema de Logros',
      description: 'Gana XP con cada acierto y desbloquea badges exclusivos. Sube de nivel y demuestra tu experiencia.'
    },
    {
      id: 'compare',
      title: 'Compara Predicciones',
      description: 'Mira que han apostado los demas del grupo partido a partido. Descubre quien piensa igual que tu.'
    }
  ];

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  prevSlide(): void {
    this.stopAutoplay();
    const current = this.currentSlide();
    if (current > 0) {
      this.currentSlide.set(current - 1);
    }
    this.startAutoplay();
  }

  nextSlide(): void {
    const current = this.currentSlide();
    if (current < this.slides.length - 1) {
      this.currentSlide.set(current + 1);
    } else {
      this.currentSlide.set(0);
    }
  }

  goToSlide(index: number): void {
    this.stopAutoplay();
    this.currentSlide.set(index);
    this.startAutoplay();
  }
}
