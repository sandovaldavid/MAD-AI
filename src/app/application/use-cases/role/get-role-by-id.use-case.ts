import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

import { RoleEntity } from '@domain/entities/role.entity';

@Injectable({
    providedIn: 'root',
})
export class GetRoleByIdUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(id: number): Observable<RoleEntity> {
        return this.roleRepository.getRoleById(id);
    }
}
