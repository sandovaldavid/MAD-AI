import { Provider } from '@angular/core';
import { ROLE_REPOSITORY } from './tokens';
import { HttpRoleRepository } from '@infrastructure/repositories/http-role.repository';
import { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import { CreateRole } from '@application/use-cases/roles/create-role.usecase';
import { UpdateRole } from '@application/use-cases/roles/update-role.usecase';
import { DeleteRole } from '@application/use-cases/roles/delete-role.usecase';

export function provideRoles(): Provider[] {
  return [
    // Repository
    { provide: ROLE_REPOSITORY, useClass: HttpRoleRepository },

    // Use cases
    ListRoles,
    GetRoleById,
    CreateRole,
    UpdateRole,
    DeleteRole,
  ];
}
