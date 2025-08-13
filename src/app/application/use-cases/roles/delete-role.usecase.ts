import { inject } from '@angular/core';
import { ROLE_REPOSITORY } from '@di/tokens';
import { RoleRepository } from '@domain/repositories/role.repository';

export class DeleteRole {
    private repo = inject<RoleRepository>(ROLE_REPOSITORY);
    execute(id: number) {
        return this.repo.delete(id);
    }
}
