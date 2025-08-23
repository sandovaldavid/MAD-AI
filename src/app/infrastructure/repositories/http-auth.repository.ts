import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@domain/repositories/business/auth.repository';
import { ValidationError } from '@domain/errors/validation-error.entity';
import {
    CredentialsContract,
    RegisterUserContract,
    MessageResultContract,
    ResetPasswordContract,
} from '@domain/contracts/auth.contract';
import { Session } from '@domain/entities/session.entity';
import { User } from '@domain/entities/user.entity';
import { TokenStorePort } from '@domain/repositories/session/session-store.repository';
import { ClockPort } from '@domain/repositories/system/clock.repository';
import { TOKEN_STORE_PORT, CLOCK_PORT } from '../../di/tokens';
import { AUTH_USER_STORE_PORT } from '../../di/tokens';
import { InfraErrorToDomainMapper } from '../errors/infra-to-domain.mapper';
import { mapHttpErrorToInfra } from '../errors/http-to-infra.mapper';
import {
    LoginRequestDTO,
    LoginResponseDTO,
    MeResponseDTO,
    RefreshRequestDTO,
    RefreshResponseDTO,
    LogoutRequestDTO,
    LogoutResponseDTO,
    ConfirmEmailResponseDTO,
    RegisterRequestDTO,
    RegisterResponseDTO,
    ResetPasswordRequestDTO,
    ResetPasswordResponseDTO,
    ResetPasswordConfirmRequestDTO,
    ResetPasswordConfirmResponseDTO,
} from '../dtos/auth';
import { AuthMapper } from '../mappers/auth.mapper';
import { environment } from '@env/environment';

import type { AuthUserStorePort } from '@domain/repositories/session/session-store.repository';
import { UserStatus } from '@domain/enums/user-status.enum';

const API = `${environment.API_URL}/auth`;

@Injectable()
export class HttpAuthRepository implements AuthRepository {
    private http = inject(HttpClient);
    private tokenStore = inject<TokenStorePort>(TOKEN_STORE_PORT);
    private clock = inject<ClockPort>(CLOCK_PORT);
    private userStore = inject<AuthUserStorePort>(AUTH_USER_STORE_PORT);
    private errorMapper = inject(InfraErrorToDomainMapper);

    getLocalTokens() {
        return this.tokenStore.read() ?? Promise.resolve(null);
    }
    setLocalTokens(s: {
        accessToken?: string | null;
        accessExp?: number | null;
        refreshToken?: string | null;
    }) {
        this.tokenStore.write(s);
    }

