import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';
import type { Identifier } from '@/app/domain/types/auth/Identifier.type';

@Injectable({ providedIn: 'root' })
export class LoginWithCredentials {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);

    /**
     * Inicia sesión con identifier (username o email), password y rememberMe opcional.
     */
    execute(identifier: Identifier, password: string, rememberMe = false) {
        return this.repo.login({ identifier, password, rememberMe });
    }
}
