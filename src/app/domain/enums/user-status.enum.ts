/**
 * User Status enumeration for the MAD-AI system.
 * Represents all possible states a user account can have.
 * 
 * @description This enum encapsulates the user lifecycle states with
 * clear business semantics. Each status represents a distinct state
 * in the user account lifecycle with specific access permissions.
 * 
 * **State Transition Rules:**
 * - PENDING → ACTIVE (email verification or admin approval)
 * - PENDING → INACTIVE (user chooses not to activate)
 * - ACTIVE → SUSPENDED (policy violation or admin action)
 * - ACTIVE → INACTIVE (user deactivation or admin action)
 * - SUSPENDED → ACTIVE (suspension lifted)
 * - INACTIVE → ACTIVE (reactivation requested)
 * 
 * **Access Levels:**
 * - ACTIVE: Full system access
 * - PENDING: Limited access, awaiting verification
 * - INACTIVE: No access, account disabled
 * - SUSPENDED: No access, account temporarily blocked
 * 
 * @example
 * ```typescript
 * const status = UserStatus.ACTIVE;
 * if (UserStatusUtils.isActive(status)) {
 *   // Grant full access
 * }
 * ```
 * 
 * @since 1.0.0
 * @domain User Management
 */
export enum UserStatus {
    /** User account is active and has full system access */
    ACTIVE = 'active',
    /** User account is inactive and cannot access the system */
    INACTIVE = 'inactive',
    /** User account is suspended due to policy violations */
    SUSPENDED = 'suspended',
    /** User account is pending activation (new registrations) */
    PENDING = 'pending',
}

/**
 * Human-readable labels for user status values.
 * Used for UI display and internationalization support.
 * 
 * @description Maps each UserStatus enum value to its corresponding
 * display label in Spanish. These labels should be used in UI
 * components instead of raw enum values.
 * 
 * @since 1.0.0
 * @domain User Management
 */
export const USER_STATUS_LABELS = {
    [UserStatus.ACTIVE]: 'Activo',
    [UserStatus.INACTIVE]: 'Inactivo',
    [UserStatus.SUSPENDED]: 'Suspendido',
    [UserStatus.PENDING]: 'Pendiente',
} as const;

/**
 * Utility functions for UserStatus enum operations.
 * Provides business logic, validation, and state transition rules.
 * 
 * @description This utility object encapsulates all business rules
 * related to user status management, including valid transitions,
 * access control logic, and validation functions.
 * 
 * **Design Principles:**
 * - Pure functions without side effects
 * - Immutable operations
 * - Business rule encapsulation
 * - Type-safe operations
 * 
 * @since 1.0.0
 * @domain User Management
 */
