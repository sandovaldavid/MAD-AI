import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { UserStatus } from '../enums/user-status.enum';

/**
 * UserStatusVO Value Object
 *
 * Represents a validated user account status for lifecycle management and access control.
 * Ensures only valid status transitions and provides business logic for user account
 * management, security enforcement, and operational workflows.
 *
 * **Domain Rules:**
 * - Must be one of the predefined UserStatus enum values
 * - Case-insensitive input with normalization to standard format
 * - Immutable once created for audit consistency
 * - Supports status transition validation and business rules
 * - Critical for access control and security enforcement
 *
 * **Business Rules:**
 * - ACTIVE: User can authenticate and access all authorized features
 * - INACTIVE: User account is temporarily disabled, can be reactivated
 * - SUSPENDED: User account is suspended due to policy violations
 * - PENDING: User account is awaiting activation or verification
 *
 * **Security Implications:**
 * - Status directly affects authentication and authorization decisions
 * - Audit trail required for all status changes
 * - Some status transitions require administrative privileges
 * - Status affects data retention and privacy compliance
 *
 * **Operational Considerations:**
 * - Status changes trigger automated workflows and notifications
 * - Different statuses have different UI/UX presentations
 * - Integration with compliance and monitoring systems
 * - Impact on license allocation and billing systems
 *
 * @example
 * ```typescript
 * // Creating validated user status
 * const active = UserStatusVO.create('active');
 * console.log(active.value); // UserStatus.ACTIVE
 * console.log(active.isActive()); // true
 * console.log(active.canAuthenticate()); // true
 *
 * // Case-insensitive creation
 * const suspended = UserStatusVO.create('SUSPENDED');
 * console.log(suspended.value); // UserStatus.SUSPENDED
 * console.log(suspended.isSuspended()); // true
 *
 * // Status validation
 * const isValid = UserStatusVO.isValid('active'); // true
 * const isInvalid = UserStatusVO.isValid('unknown'); // false
 *
 * // Status transition validation
 * const canTransition = active.canTransitionTo(UserStatus.SUSPENDED); // true
 * const invalidTransition = suspended.canTransitionTo(UserStatus.DELETED); // false
 *
 * // Business logic queries
 * console.log(active.requiresVerification()); // false
 * console.log(active.isOperational()); // true
 * console.log(active.getDisplayName()); // 'Active'
 *
 * // Invalid status throws ValidationError
 * try {
 *   UserStatusVO.create('invalid-status');
 * } catch (error) {
 *   console.log(error.message); // 'Invalid user status. Must be one of: active, inactive, suspended, pending, deleted'
 * }
 *
 * // Audit and workflow integration
 * const statusChange = active.createTransitionTo(UserStatus.SUSPENDED, 'Policy violation');
 * console.log(statusChange.reason); // 'Policy violation'
 * console.log(statusChange.requiresApproval); // true
 * ```
 *
 * @see {@link UserStatus} - Enumeration of valid status values
 * @see {@link User} - User entity that uses this value object
 * @see {@link UserStatusTransition} - Status change audit trail
 */
export class UserStatusVO {
  private constructor(public readonly value: UserStatus) {}

  /**
   * Canonical list of all allowed user status values.
   * Used for validation, UI generation, and business logic decisions.
   */
  static readonly allowed: readonly UserStatus[] = Object.values(UserStatus) as UserStatus[];

