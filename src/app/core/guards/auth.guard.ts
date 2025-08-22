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

    // Simple technical check - delegate to Application layer
    const isAuthenticated = authFacade.isAuthenticated();
    
    if (isAuthenticated) {
        return true;
    }

    // Attempt to restore session if possible
    try {
        await authFacade.refreshProfile();
        return authFacade.isAuthenticated() 
            ? true 
            : router.parseUrl('/auth/login');
    } catch {
        // Clear auth state on failed refresh to prevent stale errors
        authFacade.clearAuthState();
        return router.parseUrl('/auth/login');
    }
};

export const authGuard: CanActivateFn = (_route, _state) => checkAuth();
export const authChildGuard: CanActivateChildFn = (_route, _state) => checkAuth();
