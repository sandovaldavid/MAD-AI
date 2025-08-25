import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthFacade } from '@application/facades/auth.facade';
import { Icon } from '@shared/ui/icon/icon';

type VerificationState = 'loading' | 'success' | 'error' | 'invalid-token';

@Component({
  selector: 'app-verify-email',
  imports: [CommonModule, Icon],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authFacade = inject(AuthFacade);

  private _state = signal<VerificationState>('loading');
  private _errorMessage = signal<string | null>(null);

  readonly state = computed(() => this._state());
  readonly errorMessage = computed(() => this._errorMessage());
  readonly isLoading = computed(() => this._state() === 'loading');
  readonly isSuccess = computed(() => this._state() === 'success');
  readonly isError = computed(() => this._state() === 'error');
  readonly isInvalidToken = computed(() => this._state() === 'invalid-token');

  async ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this._state.set('invalid-token');
      return;
    }

    try {
      await this.authFacade.confirmEmail(token, { silent: true });
      this._state.set('success');

      // Redirect to dashboard after a delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 3000);
    } catch (error: any) {
      this._errorMessage.set(error?.message || 'Error al verificar el email');
      this._state.set('error');
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
