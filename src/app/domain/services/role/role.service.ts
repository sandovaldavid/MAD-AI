import { RoleName } from '@domain/value-objects';
import { SYSTEM_ROLE_CATEGORIES } from '@domain/enums/role-name.enum';
import { RoleNameReservedSpec } from '@domain/specifications/role-name-reserved.specs';

export class RoleService {
  static isReserved(roleName: RoleName): boolean {
    try {
      RoleNameReservedSpec.isSatisfiedBy(roleName);
      return false; // Not reserved if no exception thrown
    } catch (error) {
      return true; // Reserved if exception thrown
    }
  }

  static isSystemRole(roleName: RoleName): boolean {
    const allSystemRoles = [
      ...SYSTEM_ROLE_CATEGORIES.ADMINISTRATOR,
      ...SYSTEM_ROLE_CATEGORIES.MODERATOR,
      ...SYSTEM_ROLE_CATEGORIES.USER,
    ].map((role) => role.toLowerCase());

    return allSystemRoles.includes(roleName.value.toLowerCase());
  }

  static validateCreation(roleName: RoleName): void {
    RoleNameReservedSpec.isSatisfiedBy(roleName);
  }
}
