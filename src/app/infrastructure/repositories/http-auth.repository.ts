import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
import {
    Credentials,
    RegisterData,
    MessageResult,
    ResetPasswordData,
} from '@/app/domain/types/auth';
import { Session } from '@domain/entities/session.entity';
import { User } from '@domain/entities/user.entity';
import { TokenStorePort } from '@domain/ports/token-store.port';
import { ClockPort } from '@domain/ports/clock.port';
import { TOKEN_STORE_PORT, CLOCK_PORT } from '../../di/tokens';
import { AUTH_USER_STORE_PORT } from '../../di/tokens';
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

import type { AuthUserStorePort } from '@domain/ports/auth-user-store.port';
import { UserStatus } from '@/app/domain/enums/user_status.enum';

const API = `${environment.API_URL}/auth`;

@Injectable()
export class HttpAuthRepository implements AuthRepository {
    private http = inject(HttpClient);
    private tokenStore = inject<TokenStorePort>(TOKEN_STORE_PORT);
    private clock = inject<ClockPort>(CLOCK_PORT);
    private userStore = inject<AuthUserStorePort>(AUTH_USER_STORE_PORT);

    getLocalTokens() {
        return this.tokenStore.read() ?? {};
    }
    setLocalTokens(s: {
        accessToken?: string | null;
        accessExp?: number | null;
        refreshToken?: string | null;
    }) {
        this.tokenStore.write(s);
    }

    async login(creds: Credentials): Promise<Session> {
        const body: LoginRequestDTO = {
            identifier: creds.identifier.value,
            password: creds.password,
            remember_me: !!creds.rememberMe,
        };
        const now = this.clock.nowEpochSeconds();
        const dto = await firstValueFrom(this.http.post<LoginResponseDTO>(`${API}/login/`, body));
        this.writeUserSnapshotFromLogin(dto.user);
        const user = AuthMapper.loginUserToEntity(dto.user);
        const tokens = AuthMapper.tokensFromLogin(dto, now);
        this.setLocalTokens({
            accessToken: tokens.accessToken,
            accessExp: tokens.accessExp,
            refreshToken: tokens.refreshToken,
        });
        return AuthMapper.toSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessExpEpochSeconds: tokens.accessExp,
            user,
        });
    }

    async me(): Promise<User> {
        const dto = await firstValueFrom(this.http.get<MeResponseDTO>(`${API}/me/`));
        this.writeUserSnapshotFromMe(dto);
        return AuthMapper.meToEntity(dto);
    }

    async refresh(): Promise<Session> {
        const t = this.getLocalTokens();
        if (!t?.refreshToken) throw new Error('No hay refresh token');
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
    }

    async logout(): Promise<void> {
        const t = this.getLocalTokens();
        try {
            await firstValueFrom(
                this.http.post<LogoutResponseDTO>(`${API}/logout/`, {
                    refresh_token: t?.refreshToken,
                } as LogoutRequestDTO)
            );
        } finally {
            this.tokenStore.clear();
            this.userStore.clear();
        }
    }

    async register(data: RegisterData): Promise<Session> {
        const body: RegisterRequestDTO = {
            username: data.username,
            email: data.email,
            password: data.password,
            password_confirm: data.password_confirm,
            first_name: data.first_name,
            last_name: data.last_name,
            role_id: data.role_id ?? null,
        };
        const now = this.clock.nowEpochSeconds();
        const dto = await firstValueFrom(
            this.http.post<RegisterResponseDTO>(`${API}/register/`, body)
        );
        this.writeUserSnapshotFromLogin(dto.user);
        const user = AuthMapper.registerUserToEntity(dto.user); // misma forma que login
        const tokens = AuthMapper.tokensFromRegister(dto, now); // o tokensFromLogin(dto, now)
        this.setLocalTokens({
            accessToken: tokens.accessToken,
            accessExp: tokens.accessExp,
            refreshToken: tokens.refreshToken,
        });
        return AuthMapper.toSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            accessExpEpochSeconds: tokens.accessExp,
            user,
        });
    }

    async confirmEmail(token: string): Promise<MessageResult> {
        const res = await firstValueFrom(
            this.http.post<ConfirmEmailResponseDTO>(`${API}/confirm-email/`, { token })
        );

        const snap = this.userStore.read();
        if (snap) {
            this.userStore.write({
                ...snap,
                is_email_confirmed: true,
                // si estaba en PENDING, lo normalizamos a ACTIVE tras confirmar
                status:
                    snap.status === UserStatus.PENDING ? UserStatus.ACTIVE : snap.status ?? null,
            });
        }

        // * Nota: la UI debería llamar a facade.confirmEmail(...) y luego refreshProfile()

        return { message: res.message };
    }

    async requestPasswordReset(email: string): Promise<MessageResult> {
        const body: ResetPasswordRequestDTO = { email };
        const dto = await firstValueFrom(
            this.http.post<ResetPasswordResponseDTO>(`${API}/reset-password/`, body)
        );
        return { message: dto.message };
    }

    async confirmPasswordReset(data: ResetPasswordData): Promise<MessageResult> {
        const body: ResetPasswordConfirmRequestDTO = {
            token: data.token,
            new_password: data.newPassword,
            new_password_confirm: data.newPasswordConfirm,
        };
        const dto = await firstValueFrom(
            this.http.post<ResetPasswordConfirmResponseDTO>(`${API}/reset-password/confirm/`, body)
        );
        return { message: dto.message };
    }

    private writeUserSnapshotFromLogin(u: LoginResponseDTO['user']) {
        this.userStore.write({
            id: u.id,
            username: u.username,
            email: u.email,
            role_id: u.role_id,
            role_name: u.role_name,
            is_email_confirmed: u.is_email_confirmed,
            status: (u.status as UserStatus) ?? null,
            updated_at: u.updated_at ?? null,
        });
    }

    private writeUserSnapshotFromMe(dto: MeResponseDTO) {
        const prev = this.userStore.read();
        this.userStore.write({
            id: dto.id,
            username: dto.username,
            email: dto.email,
            role_id: dto.role?.id,
            role_name: dto.role?.name,
            access_level: dto.role?.access_level,
            is_email_confirmed: prev?.is_email_confirmed ?? null,
            status: prev?.status ?? null,
            updated_at: prev?.updated_at ?? null,
        });
    }
}
