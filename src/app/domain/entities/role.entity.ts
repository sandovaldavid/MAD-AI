import { ValidationError } from './validation-error';
import { ValidationErrorCode } from '../enums/validation-error-code.enum';
import { RoleName } from '../value-objects/rolename.vo';
import { AccessLevel } from '../value-objects/accesslevel.vo';

import type { FieldError } from '../types/field-error.type';

export class Role {
    private constructor(
        private readonly _id: number,
        private readonly _name: RoleName,
        private readonly _accessLevel: AccessLevel,
        private _isActive: boolean,
        private _description?: string | '',
        private _userCount?: number
    ) {}

    /**
     * Factory method to create a Role instance with validation using value objects.
     * @param p Role properties
     * @throws ValidationError if any property is invalid
     */
    static create(p: {
        id: number;
        name: string;
        accessLevel?: number;
        isActive: boolean;
        description?: string | null;
        userCount?: number;
    }): Role {
        const errors: FieldError[] = [];
        if (typeof p.id !== 'number' || p.id < 0) {
            errors.push({
                field: 'id',
                value: p.id,
                message: 'Role.id must be a positive integer',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        let roleName: RoleName;
        try {
            roleName = RoleName.create(p.name);
        } catch (e: any) {
            errors.push({
                field: 'name',
                value: p.name,
                message: e.message,
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        // Determinar accessLevel por defecto si no se provee
        let accessLevelValue: number =
            p.accessLevel !== undefined ? p.accessLevel : Role.defaultAccessLevelForName(p.name);
        let accessLevel: AccessLevel;
        try {
            accessLevel = AccessLevel.create(accessLevelValue);
        } catch (e: any) {
            errors.push({
                field: 'accessLevel',
                value: accessLevelValue,
                message: e.message,
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (errors.length) {
            throw new ValidationError(errors, ValidationErrorCode.VALIDATION_ERROR);
        }

        return new Role(
            p.id,
            roleName!,
            accessLevel!,
            !!p.isActive,
            p.description ?? '',
            p.userCount
        );
    }

    /**
     * Determinate the default access level based on the role name.
     */
    private static defaultAccessLevelForName(name: string): number {
        const n = name?.toLowerCase().trim();
        if (n === 'administrator' || n === 'administrador') return 1;
        if (n === 'user' || n === 'usuario') return 5;
        return 5; // Default
    }

    /**
     * Gets the role ID.
     */
    get id(): number {
        return this._id;
    }

    /**
     * Gets the role name as a string.
     */
    get name(): string {
        return this._name.value;
    }

    /**
     * Gets the access level of the role as a number.
     */
    get accessLevel(): number {
        return this._accessLevel.value;
    }

    /**
     * Returns whether the role is active.
     */
    get isActive(): boolean {
        return this._isActive;
    }

    /**
     * Gets the description of the role (if any).
     */
    get description(): string {
        return this._description ?? 'Noy ha Descripcion para ese rol';
    }

    /**
     * Gets the number of users assigned to this role (if available).
     */
    get userCount(): number {
        return this._userCount ?? 0;
    }

    /**
     * Returns true if this role is an administrator role.
     */
    isAdministrator(): boolean {
        return this.accessLevel === 1 || this.name.toLowerCase() === 'administrator';
    }
    /**
     * Returns true if this role can manage projects (accessLevel <= 2).
     */
    canManageProjects(): boolean {
        return this.accessLevel <= 2;
    }
    /**
     * Returns a label for the role (name and access level).
     */
    label(): string {
        return `${this.name} (L${this.accessLevel})`;
    }

    /**
     * Activates the role.
     */
    activate(): void {
        this._isActive = true;
    }

    /**
     * Deactivates the role.
     */
    deactivate(): void {
        this._isActive = false;
    }

    /**
     * Returns true if the role is editable (not administrator).
     */
    isEditable(): boolean {
        return !this.isAdministrator();
    }

    /**
     * Compares this role to another role by id.
     * @param other Role to compare
     */
    equals(other: Role): boolean {
        return this.id === other.id;
    }

    /**
     * Returns a string representation of the role.
     */
    toString(): string {
        return `Role(${this.id}, ${this.name}, L${this.accessLevel}, active=${this.isActive})`;
    }
}
