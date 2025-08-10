// src/app/core/guards/matchers.ts
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '../../application/facades/auth.facade';
import { AUTH_REPOSITORY } from '../../di/tokens';
import type { AuthRepository } from '../../domain/repositories/auth.repository';

/**
 * Permite la ruta solo si el usuario NO está autenticado.
 * Si ya está autenticado => redirige a /dashboard.
 */
export const guestOnly: CanMatchFn = async (): Promise<boolean | UrlTree> => {
    const auth = inject(AuthFacade);
    const router = inject(Router);
    const repo = inject<AuthRepository>(AUTH_REPOSITORY);

    // Si ya hay user en memoria -> bloquear
    if (auth.user()) return router.parseUrl('/dashboard');

    // Si hay token guardado pero aún no cargamos perfil, intenta cargarlo
    const hasToken = !!repo.getLocalTokens()?.accessToken;
    if (hasToken) {
        try {
            await auth.refreshProfile();
        } catch {}
        if (auth.user()) return router.parseUrl('/dashboard');
    }

    // Usuario invitado: permitir
    return true;
};

/**
 * Permite la ruta solo si el usuario ESTÁ autenticado.
 * Si no lo está => redirige a /auth/login.
 */
export const authOnly: CanMatchFn = async (): Promise<boolean | UrlTree> => {
    const auth = inject(AuthFacade);
    const router = inject(Router);
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
