import { Provider, InjectionToken } from '@angular/core';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserRepositoryImpl } from '../repositories/user.repository.impl';

export const USER_REPOSITORY_TOKEN = new InjectionToken<UserRepository>('UserRepository');

export const USER_PROVIDERS: Provider[] = [
    {
        provide: USER_REPOSITORY_TOKEN,
        useClass: UserRepositoryImpl
    }
];
