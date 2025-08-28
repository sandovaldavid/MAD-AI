import {
  Email,
  Username,
  FirstName,
  LastName,
  ISODateTime,
  UserStatusVO,
  UserNotificationPreferencesVO,
} from '../value-objects';

import { AccessLevelService } from '../services/role/accessLevel.service';

import type { UserNotificationPreferences } from '../value-objects/user-notification-preferences.vo';

import { Role } from './role.entity';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import type { FieldError } from '../errors/field-error.type';
import { DomainEvent, DomainEventType } from '../events/domain-event.entity';

export class User {
  private _domainEvents: DomainEvent[] = [];
  public readonly id: number;
  private _username: Username;
  private _email: Email;
  private _firstName: FirstName;
  private _lastName: LastName;
  private _active: boolean;
  private _role: Role;
  public readonly createdAt?: ISODateTime;
  public readonly updatedAt?: ISODateTime;
  public readonly lastActivityAt?: ISODateTime;
  public status?: UserStatusVO;
  public isEmailConfirmed?: boolean;
  public notificationPreferences?: UserNotificationPreferencesVO;

  private constructor(
    id: number,
    username: Username,
    email: Email,
    firstName: FirstName,
    lastName: LastName,
    isActive: boolean,
    role: Role,
    createdAt?: ISODateTime,
    updatedAt?: ISODateTime,
    lastActivityAt?: ISODateTime,
    status?: UserStatusVO,
    isEmailConfirmed?: boolean,
    notificationPreferences?: UserNotificationPreferencesVO
  ) {
    this.id = id;
    this._username = username;
    this._email = email;
    this._firstName = firstName;
    this._lastName = lastName;
    this._active = isActive;
    this._role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.lastActivityAt = lastActivityAt;
    this.status = status || UserStatusVO.create('pending');
    this.isEmailConfirmed = isEmailConfirmed || false;
    this.notificationPreferences = notificationPreferences;
  }

