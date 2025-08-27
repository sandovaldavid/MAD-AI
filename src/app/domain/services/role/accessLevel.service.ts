import { AccessLevel } from '@domain/value-objects/accesslevel.vo';

export interface AccessLevelPermissions {
  canManageSystem: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canAccessAdmin: boolean;
  canDeleteUsers: boolean;
  level: number;
  displayName: string;
}

export class AccessLevelService {
  static isHigherThan(current: AccessLevel, other: AccessLevel): boolean {
    return current.compareTo(other) < 0;
  }

  static isAtLeast(current: AccessLevel, required: AccessLevel): boolean {
    return current.compareTo(required) <= 0;
  }

  // === PERMISSIONS ===
  static canManageSystem(level: AccessLevel): boolean {
    return level.getValue() === 1;
  }

  static canManageUsers(level: AccessLevel): boolean {
    return level.getValue() <= 2;
  }

  static canManageProjects(level: AccessLevel): boolean {
    return level.getValue() <= 3;
  }

  static canAccessAdmin(level: AccessLevel): boolean {
    return level.getValue() <= 3;
  }

  static canDeleteUsers(level: AccessLevel): boolean {
    return level.getValue() <= 2;
  }

  static canLeadProjects(level: AccessLevel): boolean {
    return level.getValue() <= 2;
  }

  static isUniqueForTeam(level: AccessLevel): boolean {
    return level.getValue() === 2;
  }

  // === SINGLE ENTRY POINT ===
  static getPermissions(level: AccessLevel): AccessLevelPermissions {
    return {
      canManageSystem: this.canManageSystem(level),
      canManageUsers: this.canManageUsers(level),
      canManageProjects: this.canManageProjects(level),
      canAccessAdmin: this.canAccessAdmin(level),
      canDeleteUsers: this.canDeleteUsers(level),
      level: level.getValue(),
      displayName: level.getName(),
    };
  }
}
