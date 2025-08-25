import { AccessLevel, RoleName } from '@domain/value-objects';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';
import { DomainEvent, DomainEventType } from '../events/domain-event.entity';
import { ISODateTime } from '../value-objects/iso-datetime.vo';

/**
 * Role Entity - Represents organizational roles in the MAD-AI system.
 *
 * @description This entity encapsulates the concept of organizational roles
 * with access levels, permissions, and business rules. It follows DDD principles
 * by maintaining role-specific business logic and invariants.
 *
 * @since 1.0.0
 * @domain Role Management
 */
export class Role {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: number,
    private readonly _name: RoleName,
    private readonly _accessLevel: AccessLevel,
    private _isActive: boolean,
    private _description?: string,
    private _userCount?: number
  ) {}

  /**
   * Factory method for creating Role instances with validation.
   *
   * @description Creates a Role entity after validating all invariants.
   * The construction logic ensures data integrity and business rule compliance.
   *
   * @param props - Role properties for creation
   * @returns Role instance
   * @throws ValidationError if any invariant is violated
   *
   * @example
   * ```typescript
   * const role = Role.create({
   *   id: 1,
   *   name: RoleName.create('Admin'),
   *   accessLevel: AccessLevel.create(90),
   *   isActive: true,
   *   description: 'System administrator'
   * });
   * ```
   *
   * @since 1.0.0
   * @domain Role Management
   */
  static create(props: {
    id: number;
    name: RoleName;
    accessLevel: AccessLevel;
    isActive: boolean;
    description?: string | null;
    userCount?: number;
  }): Role {
    const errors: FieldError[] = [];

    // Invariante mínima sobre id (entidad)
    if (typeof props.id !== 'number' || !Number.isInteger(props.id) || props.id <= 0) {
      errors.push({
        field: 'id',
        value: props.id,
        message: 'Role.id must be a positive integer',
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }

    if (!props.name) {
      errors.push({
        field: 'name',
        value: props.name,
        message: 'RoleName is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (!props.accessLevel) {
      errors.push({
        field: 'accessLevel',
        value: props.accessLevel,
        message: 'AccessLevel is required',
        code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
      });
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new Role(
      props.id,
      props.name,
      props.accessLevel,
      !!props.isActive,
      props.description ?? undefined,
      props.userCount
    );
  }

  // ---------- Domain Events Management ----------

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

  // ---------- Getters ----------
  get id(): number {
    return this._id;
  }
  get name(): string {
    return this._name.value;
  }
  get accessLevel(): number {
    return this._accessLevel.value;
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

  // ---------- Comportamiento de dominio ----------

  /**
   * Determines if this role represents a system administrator.
   *
   * @description Implements business logic to identify administrative roles
   * based on access level and name patterns. Administrators have special
   * privileges and restrictions in the system.
   *
   * @returns true if this is an administrator role, false otherwise
   *
   * @example
   * ```typescript
   * if (role.isAdministrator()) {
   *   // Grant full system access
   * }
   * ```
   *
   * @since 1.0.0
   * @domain Role Management
   */
  isAdministrator(): boolean {
    // Política: nivel 1 es administrador
    return this.accessLevel === 1 || this.name.toLowerCase() === 'administrator';
  }

  /**
   * Determines if this role can manage projects.
   *
   * @description Implements business rule for project management permissions
   * based on access level hierarchy. Higher-level roles have project
   * management capabilities.
   *
   * @returns true if role can manage projects, false otherwise
   *
   * @example
   * ```typescript
   * if (role.canManageProjects()) {
   *   // Allow project creation and management
   * }
   * ```
   *
   * @since 1.0.0
   * @domain Project Management
   */
  canManageProjects(): boolean {
    return this.accessLevel <= 2;
  }

  /**
   * Determines if this role can lead projects.
   *
   * @description Implements business rule for project leadership eligibility
   * based on access level. Project leadership requires sufficient authority
   * and responsibility level.
   *
   * @returns true if role can lead projects, false otherwise
   *
   * @example
   * ```typescript
   * if (role.canLeadProjects()) {
   *   // Allow project leadership assignment
   * }
   * ```
   *
   * @since 1.0.0
   * @domain Project Management
   */
  canLeadProjects(): boolean {
    return this.accessLevel >= 75; // Consistent with User entity logic
  }

  /**
   * Creates a display label for the role.
   *
   * @description Generates a human-readable label combining role name
   * and access level for UI display purposes.
   *
   * @returns Formatted role label
   *
   * @example
   * ```typescript
   * console.log(role.label()); // "Admin (L90)"
   * ```
   *
   * @since 1.0.0
   * @domain Display
   */
  label(): string {
    return `${this.name} (L${this.accessLevel})`;
  }

  /**
   * Activates the role.
   * Publishes a RoleActivated domain event.
   *
   * @description Changes the role's active status to true, enabling its
   * use for user assignments. This is a significant business operation
   * that affects user permissions system-wide.
   *
   * @example
   * ```typescript
   * role.activate();
   * // RoleActivated event will be published
   * ```
   *
   * @since 1.0.0
   * @domain Role Management
   */
  activate(): void {
    if (!this._isActive) {
      this._isActive = true;
      this.addDomainEvent(
        DomainEvent.create({
          id: `role-activated-${this.id}-${Date.now()}`,
          aggregateId: this.id.toString(),
          aggregateType: 'Role',
          eventType: DomainEventType.ROLE_ACTIVATED,
          eventData: {
            roleId: this.id,
            roleName: this.name,
            accessLevel: this.accessLevel,
            activatedAt: new Date().toISOString(),
          },
          occurredAt: ISODateTime.now(),
        })
      );
    }
  }

  /**
   * Deactivates the role.
   * Publishes a RoleDeactivated domain event.
   *
   * @description Changes the role's active status to false, preventing
   * new assignments and potentially affecting existing users. This is
   * a critical business operation requiring careful consideration.
   *
   * @example
   * ```typescript
   * role.deactivate();
   * // RoleDeactivated event will be published
   * ```
   *
   * @since 1.0.0
   * @domain Role Management
   */
  deactivate(): void {
    if (this._isActive) {
      this._isActive = false;
      this.addDomainEvent(
        DomainEvent.create({
          id: `role-deactivated-${this.id}-${Date.now()}`,
          aggregateId: this.id.toString(),
          aggregateType: 'Role',
          eventType: DomainEventType.ROLE_DEACTIVATED,
          eventData: {
            roleId: this.id,
            roleName: this.name,
            accessLevel: this.accessLevel,
            userCount: this.userCount,
            deactivatedAt: new Date().toISOString(),
          },
          occurredAt: ISODateTime.now(),
        })
      );
    }
  }

  /**
   * Determines if the role can be edited by users.
   *
   * @description Implements business rule that prevents modification of
   * system-critical administrator roles while allowing editing of
   * regular organizational roles.
   *
   * @returns true if role can be edited, false otherwise
   *
   * @example
   * ```typescript
   * if (role.isEditable()) {
   *   // Show edit interface
   * } else {
   *   // Show read-only view
   * }
   * ```
   *
   * @since 1.0.0
   * @domain Role Management
   */
  isEditable(): boolean {
    return !this.isAdministrator();
  }

  /**
   * Checks if users with this role can perform administrative actions.
   *
   * @description Implements business rule combining administrator status
   * with active state to determine administrative capabilities.
   *
   * @returns true if role has admin privileges, false otherwise
   *
   * @example
   * ```typescript
   * if (role.hasAdminPrivileges()) {
   *   // Grant administrative access
   * }
   * ```
   *
   * @since 1.0.0
   * @domain Authorization
   */
  hasAdminPrivileges(): boolean {
    return this.isAdministrator() && this.isActive;
  }

  equals(other: Role): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `Role(${this.id}, ${this.name}, L${this.accessLevel}, active=${this.isActive})`;
  }
}
