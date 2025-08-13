import { inject } from '@angular/core';
import { ROLE_REPOSITORY } from '@di/tokens';
import { RoleRepository } from '@domain/repositories/role.repository';
import type { ListRolesParams } from '@domain/repositories/role.repository';

export class ListRoles {
    private repo = inject<RoleRepository>(ROLE_REPOSITORY);

    execute(params?: ListRolesParams) {
        return this.repo.list(params);
    }
}
