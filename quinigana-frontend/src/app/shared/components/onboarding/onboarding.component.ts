import { Component, signal, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Step {
  title: string;
  subtitle: string;
  icon: string;
}

const STORAGE_KEY = 'quinigana-onboarding-completed';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  template: `
    @if (visible()) {
      <div class="onboarding-overlay" (click)="$event.stopPropagation()">
        <div class="onboarding-card">
          <button class="skip-btn" (click)="complete()">Saltar</button>

          <div class="step-content">
            <div class="step-icon-wrap">
              <mat-icon class="step-icon">{{ steps[currentStep()].icon }}</mat-icon>
            </div>
            <h2>{{ steps[currentStep()].title }}</h2>
            <p>{{ steps[currentStep()].subtitle }}</p>
          </div>

          @if (currentStep() < steps.length - 1) {
            <div class="step-actions">
              <button mat-flat-button class="next-btn" (click)="next()">
                Siguiente
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          } @else {
            <div class="step-actions final">
              <a mat-flat-button class="next-btn" routerLink="/dashboard" (click)="complete()">
                <mat-icon>dashboard</mat-icon>
                Ir al Dashboard
              </a>
              <a mat-stroked-button class="secondary-btn" routerLink="/groups/create" (click)="complete()">
                <mat-icon>group_add</mat-icon>
                Crear Grupo
              </a>
            </div>
          }

          <div class="dots">
            @for (step of steps; track $index) {
              <div class="dot" [class.active]="$index === currentStep()" (click)="goTo($index)"></div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .onboarding-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .onboarding-card {
      background: var(--bg-card, #fff);
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      position: relative;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .skip-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      color: var(--text-muted, #94a3b8);
      cursor: pointer;
      font-size: 0.8rem;
    }
    .skip-btn:hover { color: var(--text-primary, #1e293b); }

    .step-content { padding: 1rem 0 1.5rem; }

    .step-icon-wrap {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(200, 168, 75, 0.15), rgba(200, 168, 75, 0.05));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }

    .step-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #c8a84b;
    }

    h2 {
      font-size: 1.4rem;
      color: var(--text-primary, #1e293b);
      margin: 0 0 0.75rem;
    }

    p {
      color: var(--text-secondary, #64748b);
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0;
    }

    .step-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 1.5rem;
    }
    .step-actions.final { flex-direction: column; align-items: center; }

    .next-btn {
      background: linear-gradient(135deg, #c8a84b, #dfc56a) !important;
      color: #1e293b !important;
      font-weight: 600;
      min-width: 180px;
      height: 44px;
      border-radius: 12px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .secondary-btn {
      border-color: rgba(200, 168, 75, 0.4) !important;
      color: #c8a84b !important;
      min-width: 180px;
      height: 44px;
      border-radius: 12px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .dots {
      display: flex;
      justify-content: center;
      gap: 8px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border-color, #e2e8f0);
      cursor: pointer;
      transition: all 0.2s;
    }
    .dot.active {
      background: #c8a84b;
      width: 24px;
      border-radius: 4px;
    }

    @media (max-width: 480px) {
      .onboarding-card { padding: 1.5rem; }
      h2 { font-size: 1.2rem; }
    }
  `],
})
export class OnboardingComponent {
  completed = output<void>();
  visible = signal(true);
  currentStep = signal(0);

  steps: Step[] = [
    { title: 'Bienvenido a QuiniGana!', subtitle: 'La plataforma para competir con tus predicciones de futbol', icon: 'sports_soccer' },
    { title: 'Crea o unete a un grupo', subtitle: 'Invita a tus amigos y competid juntos cada jornada', icon: 'groups' },
    { title: 'Haz tus predicciones', subtitle: 'Propone resultados, vota las propuestas del grupo y gana puntos', icon: 'emoji_events' },
    { title: 'Reta a tus rivales', subtitle: 'Desafia a otros usuarios en retos 1vs1 y sube en el ranking', icon: 'sports_kabaddi' },
    { title: 'Todo listo!', subtitle: 'Empieza explorando el dashboard o crea tu primer grupo', icon: 'rocket_launch' },
  ];

  static shouldShow(): boolean {
    return !localStorage.getItem(STORAGE_KEY);
  }

  next(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(s => s + 1);
    }
  }

  goTo(index: number): void {
    this.currentStep.set(index);
  }

  complete(): void {
    localStorage.setItem(STORAGE_KEY, 'true');
    this.visible.set(false);
    this.completed.emit();
  }
}
