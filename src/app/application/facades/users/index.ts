/**
 * @fileoverview Users Facade Exports
 *
 * This barrel file provides a centralized export point for all user-related
 * facades in the MAD-AI application. It exports both the main coordinating
 * facade and all specialized facades for flexible usage patterns.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Main coordinating facade (for backward compatibility)
export { UsersFacade } from './user.facade';

// Specialized facades (for advanced usage)
export { BaseUserFacade } from './base-user.facade';
export { UserCrudFacade } from './user-crud.facade';
export { UserLookupFacade } from './user-lookup.facade';
export { UserListFacade } from './user-list.facade';
export { UserStateFacade } from './user-state.facade';
export { UserUtilsFacade } from './user-utils.facade';

// Re-export the main facade as UserFacade for alternative naming
export { UsersFacade as UserFacade } from './user.facade';
