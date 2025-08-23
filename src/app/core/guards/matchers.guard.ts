import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthFacade } from '@application/facades/auth.facade';
import { ReturnUrlService } from '../cross-cutting/utilities/return-url.service';

/**
 * Permite la ruta solo si el usuario NO está autenticado.
 * Si ya está autenticado => redirige a /dashboard.
 */
export const guestOnly: CanMatchFn = async (): Promise<boolean | UrlTree> => {
    const auth = inject(AuthFacade);
    const router = inject(Router);

    // Ensure authentication state is properly initialized
    if (!auth.sessionRestoreAttempted()) {
        await auth.initializeAuth();
    }

    // Si ya hay user autenticado -> bloquear acceso a auth pages
    if (auth.isAuthenticated()) {
        console.log('🔒 guestOnly guard: User is authenticated, redirecting to dashboard');
        return router.parseUrl('/dashboard');
    }

    // Usuario invitado: permitir acceso a auth pages
    console.log('✅ guestOnly guard: User is not authenticated, allowing access to auth pages');
    return true;
};

/**
 * Permite la ruta solo si el usuario ESTÁ autenticado.
 * Si no lo está => redirige a /auth/login.
 */
export const authOnly: CanMatchFn = async (): Promise<boolean | UrlTree> => {
    const auth = inject(AuthFacade);
    const router = inject(Router);
    const returnUrlService = inject(ReturnUrlService);

    // Ensure authentication state is properly initialized
    if (!auth.sessionRestoreAttempted()) {
        await auth.initializeAuth();
    }

    // Si el usuario está autenticado -> permitir
    if (auth.isAuthenticated()) {
        console.log('✅ authOnly guard: User is authenticated, allowing access');
        return true;
    }

    // Usuario no autenticado -> redirigir a login
    console.log('🔒 authOnly guard: User is not authenticated, redirecting to login');
    // Guarda la URL actual para retorno después del login
    returnUrlService.set(router.url);
    return router.parseUrl('/auth/login');
};
