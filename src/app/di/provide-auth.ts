import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  AUTH_REPOSITORY,
  TOKEN_STORE_PORT,
  CLOCK_PORT,
  AUTH_USER_STORE_PORT,
  SESSION_STORE_PORT,
  LOGIN_USECASE_PORT,
  LOGOUT_USECASE_PORT,
  GET_PROFILE_USECASE_PORT,
  REGISTER_USECASE_PORT,
  REFRESH_SESSION_USECASE_PORT,
  CONFIRM_EMAIL_USECASE_PORT,
  REQUEST_PASSWORD_RESET_USECASE_PORT,
  CONFIRM_PASSWORD_RESET_USECASE_PORT,
  UPDATE_USER_PROFILE_USECASE_PORT,
  CHANGE_PASSWORD_USECASE_PORT,
  UPDATE_NOTIFICATION_PREFERENCES_USECASE_PORT,
} from './tokens';
import { HttpAuthRepository } from '@infrastructure/repositories/business/http-auth.repository';
import { LocalStorageTokenStore } from '@infrastructure/services/storage/local-storage-token-store.service';
import { LocalStorageAuthUserStore } from '@infrastructure/services/storage/local-storage-auth-user-store.service';
import { LocalStorageSessionStore } from '@infrastructure/services/storage/local-storage-session-store.service';
import { SystemClock } from '@infrastructure/services/system/system-clock.service';
import { authInterceptor } from '@infrastructure/http/interceptors/auth.interceptor';
import { LoginUseCase } from '@application/use-cases/auth/login.usecase';
import { LogoutUseCase } from '@application/use-cases/auth/logout.usecase';
import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.usecase';
import { RegisterUseCase } from '@application/use-cases/auth/register.usecase';
import { RefreshSessionUseCase } from '@application/use-cases/auth/refresh-session.usecase';
import { ConfirmEmailUseCase } from '@application/use-cases/auth/confirm-email.usecase';
import { RequestPasswordResetUseCase } from '@application/use-cases/auth/request-password-reset.usecase';
import { ConfirmPasswordResetUseCase } from '@application/use-cases/auth/confirm-password-reset.usecase';
import { UpdateUserProfileUseCase } from '@application/use-cases/auth/update-user-profile.usecase';
import { ChangePasswordUseCase } from '@application/use-cases/auth/change-password.usecase';
import { UpdateNotificationPreferencesUseCase } from '@application/use-cases/auth/update-notification-preferences.usecase';

export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
    { provide: TOKEN_STORE_PORT, useClass: LocalStorageTokenStore },
    { provide: AUTH_USER_STORE_PORT, useClass: LocalStorageAuthUserStore },
    { provide: SESSION_STORE_PORT, useClass: LocalStorageSessionStore },
    { provide: CLOCK_PORT, useClass: SystemClock },
    { provide: LOGIN_USECASE_PORT, useClass: LoginUseCase },
    { provide: LOGOUT_USECASE_PORT, useClass: LogoutUseCase },
    { provide: GET_PROFILE_USECASE_PORT, useClass: GetProfileUseCase },
    { provide: REGISTER_USECASE_PORT, useClass: RegisterUseCase },
    { provide: REFRESH_SESSION_USECASE_PORT, useClass: RefreshSessionUseCase },
    { provide: CONFIRM_EMAIL_USECASE_PORT, useClass: ConfirmEmailUseCase },
    { provide: REQUEST_PASSWORD_RESET_USECASE_PORT, useClass: RequestPasswordResetUseCase },
    { provide: CONFIRM_PASSWORD_RESET_USECASE_PORT, useClass: ConfirmPasswordResetUseCase },
    { provide: UPDATE_USER_PROFILE_USECASE_PORT, useClass: UpdateUserProfileUseCase },
    { provide: CHANGE_PASSWORD_USECASE_PORT, useClass: ChangePasswordUseCase },
    { provide: UPDATE_NOTIFICATION_PREFERENCES_USECASE_PORT, useClass: UpdateNotificationPreferencesUseCase },
    provideHttpClient(withInterceptors([authInterceptor])),
  ]);
}
