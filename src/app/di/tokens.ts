import { InjectionToken } from '@angular/core';
import { UINotificationPosition } from '@shared/components/toast/enums/ui-notification-position.enum';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { SessionStoreRepository } from '@domain/repositories/session/session-store.repository';
import type { ExportRepository } from '@domain/repositories/system/export.repository';
import { AuthUserStoreRepository } from '@domain/repositories/session/auth-user-store.repository';
import { TokenStoreRepository } from '@domain/repositories/session/token-store.repository';
import { SecurityEventRepository } from '@domain/repositories/system/security-event.repository';
import type { Logger } from '@core/interfaces/logger.interface';

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
      desktop: UINotificationPosition;
      mobile: UINotificationPosition;
    };
  };
}

export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
export const USER_REPOSITORY = new InjectionToken<UserRepository>('USER_REPOSITORY');
export const ROLE_REPOSITORY = new InjectionToken<RoleRepository>('ROLE_REPOSITORY');
export const CLOCK_PORT = new InjectionToken<ClockPort>('CLOCK_PORT');
export const NOTIFICATION_PORT = new InjectionToken<NotificationPort>('NOTIFICATION_PORT');
export const NOTIFICATION_CONFIG = new InjectionToken<NotificationConfig>('NOTIFICATION_CONFIG');
export const EXPORT_PORT = new InjectionToken<ExportRepository>('EXPORT_PORT');

// Session Storage Ports
export const AUTH_USER_STORE_PORT = new InjectionToken<AuthUserStoreRepository>(
  'AUTH_USER_STORE_PORT'
);
export const TOKEN_STORE_PORT = new InjectionToken<TokenStoreRepository>('TOKEN_STORE_PORT');
export const SESSION_STORE_PORT = new InjectionToken<SessionStoreRepository>('SESSION_STORE_PORT');

// Security Event Repository Port
export const SECURITY_EVENT_REPOSITORY = new InjectionToken<SecurityEventRepository>(
  'SECURITY_EVENT_REPOSITORY'
);

// Core Services
// Domain Event Bus
export const DOMAIN_EVENT_BUS_REPO = new InjectionToken<any>('DOMAIN_EVENT_BUS_REPO');

// Logger Port
export const LOGGER_PORT = new InjectionToken<Logger>('LOGGER_PORT');

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
