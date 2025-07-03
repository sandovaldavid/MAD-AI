import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '@domain/repositories/auth.repository';
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
import { AuthApiClient } from '../api/auth.api';

@Injectable({
    providedIn: 'root',
})
export class AuthRepositoryImpl extends AuthRepository {
    private readonly authApiClient = inject(AuthApiClient);

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.authApiClient.login(request);
    }

    register(request: RegisterRequest): Observable<RegisterResponse> {
        return this.authApiClient.register(request);
    }

    logout(request: LogoutRequest): Observable<void> {
        return this.authApiClient.logout(request);
    }

    refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse> {
        return this.authApiClient.refreshToken(request);
    }

    getMe(): Observable<UserInfo> {
        return this.authApiClient.getMe();
    }

    confirmEmail(token: string): Observable<{ access_token: string }> {
        return this.authApiClient.confirmEmail(token);
    }
}
