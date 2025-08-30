import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { ValidationError } from '../errors/validation-error.entity';

export interface AccessLevelPermissions {
  canManageSystem: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canAccessAdmin: boolean;
  canDeleteUsers: boolean;
  canLeadProjects: boolean;
  isUniqueForTeam: boolean;
  level: number;
  displayName: string;
}

export class AccessLevel {
  private constructor(private readonly value: number) {}

  static readonly MIN = 1;
  static readonly MAX = 5;

  static readonly LEVEL_NAMES: Record<number, string> = {
    1: 'Super Administrador',
    2: 'Administrador',
    3: 'Jefe de Proyecto',
    4: 'Analista de Datos',
    5: 'Usuario Estándar',
  };

  static create(value: number): AccessLevel {
    if (value < this.MIN || value > this.MAX) {
      throw ValidationError.fromMessage(
        `Invalid AccessLevel: ${value}. Must be between ${this.MIN} and ${this.MAX}.`,
        'accessLevel',
        ValidationErrorCode.FIELD_OUT_OF_RANGE
      );
    }
    return new AccessLevel(value);
  }

  getValue(): number {
    return this.value;
  }

  getName(): string {
    return AccessLevel.LEVEL_NAMES[this.value];
  }

  compareTo(other: AccessLevel): number {
    return this.value - other.value;
  }

  isEqual(other: AccessLevel): boolean {
    return this.value === other.value;
  }

  isHigherThan(other: AccessLevel): boolean {
    return this.compareTo(other) < 0;
  }

  isAtLeast(other: AccessLevel): boolean {
    return this.compareTo(other) <= 0;
  }

  // === PERMISSIONS - Domain Logic Encapsulated in VO ===
  canManageSystem(): boolean {
    return this.value === 1;
  }

  canManageUsers(): boolean {
    return this.value <= 2;
  }

  canManageProjects(): boolean {
    return this.value <= 3;
  }

  canAccessAdmin(): boolean {
    return this.value <= 3;
  }

  canDeleteUsers(): boolean {
    return this.value <= 2;
  }

  canLeadProjects(): boolean {
    return this.value <= 2;
  }

  isUniqueForTeam(): boolean {
    return this.value === 2;
  }

  getPermissions(): AccessLevelPermissions {
    return {
      canManageSystem: this.canManageSystem(),
      canManageUsers: this.canManageUsers(),
      canManageProjects: this.canManageProjects(),
      canAccessAdmin: this.canAccessAdmin(),
      canDeleteUsers: this.canDeleteUsers(),
      canLeadProjects: this.canLeadProjects(),
      isUniqueForTeam: this.isUniqueForTeam(),
      level: this.value,
      displayName: this.getName(),
    };
  }

  toString(): string {
    return this.getName();
  }
}
