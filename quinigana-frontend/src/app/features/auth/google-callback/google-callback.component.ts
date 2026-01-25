import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: `
    <div class="callback-container">
      <app-loading-spinner />
      <p>Completing sign in...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;

      p {
        color: #9e9e9e;
        font-size: 0.875rem;
      }
    }
  `],
})
export class GoogleCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    const error = this.route.snapshot.queryParams['error'];

    if (error) {
      this.router.navigate(['/auth/login'], { queryParams: { error } });
      return;
    }

    if (token) {
      this.authService.handleGoogleCallback(token);
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
