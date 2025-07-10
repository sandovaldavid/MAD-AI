import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '../../../domain/repositories/role.repository';
import { AssignRoleModel } from '../../../domain/models/role/assign-role.model';

@Injectable({
    providedIn: 'root'
})
export class AssignRoleUseCase {
    constructor(private readonly roleRepository: RoleRepository) {}

    execute(assignRoleModel: AssignRoleModel): Observable<void> {
        return this.roleRepository.assignRole(assignRoleModel);
    }
}
