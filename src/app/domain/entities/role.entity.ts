import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';

/**
 * Role Entity - Represents organizational roles in the MAD-AI system.
 *
 * @description Simplified role entity without over-engineering.
 * Focuses on essential business logic and data integrity.
 *
 * @since 1.0.0
 * @domain Role Management
 */
export class Role {
  private readonly _id: number;
  private readonly _name: string;
  private readonly _accessLevel: number;
  private _isActive: boolean;
  private _description?: string;
  private _userCount?: number;

  private constructor(
    id: number,
    name: string,
    accessLevel: number,
    isActive = false,
    description?: string,
    userCount?: number
  ) {
    this._id = id;
    this._name = name;
    this._accessLevel = accessLevel;
    this._isActive = isActive;
    this._description = description;
    this._userCount = userCount || 0;
  }

  /**
   * Factory method to create a Role with essential validations.
   */
  static create(props: {
    id: number;
    name: string;
    accessLevel?: number;
    isActive?: boolean;
    description?: string | null;
    userCount?: number;
  }): Role {
    const errors: FieldError[] = [];

    // Validate ID
    if (
      typeof props.id !== 'number' ||
      !Number.isInteger(props.id) ||
      props.id <= 0 ||
      props.id > Number.MAX_SAFE_INTEGER
    ) {
      errors.push({
        field: 'id',
        value: props.id,
        message: 'Role.id must be a positive integer',
        code: ValidationErrorCode.FIELD_OUT_OF_RANGE,
      });
    }

    // Validate name
    if (!props.name || typeof props.name !== 'string' || props.name.trim().length === 0) {
      errors.push({
        field: 'name',
        value: props.name,
        message: 'Role name is required',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    } else if (props.name.trim().length > 50) {
      errors.push({
        field: 'name',
        value: props.name,
        message: 'Role name cannot exceed 50 characters',
        code: ValidationErrorCode.FIELD_TOO_LONG,
      });
    }

    // Validate access level
    const accessLevel = props.accessLevel ?? 5;
    if (
      typeof accessLevel !== 'number' ||
      !Number.isInteger(accessLevel) ||
      accessLevel < 1 ||
      accessLevel > 10
    ) {
      errors.push({
        field: 'accessLevel',
        value: props.accessLevel,
        message: 'Access level must be an integer between 1 and 10',
        code: ValidationErrorCode.FIELD_OUT_OF_RANGE,
      });
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new Role(
      props.id,
      props.name.trim(),
      accessLevel,
      !!props.isActive,
      props.description ?? undefined,
      props.userCount
    );
  }

  // ---------- Getters ----------
  get id(): number {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get accessLevel(): number {
    return this._accessLevel;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get description(): string {
    return this._description ?? 'No hay descripción para este rol';
  }

  get userCount(): number {
    return this._userCount ?? 0;
  }

  // ---------- Business Methods ----------
  canManageUsers(): boolean {
    return this._accessLevel <= 2;
  }

  canAccessAdmin(): boolean {
    return this._accessLevel <= 3;
  }

  canLeadProjects(): boolean {
    return this._accessLevel <= 4;
  }

  /**
   * Get permissions based on access level.
   */
  getPermissions(): string[] {
    const level = this._accessLevel;
    const permissions: string[] = [];

    if (level <= 1) {
      permissions.push('SYSTEM_ADMIN', 'USER_MANAGEMENT', 'PROJECT_MANAGEMENT', 'READ_ALL');
    } else if (level <= 2) {
      permissions.push('USER_MANAGEMENT', 'PROJECT_MANAGEMENT', 'READ_ALL');
    } else if (level <= 3) {
      permissions.push('PROJECT_MANAGEMENT', 'READ_ALL');
    } else if (level <= 4) {
      permissions.push('PROJECT_LEAD', 'READ_ALL');
    } else {
      permissions.push('READ_ALL');
    }

    return permissions;
  }

  isUniqueForTeam(): boolean {
    return this._accessLevel <= 2;
  }

  canDeleteUsers(): boolean {
    return this._accessLevel <= 2;
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

  equals(other: Role | null | undefined): boolean {
    if (!other) return false;
    return this.id === other.id;
  }

  toString(): string {
    return `Role(${this.id}, ${this.name}, L${this._accessLevel}, active=${this.isActive})`;
  }
}
