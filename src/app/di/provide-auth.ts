import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  AUTH_REPOSITORY,
  TOKEN_STORE_PORT,
  CLOCK_PORT,
  AUTH_USER_STORE_PORT,
  SESSION_STORE_PORT,
} from './tokens';
import { HttpAuthRepository } from '../infrastructure/repositories/http-auth.repository';
import { LocalStorageTokenStore } from '../infrastructure/services/local-storage-token-store.service';
import { LocalStorageAuthUserStore } from '../infrastructure/services/local-storage-auth-user-store.service';
import { LocalStorageSessionStore } from '../infrastructure/services/local-storage-session-store.service';
import { SystemClock } from '../infrastructure/services/system-clock.service';
import { authInterceptor } from '../infrastructure/http/auth.interceptor';

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
    { provide: TOKEN_STORE_PORT, useClass: LocalStorageTokenStore },
    { provide: AUTH_USER_STORE_PORT, useClass: LocalStorageAuthUserStore },
    { provide: SESSION_STORE_PORT, useClass: LocalStorageSessionStore },
    { provide: CLOCK_PORT, useClass: SystemClock },
    provideHttpClient(withInterceptors([authInterceptor])),
  ]);
}
