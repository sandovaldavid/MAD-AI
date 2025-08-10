import { Email } from '../value-objects/email.vo';
import { ISODateTime } from '../value-objects/iso-datetime.vo';
import { Username } from '../value-objects/username.vo';
import { FirstName } from '../value-objects/firstname.vo';
import { LastName } from '../value-objects/lastname.vo';
import { UserStatusVO } from '../value-objects/userstatus.vo';
import { NotificationPreferencesVO } from '../value-objects/notification-preferences.vo';
import { Role } from './role.entity';
import { ValidationError } from './validation-error';
import { ValidationErrorCode } from '../enums/validation-error-code.enum';

import type { FieldError } from '../models/field-error.model';

export class User {
    private constructor(
        public readonly id: number,
        private _username: Username,
        private _email: Email,
        private _firstName: FirstName,
        private _lastName: LastName,
        private _active: boolean,
        private _role: Role,

        public readonly createdAt?: ISODateTime,
        public updatedAt?: ISODateTime,
        public readonly lastActivityAt?: ISODateTime,

        public status?: UserStatusVO,
        public isEmailConfirmed?: boolean,
        public profileCompleted?: boolean,
        public notificationPreferences?: NotificationPreferencesVO
    ) {}

    static create(p: {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        role: Role;

        createdAt?: string | null;
        updatedAt?: string | null;
        lastActivityAt?: string | null;
        status?: string;
        isEmailConfirmed?: boolean;
        profileCompleted?: boolean;
        notificationPreferences?: { email: boolean; system: boolean; task: boolean };

        fullName?: string | null;
    }): User {
        const errors: FieldError[] = [];
        if (typeof p.id !== 'number' || p.id < 0) {
            errors.push({
                field: 'id',
                value: p.id,
                message: 'User.id must be a positive integer',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }
        let username: Username;
        try {
            username = Username.create(p.username);
        } catch (e: any) {
            errors.push({
                field: 'username',
                value: p.username,
                message: e.message,
                code: ValidationErrorCode.USERNAME_TAKEN,
            });
        }
        let email: Email;
        try {
            email = Email.create(p.email);
        } catch (e: any) {
            errors.push({
                field: 'email',
                value: p.email,
                message: e.message,
                code: ValidationErrorCode.EMAIL_INVALID,
            });
        }
        let firstName: FirstName;
        try {
            firstName = FirstName.create(p.firstName);
        } catch (e: any) {
            errors.push({
                field: 'firstName',
                value: p.firstName,
                message: e.message,
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }
        let lastName: LastName;
        try {
            lastName = LastName.create(p.lastName);
        } catch (e: any) {
            errors.push({
                field: 'lastName',
                value: p.lastName,
                message: e.message,
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }
        let statusVO: UserStatusVO | undefined;
        if (p.status) {
            try {
                statusVO = UserStatusVO.create(p.status);
            } catch (e: any) {
                errors.push({
                    field: 'status',
                    value: p.status,
                    message: e.message,
                    code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
                });
            }
        }
        let notificationPreferencesVO: NotificationPreferencesVO | undefined;
        if (p.notificationPreferences) {
            try {
                notificationPreferencesVO = NotificationPreferencesVO.create(
                    p.notificationPreferences
                );
            } catch (e: any) {
                errors.push({
                    field: 'notificationPreferences',
                    value: p.notificationPreferences,
                    message: e.message,
                    code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
                });
            }
        }
        // try ISODateTime validation for createdAt, updatedAt, lastActivityAt
        if (p.createdAt) {
            try {
                ISODateTime.create(p.createdAt);
            } catch (e: any) {
                errors.push({
                    field: 'createdAt',
                    value: p.createdAt,
                    message: 'User.createdAt is not a valid ISO datetime',
                    code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
                });
            }
        }
        if (p.updatedAt) {
            try {
                ISODateTime.create(p.updatedAt);
            } catch (e: any) {
                errors.push({
                    field: 'updatedAt',
                    value: p.updatedAt,
                    message: 'User.updatedAt is not a valid ISO datetime',
                    code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
                });
            }
        }
        if (p.lastActivityAt) {
            try {
                ISODateTime.create(p.lastActivityAt);
            } catch (e: any) {
                errors.push({
                    field: 'lastActivityAt',
                    value: p.lastActivityAt,
                    message: 'User.lastActivityAt is not a valid ISO datetime',
                    code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
                });
            }
        }
        if (errors.length) {
            throw new ValidationError(errors, ValidationErrorCode.VALIDATION_ERROR);
        }
        return new User(
            p.id,
            username!,
            email!,
            firstName!,
            lastName!,
            !!p.isActive,
            p.role as Role,

            ISODateTime.create(p.createdAt ?? undefined),
            ISODateTime.create(p.updatedAt ?? undefined),
            ISODateTime.create(p.lastActivityAt ?? undefined),

            statusVO,
            p.isEmailConfirmed,
            p.profileCompleted,
            notificationPreferencesVO
        );
    }

    /**
     * Get the role of the user.
     */
    get role(): Role {
        return this._role;
    }

    /**
     * Set the role of the user.
     */
    set role(value: Role) {
        this._role = value;
    }

    /**
     * Gets the username of the user.
     */
    get username(): string {
        return this._username.value;
    }

    /**
     * Gets the email address of the user as a string.
     */
    get email(): string {
        return this._email.value;
    }

    /**
     * Returns whether the user is active.
     */
    get active(): boolean {
        return this._active;
    }

    /**
     * Gets the role name of the user (if available).
     */
    get roleName(): string {
        return this._role.name;
    }

    /**
     * Gets the first name of the user.
     */
    get firstName(): string {
        return this._firstName.value;
    }

    /**
     * Gets the last name of the user.
     */
    get lastName(): string {
        return this._lastName.value;
    }

    /**
     * Gets the full name of the user (first + last name).
     */
    get fullName(): string {
        return `${this._firstName.value} ${this._lastName.value}`.trim();
    }

    /**
     * Activates the user (sets active to true).
     */
    activate(): void {
        this._active = true;
    }

    /**
     * Deactivates the user (sets active to false).
     */
    deactivate(): void {
        this._active = false;
    }

    /**
     * Changes the user's email address after validation.
     * @param value New email address
     */
    set changeEmail(value: string) {
        this._email = Email.create(value);
    }

    /**
     * Returns true if the user is an administrator.
     * Checks both role object and role name.
     */
    isAdministrator(): boolean {
        if (this._role) return this._role.isAdministrator();
        return false;
    }

    /**
     * Determines if this user can assign the given role.
     * Only administrators can assign roles, but cannot assign administrator role to others.
     * @param role Role to assign
     */
    canAssignRole(role: Role): boolean {
        // Only administrators can assign roles
        if (!this.isAdministrator()) return false;
        // Prevent assigning administrator role to others
        if (role.isAdministrator()) return false;
        return true;
    }

    /**
     * Assigns a new role to the user if allowed.
     * Throws ValidationError if not permitted.
     * @param role Role to assign
     */
    assignRole(role: Role): void {
        if (!this.canAssignRole(role)) {
            throw new ValidationError([
                {
                    field: 'role',
                    value: role.name,
                    message: 'User is not allowed to assign this role',
                },
            ]);
        }
        this._role = role;
    }

    /**
     * Checks if the user's email is from the given domain.
     * @param domain Domain to check
     */
    emailFrom(domain: string): boolean {
        return this.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
    }

    /**
     * Returns a string representation of the user.
     */
    toString(): string {
        return `User(${this.id}, ${this.username}, ${this.email}, ${this.fullName})`;
    }
}
