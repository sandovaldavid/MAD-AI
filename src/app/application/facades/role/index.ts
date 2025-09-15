/**
 * Role Facades - Barrel Export
 *
 * This file serves as the main entry point for all role-related facades,
 * providing clean imports and a well-organized public API.
 *
 * @example
 * ```typescript
 * // Import the main orchestrator facade
 * import { RolesFacade } from '@application/facades/role';
 *
 * // Import specific specialized facades if needed
 * import {
 *   RoleStateFacade,
 *   RoleCrudFacade,
 *   RoleSearchFacade
 * } from '@application/facades/role';
 *
 * // Import types
 * import {
 *   ListRolesParams,
 *   CreateRoleData,
 *   UpdateRoleData,
 *   RoleStatistics
 * } from '@application/facades/role';
 * ```
 */

// Main orchestrator facade
export { RolesFacade } from './role.facade';

// Specialized facades
export { RoleStateFacade } from './role-state.facade';
export { RoleCrudFacade } from './role-crud.facade';
export { RoleActivationFacade } from './role-activation.facade';
export { RoleAssignmentFacade } from './role-assignment.facade';
export { RoleSearchFacade } from './role-search.facade';
export { RoleExportFacade } from './role-export.facade';

// Shared types
export type {
  ListRolesParams,
  RoleState,
  CreateRoleData,
  UpdateRoleData,
  BulkUpdateRoleData,
  RoleStatistics,
  FacadeOpts,
} from './role.types';
