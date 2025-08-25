import { CanMatchFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '../../application/facades/auth.facade';
import { environment } from '../../../env/environment';

/**
 * Email Confirmed Guard - Clean Architecture Compliant
 *
 * @description Pure technical guard that verifies email confirmation status
 * without containing business logic. Delegates to Application layer (AuthFacade)
 * for user state verification following Clean Architecture principles.
 *
 * @businessRules
 * - Core layer should not contain business logic
 * - Guards should be purely technical concerns
 * - Delegation to Application layer for user state verification
 *
 * @architecturalNotes
 * - NO direct repository or port injection (violates dependency rule)
 * - NO business logic in Core layer
 * - Uses AuthFacade as single point of user state
 */

const VERIFY_URL = `${environment.API_URL}/auth/verify-email/`;

const checkEmailConfirmed = async (): Promise<boolean | UrlTree> => {
  const router = inject(Router);
  const authFacade = inject(AuthFacade);

  // Ensure we have user data
  if (!authFacade.isAuthenticated()) {
    try {
      await authFacade.refreshProfile();
    } catch {
      return router.parseUrl('/auth/login');
    }
  }

  // Get current user
  const user = authFacade.user();
  if (!user) {
    return router.parseUrl('/auth/login');
  }

  // Simple technical check - delegate business logic to domain
  // Check if email is confirmed using domain entity property
  const isConfirmed = user.isEmailConfirmed ?? true; // Default to true if undefined

  return isConfirmed ? true : router.parseUrl(VERIFY_URL);
};

export const emailConfirmedOnly: CanMatchFn = (_route, _segments) => checkEmailConfirmed();
export const emailConfirmedGuard: CanActivateFn = (_route, _state) => checkEmailConfirmed();
