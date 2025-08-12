import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';
import type { ResetPasswordData } from '@domain/models/auth';

@Injectable({ providedIn: 'root' })
export class ConfirmPasswordReset {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);
    execute(data: ResetPasswordData) {
        return this.repo.confirmPasswordReset(data);
    }
}
