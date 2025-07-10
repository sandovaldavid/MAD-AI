import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { CreateRoleModel } from '@domain/models/role/create-role.model';
import { RoleEntity } from '@domain/entities/role.entity';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

@Injectable({
    providedIn: 'root',
})
export class CreateRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(createRoleModel: CreateRoleModel): Observable<RoleEntity> {
        return this.roleRepository.createRole(createRoleModel);
    }
}
