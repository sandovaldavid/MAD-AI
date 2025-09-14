/**
 * Central export point for all MAD-AI domain value objects.
 *
 * @description
 * This module provides a comprehensive collection of domain value objects that represent
 * core business concepts in the MAD-AI system. All value objects follow immutable patterns,
 * implement comprehensive validation, and provide rich business functionality.
 *
 * @exports
 * - **Identity & Authentication**: Email, Username, AccessToken, RefreshToken, TokenPair
 * - **User Profile**: FirstName, LastName, UserStatus, UserNotificationPreferences
 * - **Authorization**: AccessLevel, RoleName (with hierarchical RBAC)
 * - **Temporal Data**: ISODateTime (with timezone and formatting support)
 *
 * @architecture
 * All value objects implement:
 * - Immutable value object pattern
 * - Factory method with comprehensive validation
 * - Rich business behavior and utility methods
 * - Extensive JSDoc documentation with examples
 * - Type-safe equality comparisons
 * - Secure handling for sensitive data (masking, etc.)
 *
 * @example
 * ```typescript
 * import {
 *   Email,
 *   Username,
 *   AccessToken,
 *   RoleName,
 *   UserNotificationPreferences
 * } from '@domain/value-objects';
 *
 * // Create user identity
 * const email = Email.create('user@example.com');
 * const username = Username.create('john_doe');
 *
 * // Create authentication tokens
 * const accessToken = AccessToken.create('token_value', expiryTime);
 * const tokenPair = TokenPair.create(accessToken, refreshToken);
 *
 * // Create role with hierarchical access
 * const role = RoleName.create('Manager');
 * console.log(role.getHierarchyLevel()); // 3
 *
 * // Create notification preferences
 * const prefs = UserNotificationPreferences.create({
 *   email: { enabled: true, frequency: 'IMMEDIATE' },
 *   inApp: { enabled: true, frequency: 'IMMEDIATE' },
 *   quietHours: { enabled: true, start: '22:00', end: '07:00' }
 * });
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */

// Core value object exports (star exports for all functionality)
export * from './email.vo';
export * from './username.vo';
export * from './firstname.vo';
export * from './lastname.vo';
export * from './local-tokens.vo';

export * from './user-status.vo';
export * from './user-notification-preferences.vo';
export * from './iso-datetime.vo';
export * from './activity-period.vo';
export * from './export-format.vo';
