import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository, ResetPasswordResponse } from '@domain/repositories/auth.repository';

export interface ResetPasswordRequest {
    email: string;
}

export interface ResetPasswordConfirmRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

@Injectable({
    providedIn: 'root',
})
export class ResetPasswordUseCase {
    private readonly authRepository = inject(AuthRepository);

    /**
     * Solicita un reset de contraseña enviando un email con el token
     */
    requestReset(request: ResetPasswordRequest): Observable<ResetPasswordResponse> {
        if (!request.email || !this.isValidEmail(request.email)) {
            throw new Error('Email inválido');
        }

        return this.authRepository.requestPasswordReset(request.email);
    }

    /**
     * Confirma el reset de contraseña con el token recibido
     */
    confirmReset(request: ResetPasswordConfirmRequest): Observable<ResetPasswordResponse> {
        if (!request.token) {
            throw new Error('Token requerido');
        }

        if (!request.newPassword || request.newPassword.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        if (request.newPassword !== request.confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }

        return this.authRepository.confirmPasswordReset(
            request.token,
            request.newPassword,
            request.confirmPassword
        );
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
