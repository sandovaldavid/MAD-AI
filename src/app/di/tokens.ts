import { InjectionToken } from '@angular/core';
import type { AuthRepository } from '../domain/repositories/auth.repository';
import type { TokenStorePort } from '../domain/ports/token-store.port';
import type { ClockPort } from '../domain/ports/clock.port';
import type { AuthUserStorePort } from '../domain/ports/auth-user-store.port';

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
export const TOKEN_STORE_PORT = new InjectionToken<TokenStorePort>('TOKEN_STORE_PORT');
export const CLOCK_PORT = new InjectionToken<ClockPort>('CLOCK_PORT');
export const AUTH_USER_STORE_PORT = new InjectionToken<AuthUserStorePort>('AUTH_USER_STORE_PORT');
