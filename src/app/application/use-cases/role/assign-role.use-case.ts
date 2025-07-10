import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { AssignRoleModel } from '@domain/models/role/assign-role.model';
import { AssignRoleData } from '@domain/models/role/role.dto';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';

@Injectable({
    providedIn: 'root',
})
export class AssignRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(assignRoleModel: AssignRoleModel): Observable<void> {
        // Transform legacy model to new DTO
        const assignRoleData: AssignRoleData = {
            userId: assignRoleModel.user_id,
            roleId: assignRoleModel.role_id,
            assignedByUserId: assignRoleModel.assigned_by_user_id,
        };

        return this.roleRepository.assignRole(assignRoleData);
    }
}
