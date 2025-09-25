import { Injectable } from '@angular/core';
import { Role } from '@domain/entities/role.entity';

/**
 * Role Application Mapper
 *
 * Maps Domain entities to Application layer types following Clean Architecture.
 * This mapper handles transformations between Domain and Application layers
 * without depending on Presentation layer concerns.
 *
 * @layer Application
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class RoleApplicationMapper {
  /**
   * Maps Domain Role entity to Application Role summary
   */
  static toRoleSummary(role: Role): RoleSummary {
    return {
      id: role.id,
      name: role.name,
      accessLevel: role.accessLevel,
      description: role.description,
      canLeadProjects: role.canLeadProjects(),
      isUniquePerTeam: role.isUniqueForTeam(),
      isActive: role.isActive,
      userCount: role.userCount,
      createdAt: role.createdAt,
    };
  }

  /**
   * Maps array of Domain Role entities to Application Role summaries
   */
  static toRoleSummaries(roles: Role[]): RoleSummary[] {
    return roles.map((role) => this.toRoleSummary(role));
  }

  /**
   * Maps Domain Role entity to detailed Application Role view
   */
  static toRoleDetail(role: Role): RoleDetail {
    return {
      ...this.toRoleSummary(role),
      permissions: role.getPermissions(),
      metadata: {
        totalUsers: role.userCount,
        canManageUsers: role.canManageUsers(),
        canAccessAdmin: role.canAccessAdmin(),
      },
    };
  }
}

// ============================================================================
// Application Types (Clean Architecture compliant)
// ============================================================================

export interface RoleSummary {
  readonly id: number;
  readonly name: string;
  readonly accessLevel: number;
  readonly description: string;
  readonly canLeadProjects: boolean;
  readonly isUniquePerTeam: boolean;
  readonly isActive: boolean;
  readonly userCount: number;
  readonly createdAt?: Date;
}

export interface RoleDetail extends RoleSummary {
  readonly permissions: string[];
  readonly metadata: {
    readonly totalUsers: number;
    readonly canManageUsers: boolean;
    readonly canAccessAdmin: boolean;
  };
  readonly createdAt?: Date;
}

export interface RoleUser {
  readonly id: number;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly isActive: boolean;
}

export interface RoleExportOptions {
  readonly format: 'csv' | 'excel' | 'pdf';
  readonly includeUsers: boolean;
  readonly includePermissions: boolean;
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
}

export interface RoleExportData {
  readonly id: number;
  readonly name: string;
  readonly accessLevel: number;
  readonly description: string;
  readonly canLeadProjects: boolean;
  readonly isUniquePerTeam: boolean;
  readonly isActive: boolean;
  readonly userCount: number;
}
