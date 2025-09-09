import {
  Email,
  Username,
  FirstName,
  LastName,
  ISODateTime,
  UserStatusVO,
  UserNotificationPreferencesVO,
} from '../value-objects';

import type { UserNotificationPreferences } from '../value-objects/user-notification-preferences.vo';

import { Role } from './role.entity';
import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import type { FieldError } from '../errors/field-error.type';

export class User {
  public readonly id: number;
  private _username: Username;
  private _email: Email;
  private _firstName: FirstName;
  private _lastName: LastName;
  private _active: boolean;
  private _role: Role;
  private readonly _createdAt?: ISODateTime;
  private readonly _updatedAt?: ISODateTime;
  private readonly _lastActivityAt?: ISODateTime;
  private _status?: UserStatusVO;
  private _isEmailConfirmed?: boolean;
  private _notificationPreferences?: UserNotificationPreferencesVO;

  private constructor(
    id: number,
    username: Username,
    email: Email,
    firstName: FirstName,
    lastName: LastName,
    isActive: boolean,
    role: Role,
    options?: {
      createdAt?: ISODateTime;
      updatedAt?: ISODateTime;
      lastActivityAt?: ISODateTime;
      status?: UserStatusVO;
      isEmailConfirmed?: boolean;
      notificationPreferences?: UserNotificationPreferencesVO;
    }
  ) {
    this.id = id;
    this._username = username;
    this._email = email;
    this._firstName = firstName;
    this._lastName = lastName;
    this._active = isActive;
    this._role = role;
    this._createdAt = options?.createdAt;
    this._updatedAt = options?.updatedAt;
    this._lastActivityAt = options?.lastActivityAt;
    this._status = options?.status;
    this._isEmailConfirmed = options?.isEmailConfirmed;
    this._notificationPreferences = options?.notificationPreferences;
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

    // Throw validation errors if any
    if (errors.length > 0) {
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
      {
        createdAt: createdAtVO,
        updatedAt: updatedAtVO,
        lastActivityAt: lastActivityAtVO,
        status: statusVO!,
        isEmailConfirmed: props.isEmailConfirmed,
        notificationPreferences: notificationPreferecesVO,
      }
    );
  }

  // --- Domain Events Management ---

  // --- Domain Events Management Removed ---

  canDeleteUsers(): boolean {
    return this._role.canDeleteUsers();
  }

  getPermissions() {
    return this._role.getPermissions();
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

  get userStatus(): UserStatusVO {
    return this._status!;
  }

  get createdAt(): ISODateTime | undefined {
    return this._createdAt;
  }

  get updatedAt(): ISODateTime | undefined {
    return this._updatedAt;
  }

  get lastActivityAt(): ISODateTime | undefined {
    return this._lastActivityAt;
  }

  get status(): UserStatusVO | undefined {
    return this._status;
  }

  get isEmailConfirmed(): boolean | undefined {
    return this._isEmailConfirmed;
  }

  get notificationPreferences(): UserNotificationPreferencesVO | undefined {
    return this._notificationPreferences;
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
      // Domain event removed: USER_ACCOUNT_ACTIVATED
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
      // Domain event removed: USER_ACCOUNT_DEACTIVATED
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

    this._email = newEmail;
    // Domain event removed: USER_PROFILE_MODIFIED
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

    this._username = newUsername;
    // Domain event removed: USER_PROFILE_MODIFIED
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

  /** Business logic: Update user notification preferences */
  updateNotificationPreferences(preferences: UserNotificationPreferences): void {
    // Validar y actualizar el VO de preferencias
    this._notificationPreferences = UserNotificationPreferencesVO.create(preferences);
    // Domain event removed: USER_PREFERENCES_UPDATED
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

    this._role = newRole;
    // Domain event removed: USER_ROLE_CHANGED
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
    return this._isEmailConfirmed ?? false;
  }

  /** Método equals para comparación de entidades */
  equals(other: User | null | undefined): boolean {
    if (!other) return false;
    return this.id === other.id;
  }

  toString(): string {
    return `User(${this.id}, ${this.username}, ${this.email}, ${this.firstName} ${this.lastName}, Active: ${this.active}, Role: ${this.role.name})`;
  }
}