  /**
   * Creates a validated UserStatusVO value object from a raw string input.
   *
   * Performs comprehensive validation and normalization:
   * - Validates input is a non-empty string
   * - Normalizes to lowercase and trims whitespace
   * - Validates against allowed UserStatus enum values
   * - Provides detailed error messages with suggestions for invalid inputs
   *
   * @param raw - The raw status string to validate
   * @returns A validated UserStatusVO instance
   * @throws {ValidationError} When validation fails with specific error details
   *
   * @example
   * ```typescript
   * // Valid status creation
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('SUSPENDED'); // Case insensitive
   * const pending = UserStatusVO.create('  pending  '); // Whitespace handled
   *
   * // Validation errors
   * try {
   *   UserStatusVO.create('invalid');
   * } catch (error) {
   *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_FORMAT_INVALID
   *   console.log(error.errors[0].message); // Detailed error with valid options
   * }
   *
   * try {
   *   UserStatusVO.create('');
   * } catch (error) {
   *   console.log(error.errors[0].code); // ValidationErrorCode.REQUIRED_FIELD_MISSING
   * }
   * ```
   */
  static create(raw: string): UserStatusVO {
    if (!raw || typeof raw !== 'string') {
      throw ValidationError.createFromFields([
        {
          field: 'userStatus',
          value: raw,
          message: 'User status is required and must be a valid string',
          code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        },
      ]);
    }

    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0) {
      throw ValidationError.createFromFields([
        {
          field: 'userStatus',
          value: raw,
          message: 'User status cannot be empty',
          code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        },
      ]);
    }

    const found = UserStatusVO.allowed.find((status) => status.toLowerCase() === normalized);
    if (!found) {
      const validOptions = UserStatusVO.allowed.join(', ');
      throw ValidationError.createFromFields([
        {
          field: 'userStatus',
          value: raw,
          message: `Invalid user status. Must be one of: ${validOptions}`,
          code: ValidationErrorCode.FIELD_FORMAT_INVALID,
        },
      ]);
    }

