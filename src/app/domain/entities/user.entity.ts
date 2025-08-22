import {
    Email,
    Username,
    FirstName,
    LastName,
    ISODateTime,
    UserStatusVO,
    UserNotificationPreferences,
} from '../value-objects';
import { Role } from './role.entity';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import type { FieldError } from '../errors/field-error.type';
import { DomainEvent, DomainEventType } from '../events/domain-event.entity';

export class User {
    private _domainEvents: DomainEvent[] = [];

    private constructor(
        public readonly id: number,
        private _username: Username,
        private _email: Email,
        private _firstName: FirstName,
        private _lastName: LastName,
        private _active: boolean,
        private _role: Role,
        public readonly createdAt?: ISODateTime,
        public readonly updatedAt?: ISODateTime,
        public readonly lastActivityAt?: ISODateTime,
        public readonly status?: UserStatusVO,
        public readonly isEmailConfirmed?: boolean,
        public readonly profileCompleted?: boolean,
        public readonly notificationPreferences?: UserNotificationPreferences
    ) {}

    /** Factory method con validación de invariantes */
    static create(props: {
        id: number;
        username: Username;
        email: Email;
        firstName: FirstName;
        lastName: LastName;
        isActive: boolean;
        role: Role;
        createdAt?: ISODateTime;
        updatedAt?: ISODateTime;
        lastActivityAt?: ISODateTime;
        status?: UserStatusVO;
        isEmailConfirmed?: boolean;
        profileCompleted?: boolean;
        notificationPreferences?: UserNotificationPreferences;
    }): User {
        const errors: FieldError[] = [];

        // Validar invariantes de entidad
        if (typeof props.id !== 'number' || !Number.isInteger(props.id) || props.id <= 0) {
            errors.push({
                field: 'id',
                value: props.id,
                message: 'User.id must be a positive integer',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        if (!props.username) {
            errors.push({
                field: 'username',
                value: props.username,
                message: 'Username is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (!props.email) {
            errors.push({
                field: 'email',
                value: props.email,
                message: 'Email is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (!props.firstName) {
            errors.push({
                field: 'firstName',
                value: props.firstName,
                message: 'FirstName is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (!props.lastName) {
            errors.push({
                field: 'lastName',
                value: props.lastName,
                message: 'LastName is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (!props.role) {
            errors.push({
                field: 'role',
                value: props.role,
                message: 'Role is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (errors.length) {
            throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
        }

        return new User(
            props.id,
            props.username,
            props.email,
            props.firstName,
            props.lastName,
            props.isActive,
            props.role,
            props.createdAt,
            props.updatedAt,
            props.lastActivityAt,
            props.status,
            props.isEmailConfirmed,
            props.profileCompleted,
            props.notificationPreferences
        );
    }

    // --- Domain Events Management ---

    /**
     * Adds a domain event to the aggregate.
     * Events will be published when the aggregate is persisted.
     *
     * @param event - Domain event to add
     * @private
     */
    private addDomainEvent(event: DomainEvent): void {
        this._domainEvents.push(event);
    }

    /**
     * Gets all unpublished domain events from this aggregate.
     *
     * @returns Array of domain events
     */
    getDomainEvents(): DomainEvent[] {
        return [...this._domainEvents];
    }

    /**
     * Clears all domain events from this aggregate.
     * Should be called after events have been published.
     */
    clearDomainEvents(): void {
        this._domainEvents = [];
    }

    // --- Getters / Domain Logic ---

    get username(): string {
        return this._username.value;
    }
    get email(): string {
        return this._email.value;
    }
    get firstName(): string {
        return this._firstName.value;
    }
    get lastName(): string {
        return this._lastName.value;
    }
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }
    get active(): boolean {
        return this._active;
    }
    get role(): Role {
        return this._role;
    }
    get roleName(): string {
        return this._role.name;
    }

    /**
     * Activates the user account.
     * Publishes a UserActivated domain event.
     *
     * @description This method changes the user's active status to true,
     * enabling account access and functionality. This is a significant
     * business operation that should trigger downstream processes.
     *
     * @example
     * ```typescript
     * user.activate();
     * // UserActivated event will be published
     * ```
     *
     * @since 1.0.0
     * @domain User Management
     */
    activate(): void {
        if (!this._active) {
            this._active = true;
            this.addDomainEvent(
                DomainEvent.create({
                    id: `user-activated-${this.id}-${Date.now()}`,
                    aggregateId: this.id.toString(),
                    aggregateType: 'User',
                    eventType: DomainEventType.USER_ACCOUNT_ACTIVATED,
                    eventData: {
                        userId: this.id,
                        username: this._username.value,
                        email: this._email.value,
                        activatedAt: new Date().toISOString(),
                    },
                    occurredAt: ISODateTime.now(),
                })
            );
        }
    }

    /**
     * Deactivates the user account.
     * Publishes a UserDeactivated domain event.
     *
     * @description This method changes the user's active status to false,
     * restricting account access. This is a critical business operation
     * that should trigger security and cleanup processes.
     *
     * @example
     * ```typescript
     * user.deactivate();
     * // UserDeactivated event will be published
     * ```
     *
     * @since 1.0.0
     * @domain User Management
     */
    deactivate(): void {
        if (this._active) {
            this._active = false;
            this.addDomainEvent(
                DomainEvent.create({
                    id: `user-deactivated-${this.id}-${Date.now()}`,
                    aggregateId: this.id.toString(),
                    aggregateType: 'User',
                    eventType: DomainEventType.USER_ACCOUNT_DEACTIVATED,
                    eventData: {
                        userId: this.id,
                        username: this._username.value,
                        email: this._email.value,
                        deactivatedAt: new Date().toISOString(),
                    },
                    occurredAt: ISODateTime.now(),
                })
            );
        }
    }

    /**
     * Changes the user's email address.
     * Publishes a UserProfileModified domain event.
     *
     * @description This method updates the user's email address after validation.
     * The email change is a significant operation that may affect authentication
     * and communication, so a domain event is published.
     *
     * @param newEmail - New email address for the user
     * @throws ValidationError if the email is invalid
     *
     * @example
     * ```typescript
     * const newEmail = Email.create('newemail@madai.com');
     * user.changeEmail(newEmail);
     * // UserProfileModified event will be published
     * ```
     *
     * @since 1.0.0
     * @domain User Management
     */
    changeEmail(newEmail: Email): void {
        if (!newEmail) {
            throw ValidationError.create({
                field: 'email',
                value: newEmail,
                message: 'Email is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        const oldEmail = this._email.value;
        this._email = newEmail;

        this.addDomainEvent(
            DomainEvent.create({
                id: `user-email-changed-${this.id}-${Date.now()}`,
                aggregateId: this.id.toString(),
                aggregateType: 'User',
                eventType: DomainEventType.USER_PROFILE_MODIFIED,
                eventData: {
                    userId: this.id,
                    username: this._username.value,
                    oldEmail,
                    newEmail: newEmail.value,
                    changedAt: new Date().toISOString(),
                },
                occurredAt: ISODateTime.now(),
            })
        );
    }

    /**
     * Changes the user's username.
     * Publishes a UserProfileModified domain event.
     *
     * @description This method updates the user's username after validation.
     * Username changes affect user identification and may impact references
     * across the system, so a domain event is published.
     *
     * @param newUsername - New username for the user
     * @throws ValidationError if the username is invalid
     *
     * @example
     * ```typescript
     * const newUsername = Username.create('new_username');
     * user.changeUsername(newUsername);
     * // UserProfileModified event will be published
     * ```
     *
     * @since 1.0.0
     * @domain User Management
     */
    changeUsername(newUsername: Username): void {
        if (!newUsername) {
            throw ValidationError.create({
                field: 'username',
                value: newUsername,
                message: 'Username is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        const oldUsername = this._username.value;
        this._username = newUsername;

        this.addDomainEvent(
            DomainEvent.create({
                id: `user-username-changed-${this.id}-${Date.now()}`,
                aggregateId: this.id.toString(),
                aggregateType: 'User',
                eventType: DomainEventType.USER_PROFILE_MODIFIED,
                eventData: {
                    userId: this.id,
                    oldUsername,
                    newUsername: newUsername.value,
                    email: this._email.value,
                    changedAt: new Date().toISOString(),
                },
                occurredAt: ISODateTime.now(),
            })
        );
    }

    updateName(firstName: FirstName, lastName: LastName): void {
        if (!firstName) {
            throw ValidationError.create({
                field: 'firstName',
                value: firstName,
                message: 'FirstName is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }
        if (!lastName) {
            throw ValidationError.create({
                field: 'lastName',
                value: lastName,
                message: 'LastName is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }
        this._firstName = firstName;
        this._lastName = lastName;
    }

    isAdministrator(): boolean {
        return this._role?.isAdministrator() ?? false;
    }

    canAssignRole(role: Role): boolean {
        // Solo administradores pueden asignar roles
        if (!this.isAdministrator()) return false;

        // Los administradores no pueden asignar roles de administrador a otros
        if (role.isAdministrator()) return false;

        // No se puede asignar un rol inactivo
        if (!role.isActive) return false;

        return true;
    }

    assignRole(role: Role): void {
        if (!this.canAssignRole(role)) {
            throw ValidationError.create({
                field: 'role',
                value: role.name,
                message: 'User not allowed to assign this role',
                code: ValidationErrorCode.ROLE_NOT_ALLOWED,
            });
        }
        this._role = role;
    }

    emailFrom(domain: string): boolean {
        return this.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
    }

    /** Verifica si el usuario puede realizar acciones administrativas */
    canPerformAdminActions(): boolean {
        return this.isAdministrator() && this.active;
    }

    /** Verifica si el perfil del usuario está completo */
    hasCompleteProfile(): boolean {
        return (
            !!this.username &&
            !!this.email &&
            !!this.firstName &&
            !!this.lastName &&
            (this.profileCompleted ?? false)
        );
    }

    /** Verifica si el usuario puede acceder al sistema */
    canAccess(): boolean {
        return this.active && (this.isEmailConfirmed ?? false);
    }

    /** Business logic: Check if user allows email notifications */
    allowsEmailNotifications(): boolean {
        return this.notificationPreferences?.canReceiveNotification('email', 'system') ?? true;
    }

    /** Business logic: Check if user allows system notifications */
    allowsSystemNotifications(): boolean {
        return this.notificationPreferences?.canReceiveNotification('inApp', 'system') ?? true;
    }

    /** Business logic: Check if user allows task notifications */
    allowsTaskNotifications(): boolean {
        return this.notificationPreferences?.canReceiveNotification('email', 'task') ?? true;
    }

    /** Business logic: Get user's enabled notification channels */
    getEnabledNotificationChannels(): string[] {
        return this.notificationPreferences?.getEnabledChannelsFor('system') ?? ['email', 'inApp'];
    }

    /** Business logic: Update user notification preferences */
    updateNotificationPreferences(preferences: UserNotificationPreferences): void {
        if (!preferences) {
            throw ValidationError.create({
                field: 'notificationPreferences',
                value: preferences,
                message: 'Notification preferences are required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }
        // Note: Since readonly, this would need to be handled through a proper entity update method
        // For now, this validates the business rule
    }

    /**
     * Changes the user's role assignment.
     * Publishes a UserRoleChanged domain event.
     *
     * @description This method updates the user's role, which affects
     * permissions and access levels throughout the system. This is a
     * critical operation that requires event notification.
     *
     * @param newRole - New role to assign to the user
     * @throws ValidationError if the role is invalid
     *
     * @example
     * ```typescript
     * const adminRole = Role.create({...});
     * user.changeRole(adminRole);
     * // UserRoleChanged event will be published
     * ```
     *
     * @since 1.0.0
     * @domain User Management
     */
    changeRole(newRole: Role): void {
        if (!newRole) {
            throw ValidationError.create({
                field: 'role',
                value: newRole,
                message: 'Role is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        const oldRole = this._role;
        this._role = newRole;

        this.addDomainEvent(
            DomainEvent.create({
                id: `user-role-changed-${this.id}-${Date.now()}`,
                aggregateId: this.id.toString(),
                aggregateType: 'User',
                eventType: DomainEventType.USER_ROLE_CHANGED,
                eventData: {
                    userId: this.id,
                    username: this._username.value,
                    email: this._email.value,
                    oldRoleId: oldRole.id,
                    oldRoleName: oldRole.name,
                    newRoleId: newRole.id,
                    newRoleName: newRole.name,
                    changedAt: new Date().toISOString(),
                },
                occurredAt: ISODateTime.now(),
            })
        );
    }

    /**
     * Checks if the user can lead projects based on their role.
     *
     * @description This method encapsulates the business rule that
     * determines project leadership eligibility based on role permissions.
     * For now, it uses access level as a proxy for leadership capability.
     *
     * @returns true if user can lead projects, false otherwise
     *
     * @example
     * ```typescript
     * if (user.canLeadProjects()) {
     *   // User can be assigned as project leader
     * }
     * ```
     *
     * @since 1.0.0
     * @domain Project Management
     */
    canLeadProjects(): boolean {
        // Business rule: Users with access level 75 or higher can lead projects
        return this._role.accessLevel >= 75;
    }

    /**
     * Checks if the user has sufficient access level for a given operation.
     *
     * @description This method implements access control logic based on
     * the user's role access level. Higher access levels can perform
     * operations requiring lower access levels.
     *
     * @param requiredLevel - Minimum access level required for the operation
     * @returns true if user has sufficient access, false otherwise
     *
     * @example
     * ```typescript
     * if (user.hasAccessLevel(75)) {
     *   // User can perform administrative operations
     * }
     * ```
     *
     * @since 1.0.0
     * @domain Authorization
     */
    hasAccessLevel(requiredLevel: number): boolean {
        return this._role.accessLevel >= requiredLevel;
    }

    /**
     * Checks if the user's email has been verified.
     *
     * @description This method provides access to email verification status,
     * which is crucial for security features and communication preferences.
     *
     * @returns true if email is confirmed, false otherwise
     *
     * @example
     * ```typescript
     * if (!user.hasVerifiedEmail()) {
     *   // Show email verification prompt
     * }
     * ```
     *
     * @since 1.0.0
     * @domain Authentication
     */
    hasVerifiedEmail(): boolean {
        return this.isEmailConfirmed ?? false;
    }

    /** Método equals para comparación de entidades */
    equals(other: User): boolean {
        return this.id === other.id;
    }

    toString(): string {
        return `User(${this.id}, ${this.username}, ${this.email}, ${this.fullName})`;
    }
}
