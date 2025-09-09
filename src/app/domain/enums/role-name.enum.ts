/**
 * Role Name Domain Constants and Enums for MAD-AI System
 *
 * @description
 * This enum centralizes all role-related constants and business rules that were
 * previously scattered in the RoleName Value Object. Following DDD principles,
 * constants and business rules are separated from value object invariants.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */

/**
 * Length constraints for role names (invariant validations)
 */
export const ROLE_NAME_LENGTH_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  OPTIMAL_LENGTH: 20,
} as const;

/**
 * Validation patterns for role name format (invariant validations)
 */
export const ROLE_NAME_VALIDATION_PATTERNS = {
  VALID_CHARACTERS: /^[A-Za-z\s-]+$/,
  VALID_START: /^[A-Za-z]/,
  NO_CONSECUTIVE_SPACES: /\s{2,}/,
  NO_CONSECUTIVE_HYPHENS: /-{2,}/,
} as const;

/**
 * Reserved names that cannot be used for roles (business rule)
 * These are completely forbidden names that should never be used
 */
export const RESERVED_ROLE_NAMES = [
  'system',
  'api',
  'service',
  'internal',
  'bot',
  'admin',
  'root',
  'superuser',
  'god',
  'sudo',
] as const;

/**
 * System role categories (business rule)
 * These are names that the system can create automatically but users cannot create manually
 */
export const SYSTEM_ROLE_CATEGORIES = {
  ADMINISTRATOR: ['admin', 'root', 'superuser'],
  MODERATOR: ['moderator', 'mod', 'moderador'],
  USER: ['user', 'member', 'usuario', 'guest'],
} as const;

/**
 * Validation messages for role name errors
 */
export const ROLE_NAME_VALIDATION_MESSAGES = {
  REQUIRED: 'Role name is required',
  TOO_SHORT: 'Role name must be at least 3 characters',
  TOO_LONG: 'Role name must be at most 50 characters',
  INVALID_FORMAT: 'Role name must contain only letters, spaces, or hyphens',
  RESERVED_NAME: 'This role name is reserved and cannot be used',
  INVALID_START: 'Role name must start with a letter',
  CONSECUTIVE_CHARS: 'Role name cannot have consecutive spaces or hyphens',
} as const;

/**
 * Utility functions for role name operations
 */
export const RoleNameUtils = {
  /**
   * Checks if a role name format is valid (invariant validation)
   */
  isValidFormat(name: string): boolean {
    if (!ROLE_NAME_VALIDATION_PATTERNS.VALID_CHARACTERS.test(name)) return false;
    if (!ROLE_NAME_VALIDATION_PATTERNS.VALID_START.test(name)) return false;
    return true;
  },

  /**
   * Normalizes a role name (formatting utility)
   */
  normalize(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/-+/g, '-')
      .split(/[\s-]/)
      .map((word) => {
        if (word.length === 0) return '';
        // If word is all uppercase, convert to title case
        if (word === word.toUpperCase()) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        // Otherwise, just capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  },

  /**
   * Formats role name for display
   */
  formatForDisplay(name: string): string {
    return name
      .replace(/-/g, ' ') // Convert hyphens to spaces for display
      .replace(/\b\w+\b/g, (word) => {
        // If word is all uppercase, convert to title case
        if (word === word.toUpperCase()) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        // Otherwise, just capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1);
      });
  },

  /**
   * Converts role name to URL-friendly slug
   */
  toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  },

  /**
   * Gets all system role names as a flat array
   */
  getAllSystemRoles(): string[] {
    return [
      ...SYSTEM_ROLE_CATEGORIES.ADMINISTRATOR,
      ...SYSTEM_ROLE_CATEGORIES.MODERATOR,
      ...SYSTEM_ROLE_CATEGORIES.USER,
    ];
  },

  /**
   * Gets only the completely reserved names (not system roles)
   */
  getAllReservedNames(): string[] {
    return [...RESERVED_ROLE_NAMES];
  },

  /**
   * Gets all forbidden names (reserved + system roles)
   */
  getAllForbiddenNames(): string[] {
    return [...RESERVED_ROLE_NAMES, ...this.getAllSystemRoles()];
  },
};
