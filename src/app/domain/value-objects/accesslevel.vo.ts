import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * AccessLevel Value Object
 *
 * Represents a validated hierarchical access level for role-based access control (RBAC).
 * Provides fine-grained authorization control with numeric levels where lower numbers
 * indicate higher privileges, enabling flexible permission management and security policies.
 *
 * **Domain Rules:**
 * - Must be an integer between 1 and 5 (inclusive)
 * - Lower numeric values represent higher access privileges
 * - Level 1 = Administrator (highest privileges)
 * - Level 5 = Basic User (lowest privileges)
 * - Immutable once created for security consistency
 *
 * **Hierarchical Structure:**
 * - Level 1: System Administrator (full system access)
 * - Level 2: Project Manager (project and user management)
 * - Level 3: Senior User (advanced features, limited admin)
 * - Level 4: Standard User (standard application features)
 * - Level 5: Basic User (read-only or limited access)
 *
 * **Security Implications:**
 * - Access level determines feature availability and data visibility
 * - Lower levels can perform actions of higher levels (inheritance)
 * - Critical for authorization decisions throughout the application
 * - Must be validated in all permission-sensitive operations
 *
 * **Business Rules:**
 * - Level 1-2: Can create and manage user accounts
 * - Level 1-3: Can access administrative features
 * - Level 1-4: Can create and manage projects
 * - Level 5: Read-only access to assigned resources
 *
 * @example
 * ```typescript
 * // Creating validated access levels
 * const admin = AccessLevel.create(1);
 * console.log(admin.value); // 1
 * console.log(admin.isAdmin()); // true
 * console.log(admin.getDisplayName()); // 'System Administrator'
 *
 * const user = AccessLevel.create(4);
 * console.log(user.canManageProjects()); // true
 * console.log(user.canManageUsers()); // false
 *
 * // Access level comparisons
 * console.log(admin.isHigherThan(user)); // true (1 < 4)
 * console.log(admin.canPerformActionsOf(user)); // true
 * console.log(user.isAtLeast(AccessLevel.create(3))); // false (4 >= 3)
 *
 * // Permission checks
 * const permissions = admin.getPermissions();
 * console.log(permissions.canManageSystem); // true
 * console.log(permissions.canDeleteUsers); // true
 *
 * // Validation and business logic
 * if (currentUser.accessLevel.canManageUsers()) {
 *   // Allow user management operations
 * }
 *
 * // Invalid access level throws ValidationError
 * try {
 *   AccessLevel.create(10); // Out of range
 * } catch (error) {
 *   console.log(error.message); // 'Access level must not exceed 5'
 * }
 *
 * // Security enforcement
 * const requiredLevel = AccessLevel.create(2);
 * if (!userLevel.hasAccessLevel(requiredLevel)) {
 *   throw new AuthorizationError('Insufficient access level');
 * }
 * ```
 *
 * @see {@link Role} - Role entity that uses access levels
 * @see {@link Permission} - Permission system integration
 * @see {@link User} - User entity with assigned access levels
 */
export class AccessLevel {
    private constructor(public readonly value: number) {}

