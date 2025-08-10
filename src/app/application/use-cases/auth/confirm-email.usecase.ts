import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class ConfirmEmail {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);
    execute(token: string) {
        return this.repo.confirmEmail(token);
    }
}
