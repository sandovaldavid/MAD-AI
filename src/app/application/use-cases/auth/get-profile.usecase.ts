import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '../../../di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';
import type { User } from '@domain/entities/user.entity';

@Injectable({ providedIn: 'root' })
export class GetProfile {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);
    execute(): Promise<User> {
        return this.repo.me();
    }
}
