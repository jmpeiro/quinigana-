import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <div class="hero-bg"></div>
        <div class="hero-inner">
          <div class="hero-content">
            <div class="hero-badge">
              <mat-icon>star</mat-icon>
              Temporada 2025/26
            </div>
            <h1 class="hero-title">La mejor forma de vivir <span class="gold">La Liga</span></h1>
            <p class="hero-subtitle">
              Crea tu quiniela con amigos, compite en grupos privados, reta a rivales en duelos 1v1
              y demuestra que sabes mas de futbol que nadie.
            </p>
            <div class="hero-cta">
              <a routerLink="/auth/register" mat-flat-button class="btn-primary-lg">
                <mat-icon>rocket_launch</mat-icon>
                Empieza Gratis
              </a>
              <a routerLink="/auth/login" mat-stroked-button class="btn-outline-lg">
                Ya tengo cuenta
              </a>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-number">10K+</span>
                <span class="stat-label">Usuarios</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">500+</span>
                <span class="stat-label">Grupos</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">50K+</span>
                <span class="stat-label">Predicciones</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="phone-mockup">
              <div class="phone-screen">
                <div class="mock-header">
                  <div class="mock-dot"></div>
                  <span>QuiniGana</span>
                </div>
                <div class="mock-card">
                  <div class="mock-match">
                    <span>Real Madrid</span>
                    <span class="mock-vs">vs</span>
                    <span>Barcelona</span>
                  </div>
                  <div class="mock-predictions">
                    <div class="mock-pred active">1</div>
                    <div class="mock-pred">X</div>
                    <div class="mock-pred">2</div>
                  </div>
                </div>
                <div class="mock-card">
                  <div class="mock-match">
                    <span>Atletico</span>
                    <span class="mock-vs">vs</span>
                    <span>Sevilla</span>
                  </div>
                  <div class="mock-predictions">
                    <div class="mock-pred">1</div>
                    <div class="mock-pred active">X</div>
                    <div class="mock-pred">2</div>
                  </div>
                </div>
                <div class="mock-card">
                  <div class="mock-match">
                    <span>Valencia</span>
                    <span class="mock-vs">vs</span>
                    <span>Betis</span>
                  </div>
                  <div class="mock-predictions">
                    <div class="mock-pred">1</div>
                    <div class="mock-pred">X</div>
                    <div class="mock-pred active">2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features" id="features">
        <div class="section-inner">
          <h2 class="section-title">Todo lo que necesitas para competir</h2>
          <p class="section-subtitle">Funcionalidades disenadas para hacer cada jornada emocionante</p>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>groups</mat-icon>
              </div>
              <h3>Grupos Privados</h3>
              <p>Crea grupos con amigos, familia o companeros. Compite en tu propia liga privada con clasificaciones en tiempo real.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>bolt</mat-icon>
              </div>
              <h3>Retos 1v1</h3>
              <p>Desafia a cualquier usuario a un duelo directo. Demuestra quien predice mejor en enfrentamientos cara a cara.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>leaderboard</mat-icon>
              </div>
              <h3>Clasificaciones</h3>
              <p>Rankings en tiempo real por grupo y globales. Sube posiciones cada jornada y conquista el primer puesto.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon-wrap">
                <mat-icon>emoji_events</mat-icon>
              </div>
              <h3>Logros y Rachas</h3>
              <p>Desbloquea insignias, mantiene rachas de aciertos y sube de nivel. Comparte tus logros con la comunidad.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works -->
      <section class="how-it-works">
        <div class="section-inner">
          <h2 class="section-title">Como funciona</h2>
          <p class="section-subtitle">Empieza a jugar en 3 sencillos pasos</p>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <div class="step-icon"><mat-icon>person_add</mat-icon></div>
              <h3>Registrate gratis</h3>
              <p>Crea tu cuenta en segundos con email o Google. Personaliza tu perfil y elige tu avatar.</p>
            </div>
            <div class="step-connector">
              <mat-icon>arrow_forward</mat-icon>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <div class="step-icon"><mat-icon>group_add</mat-icon></div>
              <h3>Unete o crea un grupo</h3>
              <p>Invita a tus amigos o unete a grupos existentes. Cuantos mas, mejor.</p>
            </div>
            <div class="step-connector">
              <mat-icon>arrow_forward</mat-icon>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <div class="step-icon"><mat-icon>sports_soccer</mat-icon></div>
              <h3>Predice y compite</h3>
              <p>Envia tus predicciones antes de cada jornada y acumula puntos. El mejor predictor gana.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="section-inner">
          <div class="cta-card">
            <h2>Unete a miles de aficionados</h2>
            <p>La proxima jornada esta a punto de comenzar. No te quedes fuera.</p>
            <div class="cta-buttons">
              <a routerLink="/auth/register" mat-flat-button class="btn-primary-lg">
                <mat-icon>rocket_launch</mat-icon>
                Crear cuenta gratis
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <img src="logoquinigana.png" alt="QuiniGana" class="footer-logo" />
            <span>QuiniGana</span>
          </div>
          <div class="footer-links">
            <a href="#">Terminos</a>
            <a href="#">Privacidad</a>
            <a href="#">Contacto</a>
          </div>
          <div class="footer-copy">&copy; 2026 QuiniGana. Todos los derechos reservados.</div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .landing-page {
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden;
    }

    /* Navbar */
    .landing-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(200, 168, 75, 0.15);
    }
    .nav-inner {
      max-width: 1200px; margin: 0 auto; padding: 0.75rem 1.5rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .nav-brand { display: flex; align-items: center; gap: 0.5rem; }
    .nav-logo { height: 36px; width: 36px; border-radius: 8px; }
    .nav-title { font-size: 1.25rem; font-weight: 700; color: #c8a84b; }
    .nav-actions { display: flex; gap: 0.75rem; align-items: center; }

    .btn-login {
      color: #c8a84b !important;
      border-color: rgba(200, 168, 75, 0.4) !important;
      font-weight: 600 !important;
    }
    .btn-register {
      background: linear-gradient(135deg, #c8a84b, #b8963e) !important;
      color: #0f172a !important;
      font-weight: 700 !important;
    }

    /* Hero */
    .hero {
      position: relative; padding: 8rem 1.5rem 4rem; min-height: 90vh;
      display: flex; align-items: center;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 30% 20%, rgba(200, 168, 75, 0.08) 0%, transparent 60%),
                  radial-gradient(ellipse at 70% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 60%);
    }
    .hero-inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;
      position: relative; z-index: 1;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: rgba(200, 168, 75, 0.12); border: 1px solid rgba(200, 168, 75, 0.25);
      border-radius: 100px; padding: 0.4rem 1rem; font-size: 0.85rem;
      color: #c8a84b; font-weight: 600; margin-bottom: 1.5rem;
    }
    .hero-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .hero-title {
      font-size: 3.5rem; font-weight: 800; line-height: 1.1;
      color: #f8fafc; margin: 0 0 1.5rem;
    }
    .gold { color: #c8a84b; }
    .hero-subtitle {
      font-size: 1.15rem; color: #94a3b8; line-height: 1.7; margin: 0 0 2rem; max-width: 520px;
    }
    .hero-cta { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }
    .btn-primary-lg {
      background: linear-gradient(135deg, #c8a84b, #b8963e) !important;
      color: #0f172a !important;
      font-weight: 700 !important; font-size: 1rem !important;
      padding: 0.6rem 1.75rem !important; border-radius: 12px !important;
    }
    .btn-outline-lg {
      color: #e2e8f0 !important;
      border-color: rgba(226, 232, 240, 0.3) !important;
      font-weight: 600 !important; font-size: 1rem !important;
      padding: 0.6rem 1.75rem !important; border-radius: 12px !important;
    }

    .hero-stats {
      display: flex; align-items: center; gap: 1.5rem;
      padding: 1.25rem 1.5rem; background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(200, 168, 75, 0.12); border-radius: 16px;
      max-width: fit-content;
    }
    .stat-item { text-align: center; }
    .stat-number { display: block; font-size: 1.5rem; font-weight: 800; color: #c8a84b; }
    .stat-label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-divider { width: 1px; height: 36px; background: rgba(200, 168, 75, 0.2); }

    /* Phone Mockup */
    .hero-visual { display: flex; justify-content: center; }
    .phone-mockup {
      width: 280px; background: #1e293b; border-radius: 28px;
      border: 2px solid rgba(200, 168, 75, 0.2); overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(200, 168, 75, 0.08);
      transform: perspective(800px) rotateY(-5deg) rotateX(2deg);
    }
    .phone-screen { padding: 1rem; }
    .mock-header {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem; margin-bottom: 0.75rem; font-weight: 700;
      color: #c8a84b; font-size: 0.9rem;
    }
    .mock-dot { width: 8px; height: 8px; border-radius: 50%; background: #c8a84b; }
    .mock-card {
      background: rgba(15, 23, 42, 0.6); border-radius: 12px;
      padding: 0.75rem; margin-bottom: 0.5rem;
      border: 1px solid rgba(200, 168, 75, 0.1);
    }
    .mock-match {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.75rem; margin-bottom: 0.5rem; color: #cbd5e1;
    }
    .mock-vs { color: #64748b; font-size: 0.65rem; }
    .mock-predictions { display: flex; gap: 0.4rem; justify-content: center; }
    .mock-pred {
      width: 36px; height: 28px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700;
      background: rgba(100, 116, 139, 0.2); color: #94a3b8;
      border: 1px solid rgba(100, 116, 139, 0.2);
    }
    .mock-pred.active {
      background: rgba(200, 168, 75, 0.2); color: #c8a84b;
      border-color: rgba(200, 168, 75, 0.5);
    }

    /* Features */
    .features {
      padding: 6rem 1.5rem;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }
    .section-inner { max-width: 1200px; margin: 0 auto; }
    .section-title {
      text-align: center; font-size: 2.25rem; font-weight: 800;
      color: #f8fafc; margin: 0 0 0.75rem;
    }
    .section-subtitle {
      text-align: center; font-size: 1.1rem; color: #64748b; margin: 0 0 3.5rem;
    }
    .features-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
    }
    .feature-card {
      background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(200, 168, 75, 0.1);
      border-radius: 16px; padding: 2rem 1.5rem; text-align: center;
      transition: transform 0.3s, border-color 0.3s;
    }
    .feature-card:hover {
      transform: translateY(-4px); border-color: rgba(200, 168, 75, 0.3);
    }
    .feature-icon-wrap {
      width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 1.25rem;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(200, 168, 75, 0.15), rgba(200, 168, 75, 0.05));
      border: 1px solid rgba(200, 168, 75, 0.2);
    }
    .feature-icon-wrap mat-icon { color: #c8a84b; font-size: 28px; width: 28px; height: 28px; }
    .feature-card h3 { color: #f8fafc; font-size: 1.15rem; font-weight: 700; margin: 0 0 0.75rem; }
    .feature-card p { color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin: 0; }

    /* How it Works */
    .how-it-works { padding: 6rem 1.5rem; }
    .steps-grid {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
    }
    .step-card {
      background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(200, 168, 75, 0.1);
      border-radius: 16px; padding: 2rem 1.5rem; text-align: center;
      flex: 1; max-width: 300px; position: relative;
    }
    .step-number {
      position: absolute; top: -16px; left: 50%; transform: translateX(-50%);
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #c8a84b, #b8963e);
      color: #0f172a; font-weight: 800; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: center;
    }
    .step-icon {
      width: 48px; height: 48px; border-radius: 12px; margin: 0.5rem auto 1rem;
      display: flex; align-items: center; justify-content: center;
      background: rgba(200, 168, 75, 0.1);
    }
    .step-icon mat-icon { color: #c8a84b; }
    .step-card h3 { color: #f8fafc; font-size: 1.05rem; font-weight: 700; margin: 0 0 0.5rem; }
    .step-card p { color: #94a3b8; font-size: 0.85rem; line-height: 1.6; margin: 0; }
    .step-connector { color: rgba(200, 168, 75, 0.3); }

    /* CTA */
    .cta-section { padding: 4rem 1.5rem 6rem; }
    .cta-card {
      max-width: 700px; margin: 0 auto; text-align: center;
      background: linear-gradient(135deg, rgba(200, 168, 75, 0.1), rgba(200, 168, 75, 0.03));
      border: 1px solid rgba(200, 168, 75, 0.2); border-radius: 24px;
      padding: 3.5rem 2rem;
    }
    .cta-card h2 { font-size: 2rem; font-weight: 800; color: #f8fafc; margin: 0 0 0.75rem; }
    .cta-card p { color: #94a3b8; font-size: 1.1rem; margin: 0 0 2rem; }
    .cta-buttons { display: flex; justify-content: center; gap: 1rem; }

    /* Footer */
    .landing-footer {
      border-top: 1px solid rgba(200, 168, 75, 0.1);
      padding: 2rem 1.5rem;
    }
    .footer-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
    }
    .footer-brand { display: flex; align-items: center; gap: 0.5rem; color: #c8a84b; font-weight: 700; }
    .footer-logo { height: 28px; width: 28px; border-radius: 6px; }
    .footer-links { display: flex; gap: 1.5rem; }
    .footer-links a { color: #64748b; text-decoration: none; font-size: 0.85rem; transition: color 0.2s; }
    .footer-links a:hover { color: #c8a84b; }
    .footer-copy { color: #475569; font-size: 0.8rem; }

    /* Responsive */
    @media (max-width: 1024px) {
      .hero-inner { grid-template-columns: 1fr; text-align: center; }
      .hero-subtitle { max-width: 100%; }
      .hero-cta { justify-content: center; }
      .hero-stats { margin: 0 auto; }
      .hero-visual { margin-top: 2rem; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 2.25rem; }
      .features-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
      .steps-grid { flex-direction: column; }
      .step-connector { transform: rotate(90deg); }
      .nav-actions { gap: 0.5rem; }
      .btn-login { display: none !important; }
    }
  `],
})
export class LandingComponent {}
