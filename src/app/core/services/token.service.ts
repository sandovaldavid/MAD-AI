import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type StorageType = 'local' | 'session';

@Injectable({
    providedIn: 'root',
})
export class TokenService {
    private readonly ACCESS_TOKEN_KEY = 'access_token';
    private readonly REFRESH_TOKEN_KEY = 'refresh_token';
    private readonly USER_DATA_KEY = 'user_data';

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    private getStorage(type: StorageType): Storage | null {
        if (!this.isBrowser()) {
            return null;
        }
        return type === 'local' ? localStorage : sessionStorage;
    }

    private setItem(key: string, value: string, storageType: StorageType): void {
        const storage = this.getStorage(storageType);
        storage?.setItem(key, value);
    }

    private getItem(key: string): string | null {
        if (!this.isBrowser()) {
            return null;
        }
        return localStorage.getItem(key) || sessionStorage.getItem(key);
    }

    private removeItem(key: string): void {
        if (!this.isBrowser()) {
            return;
        }
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    }

    saveTokens(accessToken: string, refreshToken: string): void {
        this.setItem(this.ACCESS_TOKEN_KEY, accessToken, 'local');
        this.setItem(this.REFRESH_TOKEN_KEY, refreshToken, 'local');
    }

    saveTokensSession(accessToken: string, refreshToken: string): void {
        this.setItem(this.ACCESS_TOKEN_KEY, accessToken, 'session');
        this.setItem(this.REFRESH_TOKEN_KEY, refreshToken, 'session');
    }

    getAccessToken(): string | null {
        return this.getItem(this.ACCESS_TOKEN_KEY);
    }

    getRefreshToken(): string | null {
        return this.getItem(this.REFRESH_TOKEN_KEY);
    }

    saveUserData(userData: any): void {
        this.setItem(this.USER_DATA_KEY, JSON.stringify(userData), 'local');
    }

    saveUserDataSession(userData: any): void {
        this.setItem(this.USER_DATA_KEY, JSON.stringify(userData), 'session');
    }

    getUserData(): any | null {
        const data = this.getItem(this.USER_DATA_KEY);
        return data ? JSON.parse(data) : null;
    }

    clearTokens(): void {
        this.removeItem(this.ACCESS_TOKEN_KEY);
        this.removeItem(this.REFRESH_TOKEN_KEY);
        this.removeItem(this.USER_DATA_KEY);
    }

    /**
     * Verificación inmediata de autenticación - NO hace llamadas HTTP
     * Esta es la clave para evitar el flash login
     */
    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (!token) {
            return false;
        }

        // Verificamos si el token no está expirado
        return !this.isTokenExpired(token);
    }

    /**
     * Verificación local del token JWT sin llamadas al servidor
     */
    isTokenExpired(token: string): boolean {
        try {
            const payload = this.getTokenPayload(token);
            if (!payload || !payload.exp) {
                return true;
            }
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch {
            return true;
        }
    }

    /**
     * Verifica si el token está próximo a expirar (en los próximos 5 minutos)
     */
    isTokenExpiringSoon(token: string): boolean {
        try {
            const payload = this.getTokenPayload(token);
            if (!payload || !payload.exp) {
                return true;
            }
            const currentTime = Date.now() / 1000;
            const fiveMinutesFromNow = currentTime + 5 * 60; // 5 minutos
            return payload.exp < fiveMinutesFromNow;
        } catch {
            return true;
        }
    }

    /**
     * Obtiene información del payload del token sin verificar su validez
     */
    getTokenPayload(token: string): any | null {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            return null;
        }
    }
}
