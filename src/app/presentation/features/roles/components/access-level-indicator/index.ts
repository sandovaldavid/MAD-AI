/**
 * @fileoverview Access Level Indicator - Unified exports
 *
 * This barrel file provides a single point of import for all access level
 * related types, components, and utilities. It promotes consistency by
 * ensuring all components use the same interfaces and functions.
 *
 * @architecture Clean Architecture - Presentation Layer
 * @purpose Unified interface for access level visualization and utilities
 */

// Export the main component
export { AccessLevelIndicator } from './access-level-indicator';

// Re-export all types and utilities from role-colors.type
export type { RoleAccessLevelColor, RoleAccessLevelInfo } from './access-level-indicator';

export {
    ROLE_ACCESS_LEVEL_CONFIG,
    ROLE_ACCESS_LEVEL_ICONS,
    getRoleAccessLevelInfo,
    getRoleAccessLevelIcon,
} from './access-level-indicator';
