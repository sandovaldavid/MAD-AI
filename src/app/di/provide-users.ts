import { makeEnvironmentProviders } from '@angular/core';
import { UsersFacade } from '@application/facades/users/user.facade';
import { HttpUserRepository } from '@infrastructure/repositories/business/http-user.repository';
import { USER_REPOSITORY } from './tokens';

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

    // User Management Facade
    UsersFacade,

    // Note: Use cases are already provided by their own @Injectable({ providedIn: 'root' })
    // This provider focuses on facade-level dependencies and repository configuration
  ]);
}