    return new UserStatusVO(found);
  }

  /**
   * Validates if a raw string represents a valid user status without creating the value object.
   *
   * Useful for pre-validation, form validation, and conditional logic
   * without the overhead of exception handling.
   *
   * @param raw - The string to validate
   * @returns True if the string represents a valid user status
   *
   * @example
   * ```typescript
   * // Validation checks
   * console.log(UserStatusVO.isValid('active')); // true
   * console.log(UserStatusVO.isValid('SUSPENDED')); // true
   * console.log(UserStatusVO.isValid('invalid')); // false
   * console.log(UserStatusVO.isValid('')); // false
   * console.log(UserStatusVO.isValid(null)); // false
   *
   * // Form validation usage
   * const userInput = 'pending';
   * if (UserStatusVO.isValid(userInput)) {
   *   const status = UserStatusVO.create(userInput);
   *   // Process valid status
   * } else {
   *   // Show validation error
   * }
   * ```
   */
  static isValid(raw: string | null | undefined): boolean {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return false;
    }

    const normalized = raw.trim().toLowerCase();
    return UserStatusVO.allowed.some((status) => status.toLowerCase() === normalized);
  }

  /**
   * Gets all valid user status values.
   *
   * @returns Array of all valid UserStatus enum values
   *
   * @example
   * ```typescript
   * const validStatuses = UserStatusVO.getAllowedValues();
   * console.log(validStatuses); // ['active', 'inactive', 'suspended', 'pending', 'deleted']
   *
   * // UI dropdown generation
   * const statusOptions = UserStatusVO.getAllowedValues().map(status => ({
   *   value: status,
   *   label: UserStatusVO.create(status).getDisplayName()
   * }));
   * ```
   */
  static getAllowedValues(): UserStatus[] {
    return [...UserStatusVO.allowed];
  }

  /**
   * Creates a UserStatusVO with default PENDING status.
   *
   * Used for new user account creation where status needs to be set
   * but verification is pending.
   *
   * @returns UserStatusVO with PENDING status
   *
   * @example
   * ```typescript
   * const newUserStatus = UserStatusVO.createDefault();
   * console.log(newUserStatus.value); // UserStatus.PENDING
   * console.log(newUserStatus.requiresVerification()); // true
   * ```
   */
  static createDefault(): UserStatusVO {
    return new UserStatusVO(UserStatus.PENDING);
  }

  /**
   * Checks value equality with another UserStatusVO instance.
   *
   * @param other - The other UserStatusVO instance to compare
   * @returns True if both represent the same user status
   *
   * @example
   * ```typescript
   * const status1 = UserStatusVO.create('active');
   * const status2 = UserStatusVO.create('ACTIVE');
   * const status3 = UserStatusVO.create('suspended');
   *
   * console.log(status1.equals(status2)); // true (case insensitive)
   * console.log(status1.equals(status3)); // false
   * ```
   */
  equals(other: UserStatusVO): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the user status.
   *
   * @returns The UserStatus enum value as string
   *
   * @example
   * ```typescript
   * const status = UserStatusVO.create('active');
   * console.log(status.toString()); // 'active'
   * console.log(`User is ${status}`); // 'User is active'
   * ```
   */
  toString(): string {
    return this.value;
  }

  /**
   * Checks if the user status is ACTIVE.
   *
   * @returns True if status is ACTIVE
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   *
   * console.log(active.isActive()); // true
   * console.log(suspended.isActive()); // false
   *
   * // Business logic usage
   * if (user.status.isActive()) {
   *   // User can access all features
   * }
   * ```
   */
  isActive(): boolean {
    return this.value === UserStatus.ACTIVE;
  }

  /**
   * Checks if the user status is INACTIVE.
   *
   * @returns True if status is INACTIVE
   *
   * @example
   * ```typescript
   * const inactive = UserStatusVO.create('inactive');
   * console.log(inactive.isInactive()); // true
   *
   * // Temporary deactivation check
   * if (user.status.isInactive()) {
   *   // Show reactivation options
   * }
   * ```
   */
  isInactive(): boolean {
    return this.value === UserStatus.INACTIVE;
  }

  /**
   * Checks if the user status is SUSPENDED.
   *
   * @returns True if status is SUSPENDED
   *
   * @example
   * ```typescript
   * const suspended = UserStatusVO.create('suspended');
   * console.log(suspended.isSuspended()); // true
   *
   * // Security enforcement
   * if (user.status.isSuspended()) {
   *   // Block access and show suspension notice
   * }
   * ```
   */
  isSuspended(): boolean {
    return this.value === UserStatus.SUSPENDED;
  }

  /**
   * Checks if the user can authenticate with this status.
   *
   * Users with ACTIVE and PENDING status can authenticate,
   * but PENDING users may have limited access.
   *
   * @returns True if user can authenticate
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   * const pending = UserStatusVO.create('pending');
   *
   * console.log(active.canAuthenticate()); // true
   * console.log(suspended.canAuthenticate()); // false
   * console.log(pending.canAuthenticate()); // true (but limited access)
   *
   * // Authentication logic
   * if (!user.status.canAuthenticate()) {
   *   throw new AuthenticationError('Account access restricted');
   * }
   * ```
   */
  canAuthenticate(): boolean {
    return this.value === UserStatus.ACTIVE || this.value === UserStatus.PENDING;
  }

  /**
   * Checks if the user status requires verification or activation.
   *
   * @returns True if status requires verification
   *
   * @example
   * ```typescript
   * const pending = UserStatusVO.create('pending');
   * const active = UserStatusVO.create('active');
   *
   * console.log(pending.requiresVerification()); // true
   * console.log(active.requiresVerification()); // false
   *
   * // Onboarding workflow
   * if (user.status.requiresVerification()) {
   *   // Show verification process
   * }
   * ```
   */
  requiresVerification(): boolean {
    return this.value === UserStatus.PENDING;
  }

  /**
   * Checks if the user status represents an operational/functional account.
   *
   * Operational accounts can perform business functions.
   * Non-operational accounts are in transitional or restricted states.
   *
   * @returns True if status represents operational account
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   * const deleted = UserStatusVO.create('deleted');
   *
   * console.log(active.isOperational()); // true
   * console.log(suspended.isOperational()); // false
   * console.log(deleted.isOperational()); // false
   *
   * // Feature access control
   * if (user.status.isOperational()) {
   *   // Enable full feature set
   * }
   * ```
   */
  isOperational(): boolean {
    return this.value === UserStatus.ACTIVE;
  }

  /**
   * Checks if status transition to another status is allowed.
   *
   * Implements business rules for valid status transitions:
   * - PENDING can transition to ACTIVE, INACTIVE, SUSPENDED
   * - ACTIVE can transition to INACTIVE, SUSPENDED
   * - INACTIVE can transition to ACTIVE, SUSPENDED
   * - SUSPENDED can transition to ACTIVE, INACTIVE
   *
   * @param targetStatus - The target status to transition to
   * @returns True if transition is allowed
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   *
   * console.log(active.canTransitionTo(UserStatus.SUSPENDED)); // true
   * console.log(active.canTransitionTo(UserStatus.PENDING)); // false
   *
   * // Status change validation
   * if (currentStatus.canTransitionTo(newStatus)) {
   *   // Proceed with status change
   * } else {
   *   throw new ValidationError('Invalid status transition');
   * }
   * ```
   */
  canTransitionTo(targetStatus: UserStatus): boolean {
    // Cannot transition to the same status
    if (this.value === targetStatus) {
      return false;
    }

    // Define valid transitions for each status
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED],
      [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
      [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
    };

    return validTransitions[this.value].includes(targetStatus);
  }

  /**
   * Gets a human-readable display name for the status.
   *
   * @returns Formatted display name with proper capitalization
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   *
   * console.log(active.getDisplayName()); // 'Active'
   * console.log(suspended.getDisplayName()); // 'Suspended'
   *
   * // UI display
   * const statusBadge = `<span class="status-${status.value}">${status.getDisplayName()}</span>`;
   * ```
   */
  getDisplayName(): string {
    return UserStatusVOUtils.formatDisplayName(this.value);
  }

  /**
   * Gets a CSS class name for styling the status.
   *
   * @returns CSS class name suitable for styling
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   *
   * console.log(active.getCssClass()); // 'status-active'
   * console.log(suspended.getCssClass()); // 'status-suspended'
   *
   * // CSS styling
   * <div className={`user-badge ${status.getCssClass()}`}>
   *   {status.getDisplayName()}
   * </div>
   * ```
   */
  getCssClass(): string {
    return `status-${this.value.toLowerCase()}`;
  }

  /**
   * Gets an icon name representing the status.
   *
   * @returns Icon name suitable for icon libraries
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   *
   * console.log(active.getIconName()); // 'check-circle'
   * console.log(suspended.getIconName()); // 'ban'
   *
   * // Icon display
   * <Icon name={status.getIconName()} /> {status.getDisplayName()}
   * ```
   */
  getIconName(): string {
    return UserStatusVOUtils.getIconForStatus(this.value);
  }

  /**
   * Gets the semantic color associated with the status.
   *
   * @returns Color name for UI theming
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const suspended = UserStatusVO.create('suspended');
   *
   * console.log(active.getSemanticColor()); // 'success'
   * console.log(suspended.getSemanticColor()); // 'warning'
   *
   * // Theme application
   * <Badge color={status.getSemanticColor()}>
   *   {status.getDisplayName()}
   * </Badge>
   * ```
   */
  getSemanticColor(): string {
    return UserStatusVOUtils.getColorForStatus(this.value);
  }

  /**
   * Creates a status transition metadata object for audit purposes.
   *
   * @param targetStatus - The target status to transition to
   * @param reason - Optional reason for the transition
   * @returns Status transition metadata
   *
   * @example
   * ```typescript
   * const active = UserStatusVO.create('active');
   * const transition = active.createTransitionTo(UserStatus.SUSPENDED, 'Policy violation');
   *
   * console.log(transition.fromStatus); // UserStatus.ACTIVE
   * console.log(transition.toStatus); // UserStatus.SUSPENDED
   * console.log(transition.reason); // 'Policy violation'
   * console.log(transition.requiresApproval); // true
   *
   * // Audit trail creation
   * const auditEntry = {
   *   ...transition,
   *   timestamp: new Date(),
   *   userId: user.id,
   *   actionBy: currentUser.id
   * };
   * ```
   */
  createTransitionTo(targetStatus: UserStatus, reason?: string): UserStatusTransition {
    if (!this.canTransitionTo(targetStatus)) {
      throw ValidationError.createFromFields([
        {
          field: 'statusTransition',
          value: `${this.value} -> ${targetStatus}`,
          message: `Invalid status transition from ${this.value} to ${targetStatus}`,
          code: ValidationErrorCode.INVALID_STATE,
        },
      ]);
    }

    return {
      fromStatus: this.value,
      toStatus: targetStatus,
      reason: reason || '',
      requiresApproval: UserStatusVOUtils.transitionRequiresApproval(this.value, targetStatus),
      severity: UserStatusVOUtils.getTransitionSeverity(this.value, targetStatus),
      notificationRequired: UserStatusVOUtils.shouldNotifyUser(this.value, targetStatus),
    };
  }
}

