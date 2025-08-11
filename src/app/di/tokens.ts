import { InjectionToken } from '@angular/core';
import { NotificationPosition } from '../domain/enums/notification';
import type { AuthRepository } from '../domain/repositories/auth.repository';
import type { TokenStorePort } from '../domain/ports/token-store.port';
import type { ClockPort } from '../domain/ports/clock.port';
import type { AuthUserStorePort } from '../domain/ports/auth-user-store.port';
import type { NotificationPort } from '../domain/ports/notification.port';

export interface NotificationConfig {
    maxVisibleDesktop: number;
    maxVisibleMobile: number;
    dedupeWindowMs: number;
    dedupeMode: 'omit' | 'update';
    defaults: {
        success: { duration: number; dismissible: boolean };
        info: { duration: number; dismissible: boolean };
        warning: { duration: number; dismissible: boolean };
        error: { duration: number; dismissible: boolean };
        position: {
            desktop: NotificationPosition;
            mobile: NotificationPosition;
        };
    };
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
export const TOKEN_STORE_PORT = new InjectionToken<TokenStorePort>('TOKEN_STORE_PORT');
export const CLOCK_PORT = new InjectionToken<ClockPort>('CLOCK_PORT');
export const AUTH_USER_STORE_PORT = new InjectionToken<AuthUserStorePort>('AUTH_USER_STORE_PORT');
export const NOTIFICATION_PORT = new InjectionToken<NotificationPort>('NOTIFICATION_PORT');
export const NOTIFICATION_CONFIG = new InjectionToken<NotificationConfig>('NOTIFICATION_CONFIG');
