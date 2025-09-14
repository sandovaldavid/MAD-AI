import { Provider } from '@angular/core';
import { ROLE_REPOSITORY } from './tokens';
import { HttpRoleRepository } from '@infrastructure/repositories/business/http-role.repository';
import { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import { GetRoleByNameUseCase } from '@application/use-cases/roles/get-role-by-name.usecase';
import { CreateRoleUseCase } from '@application/use-cases/roles/create-role.usecase';
import { UpdateRoleUseCase } from '@application/use-cases/roles/update-role.usecase';
import { DeleteRoleUseCase } from '@application/use-cases/roles/delete-role.usecase';

export function provideRoles(): Provider[] {
  return [
    // Repository
    { provide: ROLE_REPOSITORY, useClass: HttpRoleRepository },

    // Use cases
    ListRoles,
    GetRoleById,
    GetRoleByNameUseCase,
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeleteRoleUseCase,
  ];
}
