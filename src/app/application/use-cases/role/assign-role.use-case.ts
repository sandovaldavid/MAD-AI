import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { AssignRoleModel } from '@domain/models/role/assign-role.model';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

@Injectable({
    providedIn: 'root',
})
export class AssignRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(assignRoleModel: AssignRoleModel): Observable<void> {
        return this.roleRepository.assignRole(assignRoleModel);
    }
}
