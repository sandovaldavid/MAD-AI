import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { RoleModel } from '@domain/models/role/role.model';

@Injectable({
    providedIn: 'root',
})
export class GetRoleByIdUseCase {
    private readonly roleRepository = inject(RoleRepository);

    execute(id: number): Observable<RoleModel> {
        return this.roleRepository.getRoleById(id);
    }
}
