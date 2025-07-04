import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    LogoutRequest,
    UserInfo,
} from '@domain/models/auth/auth.model';
import { ResetPasswordResponse } from '@domain/repositories/auth.repository';

@Injectable({
    providedIn: 'root',
})
export class AuthApiClient {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.API_URL}/auth`;

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.baseUrl}/login/`, request);
    }

    register(request: RegisterRequest): Observable<RegisterResponse> {
        return this.http.post<RegisterResponse>(`${this.baseUrl}/register/`, request);
    }

    logout(request: LogoutRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/logout/`, request);
    }

    refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse> {
        return this.http.post<RefreshTokenResponse>(`${this.baseUrl}/refresh-token/`, request);
    }

    getMe(): Observable<UserInfo> {
        return this.http.get<UserInfo>(`${this.baseUrl}/me/`);
    }

    confirmEmail(token: string): Observable<{ access_token: string }> {
        return this.http.post<{ access_token: string }>(`${this.baseUrl}/confirm-email/`, {
            token,
        });
    }

    requestPasswordReset(email: string): Observable<ResetPasswordResponse> {
        return this.http.post<ResetPasswordResponse>(`${this.baseUrl}/reset-password/`, {
            email,
        });
    }

    confirmPasswordReset(
        token: string,
        newPassword: string,
        newPasswordConfirm: string
    ): Observable<ResetPasswordResponse> {
        return this.http.post<ResetPasswordResponse>(`${this.baseUrl}/reset-password/confirm/`, {
            token,
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm,
        });
    }
}
