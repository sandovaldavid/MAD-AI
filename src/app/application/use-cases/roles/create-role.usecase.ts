import { inject } from '@angular/core';
import { ROLE_REPOSITORY } from '@di/tokens';
import { RoleRepository } from '@domain/repositories/role.repository';
import type { CreateRolePayload } from '@domain/repositories/role.repository';

export class CreateRole {
    private repo = inject<RoleRepository>(ROLE_REPOSITORY);
    execute(payload: CreateRolePayload) {
        return this.repo.create(payload);
    }
}
