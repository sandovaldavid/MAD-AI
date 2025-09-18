import { Injectable } from '@angular/core';
import { RoleApplicationMapper, type RoleSummary } from '@application/mappers/role.mapper';
import { RoleModel } from '../models/role.model';

/**
 * Role Presentation Mapper
 *
 * Maps Application layer types to Presentation layer models.
 * Handles UI-specific transformations and formatting.
 *
 * @layer Presentation
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root',
})
export class RolePresentationMapper {
  /**
   * Maps RoleSummary to RoleModel for UI consumption
   */
  static toRoleModel(roleSummary: RoleSummary): RoleModel {
    return {
      id: roleSummary.id,
      displayName: this.formatDisplayName(roleSummary),
      name: roleSummary.name,
      accessLevel: roleSummary.accessLevel,
      isActive: roleSummary.isActive,
      description: roleSummary.description,
      userCount: roleSummary.userCount,
    };
  }

  /**
   * Maps array of RoleSummary to RoleModel array
   */
  static toRoleModels(roleSummaries: RoleSummary[]): RoleModel[] {
    return roleSummaries.map((roleSummary) => this.toRoleModel(roleSummary));
  }

  /**
   * Formats display name with access level indicator
   */
  private static formatDisplayName(role: RoleSummary): string {
    const levelText = this.getAccessLevelText(role.accessLevel);
    return `${role.name} (${levelText})`;
  }

  /**
   * Converts access level number to text representation
   */
  private static getAccessLevelText(level: number): string {
    switch (level) {
      case 1:
        return 'L1';
      case 2:
        return 'L2';
      case 3:
        return 'L3';
      case 4:
        return 'L4';
      case 5:
        return 'L5';
      default:
        return `L${level}`;
    }
  }
}