export const UserStatusUtils = {
    /**
     * Gets the default status for new user accounts.
     * 
     * @description New users start in PENDING status until they
     * complete email verification or admin approval processes.
     * 
     * @returns Default user status for new accounts
     * 
     * @example
     * ```typescript
     * const newUserStatus = UserStatusUtils.getDefault();
     * // Returns UserStatus.PENDING
     * ```
     * 
     * @since 1.0.0
     */
    getDefault(): UserStatus {
        return UserStatus.PENDING;
    },
    
    /**
     * Gets all available user status values.
     * 
     * @description Returns an array of all possible UserStatus values.
     * Useful for generating UI dropdowns and validation lists.
     * 
     * @returns Array of all UserStatus enum values
     * 
     * @example
     * ```typescript
     * const allStatuses = UserStatusUtils.getAll();
     * // Returns [UserStatus.ACTIVE, UserStatus.INACTIVE, ...]
     * ```
     * 
     * @since 1.0.0
     */
    getAll(): UserStatus[] {
        return Object.values(UserStatus);
    },
    
    /**
     * Checks if a status represents an active user.
     * 
     * @description Determines if a user with the given status
     * has full system access and active account privileges.
     * 
     * @param status - User status to check
     * @returns true if user is active, false otherwise
     * 
     * @example
     * ```typescript
     * if (UserStatusUtils.isActive(user.status)) {
     *   // User has full access
     * }
     * ```
     * 
     * @since 1.0.0
     */
    isActive(status: UserStatus): boolean {
        return status === UserStatus.ACTIVE;
    },
    
    /**
     * Checks if a status can transition to ACTIVE.
     * 
     * @description Implements business rule for valid transitions
     * to active status. Only INACTIVE and PENDING users can be activated.
     * 
     * @param status - Current user status
     * @returns true if activation is allowed, false otherwise
     * 
     * @example
     * ```typescript
     * if (UserStatusUtils.canActivate(currentStatus)) {
     *   // Show activation option
     * }
     * ```
     * 
     * @since 1.0.0
     */
    canActivate(status: UserStatus): boolean {
        return [UserStatus.INACTIVE, UserStatus.PENDING].includes(status);
    },
    
    /**
     * Checks if a status can transition to SUSPENDED.
     * 
     * @description Implements business rule that only active users
     * can be suspended. Suspension is a disciplinary action for
     * policy violations.
     * 
     * @param status - Current user status
     * @returns true if suspension is allowed, false otherwise
     * 
     * @example
     * ```typescript
     * if (UserStatusUtils.canSuspend(currentStatus)) {
     *   // Show suspension option for admins
     * }
     * ```
     * 
     * @since 1.0.0
     */
    canSuspend(status: UserStatus): boolean {
        return status === UserStatus.ACTIVE;
    },

    /**
     * Checks if a status can transition to INACTIVE.
     * 
     * @description Implements business rule for deactivation.
     * Active and suspended users can be deactivated.
     * 
     * @param status - Current user status
     * @returns true if deactivation is allowed, false otherwise
     * 
     * @example
     * ```typescript
     * if (UserStatusUtils.canDeactivate(currentStatus)) {
     *   // Show deactivation option
     * }
     * ```
     * 
     * @since 1.0.0
     */
    canDeactivate(status: UserStatus): boolean {
        return [UserStatus.ACTIVE, UserStatus.SUSPENDED].includes(status);
    },

    /**
     * Checks if a status represents a blocked user.
     * 
     * @description Determines if a user is blocked from system access
     * due to suspension or deactivation.
     * 
     * @param status - User status to check
     * @returns true if user is blocked, false otherwise
     * 
     * @example
     * ```typescript
     * if (UserStatusUtils.isBlocked(user.status)) {
     *   // Deny access and show message
     * }
     * ```
     * 
     * @since 1.0.0
     */
    isBlocked(status: UserStatus): boolean {
        return [UserStatus.SUSPENDED, UserStatus.INACTIVE].includes(status);
    },

    /**
     * Gets the display label for a status value.
     * 
     * @description Returns the human-readable label for UI display.
     * Uses the USER_STATUS_LABELS mapping for consistent labeling.
     * 
     * @param status - UserStatus enum value
     * @returns Localized label string
     * 
     * @example
     * ```typescript
     * const label = UserStatusUtils.getLabel(UserStatus.ACTIVE);
     * // Returns "Activo"
     * ```
     * 
     * @since 1.0.0
     */
    getLabel(status: UserStatus): string {
        return USER_STATUS_LABELS[status];
    },
    
    /**
     * Converts a string value to UserStatus enum.
     * 
     * @description Safely converts string input to UserStatus with
     * null return for invalid values. Useful for parsing external data.
     * 
     * @param value - String value to convert
     * @returns UserStatus enum or null if invalid
     * 
     * @example
     * ```typescript
     * const status = UserStatusUtils.fromString('active');
     * // Returns UserStatus.ACTIVE or null
     * ```
     * 
     * @since 1.0.0
     */
    fromString(value: string): UserStatus | null {
        const status = Object.values(UserStatus).find(s => s === value);
        return status || null;
    },

    /**
     * Type guard to check if a value is a valid UserStatus.
     * 
     * @description Validates that an unknown value is a valid UserStatus
     * enum value. Useful for runtime type checking and validation.
     * 
     * @param value - Value to validate
     * @returns true if value is UserStatus, false otherwise
     * 
     * @example
     * ```typescript
     * if (UserStatusUtils.isValid(input)) {
     *   // input is guaranteed to be UserStatus
     *   processUserStatus(input);
     * }
     * ```
     * 
     * @since 1.0.0
     */
    isValid(value: unknown): value is UserStatus {
        return typeof value === 'string' && 
               Object.values(UserStatus).includes(value as UserStatus);
    }
} as const;
