import { CanActivateFn, CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_REPOSITORY } from '@di/tokens';
import { AuthFacade } from '@application/facades/auth.facade';
import type { AuthRepository } from '@domain/repositories/auth.repository';

const checkAuth = async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);
    const auth = inject(AuthFacade);
    const repo = inject<AuthRepository>(AUTH_REPOSITORY);

    if (auth.user()) return true;

    const hasToken = !!repo.getLocalTokens()?.accessToken;
    if (hasToken) {
        try {
            await auth.refreshProfile();
        } catch {}
        if (auth.user()) return true;
    }
    return router.parseUrl('/auth/login');
};

export const authGuard: CanActivateFn = (_route, _state) => checkAuth();
export const authChildGuard: CanActivateChildFn = (_route, _state) => checkAuth();
