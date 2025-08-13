import { inject } from '@angular/core';
import { ROLE_REPOSITORY } from '@di/tokens';
import { RoleRepository } from '@domain/repositories/role.repository';
import type { UpdateRolePayload } from '@domain/repositories/role.repository';

export class UpdateRole {
    private repo = inject<RoleRepository>(ROLE_REPOSITORY);
    execute(id: number, p: UpdateRolePayload) {
        return this.repo.update(id, p);
    }
}
