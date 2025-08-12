import { CanMatchFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AUTH_USER_STORE_PORT, AUTH_REPOSITORY } from '@di/tokens';
import { AuthFacade } from '@application/facades/auth.facade';
import type { AuthUserStorePort } from '@domain/ports/auth-user-store.port';
import type { AuthRepository } from '@domain/repositories/auth.repository';
import { UserStatus } from '@domain/enums/user_status.enum';
import { environment } from '@env/environment';

const VERIFY_URL = `${environment.API_URL}/auth/verify-email/`;
const BLOCK_ON_UNKNOWN = false;

const isEmailConfirmed = (u: any): boolean => {
    if (typeof u?.is_email_confirmed === 'boolean') return u.is_email_confirmed;
    if (u?.status) return u.status !== UserStatus.PENDING;
    return true;
};

const checkEmailConfirmed = async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);
    const cache = inject<AuthUserStorePort>(AUTH_USER_STORE_PORT);
    const repo = inject<AuthRepository>(AUTH_REPOSITORY);
    const auth = inject(AuthFacade);

    // 1) Snapshot
    const snap = cache.read();
    if (snap) return isEmailConfirmed(snap) ? true : router.parseUrl(VERIFY_URL);

    // 2) Si hay token, intenta poblar /me una vez
    const hasToken = !!repo.getLocalTokens()?.accessToken;
    if (hasToken) {
        try {
            await auth.refreshProfile();
        } catch {}
        const post = cache.read();
        if (post) return isEmailConfirmed(post) ? true : router.parseUrl(VERIFY_URL);
    }

    // 3) Política cuando es desconocido
    return BLOCK_ON_UNKNOWN ? router.parseUrl(VERIFY_URL) : true;
};

export const emailConfirmedOnly: CanMatchFn = (_route, _segments) => checkEmailConfirmed();
export const emailConfirmedGuard: CanActivateFn = (_route, _state) => checkEmailConfirmed();
