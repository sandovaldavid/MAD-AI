import type { Notify } from '@application/use-cases/notifications/notify.usecase';
import type { DismissNotification } from '@application/use-cases/notifications/dismiss-notification.usecase';
import type { ClearNotifications } from '@application/use-cases/notifications/clear-notifications.usecase';
import type { UpdateNotification } from '@application/use-cases/notifications/update-notification.usecase';
import type { GetNotifications } from '@application/use-cases/notifications/get-notifications.usecase';
import type { SubscribeToNotifications } from '@application/use-cases/notifications/subscribe-to-notifications.usecase';

export const NOTIFY_USECASE_PORT = new InjectionToken<Notify>('NOTIFY_USECASE_PORT');
export const DISMISS_NOTIFICATION_USECASE_PORT = new InjectionToken<DismissNotification>(
  'DISMISS_NOTIFICATION_USECASE_PORT'
);
export const CLEAR_NOTIFICATIONS_USECASE_PORT = new InjectionToken<ClearNotifications>(
  'CLEAR_NOTIFICATIONS_USECASE_PORT'
);
export const UPDATE_NOTIFICATION_USECASE_PORT = new InjectionToken<UpdateNotification>(
  'UPDATE_NOTIFICATION_USECASE_PORT'
);
export const GET_NOTIFICATIONS_USECASE_PORT = new InjectionToken<GetNotifications>(
  'GET_NOTIFICATIONS_USECASE_PORT'
);
export const SUBSCRIBE_TO_NOTIFICATIONS_USECASE_PORT = new InjectionToken<SubscribeToNotifications>(
  'SUBSCRIBE_TO_NOTIFICATIONS_USECASE_PORT'
);
// Auth Use Cases
import type { LoginUseCase } from '@application/use-cases/auth/login.usecase';
import type { LogoutUseCase } from '@application/use-cases/auth/logout.usecase';
import type { GetProfileUseCase } from '@application/use-cases/auth/get-profile.usecase';
import type { RegisterUseCase } from '@application/use-cases/auth/register.usecase';
import type { RefreshSessionUseCase } from '@application/use-cases/auth/refresh-session.usecase';
import type { ConfirmEmailUseCase } from '@application/use-cases/auth/confirm-email.usecase';
import type { RequestPasswordResetUseCase } from '@application/use-cases/auth/request-password-reset.usecase';
import type { ConfirmPasswordResetUseCase } from '@application/use-cases/auth/confirm-password-reset.usecase';
import type { UpdateUserProfileUseCase } from '@application/use-cases/auth/update-user-profile.usecase';
import type { ChangePasswordUseCase } from '@application/use-cases/auth/change-password.usecase';
import type { UpdateNotificationPreferencesUseCase } from '@application/use-cases/auth/update-notification-preferences.usecase';

export const LOGIN_USECASE_PORT = new InjectionToken<LoginUseCase>('LOGIN_USECASE_PORT');
export const LOGOUT_USECASE_PORT = new InjectionToken<LogoutUseCase>('LOGOUT_USECASE_PORT');
export const GET_PROFILE_USECASE_PORT = new InjectionToken<GetProfileUseCase>(
  'GET_PROFILE_USECASE_PORT'
);
export const REGISTER_USECASE_PORT = new InjectionToken<RegisterUseCase>('REGISTER_USECASE_PORT');
export const REFRESH_SESSION_USECASE_PORT = new InjectionToken<RefreshSessionUseCase>(
  'REFRESH_SESSION_USECASE_PORT'
);
export const CONFIRM_EMAIL_USECASE_PORT = new InjectionToken<ConfirmEmailUseCase>(
  'CONFIRM_EMAIL_USECASE_PORT'
);
export const REQUEST_PASSWORD_RESET_USECASE_PORT = new InjectionToken<RequestPasswordResetUseCase>(
  'REQUEST_PASSWORD_RESET_USECASE_PORT'
);
export const CONFIRM_PASSWORD_RESET_USECASE_PORT = new InjectionToken<ConfirmPasswordResetUseCase>(
  'CONFIRM_PASSWORD_RESET_USECASE_PORT'
);
export const UPDATE_USER_PROFILE_USECASE_PORT = new InjectionToken<UpdateUserProfileUseCase>(
  'UPDATE_USER_PROFILE_USECASE_PORT'
);
export const CHANGE_PASSWORD_USECASE_PORT = new InjectionToken<ChangePasswordUseCase>(
  'CHANGE_PASSWORD_USECASE_PORT'
);
export const UPDATE_NOTIFICATION_PREFERENCES_USECASE_PORT =
  new InjectionToken<UpdateNotificationPreferencesUseCase>(
    'UPDATE_NOTIFICATION_PREFERENCES_USECASE_PORT'
  );
