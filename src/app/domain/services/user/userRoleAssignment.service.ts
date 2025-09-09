import { Role } from '@domain/entities/role.entity';
import { User } from '@domain/entities/user.entity';
import { BusinessRuleError } from '@domain/errors/business-rule-error.entity';

export class UserRoleAssignmentService {
  static canAssignRole(actor: User, targetRole: Role): boolean {
    if (!actor.role.canAccessAdmin()) return false;
    if (targetRole.accessLevel < actor.role.accessLevel) return false;
    if (!targetRole.isActive) return false;
    return true;
  }

  static assignRole(actor: User, target: User, newRole: Role): void {
    if (!this.canAssignRole(actor, newRole)) {
      throw BusinessRuleError.cannotAssignRole(
        actor.id.toString(),
        newRole.id.toString(),
        actor.role.name,
        newRole.name
      );
    }
    target.changeRole(newRole);
  }
}
