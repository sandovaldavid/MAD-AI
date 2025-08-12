import { HttpTestingController } from '@angular/common/http/testing';
import { CLOCK_PORT, TOKEN_STORE_PORT, AUTH_USER_STORE_PORT } from '@app/di/tokens';
import type { TokenStorePort } from '@domain/ports/token-store.port';
import type { AuthUserStorePort, AuthUserSnapshot } from '@domain/ports/auth-user-store.port';

export class FakeTokenStore implements TokenStorePort {
    private v: any = null;
    read() {
        return this.v;
    }
    write(s: any) {
        this.v = s;
    }
    clear() {
        this.v = null;
    }
}
export class FakeUserStore implements AuthUserStorePort {
    private v: AuthUserSnapshot | null = null;
    read() {
        return this.v;
    }
    write(s: AuthUserSnapshot | null) {
        this.v = s;
    }
    clear() {
        this.v = null;
    }
}
export class FakeClock {
    private now = 1_700_000_000; // epoch seconds fijo
    nowEpochSeconds() {
        return this.now;
    }
    tick(sec: number) {
        this.now += sec;
    }
}

// testImports eliminado: ahora se usa provideHttpClientTesting en testProviders
export const testProviders = [
    { provide: TOKEN_STORE_PORT, useClass: FakeTokenStore },
    { provide: AUTH_USER_STORE_PORT, useClass: FakeUserStore },
    { provide: CLOCK_PORT, useClass: FakeClock },
];

export { HttpTestingController };
