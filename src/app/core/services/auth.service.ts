import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { UserInfo, LoginRequest, RegisterRequest } from '@domain/models/auth/auth.model';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { TokenService } from '@core/services/token.service';
import { Observable, tap, catchError, throwError, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly router = inject(Router);
    private readonly loginUseCase = inject(LoginUseCase);
    private readonly registerUseCase = inject(RegisterUseCase);
    private readonly logoutUseCase = inject(LogoutUseCase);
    private readonly tokenService = inject(TokenService);
    private readonly platformId = inject(PLATFORM_ID);

    // Check if we're in browser environment
    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    // Signals for reactive state management
    private readonly _isAuthenticated = signal<boolean>(false);
    private readonly _user = signal<UserInfo | null>(null);
    private readonly _isLoading = signal<boolean>(false);

    // Computed properties
    readonly isAuthenticated = computed(() => this._isAuthenticated());
    readonly user = computed(() => this._user());
    readonly isLoading = computed(() => this._isLoading());

    constructor() {
        // Inicialización síncrona inmediata
        this.updateAuthState();

        // Listener para sincronización entre pestañas
        if (this.isBrowser) {
            window.addEventListener('storage', () => {
                this.updateAuthState();
            });
        }
    }

    /**
     * Actualiza el estado de autenticación basándose en TokenService
     * Método privado usado para sincronización interna
     */
    private updateAuthState(): void {
        if (!this.isBrowser) {
            return;
        }

        const isAuthenticated = this.tokenService.isAuthenticated();
        const userData = this.tokenService.getUserData();

        this._isAuthenticated.set(isAuthenticated);
        this._user.set(isAuthenticated ? userData : null);
    }

    login(loginData: LoginRequest): Observable<void> {
        this._isLoading.set(true);

        return this.loginUseCase.execute(loginData).pipe(
            tap((response) => {
                // Guardar tokens usando TokenService
                if (loginData.remember_me) {
                    this.tokenService.saveTokens(response.access_token, response.refresh_token);
                    this.tokenService.saveUserData(response.user);
                } else {
                    this.tokenService.saveTokensSession(
                        response.access_token,
                        response.refresh_token
                    );
                    this.tokenService.saveUserDataSession(response.user);
                }

                // Actualizar señales
                this._user.set(response.user);
                this._isAuthenticated.set(true);
                this._isLoading.set(false);

                this.router.navigate(['/dashboard']);
            }),
            catchError((error) => {
                this._isLoading.set(false);
                return throwError(() => error);
            }),
            map(() => void 0)
        );
    }

    register(registerData: RegisterRequest): Observable<void> {
        this._isLoading.set(true);

        return this.registerUseCase.execute(registerData).pipe(
            tap(() => {
                this._isLoading.set(false);
                this.router.navigate(['/auth/login']);
            }),
            catchError((error) => {
                this._isLoading.set(false);
                return throwError(() => error);
            }),
            map(() => void 0)
        );
    }

    logout(): Observable<void> {
        const refreshToken = this.tokenService.getRefreshToken();
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
        this.tokenService.clearTokens();
    }

    updateUserData(updatedUserInfo: Partial<UserInfo>): void {
        const currentUser = this._user();
        if (currentUser) {
            const newUser = { ...currentUser, ...updatedUserInfo };
            this._user.set(newUser);

            // Actualizar también en TokenService
            this.tokenService.saveUserData(newUser);
        }
    }
}