/**
 * UserStatus transition metadata interface
 *
 * Represents the metadata for a user status transition,
 * used for audit trails, workflow management, and compliance.
 */
export interface UserStatusTransition {
  /** The current/source status */
  fromStatus: UserStatus;

  /** The target/destination status */
  toStatus: UserStatus;

  /** Optional reason for the transition */
  reason: string;

  /** Whether the transition requires administrative approval */
  requiresApproval: boolean;

  /** Severity level of the transition (low, medium, high) */
  severity: 'low' | 'medium' | 'high';

  /** Whether the user should be notified of this transition */
  notificationRequired: boolean;
}

/**
 * UserStatusVO Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the UserStatusVO value object. Used for testing, documentation, and validation.
 */
export namespace UserStatusVOSpecs {
  /**
   * All valid user status values
   */
  export const VALID_STATUSES = Object.values(UserStatus);

  /**
   * Status values that allow authentication
   */
  export const AUTHENTICATABLE_STATUSES = [UserStatus.ACTIVE, UserStatus.PENDING];

  /**
   * Status values that represent operational accounts
   */
  export const OPERATIONAL_STATUSES = [UserStatus.ACTIVE];

  /**
   * Status values that require verification
   */
  export const VERIFICATION_REQUIRED_STATUSES = [UserStatus.PENDING];

