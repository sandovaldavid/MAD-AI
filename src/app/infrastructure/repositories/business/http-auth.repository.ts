import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@domain/repositories/business/auth.repository';
import {
  CredentialsContract,
  RegisterUserContract,
  MessageResultContract,
  ResetPasswordContract,
} from '@domain/repositories/business/auth.contract';
import { Session } from '@domain/entities/session.entity';
import { User } from '@domain/entities/user.entity';
import { ClockPort } from '@domain/repositories/system/clock.repository';
import { CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { HttpErrorTransformer } from '@infrastructure/errors/http-error-transformer';
import {
  LoginRequestDTO,
  RefreshRequestDTO,
  LogoutRequestDTO,
  LogoutResponseDTO,
  RegisterRequestDTO,
  ResetPasswordRequestDTO,
  ResetPasswordConfirmRequestDTO,
} from '@infrastructure/dtos/auth';
import { AuthMapper } from '@infrastructure/mappers/auth.mapper';
import { AuthApiClient } from '@infrastructure/http/clients/auth-api.client';
import { API_ENDPOINTS_V1 } from '@infrastructure/config/api-endpoints.config';
import { Logger } from '@/app/core/interfaces/logger.interface';

@Injectable()
export class HttpAuthRepository implements AuthRepository {
  private authClient = inject(AuthApiClient);
  private clock = inject<ClockPort>(CLOCK_PORT);
  private errorTransformer = inject(HttpErrorTransformer);
  private authMapper = inject(AuthMapper);

  async login(creds: CredentialsContract): Promise<Session> {
    try {
      const body: LoginRequestDTO = {
        identifier: creds.identifier.value,
        password: creds.password,
        remember_me: !!creds.rememberMe,
      };
      const now = this.clock.nowEpochSeconds();

      const dto = await firstValueFrom(this.authClient.login(body));

      const user = await this.authMapper.loginUserToEntity(dto.user);
      const tokens = this.authMapper.tokensFromLogin(dto, now);
      const session = this.authMapper.toSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpEpochSeconds: tokens.accessExp,
        user,
      });

      return session;
    } catch (httpError) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.LOGIN,
        'LOGIN'
      );
    }
  }

  async me(): Promise<User> {
    try {
      const dto = await firstValueFrom(this.authClient.me());
      const user = await this.authMapper.meToEntity(dto);
      return user;
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.ME,
        'GET_CURRENT_USER'
      );
    }
  }

  async refresh(token_refresh: string): Promise<Session> {
    try {
      const now = this.clock.nowEpochSeconds();
      const dto = await firstValueFrom(
        this.authClient.refresh({
          refresh_token: token_refresh,
        } as RefreshRequestDTO)
      );

      const tokens = this.authMapper.tokensFromRefresh(dto, now);

      const user = await this.me();
      return this.authMapper.toSession({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpEpochSeconds: tokens.accessExp,
        user,
      });
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.REFRESH,
        'REFRESH_TOKEN'
      );
    }
  }

  async logout(refresh_token: string): Promise<MessageResultContract> {
    try {
      const response: LogoutResponseDTO = await firstValueFrom(
        this.authClient.logout({
          refresh_token,
        } as LogoutRequestDTO)
      );
      console.log('Logout response:', response);
      return response;
    } catch (httpError: unknown) {
      console.warn('Logout request failed:', httpError);
      return { message: 'Logout failed' };
    }
  }

  async register(data: RegisterUserContract): Promise<void> {
    try {
      const body: RegisterRequestDTO = {
        username: data.username,
        email: data.email,
        password: data.password,
        password_confirm: data.passwordConfirm,
        first_name: data.firstName,
        last_name: data.lastName,
        role_id: data.roleId ?? null,
      };
      await firstValueFrom(this.authClient.register(body));
      // Registration successful, response not needed for this operation
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.REGISTER,
        'REGISTER_USER'
      );
    }
  }

  async confirmEmail(token: string): Promise<MessageResultContract> {
    try {
      const res = await firstValueFrom(this.authClient.confirmEmail(token));
      return { message: res.message };
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.CONFIRM_EMAIL,
        'CONFIRM_EMAIL'
      );
    }
  }

  async requestPasswordReset(email: string): Promise<MessageResultContract> {
    try {
      const body: ResetPasswordRequestDTO = { email };
      const dto = await firstValueFrom(this.authClient.requestPasswordReset(body));
      return { message: dto.message };
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.RESET_PASSWORD,
        'REQUEST_PASSWORD_RESET'
      );
    }
  }

  async confirmPasswordReset(data: ResetPasswordContract): Promise<MessageResultContract> {
    try {
      const body: ResetPasswordConfirmRequestDTO = {
        token: data.token,
        new_password: data.newPassword,
        new_password_confirm: data.newPasswordConfirm,
      };
      const dto = await firstValueFrom(this.authClient.confirmPasswordReset(body));
      return { message: dto.message };
    } catch (httpError: unknown) {
      throw this.errorTransformer.transformWithDefaults(
        httpError,
        API_ENDPOINTS_V1.AUTH.RESET_PASSWORD_CONFIRM,
        'CONFIRM_PASSWORD_RESET'
      );
    }
  }
}
