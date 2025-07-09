import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { CreateRoleModel } from '@domain/models/role/create-role.model';
import { RoleModel } from '@domain/models/role/role.model';

@Injectable({
    providedIn: 'root',
})
export class CreateRoleUseCase {
    private readonly roleRepository = inject(RoleRepository);

    execute(createRoleModel: CreateRoleModel): Observable<RoleModel> {
        return this.roleRepository.createRole(createRoleModel);
    }
}