  /**
   * Status values that represent restricted access
   */
  export const RESTRICTED_STATUSES = [UserStatus.SUSPENDED, UserStatus.INACTIVE];

  /**
   * Business rules for user status management
   */
  export const BUSINESS_RULES = {
    DEFAULT_STATUS: 'New users start with PENDING status',
    AUTHENTICATION: 'Only ACTIVE and PENDING users can authenticate',
    FINAL_STATE: 'DELETED is a final state with no transitions',
    VERIFICATION: 'PENDING users require email/account verification',
    AUDIT_REQUIRED: 'All status changes must be audited',
    NOTIFICATION: 'Users must be notified of significant status changes',
  } as const;

  /**
   * Status transition matrix defining valid transitions
   */
  export const TRANSITION_MATRIX: Record<UserStatus, UserStatus[]> = {
    [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED],
    [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
    [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
    [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
  };
}

/**
 * UserStatusVO utility functions for formatting, validation, and business logic
 */
export namespace UserStatusVOUtils {
  /**
   * Formats a user status value into a display-friendly name
   *
   * @param status - The UserStatus enum value
   * @returns Formatted display name
   */
  export function formatDisplayName(status: UserStatus): string {
    const displayNames: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'Active',
      [UserStatus.INACTIVE]: 'Inactive',
      [UserStatus.SUSPENDED]: 'Suspended',
      [UserStatus.PENDING]: 'Pending',
    };

    return displayNames[status] || status;
  }

  /**
   * Gets an appropriate icon name for a user status
   *
   * @param status - The UserStatus enum value
   * @returns Icon name suitable for icon libraries
   */
  export function getIconForStatus(status: UserStatus): string {
    const iconMap: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'check-circle',
      [UserStatus.INACTIVE]: 'pause-circle',
      [UserStatus.SUSPENDED]: 'ban',
      [UserStatus.PENDING]: 'clock',
    };

    return iconMap[status] || 'help-circle';
  }

  /**
   * Gets a semantic color for a user status
   *
   * @param status - The UserStatus enum value
   * @returns Semantic color name
   */
  export function getColorForStatus(status: UserStatus): string {
    const colorMap: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: 'success',
      [UserStatus.INACTIVE]: 'secondary',
      [UserStatus.SUSPENDED]: 'warning',
      [UserStatus.PENDING]: 'info',
    };

    return colorMap[status] || 'secondary';
  }

