import { Provider } from '@angular/core';
import {
  ROLE_REPOSITORY,
  ACTIVATE_ROLE_USECASE_PORT,
  DEACTIVATE_ROLE_USECASE_PORT,
  ASSIGN_ROLE_TO_USER_USECASE_PORT,
  UNASSIGN_ROLE_FROM_USER_USECASE_PORT,
  GET_USERS_BY_ROLE_USECASE_PORT,
  LIST_ROLES_USECASE_PORT,
  GET_ROLE_BY_ID_USECASE_PORT,
  CREATE_ROLE_USECASE_PORT,
  UPDATE_ROLE_USECASE_PORT,
  DELETE_ROLE_USECASE_PORT,
  GET_ROLE_BY_NAME_USECASE_PORT,
  ROLE_EXPORT_SERVICE_PORT,
} from './tokens';
import { HttpRoleRepository } from '@infrastructure/repositories/business/http-role.repository';
import { ActivateRole } from '@application/use-cases/roles/activate-role.usecase';
import { DeactivateRoleUseCase } from '@application/use-cases/roles/deactivate-role.usecase';
import { AssignRoleToUser } from '@application/use-cases/roles/assign-role-to-user.usecase';
import { UnassignRoleFromUser } from '@application/use-cases/roles/unassign-role-from-user.usecase';
import { GetUsersByRole } from '@application/use-cases/roles/get-users-by-role.usecase';
import { ListRoles } from '@application/use-cases/roles/list-roles.usecase';
import { GetRoleById } from '@application/use-cases/roles/get-role-by-id.usecase';
import { GetRoleByNameUseCase } from '@application/use-cases/roles/get-role-by-name.usecase';
import { CreateRoleUseCase } from '@application/use-cases/roles/create-role.usecase';
import { UpdateRoleUseCase } from '@application/use-cases/roles/update-role.usecase';
import { DeleteRoleUseCase } from '@application/use-cases/roles/delete-role.usecase';
import { RoleExportService } from '@application/services/role-export-report.service';

export function provideRoles(): Provider[] {
  return [
    // Repository
    { provide: ROLE_REPOSITORY, useClass: HttpRoleRepository },

    // Use cases registered with InjectionTokens
    { provide: ACTIVATE_ROLE_USECASE_PORT, useClass: ActivateRole },
    { provide: DEACTIVATE_ROLE_USECASE_PORT, useClass: DeactivateRoleUseCase },
    { provide: ASSIGN_ROLE_TO_USER_USECASE_PORT, useClass: AssignRoleToUser },
    { provide: UNASSIGN_ROLE_FROM_USER_USECASE_PORT, useClass: UnassignRoleFromUser },
    { provide: GET_USERS_BY_ROLE_USECASE_PORT, useClass: GetUsersByRole },
    { provide: LIST_ROLES_USECASE_PORT, useClass: ListRoles },
    { provide: GET_ROLE_BY_ID_USECASE_PORT, useClass: GetRoleById },
    { provide: CREATE_ROLE_USECASE_PORT, useClass: CreateRoleUseCase },
    { provide: UPDATE_ROLE_USECASE_PORT, useClass: UpdateRoleUseCase },
    { provide: DELETE_ROLE_USECASE_PORT, useClass: DeleteRoleUseCase },
    { provide: GET_ROLE_BY_NAME_USECASE_PORT, useClass: GetRoleByNameUseCase },
    { provide: ROLE_EXPORT_SERVICE_PORT, useClass: RoleExportService },
  ];
}
