import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UserInfo, LoginRequest, RegisterRequest } from '@domain/models/auth/auth.model';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { Observable, tap, catchError, throwError, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly router = inject(Router);
    private readonly loginUseCase = inject(LoginUseCase);
    private readonly registerUseCase = inject(RegisterUseCase);
    private readonly logoutUseCase = inject(LogoutUseCase);
    private readonly platformId = inject(PLATFORM_ID);

    // Check if we're in browser environment
    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    // Signals for reactive state management
    private readonly _isAuthenticated = signal<boolean>(false);
    private readonly _user = signal<UserInfo | null>(null);
    private readonly _accessToken = signal<string | null>(null);
    private readonly _refreshToken = signal<string | null>(null);
    private readonly _isLoading = signal<boolean>(false);

    // Computed properties
    readonly isAuthenticated = computed(() => this._isAuthenticated());
    readonly user = computed(() => this._user());
    readonly isLoading = computed(() => this._isLoading());

    constructor() {
        // Defer initialization to avoid SSR issues
        if (this.isBrowser) {
            setTimeout(() => this.initializeAuth(), 0);
        }
    }

    // Public method to manually initialize if needed
    public initialize(): void {
        if (this.isBrowser) {
            this.initializeAuth();
        }
    }

    private initializeAuth(): void {
        // Only initialize auth in browser environment
        if (!this.isBrowser) {
            return;
        }

        const token = this.getStoredToken();
        const refreshToken = this.getStoredRefreshToken();
        const user = this.getStoredUser();

        if (token && refreshToken && user) {
            this._accessToken.set(token);
            this._refreshToken.set(refreshToken);
            this._user.set(user);
            this._isAuthenticated.set(true);
        }
    }

    login(loginData: LoginRequest): Observable<void> {
        this._isLoading.set(true);

        return this.loginUseCase.execute(loginData).pipe(
            tap((response) => {
                this._accessToken.set(response.access_token);
                this._refreshToken.set(response.refresh_token);
                this._user.set(response.user);
                this._isAuthenticated.set(true);

                // Store in localStorage if remember_me is true
                if (loginData.remember_me) {
                    this.storeTokens(response.access_token, response.refresh_token);
                    this.storeUser(response.user);
                } else {
                    // Store in sessionStorage for session-based auth
                    this.storeTokensSession(response.access_token, response.refresh_token);
                    this.storeUserSession(response.user);
                }

                this._isLoading.set(false);
                this.router.navigate(['/dashboard']);
            }),
            catchError((error) => {
                this._isLoading.set(false);
                return throwError(() => error);
            }),
            map(() => void 0) // Convert to void
        );
    }

    register(registerData: RegisterRequest): Observable<void> {
        this._isLoading.set(true);

        return this.registerUseCase.execute(registerData).pipe(
            tap((response) => {
                // User created successfully, now we need to login
                this._isLoading.set(false);
                
                // Navigate to login with a success message or auto-login
                // For now, we'll navigate to login page
                this.router.navigate(['/auth/login'], { 
                    queryParams: { message: 'Registration successful! Please sign in.' }
                });
            }),
            catchError((error) => {
                this._isLoading.set(false);
                return throwError(() => error);
            }),
            map(() => void 0) // Convert to void
        );
    }

    logout(): Observable<void> {
        const refreshToken = this._refreshToken();
        if (!refreshToken) {
            this.clearAuthData();
            this.router.navigate(['/auth/login']);
            return new Observable((observer) => observer.complete());
        }

        this._isLoading.set(true);

        return this.logoutUseCase.execute({ refresh_token: refreshToken }).pipe(
            tap(() => {
                this.clearAuthData();
                this._isLoading.set(false);
                this.router.navigate(['/auth/login']);
            }),
            catchError((error) => {
                // Even if logout fails on server, clear local data
                this.clearAuthData();
                this._isLoading.set(false);
                this.router.navigate(['/auth/login']);
                return throwError(() => error);
            })
        );
    }

    private clearAuthData(): void {
        this._isAuthenticated.set(false);
        this._user.set(null);
        this._accessToken.set(null);
        this._refreshToken.set(null);

        // Clear both localStorage and sessionStorage
        this.clearStoredTokens();
        this.clearStoredUser();
        this.clearSessionTokens();
        this.clearSessionUser();
    }

    // Token management
    getAccessToken(): string | null {
        return this._accessToken();
    }

    private storeTokens(accessToken: string, refreshToken: string): void {
        if (!this.isBrowser) return;
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    private storeTokensSession(accessToken: string, refreshToken: string): void {
        if (!this.isBrowser) return;
        sessionStorage.setItem('access_token', accessToken);
        sessionStorage.setItem('refresh_token', refreshToken);
    }

    private storeUser(user: UserInfo): void {
        if (!this.isBrowser) return;
        localStorage.setItem('user', JSON.stringify(user));
    }

    private storeUserSession(user: UserInfo): void {
        if (!this.isBrowser) return;
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    private getStoredToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }

    private getStoredRefreshToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    }

    private getStoredUser(): UserInfo | null {
        if (!this.isBrowser) return null;
        const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    private clearStoredTokens(): void {
        if (!this.isBrowser) return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    private clearStoredUser(): void {
        if (!this.isBrowser) return;
        localStorage.removeItem('user');
    }

    private clearSessionTokens(): void {
        if (!this.isBrowser) return;
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
    }

    private clearSessionUser(): void {
        if (!this.isBrowser) return;
        sessionStorage.removeItem('user');
    }
}
