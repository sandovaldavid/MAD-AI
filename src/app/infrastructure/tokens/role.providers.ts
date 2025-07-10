import { Provider, InjectionToken } from '@angular/core';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { RoleRepositoryImpl } from '../repositories/role.repository.impl';

export const ROLE_REPOSITORY_TOKEN = new InjectionToken<RoleRepository>('RoleRepository');

export const ROLE_PROVIDERS: Provider[] = [
    {
        provide: ROLE_REPOSITORY_TOKEN,
        useClass: RoleRepositoryImpl
    }
];
