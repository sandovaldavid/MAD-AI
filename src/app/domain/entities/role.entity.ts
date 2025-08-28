import { AccessLevel, RoleName } from '@domain/value-objects';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';
import { DomainEvent, DomainEventType } from '../events/domain-event.entity';
import { ISODateTime } from '../value-objects/iso-datetime.vo';
import { AccessLevelService } from '../services/role/accessLevel.service';

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
  private readonly _id: number;
  private readonly _name: RoleName;
  private readonly _accessLevel: AccessLevel;
  private _isActive: boolean;
  private _description?: string;
  private _userCount?: number;

  private constructor(
    id: number,
    name: RoleName,
    accessLevel?: AccessLevel,
    isActive?: boolean,
    description?: string,
    userCount?: number
  ) {
    this._id = id;
    this._name = name;
    this._accessLevel = accessLevel || AccessLevel.create(5);
    this._isActive = isActive || false;
    this._description = description;
    this._userCount = userCount || 0;
  }

  static create(props: {
    id: number;
    name: string;
    accessLevel?: number;
    isActive?: boolean;
    description?: string | null;
    userCount?: number;
    canLeadProjects?: boolean;
  }): Role {
    const errors: FieldError[] = [];

    // Validación mínima sobre id
    if (typeof props.id !== 'number' || !Number.isInteger(props.id) || props.id <= 0) {
      errors.push({
        field: 'id',
        value: props.id,
        message: 'Role.id must be a positive integer',
        code: ValidationErrorCode.FIELD_OUT_OF_RANGE,
      });
    }

    // Validar y construir RoleName VO
    let nameVO: RoleName;
    try {
      nameVO = RoleName.create(props.name);
    } catch (e: unknown) {
      // Map field errors from RoleName VO to Role context
      if (e instanceof ValidationError) {
        const mappedError = e.mapFieldName('name');
        errors.push(...mappedError.errors);
      } else {
        errors.push({
          field: 'name',
          value: props.name,
          message: (e as Error)?.message || 'Invalid RoleName',
          code: ValidationErrorCode.FIELD_FORMAT_INVALID,
        });
      }
    }

    // Validar y construir AccessLevel VO
    let accessLevelVO: AccessLevel;
    if (props.accessLevel) {
      try {
        accessLevelVO = AccessLevel.create(props.accessLevel);
      } catch (e: unknown) {
        // Map field errors from AccessLevel VO to Role context
        if (e instanceof ValidationError) {
          const mappedError = e.mapFieldName('accessLevel');
          errors.push(...mappedError.errors);
        } else {
          errors.push({
            field: 'accessLevel',
            value: props.accessLevel,
            message: (e as Error)?.message || 'Invalid AccessLevel',
            code: ValidationErrorCode.FIELD_FORMAT_INVALID,
          });
        }
      }
    }

    if (errors.length) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new Role(
      props.id,
      nameVO!,
      accessLevelVO!,
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

  getAccessLevel(): AccessLevel {
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

  canManageUsers(): boolean {
    return AccessLevelService.canManageUsers(this._accessLevel);
  }

  canAccessAdmin(): boolean {
    return AccessLevelService.canAccessAdmin(this._accessLevel);
  }

  canLeadProjects(): boolean {
    return AccessLevelService.canLeadProjects(this._accessLevel);
  }

  getPermissions() {
    return AccessLevelService.getPermissions(this._accessLevel);
  }

  isUniqueForTeam(): boolean {
    return AccessLevelService.isUniqueForTeam(this._accessLevel);
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
            accessLevel: this._accessLevel,
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
            accessLevel: this._accessLevel,
            userCount: this.userCount,
            deactivatedAt: new Date().toISOString(),
          },
          occurredAt: ISODateTime.now(),
        })
      );
    }
  }

  equals(other: Role): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return `Role(${this.id}, ${this.name}, L${this._accessLevel}, active=${this.isActive})`;
  }
}
