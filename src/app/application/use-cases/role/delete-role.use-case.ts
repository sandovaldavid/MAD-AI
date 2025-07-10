import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RoleRepository } from '@domain/repositories/role.repository';
import { ROLE_REPOSITORY_TOKEN } from '@infrastructure/tokens/role.providers';


@Injectable({
    providedIn: 'root',
})
export class DeleteRoleUseCase {
    private readonly roleRepository: RoleRepository = inject(ROLE_REPOSITORY_TOKEN);

    execute(id: number): Observable<void> {
        return this.roleRepository.deleteRole(id);
    }
}
