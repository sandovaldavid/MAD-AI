import { inject, Injectable } from '@angular/core';
import { AUTH_REPOSITORY } from '@di/tokens';
import type { AuthRepository } from '@domain/repositories/auth.repository';
import type { RegisterData } from '@/app/domain/types/auth';

@Injectable({ providedIn: 'root' })
export class Register {
    private repo = inject<AuthRepository>(AUTH_REPOSITORY);
    execute(data: RegisterData) {
        return this.repo.register(data);
    }
}
