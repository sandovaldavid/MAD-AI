import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { UnassignRoleModel } from '@domain/models/role/unassign-role.model';
import { UnassignRoleData } from '@domain/models/role/role.dto';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

@Injectable({
    providedIn: 'root',
})
export class UnassignRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(unassignRoleModel: UnassignRoleModel): Observable<void> {
        // Transform legacy model to new DTO
        const unassignRoleData: UnassignRoleData = {
            userId: unassignRoleModel.user_id,
        };

        return this.roleRepository.unassignRole(unassignRoleData);
    }
}
