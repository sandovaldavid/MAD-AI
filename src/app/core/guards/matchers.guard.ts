import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '@application/facades/auth.facade';
import { TOKEN_STORE_PORT } from '@di/tokens';
import type { TokenStorePort } from '@domain/repositories/session/session-store.repository';
import { ReturnUrlService } from '../cross-cutting/utilities/return-url.service';

/**
 * Permite la ruta solo si el usuario NO está autenticado.
 * Si ya está autenticado => redirige a /dashboard.
 */
export const guestOnly: CanMatchFn = async (): Promise<boolean | UrlTree> => {
    const auth = inject(AuthFacade);
    const router = inject(Router);
    const tokenStore = inject<TokenStorePort>(TOKEN_STORE_PORT);
    const returnUrlService = inject(ReturnUrlService);

    // Si ya hay user en memoria -> bloquear
    if (auth.user()) {
        // Guarda la URL actual para retorno si el usuario está autenticado
        returnUrlService.set(router.url);
        return router.parseUrl('/dashboard');
    }

    // Si hay token guardado pero aún no cargamos perfil, intenta cargarlo
    const tokens = await tokenStore.read();
    const hasToken = !!tokens?.accessToken;
    if (hasToken) {
        try {
            await auth.refreshProfile();
        } catch {
            // Clear auth state on failed refresh to prevent stale errors
            auth.clearAuthState();
        }
        if (auth.user()) {
            returnUrlService.set(router.url);
            return router.parseUrl('/dashboard');
        }
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
    const tokenStore = inject<TokenStorePort>(TOKEN_STORE_PORT);
    const returnUrlService = inject(ReturnUrlService);

    if (auth.user()) return true;

    const tokens = await tokenStore.read();
    const hasToken = !!tokens?.accessToken;
    if (hasToken) {
        try {
            await auth.refreshProfile();
        } catch {
            // Clear auth state on failed refresh to prevent stale errors
            auth.clearAuthState();
        }
        if (auth.user()) return true;
    }

    // Guarda la URL actual para retorno si el usuario no está autenticado
    returnUrlService.set(router.url);
    return router.parseUrl('/auth/login');
};