  /**
   * Checks if a status transition requires administrative approval
   *
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns True if approval is required
   */
  export function transitionRequiresApproval(
    fromStatus: UserStatus,
    toStatus: UserStatus
  ): boolean {
    // Transitions to SUSPENDED typically require approval
    if (toStatus === UserStatus.SUSPENDED) {
      return true;
    }

    // Reactivating suspended users requires approval
    if (fromStatus === UserStatus.SUSPENDED && toStatus === UserStatus.ACTIVE) {
      return true;
    }

    return false;
  }

  /**
   * Gets the severity level of a status transition
   *
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns Severity level (low, medium, high)
   */
  export function getTransitionSeverity(
    fromStatus: UserStatus,
    toStatus: UserStatus
  ): 'low' | 'medium' | 'high' {
    // High severity: Suspension
    if (toStatus === UserStatus.SUSPENDED) {
      return 'high';
    }

    // Medium severity: Major state changes
    if (
      (fromStatus === UserStatus.SUSPENDED && toStatus === UserStatus.ACTIVE) ||
      (fromStatus === UserStatus.ACTIVE && toStatus === UserStatus.INACTIVE)
    ) {
      return 'medium';
    }

    // Low severity: Minor state changes
    return 'low';
  }

  /**
   * Determines if user should be notified of a status transition
   *
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns True if user should be notified
   */
  export function shouldNotifyUser(fromStatus: UserStatus, toStatus: UserStatus): boolean {
    // Always notify for significant state changes
    if (
      toStatus === UserStatus.SUSPENDED ||
      (fromStatus === UserStatus.SUSPENDED && toStatus === UserStatus.ACTIVE)
    ) {
      return true;
    }

    // Notify when activating pending accounts
    if (fromStatus === UserStatus.PENDING && toStatus === UserStatus.ACTIVE) {
      return true;
    }

    return false;
  }

  /**
   * Gets all statuses that a given status can transition to
   *
   * @param status - The current status
   * @returns Array of valid target statuses
   */
  export function getValidTransitions(status: UserStatus): UserStatus[] {
    return UserStatusVOSpecs.TRANSITION_MATRIX[status] || [];
  }

  /**
   * Validates if a collection of statuses contains only valid values
   *
   * @param statuses - Array of status strings to validate
   * @returns Array of validation results
   */
  export function validateStatusCollection(
    statuses: string[]
  ): Array<{ status: string; isValid: boolean; error?: string }> {
    return statuses.map((status) => ({
      status,
      isValid: UserStatusVO.isValid(status),
      error: UserStatusVO.isValid(status) ? undefined : `Invalid status: ${status}`,
    }));
  }

  /**
   * Creates a status summary for reporting and analytics
   *
   * @param statusCounts - Object with status counts
   * @returns Formatted status summary
   */
  export function createStatusSummary(statusCounts: Record<UserStatus, number>): {
    total: number;
    operational: number;
    restricted: number;
    pending: number;
    details: Record<UserStatus, { count: number; percentage: number }>;
  } {
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    const operational = statusCounts[UserStatus.ACTIVE] || 0;
    const restricted =
      (statusCounts[UserStatus.SUSPENDED] || 0) + (statusCounts[UserStatus.INACTIVE] || 0);
    const pending = statusCounts[UserStatus.PENDING] || 0;

    const details: Record<UserStatus, { count: number; percentage: number }> = {} as any;

    for (const status of UserStatusVOSpecs.VALID_STATUSES) {
      const count = statusCounts[status] || 0;
      details[status] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    }

    return {
      total,
      operational,
      restricted,
      pending,
      details,
    };
  }
}
