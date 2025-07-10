import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { UnassignRoleModel } from '@domain/models/role/unassign-role.model';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

@Injectable({
    providedIn: 'root'
})
export class UnassignRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(unassignRoleModel: UnassignRoleModel): Observable<void> {
        return this.roleRepository.unassignRole(unassignRoleModel);
    }
}