    async login(creds: CredentialsContract): Promise<Session> {
        try {
            const body: LoginRequestDTO = {
                identifier: creds.identifier.value,
                password: creds.password,
                remember_me: !!creds.rememberMe,
            };
            const now = this.clock.nowEpochSeconds();

            console.log('🔥 HttpAuthRepository.login - Making HTTP request with body:', {
                ...body,
                password: '[REDACTED]',
            });

            const dto = await firstValueFrom(
                this.http.post<LoginResponseDTO>(`${API}/login/`, body)
            );

            console.log('🔥 HttpAuthRepository.login - HTTP response received:', {
                access_token_length: dto.access_token?.length,
                refresh_token_length: dto.refresh_token?.length,
                user_id: dto.user?.id,
                user_username: dto.user?.username,
                user_email: dto.user?.email,
                user_first_name: dto.user?.first_name,
                user_last_name: dto.user?.last_name,
                user_role_name: dto.user?.role_name,
            });

            console.log('🔥 HttpAuthRepository.login - About to writeUserSnapshotFromLogin');
            this.writeUserSnapshotFromLogin(dto.user);

            console.log(
                '🔥 HttpAuthRepository.login - About to create User entity via AuthMapper.loginUserToEntity'
            );
            const user = AuthMapper.loginUserToEntity(dto.user);
            console.log('🔥 HttpAuthRepository.login - User entity created successfully:', {
                id: user.id,
                user_properties: Object.keys(user),
                username_type: typeof user.username,
                email_type: typeof user.email,
            });

            console.log(
                '🔥 HttpAuthRepository.login - About to create tokens via AuthMapper.tokensFromLogin'
            );
            const tokens = AuthMapper.tokensFromLogin(dto, now);
            console.log('🔥 HttpAuthRepository.login - Tokens created successfully');

            console.log('🔥 HttpAuthRepository.login - About to setLocalTokens');
            this.setLocalTokens({
                accessToken: tokens.accessToken,
                accessExp: tokens.accessExp,
                refreshToken: tokens.refreshToken,
            });
            console.log('🔥 HttpAuthRepository.login - Local tokens set successfully');

            console.log(
                '🔥 HttpAuthRepository.login - About to create Session via AuthMapper.toSession'
            );
            const session = AuthMapper.toSession({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessExpEpochSeconds: tokens.accessExp,
                user,
            });
            console.log('🔥 HttpAuthRepository.login - Session created successfully');

            return session;
        } catch (httpError) {
            console.error('🔥 HttpAuthRepository.login - ERROR CAUGHT:', httpError);
            console.error('🔥 HttpAuthRepository.login - Error type:', typeof httpError);
            console.error(
                '🔥 HttpAuthRepository.login - Error constructor:',
                (httpError as any)?.constructor?.name
            );
            console.error(
                '🔥 HttpAuthRepository.login - Error message:',
                (httpError as any)?.message
            );
            console.error('🔥 HttpAuthRepository.login - Error stack:', (httpError as any)?.stack);

            // Check if this is already a ValidationError from domain layer (value object creation)
            if (httpError instanceof ValidationError) {
                console.error(
                    '🔥 HttpAuthRepository.login - This is a ValidationError from domain layer, rethrowing as-is'
                );
                throw httpError;
            }

            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            console.error('🔥 HttpAuthRepository.login - Mapped to InfraError:', infraError);
            
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'LOGIN',
                entityType: 'User',
                field: 'credentials',
            });
            console.error('🔥 HttpAuthRepository.login - Transformed domain error:', domainError);
            throw domainError;
        }
    }

    async me(): Promise<User> {
        try {
            const dto = await firstValueFrom(this.http.get<MeResponseDTO>(`${API}/me/`));
            this.writeUserSnapshotFromMe(dto);
            return AuthMapper.meToEntity(dto);
        } catch (httpError: unknown) {
            // Check if this is an authentication error and clear tokens
            const errorStatus = (httpError as any)?.status;
            if (errorStatus === 401 || errorStatus === 403) {
                console.log('🔥 HttpAuthRepository.me - Clearing tokens due to auth error');
                this.tokenStore.clear();
                this.userStore.clear();
            }

            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'GET_CURRENT_USER',
                entityType: 'User',
                field: 'authentication',
            });
            throw domainError;
        }
    }

    async refresh(): Promise<Session> {
        try {
            const t = await this.getLocalTokens();
            if (!t?.refreshToken) {
                // Create a domain error for missing refresh token
                const domainError = this.errorMapper.mapError(
                    { kind: 'AUTH', code: 'REFRESH_TOKEN_INVALID' } as any,
                    {
                        operation: 'REFRESH_TOKEN',
                        entityType: 'Session',
                        field: 'refreshToken',
                    }
                );
                throw domainError;
            }

            const now = this.clock.nowEpochSeconds();
            const dto = await firstValueFrom(
                this.http.post<RefreshResponseDTO>(`${API}/refresh-token/`, {
                    refresh_token: t.refreshToken,
                } as RefreshRequestDTO)
            );

            const tokens = AuthMapper.tokensFromRefresh(dto, now);
            this.setLocalTokens({
                accessToken: tokens.accessToken,
                accessExp: tokens.accessExp,
                refreshToken: tokens.refreshToken,
            });
            const user = await this.me();
            return AuthMapper.toSession({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessExpEpochSeconds: tokens.accessExp,
                user,
            });
        } catch (httpError: unknown) {
            // Clear tokens when refresh fails to prevent retry loops with invalid tokens
            console.log('🔥 HttpAuthRepository.refresh - Clearing tokens due to refresh failure');
            this.tokenStore.clear();
            this.userStore.clear();

            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'REFRESH_TOKEN',
                entityType: 'Session',
                field: 'refreshToken',
            });
            throw domainError;
        }
    }

    async logout(): Promise<void> {
        const t = await this.getLocalTokens();
        try {
            await firstValueFrom(
                this.http.post<LogoutResponseDTO>(`${API}/logout/`, {
                    refresh_token: t?.refreshToken,
                } as LogoutRequestDTO)
            );
        } catch (httpError: unknown) {
            // For logout, we log errors but don't rethrow since clearing tokens is more important
            console.warn('Logout request failed:', httpError);
        } finally {
            this.tokenStore.clear();
            this.userStore.clear();
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
            const dto = await firstValueFrom(
                this.http.post<RegisterResponseDTO>(`${API}/register/`, body)
            );
            // Registration successful - no session or tokens returned
            this.writeUserSnapshotFromLogin(dto.user);
        } catch (httpError: unknown) {
            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'REGISTER_USER',
                entityType: 'User',
                field: 'registration',
            });
            throw domainError;
        }
    }

    async confirmEmail(token: string): Promise<MessageResultContract> {
        try {
            const res = await firstValueFrom(
                this.http.post<ConfirmEmailResponseDTO>(`${API}/confirm-email/`, { token })
            );

            const snap = await this.userStore.read();
            if (snap) {
                this.userStore.write({
                    ...snap,
                    isEmailConfirmed: true,
                    // si estaba en PENDING, lo normalizamos a ACTIVE tras confirmar
                    status:
                        snap.status === UserStatus.PENDING
                            ? UserStatus.ACTIVE
                            : snap.status ?? null,
                });
            }

            // * Nota: la UI debería llamar a facade.confirmEmail(...) y luego refreshProfile()

            return { message: res.message };
        } catch (httpError: unknown) {
            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'CONFIRM_EMAIL',
                entityType: 'User',
                field: 'emailConfirmation',
            });
            throw domainError;
        }
    }

    async requestPasswordReset(email: string): Promise<MessageResultContract> {
        try {
            const body: ResetPasswordRequestDTO = { email };
            const dto = await firstValueFrom(
                this.http.post<ResetPasswordResponseDTO>(`${API}/reset-password/`, body)
            );
            return { message: dto.message };
        } catch (httpError: unknown) {
            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'REQUEST_PASSWORD_RESET',
                entityType: 'User',
                field: 'email',
            });
            throw domainError;
        }
    }

    async confirmPasswordReset(data: ResetPasswordContract): Promise<MessageResultContract> {
        try {
            const body: ResetPasswordConfirmRequestDTO = {
                token: data.token,
                new_password: data.newPassword,
                new_password_confirm: data.newPasswordConfirm,
            };
            const dto = await firstValueFrom(
                this.http.post<ResetPasswordConfirmResponseDTO>(
                    `${API}/reset-password/confirm/`,
                    body
                )
            );
            return { message: dto.message };
        } catch (httpError: unknown) {
            // Transform HTTP error to infrastructure error, then to domain error
            const infraError = mapHttpErrorToInfra(httpError as any);
            const domainError = this.errorMapper.mapError(infraError, {
                operation: 'CONFIRM_PASSWORD_RESET',
                entityType: 'User',
                field: 'passwordReset',
            });
            throw domainError;
        }
    }

    private writeUserSnapshotFromLogin(u: LoginResponseDTO['user']) {
        this.userStore.write({
            id: u.id,
            username: u.username,
            email: u.email,
            roleId: u.role_id,
            roleName: u.role_name,
            isEmailConfirmed: u.is_email_confirmed,
            status: (u.status as UserStatus) ?? null,
            updatedAt: u.updated_at ?? null,
        });
    }

    private async writeUserSnapshotFromMe(dto: MeResponseDTO) {
        const prev = await this.userStore.read();
        this.userStore.write({
            id: dto.id,
            username: dto.username,
            email: dto.email,
            roleId: dto.role?.id,
            roleName: dto.role?.name,
            accessLevel: dto.role?.access_level,
            isEmailConfirmed: prev?.isEmailConfirmed ?? null,
            status: prev?.status ?? null,
            updatedAt: prev?.updatedAt ?? null,
        });
    }
}
