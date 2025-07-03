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
    readonly isAuthenticated = computed(() => {
        // Si ya está autenticado, retorna el valor actual
        if (this._isAuthenticated()) {
            return true;
        }

        // Si no está autenticado, verifica si hay tokens almacenados
        if (this.isBrowser) {
            const token = this.getStoredToken();
            const user = this.getStoredUser();

            // Si hay tokens, actualiza el estado de autenticación
            if (token && user) {
                this._accessToken.set(token);
                this._user.set(user);
                this._isAuthenticated.set(true);
                return true;
            }
        }

        return false;
    });
    readonly user = computed(() => this._user());
    readonly isLoading = computed(() => this._isLoading());

    constructor() {
        // Inicializamos inmediatamente si estamos en el navegador
        if (this.isBrowser) {
            // Usando un timeout de 0 para asegurar que se ejecuta después de la inicialización del componente
            // pero aún así lo más pronto posible en el ciclo de eventos de JavaScript
            setTimeout(() => this.initializeAuth(), 0);

            // También añadimos un listener para el evento storage para sincronizar entre pestañas
            window.addEventListener('storage', (event) => {
                // Si los tokens cambian en otra pestaña, actualizamos el estado
                if (
                    event.key === 'access_token' ||
                    event.key === 'refresh_token' ||
                    event.key === 'user'
                ) {
                    this.initializeAuth();
                }
            });
        }
    }

    // Public method to manually initialize if needed
    public initialize(): void {
        if (this.isBrowser) {
            this.initializeAuth();
        }
    }

    private initializeAuth(): void {
        // Solo inicializamos en entorno de navegador
        if (!this.isBrowser) {
            return;
        }

        // Intentamos recuperar tokens y usuario del almacenamiento
        const token = this.getStoredToken();
        const refreshToken = this.getStoredRefreshToken();
        const user = this.getStoredUser();

        // Si tenemos los datos necesarios para la autenticación
        if (token && user) {
            console.log('Initializing auth from storage');
            // Actualizamos el estado de autenticación
            this._accessToken.set(token);
            if (refreshToken) {
                this._refreshToken.set(refreshToken);
            }
            this._user.set(user);
            this._isAuthenticated.set(true);
        } else {
            // Si no hay datos de autenticación válidos, aseguramos que el estado sea no autenticado
            this._isAuthenticated.set(false);
            this._user.set(null);
            this._accessToken.set(null);
            this._refreshToken.set(null);
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

                // Navigate to login page without message (notification is handled by the component)
                this.router.navigate(['/auth/login']);
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
        // Primero intentamos obtener el token de la señal
        const tokenFromSignal = this._accessToken();
        if (tokenFromSignal) {
            return tokenFromSignal;
        }

        // Si no está disponible en la señal, intentamos recuperarlo del almacenamiento
        if (this.isBrowser) {
            const storedToken = this.getStoredToken();
            if (storedToken) {
                // Actualizamos la señal con el token almacenado
                this._accessToken.set(storedToken);
                return storedToken;
            }
        }

        return null;
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
