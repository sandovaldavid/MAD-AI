import { inject, Injectable, signal, computed } from '@angular/core';
import { LoginWithCredentials } from '../use-cases/auth/login.usecase';
import { Logout } from '../use-cases/auth/logout.usecase';
import { GetProfile } from '../use-cases/auth/get-profile.usecase';
import { Register } from '../use-cases/auth/register.usecase';
import { ConfirmEmail } from '../use-cases/auth/confirm-email.usecase';
import { RequestPasswordReset } from '../use-cases/auth/request-password-reset.usecase';
import { ConfirmPasswordReset } from '../use-cases/auth/confirm-password-reset.usecase';
import type { User } from '@domain/entities/user.entity';
import type { Identifier, RegisterData, ResetPasswordData } from '@domain/models/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
    private loginUC = inject(LoginWithCredentials);
    private logoutUC = inject(Logout);
    private meUC = inject(GetProfile);
    private registerUC = inject(Register);
    private confirmEmailUC = inject(ConfirmEmail);
    private reqResetUC = inject(RequestPasswordReset);
    private confirmResetUC = inject(ConfirmPasswordReset);

    private _loading = signal(false);
    private _error = signal<string | null>(null);
    private _user = signal<User | null>(null);

    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    readonly user = computed(() => this._user());
    readonly isAuthenticated = computed(() => !!this._user());

    async login(identifier: Identifier, password: string, rememberMe = false) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.loginUC.execute(identifier, password, rememberMe);
            await this.refreshProfile();
        } catch (e: any) {
            this._error.set(e?.message ?? 'No se pudo iniciar sesión');
        } finally {
            this._loading.set(false);
        }
    }

    async logout() {
        this._loading.set(true);
        try {
            await this.logoutUC.execute();
            this._user.set(null);
        } finally {
            this._loading.set(false);
        }
    }

    async refreshProfile() {
        try {
            this._user.set(await this.meUC.execute());
        } catch {
            this._user.set(null);
        }
    }

    /** Útil si alguna llamada manual necesita el header; normalmente el interceptor lo agrega solo. */
    getAccessHeaderOrNull(): string | null {
        const u = this._user(); // opcional: puedes obtener el token desde el repo si lo prefieres
        return null; // mantenemos el header delegado al interceptor
    }

    async register(data: RegisterData) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.registerUC.execute(data);
            await this.refreshProfile();
        } catch (e: any) {
            this._error.set(e?.message ?? 'No se pudo registrar');
        } finally {
            this._loading.set(false);
        }
    }

    async confirmEmail(token: string) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.confirmEmailUC.execute(token);
            await this.refreshProfile();
        } finally {
            this._loading.set(false);
        }
    }

    async requestPasswordReset(email: string) {
        this._loading.set(true);
        this._error.set(null);
        try {
            return await this.reqResetUC.execute(email);
        } catch (e: any) {
            this._error.set(e?.message ?? 'No se pudo enviar el correo de reseteo');
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async confirmPasswordReset(data: ResetPasswordData) {
        this._loading.set(true);
        this._error.set(null);
        try {
            return await this.confirmResetUC.execute(data);
        } catch (e: any) {
            this._error.set(e?.message ?? 'No se pudo restablecer la contraseña');
            throw e;
        } finally {
            this._loading.set(false);
        }
    }
}
