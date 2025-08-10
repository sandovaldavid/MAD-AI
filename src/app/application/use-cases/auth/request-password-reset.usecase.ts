import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class RequestPasswordReset {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);
    execute(email: string) {
        return this.repo.requestPasswordReset(email);
    }
}
