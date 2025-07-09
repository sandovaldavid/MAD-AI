import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { UpdateRoleModel } from '@domain/models/role/update-role.model';
import { RoleModel } from '@domain/models/role/role.model';

@Injectable({
    providedIn: 'root',
})
export class UpdateRoleUseCase {
    private readonly roleRepository = inject(RoleRepository);

    execute(id: number, updateRoleModel: UpdateRoleModel): Observable<RoleModel> {
        return this.roleRepository.updateRole(id, updateRoleModel);
    }
}
