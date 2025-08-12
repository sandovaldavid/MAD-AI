import { TestBed } from '@angular/core/testing';
import { authOnly } from './matchers.guard';
import { Router } from '@angular/router';
import { AuthFacade } from '@application/facades/auth.facade';
import { AUTH_REPOSITORY } from '@di/tokens';

describe('authOnly (básico)', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: Router,
                    useValue: {
                        parseUrl: (u: string) => ({ url: u }),
                        getCurrentNavigation: () => ({ finalUrl: { toString: () => '/admin' } }),
                    },
                },
                {
                    provide: AuthFacade,
                    useValue: { user: () => null, refreshProfile: async () => {} },
                },
                {
                    provide: AUTH_REPOSITORY,
                    useValue: { getLocalTokens: () => ({ accessToken: null }) },
                },
            ],
        });
    });

    it('sin sesión → UrlTree a /auth/login', async () => {
        const res = await TestBed.runInInjectionContext(() =>
            authOnly({} as any, [{ path: 'admin' }] as any)
        );
        expect((res as any).url).toContain('/auth/login');
    });

    it('con user() → true', async () => {
        TestBed.overrideProvider(AuthFacade, { useValue: { user: () => ({ id: 1 }) } });
        const res = await TestBed.runInInjectionContext(() => authOnly({} as any, [] as any));
        expect(res).toBeTrue();
    });
});
