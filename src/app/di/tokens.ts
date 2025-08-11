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

/** Multi‑provider: cada feature aporta { [key]: rawSvg } */
export const ICON_SVG_SET = new InjectionToken<Record<string, string>>('ICON_SVG_SET (multi)', {
    factory: () => ({}),
    providedIn: 'root',
});

/** Opciones globales del registry (fallback/logging) */
export interface IconRegistryOptions {
    missingStrategy?: 'warn' | 'error' | 'silent';
    /** Nombre de ícono de fallback ya registrado (tiene prioridad) */
    fallbackName?: string;
    /** SVG embebido para fallback (si no hay fallbackName) */
    fallbackSvg?: string;
    /** Prefijo por defecto para variantes */
    defaultVariant?: 'outline' | 'filled';
}

export const ICON_REGISTRY_OPTIONS = new InjectionToken<IconRegistryOptions>(
    'ICON_REGISTRY_OPTIONS',
    {
        providedIn: 'root',
        factory: () => ({
            missingStrategy: 'warn',
            defaultVariant: 'outline',
            fallbackSvg:
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ` +
                `fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ` +
                `stroke-width="2"/><path d="M9 9h.01M12 17l4-8-8 4" stroke-width="2" /></svg>`,
        }),
    }
);
