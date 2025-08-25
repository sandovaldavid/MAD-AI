import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * Represents a validated role name in the system.
 *
 * @description
 * A RoleName is an immutable value object that ensures role names are properly validated,
 * normalized, and follow established business rules for role management. It provides
 * comprehensive functionality for role name operations, hierarchical relationships,
 * and organizational structure compliance.
 *
 * @businessRules
 * - Role names must be 3-50 characters long
 * - Only letters, spaces, and hyphens are allowed
 * - Names are automatically capitalized and normalized
 * - Reserved role names are protected from user creation
 * - Role hierarchies follow organizational structure conventions
 * - Role names must be unique within the same organizational context
 *
 * @securityConsiderations
 * - System roles cannot be modified by regular users
 * - Role name changes require appropriate permissions
 * - Audit trail maintained for role name modifications
 * - Protection against role name enumeration attacks
 *
 * @example
 * ```typescript
 * // Basic role creation
 * const adminRole = RoleName.create('Administrator');
 * const managerRole = RoleName.create('Project Manager');
 *
 * // Role hierarchy validation
 * const isSystemRole = adminRole.isSystemRole(); // true
 * const hierarchy = managerRole.getHierarchyLevel(); // 3
 *
 * // Role naming conventions
 * const displayName = managerRole.getDisplayName(); // "Project Manager"
 * const slug = managerRole.toSlug(); // "project-manager"
 *
 * // Role comparisons
 * const canAssign = adminRole.canAssignRole(managerRole); // true
 * const isEquivalent = role1.isEquivalentTo(role2);
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class RoleName {
  private constructor(public readonly value: string) {}

  /**
   * Creates a validated RoleName instance.
   *
   * @param raw - The raw role name string to validate and normalize
   * @returns A new RoleName instance
   * @throws {ValidationError} When the role name is invalid
   *
   * @example
   * ```typescript
   * const roleName = RoleName.create('Project Manager');
   * const adminRole = RoleName.create('administrator');
   * ```
   */
  static create(raw: string): RoleName {
    const errors: Array<{
      field: string;
      value: unknown;
      message: string;
      code?: ValidationErrorCode;
    }> = [];

    if (!raw || typeof raw !== 'string') {
      errors.push({
        field: 'roleName',
        value: raw,
        message: 'Role name is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    } else {
      const normalized = raw.trim();

      if (normalized.length < 3) {
        errors.push({
          field: 'roleName',
          value: normalized,
          message: 'Role name must be at least 3 characters',
          code: ValidationErrorCode.FIELD_TOO_SHORT,
        });
      }

      if (normalized.length > 50) {
        errors.push({
          field: 'roleName',
          value: normalized,
          message: 'Role name must be at most 50 characters',
          code: ValidationErrorCode.FIELD_TOO_LONG,
        });
      }

      if (!RoleNameSpecs.isValidFormat(normalized)) {
        errors.push({
          field: 'roleName',
          value: normalized,
          message: 'Role name must contain only letters, spaces, or hyphens',
          code: ValidationErrorCode.FIELD_FORMAT_INVALID,
        });
      }
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors);
    }

    const normalized = RoleNameUtils.normalize(raw.trim());
    return new RoleName(normalized);
  }

  /**
   * Checks if this role name equals another role name.
   *
   * @param other - The other RoleName to compare with
   * @returns True if the role names are equal
   *
   * @example
   * ```typescript
   * const role1 = RoleName.create('Admin');
   * const role2 = RoleName.create('admin');
   * console.log(role1.equals(role2)); // true (case-insensitive)
   * ```
   */
  equals(other: RoleName): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Returns the string representation of the role name.
   *
   * @returns The role name as a string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks if this is an administrator role.
   *
   * @returns True if this is an administrator role
   *
   * @example
   * ```typescript
   * const admin = RoleName.create('Administrator');
   * console.log(admin.isAdministrator()); // true
   * ```
   */
  isAdministrator(): boolean {
    return (RoleNameSpecs.SYSTEM_ROLES.ADMINISTRATOR as readonly string[]).includes(
      this.value.toLowerCase()
    );
  }

  /**
   * Checks if this is a system-level role.
   *
   * @returns True if this is a system role
   *
   * @example
   * ```typescript
   * const admin = RoleName.create('Administrator');
   * console.log(admin.isSystemRole()); // true
   *
   * const manager = RoleName.create('Project Manager');
   * console.log(manager.isSystemRole()); // false
   * ```
   */
  isSystemRole(): boolean {
    const lowerValue = this.value.toLowerCase();
    const allSystemRoles = [
      ...RoleNameSpecs.SYSTEM_ROLES.ADMINISTRATOR,
      ...RoleNameSpecs.SYSTEM_ROLES.MODERATOR,
      ...RoleNameSpecs.SYSTEM_ROLES.USER,
    ];
    return allSystemRoles.includes(lowerValue as any);
  }

  /**
   * Checks if this is a management role.
   *
   * @returns True if this is a management role
   *
   * @example
   * ```typescript
   * const manager = RoleName.create('Project Manager');
   * console.log(manager.isManagementRole()); // true
   * ```
   */
  isManagementRole(): boolean {
    const lowerValue = this.value.toLowerCase();
    return RoleNameSpecs.MANAGEMENT_ROLES.some(
      (role) => lowerValue.includes(role) || role.includes(lowerValue)
    );
  }

  /**
   * Gets the hierarchy level of this role (1-5, where 1 is highest).
   *
   * @returns The hierarchy level number
   *
   * @example
   * ```typescript
   * const admin = RoleName.create('Administrator');
   * console.log(admin.getHierarchyLevel()); // 1
   *
   * const user = RoleName.create('User');
   * console.log(user.getHierarchyLevel()); // 5
   * ```
   */
  getHierarchyLevel(): number {
    const lowerValue = this.value.toLowerCase();

    if ((RoleNameSpecs.SYSTEM_ROLES.ADMINISTRATOR as readonly string[]).includes(lowerValue))
      return 1;
    if ((RoleNameSpecs.SYSTEM_ROLES.MODERATOR as readonly string[]).includes(lowerValue)) return 2;
    if (this.isManagementRole()) return 3;
    if ((RoleNameSpecs.SYSTEM_ROLES.USER as readonly string[]).includes(lowerValue)) return 5;

    return 4; // Default for custom roles
  }

  /**
   * Checks if this role can assign another role.
   *
   * @param targetRole - The role to check assignment permissions for
   * @returns True if this role can assign the target role
   *
   * @example
   * ```typescript
   * const admin = RoleName.create('Administrator');
   * const manager = RoleName.create('Manager');
   * console.log(admin.canAssignRole(manager)); // true
   * console.log(manager.canAssignRole(admin)); // false
   * ```
   */
  canAssignRole(targetRole: RoleName): boolean {
    const myLevel = this.getHierarchyLevel();
    const targetLevel = targetRole.getHierarchyLevel();

    // Can only assign roles at same level or lower (higher number)
    return myLevel <= targetLevel;
  }

  /**
   * Checks if this role is equivalent to another role (considering aliases).
   *
   * @param other - The other role to compare with
   * @returns True if the roles are equivalent
   *
   * @example
   * ```typescript
   * const admin1 = RoleName.create('Administrator');
   * const admin2 = RoleName.create('Admin');
   * console.log(admin1.isEquivalentTo(admin2)); // true
   * ```
   */
  isEquivalentTo(other: RoleName): boolean {
    if (this.equals(other)) return true;

    const myLevel = this.getHierarchyLevel();
    const otherLevel = other.getHierarchyLevel();

    // Same hierarchy level and both are system roles
    return myLevel === otherLevel && this.isSystemRole() && other.isSystemRole();
  }

  /**
   * Gets the display name with proper formatting.
   *
   * @returns The formatted display name
   *
   * @example
   * ```typescript
   * const role = RoleName.create('project manager');
   * console.log(role.getDisplayName()); // "Project Manager"
   * ```
   */
  getDisplayName(): string {
    return RoleNameUtils.formatForDisplay(this.value);
  }

  /**
   * Converts the role name to a URL-friendly slug.
   *
   * @returns The role name as a slug
   *
   * @example
   * ```typescript
   * const role = RoleName.create('Project Manager');
   * console.log(role.toSlug()); // "project-manager"
   * ```
   */
  toSlug(): string {
    return RoleNameUtils.toSlug(this.value);
  }

  /**
   * Gets the role description based on the role name.
   *
   * @returns A description of the role's responsibilities
   *
   * @example
   * ```typescript
   * const admin = RoleName.create('Administrator');
   * console.log(admin.getDescription());
   * // "Full system access and user management capabilities"
   * ```
   */
  getDescription(): string {
    return RoleNameUtils.getDescription(this.value);
  }

  /**
   * Checks if this role requires multi-factor authentication.
   *
   * @returns True if MFA is required for this role
   *
   * @example
   * ```typescript
   * const admin = RoleName.create('Administrator');
   * console.log(admin.requiresMFA()); // true
   * ```
   */
  requiresMFA(): boolean {
    return this.getHierarchyLevel() <= 2; // Admin and Moderator roles
  }

  /**
   * Gets the default permissions for this role.
   *
   * @returns Array of permission strings
   *
   * @example
   * ```typescript
   * const manager = RoleName.create('Manager');
   * const permissions = manager.getDefaultPermissions();
   * console.log(permissions); // ["read:users", "update:users", "create:projects"]
   * ```
   */
  getDefaultPermissions(): string[] {
    return RoleNameUtils.getDefaultPermissions(this.value);
  }
}

/**
 * Namespace containing role name specifications and validation rules.
 *
 * @namespace RoleNameSpecs
 */
export namespace RoleNameSpecs {
  /**
   * System role definitions with aliases.
   */
  export const SYSTEM_ROLES = {
    ADMINISTRATOR: ['administrator', 'admin', 'root', 'superuser'],
    MODERATOR: ['moderator', 'mod', 'moderador'],
    USER: ['user', 'member', 'usuario'],
  } as const;

  /**
   * Management role keywords.
   */
  export const MANAGEMENT_ROLES = [
    'manager',
    'director',
    'supervisor',
    'lead',
    'coordinator',
    'chief',
    'head',
    'principal',
    'senior',
    'team lead',
  ] as const;

  /**
   * Reserved role names that cannot be used by regular users.
   */
  export const RESERVED_NAMES = [
    'system',
    'api',
    'service',
    'internal',
    'bot',
    'admin',
    'administrator',
    'root',
    'superuser',
    'god',
    'sudo',
  ] as const;

  /**
   * Role name validation patterns.
   */
  export const VALIDATION_PATTERNS = {
    VALID_CHARACTERS: /^[A-Za-z\s\-]+$/,
    VALID_START: /^[A-Za-z]/,
    NO_CONSECUTIVE_SPACES: /\s{2,}/,
    NO_CONSECUTIVE_HYPHENS: /-{2,}/,
  } as const;

  /**
   * Role name length constraints.
   */
  export const LENGTH_CONSTRAINTS = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    OPTIMAL_LENGTH: 20,
  } as const;

  /**
   * Checks if a role name has valid format.
   *
   * @param name - The role name to validate
   * @returns True if the format is valid
   */
  export function isValidFormat(name: string): boolean {
    if (!VALIDATION_PATTERNS.VALID_CHARACTERS.test(name)) return false;
    if (!VALIDATION_PATTERNS.VALID_START.test(name)) return false;
    if (VALIDATION_PATTERNS.NO_CONSECUTIVE_SPACES.test(name)) return false;
    if (VALIDATION_PATTERNS.NO_CONSECUTIVE_HYPHENS.test(name)) return false;

    return true;
  }

  /**
   * Checks if a role name is reserved.
   *
   * @param name - The role name to check
   * @returns True if the name is reserved
   */
  export function isReservedName(name: string): boolean {
    const lowerName = name.toLowerCase();
    const allSystemRoles = [
      ...SYSTEM_ROLES.ADMINISTRATOR,
      ...SYSTEM_ROLES.MODERATOR,
      ...SYSTEM_ROLES.USER,
    ];
    return RESERVED_NAMES.includes(lowerName as any) || allSystemRoles.includes(lowerName as any);
  }

  /**
   * Gets role hierarchy definitions.
   *
   * @returns Role hierarchy mapping
   */
  export function getHierarchyDefinitions(): Record<number, string[]> {
    return {
      1: [...SYSTEM_ROLES.ADMINISTRATOR],
      2: [...SYSTEM_ROLES.MODERATOR],
      3: [...MANAGEMENT_ROLES],
      4: ['analyst', 'specialist', 'coordinator', 'contributor'],
      5: [...SYSTEM_ROLES.USER],
    };
  }

  /**
   * Gets role security classifications.
   *
   * @returns Security level mapping
   */
  export function getSecurityClassifications(): Record<string, number> {
    return {
      high: 1, // Administrator
      elevated: 2, // Moderator
      medium: 3, // Manager
      standard: 4, // Custom roles
      basic: 5, // User
    };
  }
}

/**
 * Namespace containing role name utility functions.
 *
 * @namespace RoleNameUtils
 */
export namespace RoleNameUtils {
  /**
   * Normalizes a role name according to business rules.
   *
   * @param name - The raw role name
   * @returns The normalized role name
   */
  export function normalize(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/-+/g, '-')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Formats a role name for display purposes.
   *
   * @param name - The role name to format
   * @returns The formatted display name
   */
  export function formatForDisplay(name: string): string {
    return normalize(name);
  }

  /**
   * Converts a role name to a URL-friendly slug.
   *
   * @param name - The role name to convert
   * @returns The role name as a slug
   */
  export function toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
  }

  /**
   * Gets the description for a role based on its name.
   *
   * @param name - The role name
   * @returns A description of the role
   */
  export function getDescription(name: string): string {
    const lowerName = name.toLowerCase();

    if ((RoleNameSpecs.SYSTEM_ROLES.ADMINISTRATOR as readonly string[]).includes(lowerName)) {
      return 'Full system access and user management capabilities';
    }

    if ((RoleNameSpecs.SYSTEM_ROLES.MODERATOR as readonly string[]).includes(lowerName)) {
      return 'Content moderation and limited administrative privileges';
    }

    if (lowerName.includes('manager')) {
      return 'Team management and project oversight responsibilities';
    }

    if (lowerName.includes('analyst')) {
      return 'Data analysis and reporting capabilities';
    }

    if ((RoleNameSpecs.SYSTEM_ROLES.USER as readonly string[]).includes(lowerName)) {
      return 'Standard user access with basic functionality';
    }

    return 'Custom role with specialized responsibilities';
  }

  /**
   * Gets default permissions for a role.
   *
   * @param name - The role name
   * @returns Array of permission strings
   */
  export function getDefaultPermissions(name: string): string[] {
    const lowerName = name.toLowerCase();

    if ((RoleNameSpecs.SYSTEM_ROLES.ADMINISTRATOR as readonly string[]).includes(lowerName)) {
      return [
        'read:*',
        'write:*',
        'delete:*',
        'admin:*',
        'manage:users',
        'manage:roles',
        'manage:system',
      ];
    }

    if ((RoleNameSpecs.SYSTEM_ROLES.MODERATOR as readonly string[]).includes(lowerName)) {
      return [
        'read:*',
        'write:content',
        'delete:content',
        'moderate:content',
        'manage:users:limited',
      ];
    }

    if (lowerName.includes('manager')) {
      return ['read:team', 'write:team', 'manage:projects', 'read:analytics', 'assign:tasks'];
    }

    if ((RoleNameSpecs.SYSTEM_ROLES.USER as readonly string[]).includes(lowerName)) {
      return ['read:own', 'write:own', 'read:public'];
    }

    return ['read:own', 'write:own'];
  }

  /**
   * Validates a role name against business rules.
   *
   * @param name - The role name to validate
   * @returns Validation result with details
   */
  export function validateName(name: string): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Role name is required');
      return { isValid: false, errors, suggestions };
    }

    const normalized = name.trim();

    if (normalized.length < RoleNameSpecs.LENGTH_CONSTRAINTS.MIN_LENGTH) {
      errors.push(
        `Role name must be at least ${RoleNameSpecs.LENGTH_CONSTRAINTS.MIN_LENGTH} characters`
      );
    }

    if (normalized.length > RoleNameSpecs.LENGTH_CONSTRAINTS.MAX_LENGTH) {
      errors.push(
        `Role name must be at most ${RoleNameSpecs.LENGTH_CONSTRAINTS.MAX_LENGTH} characters`
      );
      suggestions.push('Consider using a shorter, more concise name');
    }

    if (!RoleNameSpecs.isValidFormat(normalized)) {
      errors.push('Role name contains invalid characters');
      suggestions.push('Use only letters, spaces, and hyphens');
    }

    if (normalized.length > RoleNameSpecs.LENGTH_CONSTRAINTS.OPTIMAL_LENGTH) {
      suggestions.push('Consider a shorter name for better usability');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Suggests alternative role names based on input.
   *
   * @param input - The attempted role name
   * @returns Array of suggested alternative names
   */
  export function suggestAlternatives(input: string): string[] {
    const lowerInput = input.toLowerCase();
    const suggestions: string[] = [];

    // Common role name mappings
    const mappings: Record<string, string[]> = {
      admin: ['Administrator', 'System Admin', 'Admin User'],
      mod: ['Moderator', 'Content Moderator', 'Community Mod'],
      user: ['Standard User', 'Member', 'Basic User'],
      manager: ['Project Manager', 'Team Manager', 'Operations Manager'],
      dev: ['Developer', 'Software Developer', 'Development Team'],
      analyst: ['Data Analyst', 'Business Analyst', 'Systems Analyst'],
    };

    for (const [key, values] of Object.entries(mappings)) {
      if (lowerInput.includes(key)) {
        suggestions.push(...values);
      }
    }

    // If no specific mappings found, suggest formatted version
    if (suggestions.length === 0 && input.trim()) {
      suggestions.push(normalize(input));
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Checks if two role names represent the same logical role.
   *
   * @param name1 - First role name
   * @param name2 - Second role name
   * @returns True if they represent the same role
   */
  export function areEquivalent(name1: string, name2: string): boolean {
    const lower1 = name1.toLowerCase();
    const lower2 = name2.toLowerCase();

    if (lower1 === lower2) return true;

    // Check if both are administrators
    const adminRoles = [...RoleNameSpecs.SYSTEM_ROLES.ADMINISTRATOR] as string[];
    if (adminRoles.includes(lower1) && adminRoles.includes(lower2)) return true;

    // Check if both are moderators
    const modRoles = [...RoleNameSpecs.SYSTEM_ROLES.MODERATOR] as string[];
    if (modRoles.includes(lower1) && modRoles.includes(lower2)) return true;

    // Check if both are users
    const userRoles = [...RoleNameSpecs.SYSTEM_ROLES.USER] as string[];
    if (userRoles.includes(lower1) && userRoles.includes(lower2)) return true;

    return false;
  }

  /**
   * Gets role statistics for analysis.
   *
   * @param roles - Array of role names to analyze
   * @returns Statistical analysis of role distribution
   */
  export function getRoleStatistics(roles: string[]): {
    totalRoles: number;
    systemRoles: number;
    managementRoles: number;
    customRoles: number;
    averageLength: number;
    hierarchyDistribution: Record<number, number>;
  } {
    const stats = {
      totalRoles: roles.length,
      systemRoles: 0,
      managementRoles: 0,
      customRoles: 0,
      averageLength: 0,
      hierarchyDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    let totalLength = 0;

    for (const role of roles) {
      const roleName = RoleName.create(role);
      totalLength += role.length;

      if (roleName.isSystemRole()) {
        stats.systemRoles++;
      } else if (roleName.isManagementRole()) {
        stats.managementRoles++;
      } else {
        stats.customRoles++;
      }

      const level = roleName.getHierarchyLevel();
      if (level >= 1 && level <= 5) {
        stats.hierarchyDistribution[level as keyof typeof stats.hierarchyDistribution]++;
      }
    }

    stats.averageLength = Math.round(totalLength / roles.length);

    return stats;
  }
}
