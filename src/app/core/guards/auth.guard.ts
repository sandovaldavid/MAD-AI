import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '../../application/facades/auth.facade';

/**
 * Auth Guard - Clean Architecture Compliant
 * 
 * @description Pure technical guard that only verifies authentication state
 * without containing business logic. Delegates to Application layer (AuthFacade)
 * for authentication verification following Clean Architecture principles.
 * 
 * @businessRules
 * - Core layer should not contain business logic
 * - Guards should be purely technical concerns
 * - Delegation to Application layer for authentication state
 * 
 * @architecturalNotes
 * - NO direct repository injection (violates dependency rule)
 * - NO business logic in Core layer
 * - Uses AuthFacade as single point of authentication state
 */
const checkAuth = async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);
    const authFacade = inject(AuthFacade);

    // Ensure session restoration has been attempted
    if (!authFacade.sessionRestoreAttempted()) {
        await authFacade.initializeAuth();
    }

    // Simple technical check - delegate to Application layer
    const isAuthenticated = authFacade.isAuthenticated();
    
    if (isAuthenticated) {
        return true;
    }

    // For unauthenticated state, redirect to login
    // The auth interceptor and facade already handle token refresh logic
    authFacade.clearAuthStateCompletely();
    return router.parseUrl('/auth/login');
};

export const authGuard: CanActivateFn = (_route, _state) => checkAuth();
export const authChildGuard: CanActivateChildFn = (_route, _state) => checkAuth();
