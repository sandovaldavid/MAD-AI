import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

import { UpdateRoleModel } from '@domain/models/role/update-role.model';
import { RoleEntity } from '@domain/entities/role.entity';

@Injectable({
    providedIn: 'root',
})
export class UpdateRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(id: number, updateRoleModel: UpdateRoleModel): Observable<RoleEntity> {
        return this.roleRepository.updateRole(id, updateRoleModel);
    }
}
