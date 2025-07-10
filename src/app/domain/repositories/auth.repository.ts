import { Observable } from 'rxjs';
import {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    LogoutRequest,
    UserInfo,
} from '../models/auth/auth.model';

export interface ResetPasswordResponse {
    message: string;
    success: boolean;
}

export abstract class AuthRepository {
    abstract login(request: LoginRequest): Observable<LoginResponse>;
    abstract register(request: RegisterRequest): Observable<RegisterResponse>;
    abstract logout(request: LogoutRequest): Observable<void>;
    abstract refreshToken(request: RefreshTokenRequest): Observable<RefreshTokenResponse>;
    abstract getMe(): Observable<UserInfo>;
    abstract confirmEmail(token: string): Observable<{ access_token: string }>;
    abstract requestPasswordReset(email: string): Observable<ResetPasswordResponse>;
    abstract confirmPasswordReset(
        token: string,
        newPassword: string,
        newPasswordConfirm: string
    ): Observable<ResetPasswordResponse>;
}