    /**
     * Creates a validated AccessLevel value object from a numeric input.
     *
     * Performs comprehensive validation:
     * - Validates input is a number and integer
     * - Ensures value is within valid range (1-5)
     * - Provides detailed error messages for different validation failures
     * - Uses appropriate error codes for different failure types
     *
     * @param raw - The numeric access level to validate
     * @returns A validated AccessLevel instance
     * @throws {ValidationError} When validation fails with specific error details
     *
     * @example
     * ```typescript
     * // Valid access levels
     * const admin = AccessLevel.create(1); // System Administrator
     * const manager = AccessLevel.create(2); // Project Manager
     * const senior = AccessLevel.create(3); // Senior User
     * const standard = AccessLevel.create(4); // Standard User
     * const basic = AccessLevel.create(5); // Basic User
     *
     * // Validation errors
     * try {
     *   AccessLevel.create(0); // Below minimum
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.VALUE_TOO_LOW
     * }
     *
     * try {
     *   AccessLevel.create(10); // Above maximum
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.VALUE_TOO_HIGH
     * }
     *
     * try {
     *   AccessLevel.create(3.5); // Not an integer
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_FORMAT_INVALID
     * }
     * ```
     */
    static create(raw: number): AccessLevel {
        const errors: Array<{
            field: string;
            value: unknown;
            message: string;
            code?: ValidationErrorCode;
        }> = [];

        if (typeof raw !== 'number' || !Number.isInteger(raw)) {
            errors.push({
                field: 'accessLevel',
                value: raw,
                message: 'Access level must be an integer number',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        } else {
            if (raw < AccessLevelSpecs.MIN_LEVEL) {
                errors.push({
                    field: 'accessLevel',
                    value: raw,
                    message: `Access level must be at least ${AccessLevelSpecs.MIN_LEVEL}`,
                    code: ValidationErrorCode.VALUE_TOO_LOW,
                });
            }

            if (raw > AccessLevelSpecs.MAX_LEVEL) {
                errors.push({
                    field: 'accessLevel',
                    value: raw,
                    message: `Access level must not exceed ${AccessLevelSpecs.MAX_LEVEL}`,
                    code: ValidationErrorCode.VALUE_TOO_HIGH,
                });
            }
        }

        if (errors.length) {
            throw ValidationError.createFromFields(errors);
        }

        return new AccessLevel(raw);
    }

    /**
     * Creates an AccessLevel with administrator privileges (level 1).
     *
     * @returns AccessLevel instance with maximum privileges
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.createAdmin();
     * console.log(admin.value); // 1
     * console.log(admin.isAdmin()); // true
     * console.log(admin.canManageSystem()); // true
     * ```
     */
    static createAdmin(): AccessLevel {
        return new AccessLevel(AccessLevelSpecs.ADMIN_LEVEL);
    }

    /**
     * Creates an AccessLevel with basic user privileges (level 5).
     *
     * @returns AccessLevel instance with minimum privileges
     *
     * @example
     * ```typescript
     * const basic = AccessLevel.createBasic();
     * console.log(basic.value); // 5
     * console.log(basic.isBasic()); // true
     * console.log(basic.canManageProjects()); // false
     * ```
     */
    static createBasic(): AccessLevel {
        return new AccessLevel(AccessLevelSpecs.BASIC_LEVEL);
    }

    /**
     * Creates a default AccessLevel for new users (level 4).
     *
     * @returns AccessLevel instance with standard user privileges
     *
     * @example
     * ```typescript
     * const defaultLevel = AccessLevel.createDefault();
     * console.log(defaultLevel.value); // 4
     * console.log(defaultLevel.getDisplayName()); // 'Standard User'
     * ```
     */
    static createDefault(): AccessLevel {
        return new AccessLevel(AccessLevelSpecs.DEFAULT_LEVEL);
    }

    /**
     * Validates if a numeric value represents a valid access level.
     *
     * @param raw - The number to validate
     * @returns True if the number represents a valid access level
     *
     * @example
     * ```typescript
     * console.log(AccessLevel.isValid(1)); // true
     * console.log(AccessLevel.isValid(3)); // true
     * console.log(AccessLevel.isValid(6)); // false
     * console.log(AccessLevel.isValid(0)); // false
     * console.log(AccessLevel.isValid(3.5)); // false
     *
     * // Form validation
     * const userInput = 2;
     * if (AccessLevel.isValid(userInput)) {
     *   const level = AccessLevel.create(userInput);
     *   // Process valid access level
     * }
     * ```
     */
    static isValid(raw: number): boolean {
        return (
            typeof raw === 'number' &&
            Number.isInteger(raw) &&
            raw >= AccessLevelSpecs.MIN_LEVEL &&
            raw <= AccessLevelSpecs.MAX_LEVEL
        );
    }

    /**
     * Gets all valid access level values.
     *
     * @returns Array of all valid access level numbers
     *
     * @example
     * ```typescript
     * const validLevels = AccessLevel.getAllValidLevels();
     * console.log(validLevels); // [1, 2, 3, 4, 5]
     *
     * // UI dropdown generation
     * const levelOptions = AccessLevel.getAllValidLevels().map(level => ({
     *   value: level,
     *   label: AccessLevel.create(level).getDisplayName()
     * }));
     * ```
     */
    static getAllValidLevels(): number[] {
        const levels: number[] = [];
        for (let i = AccessLevelSpecs.MIN_LEVEL; i <= AccessLevelSpecs.MAX_LEVEL; i++) {
            levels.push(i);
        }
        return levels;
    }

    /**
     * Checks value equality with another AccessLevel instance.
     *
     * @param other - The other AccessLevel instance to compare
     * @returns True if both represent the same access level
     *
     * @example
     * ```typescript
     * const level1 = AccessLevel.create(3);
     * const level2 = AccessLevel.create(3);
     * const level3 = AccessLevel.create(4);
     *
     * console.log(level1.equals(level2)); // true
     * console.log(level1.equals(level3)); // false
     * ```
     */
    equals(other: AccessLevel): boolean {
        return this.value === other.value;
    }

    /**
     * Returns the string representation of the access level.
     *
     * @returns The access level number as string
     *
     * @example
     * ```typescript
     * const level = AccessLevel.create(2);
     * console.log(level.toString()); // '2'
     * console.log(`Access Level: ${level}`); // 'Access Level: 2'
     * ```
     */
    toString(): string {
        return this.value.toString();
    }

    /**
     * Checks if this access level represents administrator privileges.
     *
     * @returns True if access level is 1 (System Administrator)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.isAdmin()); // true
     * console.log(user.isAdmin()); // false
     *
     * // Authorization check
     * if (user.accessLevel.isAdmin()) {
     *   // Allow administrative operations
     * }
     * ```
     */
    isAdmin(): boolean {
        return this.value === AccessLevelSpecs.ADMIN_LEVEL;
    }

    /**
     * Checks if this access level represents basic user privileges.
     *
     * @returns True if access level is 5 (Basic User)
     *
     * @example
     * ```typescript
     * const basic = AccessLevel.create(5);
     * const admin = AccessLevel.create(1);
     *
     * console.log(basic.isBasic()); // true
     * console.log(admin.isBasic()); // false
     *
     * // Feature limitation check
     * if (user.accessLevel.isBasic()) {
     *   // Show limited feature set
     * }
     * ```
     */
    isBasic(): boolean {
        return this.value === AccessLevelSpecs.BASIC_LEVEL;
    }

    /**
     * Checks if this access level can perform system management operations.
     *
     * @returns True if access level is 1 (System Administrator)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const manager = AccessLevel.create(2);
     *
     * console.log(admin.canManageSystem()); // true
     * console.log(manager.canManageSystem()); // false
     *
     * // System operation authorization
     * if (currentUser.accessLevel.canManageSystem()) {
     *   // Allow system configuration changes
     * }
     * ```
     */
    canManageSystem(): boolean {
        return this.value === 1;
    }

    /**
     * Checks if this access level can manage user accounts.
     *
     * @returns True if access level is 1-2 (System Administrator or Project Manager)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const manager = AccessLevel.create(2);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.canManageUsers()); // true
     * console.log(manager.canManageUsers()); // true
     * console.log(user.canManageUsers()); // false
     *
     * // User management authorization
     * if (currentUser.accessLevel.canManageUsers()) {
     *   // Show user management interface
     * }
     * ```
     */
    canManageUsers(): boolean {
        return this.value <= 2;
    }

    /**
     * Checks if this access level can manage projects.
     *
     * @returns True if access level is 1-3 (Administrator, Manager, or Senior User)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const senior = AccessLevel.create(3);
     * const standard = AccessLevel.create(4);
     *
     * console.log(admin.canManageProjects()); // true
     * console.log(senior.canManageProjects()); // true
     * console.log(standard.canManageProjects()); // false
     *
     * // Project management authorization
     * if (currentUser.accessLevel.canManageProjects()) {
     *   // Enable project creation and editing
     * }
     * ```
     */
    canManageProjects(): boolean {
        return this.value <= 3;
    }

    /**
     * Checks if this access level can access administrative features.
     *
     * @returns True if access level is 1-3 (allows admin interface access)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const senior = AccessLevel.create(3);
     * const standard = AccessLevel.create(4);
     *
     * console.log(admin.canAccessAdmin()); // true
     * console.log(senior.canAccessAdmin()); // true
     * console.log(standard.canAccessAdmin()); // false
     * ```
     */
    canAccessAdmin(): boolean {
        return this.value <= 3;
    }

    /**
     * Checks if this access level can delete user accounts.
     *
     * @returns True if access level is 1 (System Administrator only)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const manager = AccessLevel.create(2);
     *
     * console.log(admin.canDeleteUsers()); // true
     * console.log(manager.canDeleteUsers()); // false
     *
     * // Destructive operation authorization
     * if (currentUser.accessLevel.canDeleteUsers()) {
     *   // Show delete user option
     * }
     * ```
     */
    canDeleteUsers(): boolean {
        return this.value === 1;
    }

    /**
     * Checks if this access level is higher than another access level.
     *
     * Note: Lower numeric values represent higher privileges.
     *
     * @param other - The other AccessLevel to compare against
     * @returns True if this level has higher privileges (lower number)
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     * const basic = AccessLevel.create(5);
     *
     * console.log(admin.isHigherThan(user)); // true (1 < 4)
     * console.log(user.isHigherThan(basic)); // true (4 < 5)
     * console.log(user.isHigherThan(admin)); // false (4 > 1)
     *
     * // Authorization hierarchy check
     * if (managerLevel.isHigherThan(requiredLevel)) {
     *   // Allow operation
     * }
     * ```
     */
    isHigherThan(other: AccessLevel): boolean {
        return this.value < other.value; // Lower number = higher access
    }

    /**
     * Checks if this access level is at least as high as another access level.
     *
     * @param other - The other AccessLevel to compare against
     * @returns True if this level has equal or higher privileges
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const manager = AccessLevel.create(2);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.isAtLeast(manager)); // true (1 <= 2)
     * console.log(manager.isAtLeast(manager)); // true (2 <= 2)
     * console.log(user.isAtLeast(manager)); // false (4 > 2)
     *
     * // Minimum level requirement check
     * const requiredLevel = AccessLevel.create(3);
     * if (userLevel.isAtLeast(requiredLevel)) {
     *   // Grant access to feature
     * }
     * ```
     */
    isAtLeast(other: AccessLevel): boolean {
        return this.value <= other.value;
    }

    /**
     * Checks if this access level can perform actions available to another level.
     *
     * @param other - The AccessLevel whose permissions to check
     * @returns True if this level can perform all actions of the other level
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const manager = AccessLevel.create(2);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.canPerformActionsOf(user)); // true
     * console.log(manager.canPerformActionsOf(user)); // true
     * console.log(user.canPerformActionsOf(admin)); // false
     *
     * // Permission inheritance check
     * if (currentUserLevel.canPerformActionsOf(targetLevel)) {
     *   // Allow action
     * }
     * ```
     */
    canPerformActionsOf(other: AccessLevel): boolean {
        return this.isAtLeast(other);
    }

    /**
     * Checks if this access level meets the minimum requirement.
     *
     * @param requiredLevel - The minimum required AccessLevel
     * @returns True if this level meets or exceeds the requirement
     *
     * @example
     * ```typescript
     * const userLevel = AccessLevel.create(2);
     * const adminRequired = AccessLevel.create(1);
     * const managerRequired = AccessLevel.create(2);
     * const userRequired = AccessLevel.create(4);
     *
     * console.log(userLevel.hasAccessLevel(adminRequired)); // false
     * console.log(userLevel.hasAccessLevel(managerRequired)); // true
     * console.log(userLevel.hasAccessLevel(userRequired)); // true
     *
     * // Feature access control
     * if (!user.accessLevel.hasAccessLevel(requiredLevel)) {
     *   throw new AuthorizationError('Insufficient access level');
     * }
     * ```
     */
    hasAccessLevel(requiredLevel: AccessLevel): boolean {
        return this.isAtLeast(requiredLevel);
    }

    /**
     * Gets a human-readable display name for the access level.
     *
     * @returns Descriptive name for the access level
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const manager = AccessLevel.create(2);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.getDisplayName()); // 'System Administrator'
     * console.log(manager.getDisplayName()); // 'Project Manager'
     * console.log(user.getDisplayName()); // 'Standard User'
     *
     * // UI display
     * const levelBadge = `<span class="level-${level.value}">${level.getDisplayName()}</span>`;
     * ```
     */
    getDisplayName(): string {
        return AccessLevelUtils.getDisplayName(this.value);
    }

    /**
     * Gets a brief description of the access level's capabilities.
     *
     * @returns Description of what this access level can do
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.getDescription()); // 'Full system access and administration'
     * console.log(user.getDescription()); // 'Standard application features'
     *
     * // Help text or tooltips
     * <Tooltip title={level.getDescription()}>
     *   {level.getDisplayName()}
     * </Tooltip>
     * ```
     */
    getDescription(): string {
        return AccessLevelUtils.getDescription(this.value);
    }

    /**
     * Gets a CSS class name for styling the access level.
     *
     * @returns CSS class name suitable for styling
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.getCssClass()); // 'access-level-1'
     * console.log(user.getCssClass()); // 'access-level-4'
     *
     * // CSS styling
     * <div className={`user-badge ${level.getCssClass()}`}>
     *   {level.getDisplayName()}
     * </div>
     * ```
     */
    getCssClass(): string {
        return `access-level-${this.value}`;
    }

    /**
     * Gets an icon name representing the access level.
     *
     * @returns Icon name suitable for icon libraries
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.getIconName()); // 'crown'
     * console.log(user.getIconName()); // 'user'
     *
     * // Icon display
     * <Icon name={level.getIconName()} /> {level.getDisplayName()}
     * ```
     */
    getIconName(): string {
        return AccessLevelUtils.getIconName(this.value);
    }

    /**
     * Gets the semantic color associated with the access level.
     *
     * @returns Color name for UI theming
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     *
     * console.log(admin.getSemanticColor()); // 'danger'
     * console.log(user.getSemanticColor()); // 'primary'
     *
     * // Theme application
     * <Badge color={level.getSemanticColor()}>
     *   {level.getDisplayName()}
     * </Badge>
     * ```
     */
    getSemanticColor(): string {
        return AccessLevelUtils.getSemanticColor(this.value);
    }

    /**
     * Gets a comprehensive permissions object for this access level.
     *
     * @returns Object containing all permission flags
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const permissions = admin.getPermissions();
     *
     * console.log(permissions.canManageSystem); // true
     * console.log(permissions.canDeleteUsers); // true
     * console.log(permissions.canManageProjects); // true
     *
     * // Conditional UI rendering
     * {permissions.canManageUsers && <UserManagementPanel />}
     * {permissions.canAccessAdmin && <AdminLink />}
     * ```
     */
    getPermissions(): AccessLevelPermissions {
        return {
            canManageSystem: this.canManageSystem(),
            canManageUsers: this.canManageUsers(),
            canManageProjects: this.canManageProjects(),
            canAccessAdmin: this.canAccessAdmin(),
            canDeleteUsers: this.canDeleteUsers(),
            level: this.value,
            displayName: this.getDisplayName(),
            description: this.getDescription(),
        };
    }

    /**
     * Creates a permission comparison with another access level.
     *
     * @param other - The other AccessLevel to compare permissions with
     * @returns Comparison object showing permission differences
     *
     * @example
     * ```typescript
     * const admin = AccessLevel.create(1);
     * const user = AccessLevel.create(4);
     * const comparison = admin.comparePermissions(user);
     *
     * console.log(comparison.hasMorePermissions); // true
     * console.log(comparison.additionalPermissions); // ['canManageSystem', 'canDeleteUsers', ...]
     * console.log(comparison.permissionCount.current); // 5
     * console.log(comparison.permissionCount.other); // 0
     * ```
     */
    comparePermissions(other: AccessLevel): AccessLevelComparison {
        const currentPerms = this.getPermissions();
        const otherPerms = other.getPermissions();

        const currentPermCount = AccessLevelUtils.countPermissions(currentPerms);
        const otherPermCount = AccessLevelUtils.countPermissions(otherPerms);

        const additionalPermissions = AccessLevelUtils.getAdditionalPermissions(
            currentPerms,
            otherPerms
        );
        const missingPermissions = AccessLevelUtils.getAdditionalPermissions(
            otherPerms,
            currentPerms
        );

        return {
            hasMorePermissions: currentPermCount > otherPermCount,
            hasFewerPermissions: currentPermCount < otherPermCount,
            hasEqualPermissions: currentPermCount === otherPermCount,
            additionalPermissions,
            missingPermissions,
            permissionCount: {
                current: currentPermCount,
                other: otherPermCount,
                difference: currentPermCount - otherPermCount,
            },
            levelComparison: {
                isHigher: this.isHigherThan(other),
                isLower: other.isHigherThan(this),
                isEqual: this.equals(other),
                levelDifference: this.value - other.value,
            },
        };
    }
}

/**
 * AccessLevel permissions interface
 *
 * Represents all permission flags and metadata for an access level,
 * used for authorization decisions and UI conditionals.
 */
export interface AccessLevelPermissions {
    /** Can perform system administration tasks */
    canManageSystem: boolean;

    /** Can create, modify, and manage user accounts */
    canManageUsers: boolean;

    /** Can create, modify, and manage projects */
    canManageProjects: boolean;

    /** Can access administrative interface */
    canAccessAdmin: boolean;

    /** Can delete user accounts (destructive operation) */
    canDeleteUsers: boolean;

    /** The numeric access level */
    level: number;

    /** Human-readable display name */
    displayName: string;

    /** Description of capabilities */
    description: string;
}

/**
 * AccessLevel comparison result interface
 *
 * Represents the result of comparing permissions between two access levels,
 * useful for access control analysis and permission auditing.
 */
export interface AccessLevelComparison {
    /** Whether current level has more permissions than other */
    hasMorePermissions: boolean;

    /** Whether current level has fewer permissions than other */
    hasFewerPermissions: boolean;

    /** Whether both levels have equal permissions */
    hasEqualPermissions: boolean;

    /** List of permission names that current level has but other doesn't */
    additionalPermissions: string[];

    /** List of permission names that other level has but current doesn't */
    missingPermissions: string[];

    /** Permission count comparison */
    permissionCount: {
        current: number;
        other: number;
        difference: number;
    };

    /** Level numeric comparison */
    levelComparison: {
        isHigher: boolean;
        isLower: boolean;
        isEqual: boolean;
        levelDifference: number;
    };
}

/**
 * AccessLevel Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the AccessLevel value object. Used for testing, documentation, and validation.
 */
export namespace AccessLevelSpecs {
    /**
     * Minimum valid access level (highest privileges)
     */
    export const MIN_LEVEL = 1;

    /**
     * Maximum valid access level (lowest privileges)
     */
    export const MAX_LEVEL = 5;

    /**
     * Administrator access level
     */
    export const ADMIN_LEVEL = 1;

    /**
     * Basic user access level
     */
    export const BASIC_LEVEL = 5;

    /**
     * Default access level for new users
     */
    export const DEFAULT_LEVEL = 4;

    /**
     * Access level names mapped to their numeric values
     */
    export const LEVEL_NAMES = {
        [1]: 'System Administrator',
        [2]: 'Project Manager',
        [3]: 'Senior User',
        [4]: 'Standard User',
        [5]: 'Basic User',
    } as const;

    /**
     * Access level descriptions
     */
    export const LEVEL_DESCRIPTIONS = {
        [1]: 'Full system access and administration',
        [2]: 'Project and user management capabilities',
        [3]: 'Advanced features with limited administration',
        [4]: 'Standard application features',
        [5]: 'Basic read-only access to assigned resources',
    } as const;

    /**
     * Business rules for access level management
     */
    export const BUSINESS_RULES = {
        HIERARCHICAL: 'Lower numeric values represent higher privileges',
        INHERITANCE: 'Higher levels can perform actions of lower levels',
        IMMUTABLE: 'Access levels are immutable once created',
        VALIDATION: 'All access levels must be validated on creation',
        AUTHORIZATION: 'Access levels determine feature availability',
        AUDIT_REQUIRED: 'Access level changes must be audited',
    } as const;
}

/**
 * AccessLevel utility functions for formatting, validation, and business logic
 */
export namespace AccessLevelUtils {
    /**
     * Gets the display name for an access level
     *
     * @param level - The numeric access level
     * @returns Human-readable display name
     */
    export function getDisplayName(level: number): string {
        return (
            AccessLevelSpecs.LEVEL_NAMES[level as keyof typeof AccessLevelSpecs.LEVEL_NAMES] ||
            `Level ${level}`
        );
    }

    /**
     * Gets the description for an access level
     *
     * @param level - The numeric access level
     * @returns Description of capabilities
     */
    export function getDescription(level: number): string {
        return (
            AccessLevelSpecs.LEVEL_DESCRIPTIONS[
                level as keyof typeof AccessLevelSpecs.LEVEL_DESCRIPTIONS
            ] || 'Unknown access level'
        );
    }

    /**
     * Gets an appropriate icon name for an access level
     *
     * @param level - The numeric access level
     * @returns Icon name suitable for icon libraries
     */
    export function getIconName(level: number): string {
        const iconMap: Record<number, string> = {
            1: 'crown', // Administrator
            2: 'briefcase', // Project Manager
            3: 'star', // Senior User
            4: 'user', // Standard User
            5: 'user-check', // Basic User
        };

        return iconMap[level] || 'help-circle';
    }

    /**
     * Gets a semantic color for an access level
     *
     * @param level - The numeric access level
     * @returns Semantic color name
     */
    export function getSemanticColor(level: number): string {
        const colorMap: Record<number, string> = {
            1: 'danger', // Red for admin (high privilege/risk)
            2: 'warning', // Orange for manager
            3: 'info', // Blue for senior
            4: 'primary', // Primary for standard
            5: 'secondary', // Gray for basic
        };

        return colorMap[level] || 'secondary';
    }

    /**
     * Counts the number of permissions granted by an access level
     *
     * @param permissions - The permissions object
     * @returns Number of granted permissions
     */
    export function countPermissions(permissions: AccessLevelPermissions): number {
        return Object.keys(permissions).filter(
            (key) =>
                key.startsWith('can') && permissions[key as keyof AccessLevelPermissions] === true
        ).length;
    }

    /**
     * Gets additional permissions that one level has compared to another
     *
     * @param current - Current level permissions
     * @param other - Other level permissions
     * @returns Array of additional permission names
     */
    export function getAdditionalPermissions(
        current: AccessLevelPermissions,
        other: AccessLevelPermissions
    ): string[] {
        const additionalPerms: string[] = [];

        Object.keys(current).forEach((key) => {
            if (key.startsWith('can')) {
                const currentHas = current[key as keyof AccessLevelPermissions] as boolean;
                const otherHas = other[key as keyof AccessLevelPermissions] as boolean;

                if (currentHas && !otherHas) {
                    additionalPerms.push(key);
                }
            }
        });

        return additionalPerms;
    }

    /**
     * Validates if a collection of levels contains only valid values
     *
     * @param levels - Array of level numbers to validate
     * @returns Array of validation results
     */
    export function validateLevelCollection(
        levels: number[]
    ): Array<{ level: number; isValid: boolean; error?: string }> {
        return levels.map((level) => ({
            level,
            isValid: AccessLevel.isValid(level),
            error: AccessLevel.isValid(level) ? undefined : `Invalid access level: ${level}`,
        }));
    }

    /**
     * Creates a level distribution summary for reporting
     *
     * @param levelCounts - Object with level counts
     * @returns Formatted level distribution summary
     */
    export function createLevelDistribution(levelCounts: Record<number, number>): {
        total: number;
        adminCount: number;
        basicCount: number;
        averageLevel: number;
        details: Record<number, { count: number; percentage: number; name: string }>;
    } {
        const total = Object.values(levelCounts).reduce((sum, count) => sum + count, 0);

        const adminCount = levelCounts[AccessLevelSpecs.ADMIN_LEVEL] || 0;
        const basicCount = levelCounts[AccessLevelSpecs.BASIC_LEVEL] || 0;

        // Calculate weighted average level
        let weightedSum = 0;
        Object.entries(levelCounts).forEach(([level, count]) => {
            weightedSum += parseInt(level) * count;
        });
        const averageLevel = total > 0 ? weightedSum / total : 0;

        const details: Record<number, { count: number; percentage: number; name: string }> = {};

        for (let level = AccessLevelSpecs.MIN_LEVEL; level <= AccessLevelSpecs.MAX_LEVEL; level++) {
            const count = levelCounts[level] || 0;
            details[level] = {
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                name: getDisplayName(level),
            };
        }

        return {
            total,
            adminCount,
            basicCount,
            averageLevel: Math.round(averageLevel * 100) / 100,
            details,
        };
    }

    /**
     * Gets the minimum access level required for an operation
     *
     * @param operation - The operation name
     * @returns Required AccessLevel instance
     */
    export function getRequiredLevelForOperation(operation: string): AccessLevel {
        const operationLevels: Record<string, number> = {
            manage_system: 1,
            delete_users: 1,
            manage_users: 2,
            access_admin: 3,
            manage_projects: 3,
            view_projects: 4,
            basic_access: 5,
        };

        const requiredLevel = operationLevels[operation] || AccessLevelSpecs.MAX_LEVEL;
        return AccessLevel.create(requiredLevel);
    }
}