import { InjectionToken } from '@angular/core';
// Role Use Cases
import type { ActivateRole } from '@application/use-cases/roles/activate-role.usecase';
import type { DeactivateRoleUseCase } from '@application/use-cases/roles/deactivate-role.usecase';
import type { AssignRoleToUser } from '@application/use-cases/roles/assign-role-to-user.usecase';
import type { UnassignRoleFromUser } from '@application/use-cases/roles/unassign-role-from-user.usecase';
import type { GetUsersByRole } from '@application/use-cases/roles/get-users-by-role.usecase';
import type { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import type { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import type { CreateRoleUseCase } from '@application/use-cases/roles/create-role.usecase';
import type { UpdateRoleUseCase } from '@application/use-cases/roles/update-role.usecase';
import type { DeleteRoleUseCase } from '@application/use-cases/roles/delete-role.usecase';
import type { GetRoleByNameUseCase } from '@application/use-cases/roles/get-role-by-name.usecase';
import type { RoleExportService } from '@application/services/role-export-report.service';
import { UINotificationPosition } from '@presentation/shared/components/toast/enums/ui-notification-position.enum';
import type { AuthRepository } from '@domain/repositories/business/auth.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
// User Use Cases
import type { ActivateUser } from '@application/use-cases/users/activate-user.usecase';
import type { DeactivateUser } from '@application/use-cases/users/deactivate-user.usecase';
import type { CreateUser } from '@application/use-cases/users/create-user.usecase';
import type { DeleteUser } from '@application/use-cases/users/delete-user.usecase';
import type { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import type { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';
import type { GetUserByEmail } from '@application/use-cases/users/get-user-by-email.usecase';
import type { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';
import type { GetUserByUsernameUseCase } from '@application/use-cases/users/get-user-by-username.usecase';
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

// Role Use Case InjectionTokens
export const ACTIVATE_ROLE_USECASE_PORT = new InjectionToken<ActivateRole>(
  'ACTIVATE_ROLE_USECASE_PORT'
);
export const DEACTIVATE_ROLE_USECASE_PORT = new InjectionToken<DeactivateRoleUseCase>(
  'DEACTIVATE_ROLE_USECASE_PORT'
);
export const ASSIGN_ROLE_TO_USER_USECASE_PORT = new InjectionToken<AssignRoleToUser>(
  'ASSIGN_ROLE_TO_USER_USECASE_PORT'
);
export const UNASSIGN_ROLE_FROM_USER_USECASE_PORT = new InjectionToken<UnassignRoleFromUser>(
  'UNASSIGN_ROLE_FROM_USER_USECASE_PORT'
);
export const GET_USERS_BY_ROLE_USECASE_PORT = new InjectionToken<GetUsersByRole>(
  'GET_USERS_BY_ROLE_USECASE_PORT'
);
export const LIST_ROLES_USECASE_PORT = new InjectionToken<ListRoles>('LIST_ROLES_USECASE_PORT');
export const GET_ROLE_BY_ID_USECASE_PORT = new InjectionToken<GetRoleById>(
  'GET_ROLE_BY_ID_USECASE_PORT'
);
export const CREATE_ROLE_USECASE_PORT = new InjectionToken<CreateRoleUseCase>(
  'CREATE_ROLE_USECASE_PORT'
);
export const UPDATE_ROLE_USECASE_PORT = new InjectionToken<UpdateRoleUseCase>(
  'UPDATE_ROLE_USECASE_PORT'
);
export const DELETE_ROLE_USECASE_PORT = new InjectionToken<DeleteRoleUseCase>(
  'DELETE_ROLE_USECASE_PORT'
);
export const GET_ROLE_BY_NAME_USECASE_PORT = new InjectionToken<GetRoleByNameUseCase>(
  'GET_ROLE_BY_NAME_USECASE_PORT'
);
export const ROLE_EXPORT_SERVICE_PORT = new InjectionToken<RoleExportService>(
  'ROLE_EXPORT_SERVICE_PORT'
);

// User Use Case InjectionTokens
export const ACTIVATE_USER_USECASE_PORT = new InjectionToken<ActivateUser>(
  'ACTIVATE_USER_USECASE_PORT'
);
export const DEACTIVATE_USER_USECASE_PORT = new InjectionToken<DeactivateUser>(
  'DEACTIVATE_USER_USECASE_PORT'
);
export const CREATE_USER_USECASE_PORT = new InjectionToken<CreateUser>('CREATE_USER_USECASE_PORT');
export const DELETE_USER_USECASE_PORT = new InjectionToken<DeleteUser>('DELETE_USER_USECASE_PORT');
export const UPDATE_USER_USECASE_PORT = new InjectionToken<UpdateUserUseCase>(
  'UPDATE_USER_USECASE_PORT'
);
export const LIST_USERS_USECASE_PORT = new InjectionToken<ListUsersUseCase>(
  'LIST_USERS_USECASE_PORT'
);
export const GET_USER_BY_EMAIL_USECASE_PORT = new InjectionToken<GetUserByEmail>(
  'GET_USER_BY_EMAIL_USECASE_PORT'
);
export const GET_USER_BY_ID_USECASE_PORT = new InjectionToken<GetUserById>(
  'GET_USER_BY_ID_USECASE_PORT'
);
export const GET_USER_BY_USERNAME_USECASE_PORT = new InjectionToken<GetUserByUsernameUseCase>(
  'GET_USER_BY_USERNAME_USECASE_PORT'
);

// Session Storage Ports
export const AUTH_USER_STORE_PORT = new InjectionToken<AuthUserStoreRepository>(
  'AUTH_USER_STORE_PORT'
);
export const TOKEN_STORE_PORT = new InjectionToken<TokenStoreRepository>('TOKEN_STORE_PORT');
export const SESSION_STORE_PORT = new InjectionToken<SessionStoreRepository>('SESSION_STORE_PORT');

// Core Services
// Domain Event Bus

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