  /** Factory method con validación de invariantes */
  static create(props: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    role: Role;
    createdAt?: string;
    updatedAt?: string;
    lastActivityAt?: string;
    status?: string;
    isEmailConfirmed?: boolean;
    profileCompleted?: boolean;
    notificationPreferences?: UserNotificationPreferences;
  }): User {
    const errors: FieldError[] = [];
    let usernameVO: Username;
    let emailVO: Email;
    let firstNameVO: FirstName;
    let lastNameVO: LastName;
    let createdAtVO: ISODateTime | undefined;
    let updatedAtVO: ISODateTime | undefined;
    let lastActivityAtVO: ISODateTime | undefined;
    let statusVO: UserStatusVO;
    let notificationPreferecesVO: UserNotificationPreferencesVO | undefined;

    try {
      usernameVO = Username.create(props.username);
    } catch (err) {
      errors.push(...(err as ValidationError).getFieldErrors('username'));
    }

    try {
      statusVO = props.status ? UserStatusVO.create(props.status) : UserStatusVO.create('pending');
    } catch (err) {
      errors.push(...(err as ValidationError).getFieldErrors('userStatus'));
    }

    try {
      emailVO = Email.create(props.email);
    } catch (err) {
      errors.push(...(err as ValidationError).getFieldErrors('email'));
    }

    try {
      firstNameVO = FirstName.create(props.firstName);
    } catch (err) {
      errors.push(...(err as ValidationError).getFieldErrors('firstName'));
    }

    try {
      lastNameVO = LastName.create(props.lastName);
    } catch (err) {
      errors.push(...(err as ValidationError).getFieldErrors('lastName'));
    }

    if (props.createdAt) {
      try {
        createdAtVO = ISODateTime.create(props.createdAt);
      } catch (err) {
        // Map field name from 'isoDateTime' to 'createdAt'
        const mappedError = (err as ValidationError).mapFieldName('createdAt');
        errors.push(...mappedError.errors);
      }
    }

    if (props.updatedAt) {
      try {
        updatedAtVO = ISODateTime.create(props.updatedAt);
      } catch (err) {
        // Map field name from 'isoDateTime' to 'updatedAt'
        const mappedError = (err as ValidationError).mapFieldName('updatedAt');
        errors.push(...mappedError.errors);
      }
    }

    if (props.lastActivityAt) {
      try {
        lastActivityAtVO = ISODateTime.create(props.lastActivityAt);
      } catch (err) {
        // Map field name from 'isoDateTime' to 'lastActivityAt'
        const mappedError = (err as ValidationError).mapFieldName('lastActivityAt');
        errors.push(...mappedError.errors);
      }
    }

    if (props.notificationPreferences) {
      try {
        notificationPreferecesVO = UserNotificationPreferencesVO.create(
          props.notificationPreferences
        );
      } catch (err) {
        errors.push(...(err as ValidationError).getFieldErrors('notificationPreferences'));
      }
    }

    // Check for required fields using ValidationError utility
    const missingFields: string[] = [];
    if (!props.role) missingFields.push('role');
    if (!props.notificationPreferences) missingFields.push('notificationPreferences');

    if (missingFields.length > 0) {
      const requiredFieldsError = ValidationError.forMissingRequiredFields(missingFields);
      if (errors.length > 0) {
        throw ValidationError.createFromFields(
          errors,
          ValidationErrorCode.VALIDATION_ERROR
        ).combine(requiredFieldsError);
      } else {
        throw requiredFieldsError;
      }
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new User(
      props.id,
      usernameVO!,
      emailVO!,
      firstNameVO!,
      lastNameVO!,
      props.isActive,
      props.role,
      createdAtVO,
      updatedAtVO,
      lastActivityAtVO,
      statusVO!,
      props.isEmailConfirmed,
      notificationPreferecesVO
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

  canDeleteUsers(): boolean {
    return AccessLevelService.canDeleteUsers(this._role.getAccessLevel());
  }

  getPermissions() {
    return AccessLevelService.getPermissions(this._role.getAccessLevel());
  }

  // --- Getters / Domain Logic ---

  get username(): Username {
    return this._username;
  }
  get email(): Email {
    return this._email;
  }
  get firstName(): FirstName {
    return this._firstName;
  }
  get lastName(): LastName {
    return this._lastName;
  }
  get active(): boolean {
    return this._active;
  }
  get role(): Role {
    return this._role;
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
      throw ValidationError.forMissingRequiredFields(['email']);
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
      throw ValidationError.forMissingRequiredFields(['username']);
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
    const missingFields: string[] = [];
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');

    if (missingFields.length > 0) {
      throw ValidationError.forMissingRequiredFields(missingFields);
    }
    this._firstName = firstName;
    this._lastName = lastName;
  }

  isAdministrator(): boolean {
    return this._role?.canAccessAdmin();
  }

  /** Business logic: Update user notification preferences */
  updateNotificationPreferences(preferences: UserNotificationPreferences): void {
    // Validar y actualizar el VO de preferencias
    this.notificationPreferences = UserNotificationPreferencesVO.create(preferences);

    // Agregar evento de dominio
    this.addDomainEvent(
      DomainEvent.create({
        id: `user-preferences-updated-${this.id}-${Date.now()}`,
        aggregateId: this.id.toString(),
        aggregateType: 'User',
        eventType: DomainEventType.USER_PREFERENCES_UPDATED,
        eventData: {
          userId: this.id,
          updatedAt: new Date().toISOString(),
        },
        occurredAt: ISODateTime.now(),
      })
    );
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
      throw ValidationError.forMissingRequiredFields(['role']);
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
    return this._role.canLeadProjects();
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
    return `User(${this.id}, ${this.username}, ${this.email}, ${this.firstName} ${this.lastName}, Active: ${this.active}, Role: ${this.role.name})`;
  }
}
