import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';

@Injectable({ providedIn: 'root' })
export class RefreshSession {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);
    execute() {
        return this.repo.refresh();
    }
}
