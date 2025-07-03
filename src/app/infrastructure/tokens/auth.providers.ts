import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@infrastructure/repositories/auth.repository.impl';

export const AUTH_PROVIDERS = [
    {
        provide: AuthRepository,
        useClass: AuthRepositoryImpl,
    },
];
