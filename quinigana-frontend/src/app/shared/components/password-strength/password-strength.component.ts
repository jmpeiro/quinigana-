import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  template: `
    <div class="strength-container">
      <div class="strength-bars">
        @for (bar of bars(); track $index) {
          <div class="bar" [class]="bar.class"></div>
        }
      </div>
      <span class="strength-label" [style.color]="labelColor()">{{ label() }}</span>
    </div>
  `,
  styles: [`
    .strength-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .strength-bars {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .bar {
      height: 4px;
      flex: 1;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.1);
      transition: background 0.25s ease;

      &.weak { background: #f44336; }
      &.fair { background: #ff9800; }
      &.good { background: #2196f3; }
      &.strong { background: #4caf50; }
    }

    .strength-label {
      font-size: 0.75rem;
      font-weight: 500;
      min-width: 50px;
      text-align: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  password = input('');

  strength = computed(() => {
    const pwd = this.password();
    if (!pwd) return 0;

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    return Math.min(score, 4);
  });

  bars = computed(() => {
    const s = this.strength();
    const classes = ['weak', 'fair', 'good', 'strong'];
    return [0, 1, 2, 3].map((i) => ({
      class: i < s ? classes[s - 1] : '',
    }));
  });

  label = computed(() => {
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[this.strength()];
  });

  labelColor = computed(() => {
    const colors = ['', '#f44336', '#ff9800', '#2196f3', '#4caf50'];
    return colors[this.strength()];
  });
}
