import { makeEnvironmentProviders } from '@angular/core';
import { UsersFacade } from '@application/facades/users/user.facade';
import { HttpUserRepository } from '@infrastructure/repositories/business/http-user.repository';
import {
  USER_REPOSITORY,
  ACTIVATE_USER_USECASE_PORT,
  DEACTIVATE_USER_USECASE_PORT,
  CREATE_USER_USECASE_PORT,
  DELETE_USER_USECASE_PORT,
  UPDATE_USER_USECASE_PORT,
  LIST_USERS_USECASE_PORT,
  GET_USER_BY_EMAIL_USECASE_PORT,
  GET_USER_BY_ID_USECASE_PORT,
  GET_USER_BY_USERNAME_USECASE_PORT,
} from './tokens';

import { ActivateUser } from '@application/use-cases/users/activate-user.usecase';
import { DeactivateUser } from '@application/use-cases/users/deactivate-user.usecase';
import { CreateUser } from '@application/use-cases/users/create-user.usecase';
import { DeleteUser } from '@application/use-cases/users/delete-user.usecase';
import { UpdateUserUseCase } from '@application/use-cases/users/update-user.usecase';
import { ListUsersUseCase } from '@application/use-cases/users/list-users.usecase';
import { GetUserByEmail } from '@application/use-cases/users/get-user-by-email.usecase';
import { GetUserById } from '@application/use-cases/users/get-user-by-id.usecase';
import { GetUserByUsernameUseCase } from '@application/use-cases/users/get-user-by-username.usecase';

/**
 * Users Module Providers
 *
 * @description
 * Dependency injection configuration for the user management system.
 * This provider configures all necessary services, facades, repositories,
 * and use cases required for comprehensive user management functionality.
 *
 * @responsibilities
 * - Configure UsersFacade and related dependencies
 * - Provide HttpUserRepository implementation for USER_REPOSITORY token
 * - Ensure proper dependency injection for user management
 * - Integrate with Angular DI system
 * - Support user CRUD operations, bulk operations, and state management
 *
 * @architecture
 * - Infrastructure layer configuration
 * - Uses Angular dependency injection
 * - Provides facade-level services and repository implementations
 * - Integrates with existing use case providers
 *
 * @usage
 * ```typescript
 * // In main.ts or app.config.ts
 * import { provideUsers } from '@di/provide-users';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // ... other providers
 *     provideUsers(),
 *   ],
 * };
 * ```
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Infrastructure
 */
export function provideUsers() {
  return makeEnvironmentProviders([
    // Repository Implementation
    {
      provide: USER_REPOSITORY,
      useClass: HttpUserRepository,
    },

    // User Use Case Providers
    {
      provide: ACTIVATE_USER_USECASE_PORT,
      useClass: ActivateUser,
    },
    {
      provide: DEACTIVATE_USER_USECASE_PORT,
      useClass: DeactivateUser,
    },
    {
      provide: CREATE_USER_USECASE_PORT,
      useClass: CreateUser,
    },
    {
      provide: DELETE_USER_USECASE_PORT,
      useClass: DeleteUser,
    },
    {
      provide: UPDATE_USER_USECASE_PORT,
      useClass: UpdateUserUseCase,
    },
    {
      provide: LIST_USERS_USECASE_PORT,
      useClass: ListUsersUseCase,
    },
    {
      provide: GET_USER_BY_EMAIL_USECASE_PORT,
      useClass: GetUserByEmail,
    },
    {
      provide: GET_USER_BY_ID_USECASE_PORT,
      useClass: GetUserById,
    },
    {
      provide: GET_USER_BY_USERNAME_USECASE_PORT,
      useClass: GetUserByUsernameUseCase,
    },

    // User Management Facade
    UsersFacade,
  ]);
}
