import { RoleName } from '../value-objects/role-name.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { RoleNameUtils } from '../enums/role-name.enum';

/**
 * Specification: Role name must not be reserved or system-defined
 *
 * @description
 * This specification enforces the business rule that role names cannot
 * use reserved system names or predefined system role categories.
 * This is a business rule, not a validation invariant.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class RoleNameReservedSpec {
  /**
   * Checks if a role name satisfies the "not reserved" business rule
   *
   * @param roleName - The role name to validate
   * @returns True if the role name is not reserved
   * @throws {BusinessRuleError} When the role name is reserved
   */
  static isSatisfiedBy(roleName: RoleName): boolean {
    return this.isSatisfiedByString(roleName.value);
  }

  /**
   * Checks if a role name string satisfies the "not reserved" business rule
   *
   * @param name - The role name string to validate
   * @returns True if the role name is not reserved
   * @throws {BusinessRuleError} When the role name is reserved
   */
  static isSatisfiedByString(name: string): boolean {
    if (this.isReservedName(name)) {
      throw BusinessRuleError.roleNameReserved(name);
    }
    return true;
  }

  /**
   * Checks if a role name is in the reserved list (private helper)
   *
   * @param name - The role name to check
   * @returns True if the name is reserved
   */
  private static isReservedName(name: string): boolean {
    const lowerName = name.toLowerCase();
    const allReservedNames = RoleNameUtils.getAllReservedNames().map((role) => role.toLowerCase());
    return allReservedNames.includes(lowerName);
  }

  /**
   * Gets a list of all reserved role names for reference
   *
   * @returns Array of all reserved role names
   */
  static getReservedNames(): string[] {
    return RoleNameUtils.getAllReservedNames();
  }

  /**
   * Suggests alternative names when a reserved name is provided
   *
   * @param reservedName - The reserved name that was attempted
   * @returns Array of suggested alternative names
   */
  static suggestAlternatives(reservedName: string): string[] {
    const base = reservedName.toLowerCase();
    return [
      `${base}Role`,
      `${base}User`,
      `Custom${RoleNameUtils.normalize(base)}`,
      `${RoleNameUtils.normalize(base)}Member`,
      `${RoleNameUtils.normalize(base)}Staff`,
    ];
  }
}
