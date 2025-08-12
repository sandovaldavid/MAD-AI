import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthHttpOrchestrator } from './auth-http.orchestrator';
import { testProviders, FakeTokenStore } from '@test/auth/auth-test-helpers';
import { Router } from '@angular/router';
import { ReturnUrlService } from '@core/services/return-url.service';
import { TOKEN_STORE_PORT, AUTH_REPOSITORY } from '@/app/di/tokens';
import { environment } from '@env/environment';

const API = environment.API_URL;

describe('authInterceptor (básico)', () => {
    let http: HttpClient;
    let ctrl: HttpTestingController;
    let tokens: FakeTokenStore;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ...testProviders,
                AuthHttpOrchestrator,
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                ReturnUrlService,
                {
                    provide: AUTH_REPOSITORY,
                    useValue: {
                        getLocalTokens: () => ({ accessToken: 'A1', refreshToken: 'R1' }),
                        refresh: () =>
                            Promise.resolve({
                                access_token: 'A2',
                                refresh_token: 'R2',
                                token_type: 'Bearer',
                                expires_in: 3600,
                            }),
                        // agrega otros métodos si el orchestrator los requiere
                    },
                },
                {
                    provide: Router,
                    useValue: {
                        url: API + '/auth/users/42',
                        navigate: jasmine.createSpy('navigate'),
                        getCurrentNavigation: () => null,
                    },
                },
            ],
        });
        http = TestBed.inject(HttpClient);
        ctrl = TestBed.inject(HttpTestingController);
        tokens = TestBed.inject(TOKEN_STORE_PORT as any);
        router = TestBed.inject(Router);
    });

    afterEach(() => ctrl.verify());
    afterEach(() => {
        const pending = ctrl.match(() => true);
        if (pending.length) {
            // Muestra las URLs de las peticiones no flusheadas
            console.warn(
                'Peticiones pendientes:',
                pending.map((r) => r.request.url)
            );
        }
        ctrl.verify();
    });

    it('reintenta tras 401 haciendo refresh', async () => {
        tokens.write({ accessToken: 'A1', refreshToken: 'R1' });

        const obs = http.get(`${API}/auth/me/`);
        await Promise.resolve();

        // Log all active requests for debugging
        const allReqs = ctrl.match(() => true);
        allReqs.forEach((req, idx) => {
            console.log(
                `Request[${idx}]: URL=${req.request.url}, method=${
                    req.request.method
                }, headers=${JSON.stringify(req.request.headers)}`
            );
        });
    });
});
