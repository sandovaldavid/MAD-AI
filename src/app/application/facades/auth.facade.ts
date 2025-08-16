import { inject, Injectable, signal, computed } from '@angular/core';
import { LoginWithCredentials } from '../use-cases/auth/login.usecase';
import { Logout } from '../use-cases/auth/logout.usecase';
import { GetProfile } from '../use-cases/auth/get-profile.usecase';
import { Register } from '../use-cases/auth/register.usecase';
import { ConfirmEmail } from '../use-cases/auth/confirm-email.usecase';
import { RequestPasswordReset } from '../use-cases/auth/request-password-reset.usecase';
import { ConfirmPasswordReset } from '../use-cases/auth/confirm-password-reset.usecase';
import { NotificationsFacade } from './notifications.facade';
import { createFacadeErrorHandler } from '@core/errors/facade-error.handler';
import type { User } from '@domain/entities/user.entity';
import type { Identifier, RegisterData, ResetPasswordData } from '@/app/domain/types/auth';
import type { FacadeOpts } from '@application/types/facade-opts';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
    private loginUC = inject(LoginWithCredentials);
    private logoutUC = inject(Logout);
    private meUC = inject(GetProfile);
    private registerUC = inject(Register);
    private confirmEmailUC = inject(ConfirmEmail);
    private reqResetUC = inject(RequestPasswordReset);
    private confirmResetUC = inject(ConfirmPasswordReset);
    private notify = inject(NotificationsFacade);

    // Enhanced error handling for auth feature
    private errorHandler = createFacadeErrorHandler('auth');

    private _loading = signal(false);
    private _error = signal<string | null>(null);
    private _user = signal<User | null>(null);

    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    readonly user = computed(() => this._user());
    readonly isAuthenticated = computed(() => !!this._user());

    async login(identifier: Identifier, password: string, remember_me = false, opts?: FacadeOpts) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.loginUC.execute(identifier, password, remember_me);
            await this.refreshProfile();
            if (!opts?.silent)
                this.notify.success(
                    'Bienvenido de nuevo ' + this._user()?.username,
                    'Inicio de Sesión Exitoso'
                );
        } catch (e: any) {
            const msg = this.errorHandler.transformError(e, 'login');
            this._error.set(msg);
            if (!opts?.silent) this.notify.error(msg);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async logout(opts?: FacadeOpts) {
        this._loading.set(true);
        try {
            await this.logoutUC.execute();
            this._user.set(null);
            if (!opts?.silent) this.notify.info('Sesión cerrada');
        } catch (e: any) {
            const msg = this.errorHandler.transformError(e, 'logout');
            if (!opts?.silent) this.notify.error(msg);
        } finally {
            this._loading.set(false);
        }
    }

    async refreshProfile() {
        try {
            this._user.set(await this.meUC.execute());
        } catch (e: any) {
            // Don't show notifications for profile refresh errors
            // They are usually handled by interceptors (401 -> redirect)
            this._user.set(null);
        }
    }

    /** Útil si alguna llamada manual necesita el header; normalmente el interceptor lo agrega solo. */
    getAccessHeaderOrNull(): string | null {
        const u = this._user(); // opcional: puedes obtener el token desde el repo si lo prefieres
        return null; // mantenemos el header delegado al interceptor
    }

    async register(data: RegisterData, opts?: FacadeOpts) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.registerUC.execute(data);
            // Registration does not set user or tokens
            if (!opts?.silent) this.notify.info('Revisa tu correo para confirmar tu cuenta');
        } catch (e: any) {
            const message = this.errorHandler.transformError(e, 'register');
            this._error.set(message);
            if (!opts?.silent) this.notify.error(message);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async confirmEmail(token: string, opts?: FacadeOpts) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.confirmEmailUC.execute(token);
            await this.refreshProfile();
            if (!opts?.silent) this.notify.success('Correo confirmado');
        } catch (e: any) {
            const message = this.errorHandler.transformError(e, 'confirm-email');
            this._error.set(message);
            if (!opts?.silent) this.notify.error(message);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async requestPasswordReset(email: string, opts?: FacadeOpts) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.reqResetUC.execute(email);
            if (!opts?.silent)
                this.notify.info('Te enviamos un email para restablecer la contraseña');
        } catch (e: any) {
            const msg = this.errorHandler.transformError(e, 'reset-password');
            this._error.set(msg);
            if (!opts?.silent) this.notify.error(msg);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }

    async confirmPasswordReset(data: ResetPasswordData, opts?: FacadeOpts) {
        this._loading.set(true);
        this._error.set(null);
        try {
            await this.confirmResetUC.execute(data);
            if (!opts?.silent) this.notify.success('Contraseña actualizada');
        } catch (e: any) {
            const msg = this.errorHandler.transformError(e, 'confirm-password-reset');
            this._error.set(msg);
            if (!opts?.silent) this.notify.error(msg);
            throw e;
        } finally {
            this._loading.set(false);
        }
    }
}
