import { Provider } from '@angular/core';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { RoleRepositoryImpl } from '../repositories/role.repository.impl';

export const ROLE_PROVIDERS: Provider[] = [
    {
        provide: RoleRepository,
        useClass: RoleRepositoryImpl
    }
];
