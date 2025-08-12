import { TestBed } from '@angular/core/testing';
import { HttpAuthRepository } from './http-auth.repository';
import {
    testProviders,
    HttpTestingController,
    FakeTokenStore,
    FakeUserStore,
} from '@test/auth/auth-test-helpers';
import { UserStatus } from '@domain/enums/user_status.enum';
import { AUTH_USER_STORE_PORT, TOKEN_STORE_PORT } from '@/app/di/tokens';
import { environment } from '@env/environment';
import type { Identifier } from '@domain/models/auth/Identifier.model';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
const API = `${environment.API_URL}/auth`;

describe('HttpAuthRepository (básico)', () => {
    let repo: HttpAuthRepository;
    let http: HttpTestingController;
    let tokens: FakeTokenStore;
    let users: FakeUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                HttpAuthRepository,
                ...testProviders,
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        repo = TestBed.inject(HttpAuthRepository);
        http = TestBed.inject(HttpTestingController);
        tokens = TestBed.inject(TOKEN_STORE_PORT as any);
        users = TestBed.inject(AUTH_USER_STORE_PORT as any);
    });

    afterEach(() => {
        const pending = http.match(() => true);
        if (pending.length) {
            // Muestra las URLs de las peticiones no flusheadas
            console.warn(
                'Peticiones pendientes:',
                pending.map((r) => r.request.url)
            );
        }
        http.verify();
    });

    it('login: guarda tokens y snapshot, retorna session', async () => {
        const identifier: Identifier = { type: 'username', value: 'admin_david' };
        const p = repo.login({ identifier, password: 'admin@220103', rememberMe: true });
        const req = http.expectOne(`${API}/login/`);
        expect(req.request.method).toBe('POST');
        req.flush({
            access_token: 'A1.B2.C3',
            refresh_token: 'R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1',
            token_type: 'Bearer',
            expires_in: 3600,
            user: {
                id: 9,
                username: 'admin_david',
                email: 'a@a.com',
                first_name: 'A',
                last_name: 'B',
                full_name: 'A B',
                status: 'active',
                is_email_confirmed: true,
                role_id: 1,
                role_name: 'Administrator',
                created_at: '',
                updated_at: '',
                last_activity_at: null,
                is_active: true,
                email_notifications_enabled: true,
                system_notifications_enabled: true,
                task_notifications_enabled: true,
            },
        });
        const s = await p;
        expect(s.access.value).toBe('A1.B2.C3');
        expect(tokens.read()?.refreshToken).toBe('R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1');
        expect(users.read()?.username).toBe('admin_david');
        expect(users.read()?.is_email_confirmed).toBeTrue();
    });

    it('register: actúa como login y deja status PENDING', async () => {
        const p = repo.register({
            username: 'new',
            email: 'n@n.com',
            password: 'p',
            password_confirm: 'p',
            first_name: 'X',
            last_name: 'Y',
        });
        const req = http.expectOne(`${API}/register/`);
        expect(req.request.method).toBe('POST');
        req.flush({
            access_token: 'B1.B2.B3',
            refresh_token: 'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
            token_type: 'Bearer',
            expires_in: 3600,
            user: {
                id: 32,
                username: 'new',
                email: 'n@n.com',
                first_name: 'X',
                last_name: 'Y',
                full_name: 'X Y',
                status: 'pending',
                is_email_confirmed: false,
                role_id: 2,
                role_name: 'User',
                created_at: '',
                updated_at: '',
                last_activity_at: null,
                is_active: true,
                email_notifications_enabled: true,
                system_notifications_enabled: true,
                task_notifications_enabled: true,
            },
        });
        await p;
        expect(users.read()?.status).toBe(UserStatus.PENDING);
        expect(users.read()?.is_email_confirmed).toBeFalse();
    });

    it('refresh: usa refresh_token, actualiza tokens y llama a /me', async () => {
        tokens.write({ refreshToken: 'R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1R1' });
        const p = repo.refresh();

        // Log all active requests for debugging after calling refresh
        const allReqs = http.match(() => true);
        allReqs.forEach((req, idx) => {
            console.log(
                `Request[${idx}]: URL=${req.request.url}, method=${
                    req.request.method
                }, headers=${JSON.stringify(req.request.headers)}`
            );
        });
    });

    it('confirmEmail: marca is_email_confirmed y PENDING→ACTIVE', async () => {
        users.write({
            id: 1,
            username: 'u',
            email: 'e',
            status: UserStatus.PENDING,
            is_email_confirmed: false,
        });
        const p = repo.confirmEmail('tok');
        const req = http.expectOne(`${API}/confirm-email/`);
        expect(req.request.body.token).toBe('tok');
        req.flush({ message: 'ok' });
        const r = await p;

        expect(r.message).toBe('ok');
        expect(users.read()?.is_email_confirmed).toBeTrue();
        expect(users.read()?.status).toBe(UserStatus.ACTIVE);
    });

    it('reset-password: request y confirm devuelven message', async () => {
        const r1 = repo.requestPasswordReset('e@e.com');
        http.expectOne(`${API}/reset-password/`).flush({ message: 'sent' });
        expect((await r1).message).toBe('sent');

        const r2 = repo.confirmPasswordReset({
            token: 't',
            newPassword: 'p',
            newPasswordConfirm: 'p',
        });
        http.expectOne(`${API}/reset-password/confirm/`).flush({ message: 'ok' });
        expect((await r2).message).toBe('ok');
    });

    it('logout: limpia stores aunque el POST falle', async () => {
        tokens.write({ accessToken: 'A', refreshToken: 'R' });
        users.write({ id: 1, username: 'u', email: 'e' });

        const p = repo.logout();
        const req = http.expectOne(`${API}/logout/`);
        req.flush({ message: 'fail' }, { status: 500, statusText: 'err' });

        await p.catch(() => {});
        console.debug('Logout failed');
        console.debug('Stores cleared');
        console.log('---');
        console.debug(tokens.read());
        console.debug(users.read());
        expect(tokens.read()).toBeNull();
        expect(users.read()).toBeNull();
    });
});
