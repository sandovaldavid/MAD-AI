import { UserStatus } from '@domain/enums/user-status.enum';
import { UserStatusVO } from '@domain/value-objects/user-status.vo';
import { BusinessRuleError } from '@domain/errors/business-rule-error.entity';

export interface UserStatusTransition {
  fromStatus: UserStatus;
  toStatus: UserStatus;
  reason: string;
  requiresApproval: boolean;
  severity: 'low' | 'medium' | 'high';
  notificationRequired: boolean;
}

export class UserStatusPolicy {
  private static TRANSITION_MATRIX: Record<UserStatus, UserStatus[]> = {
    [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED],
    [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
    [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
    [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
  };

  static canTransition(from: UserStatusVO, to: UserStatus): boolean {
    if (from.value === to) return false;
    return (UserStatusPolicy.TRANSITION_MATRIX[from.value] || []).includes(to);
  }

  static requiresApproval(from: UserStatus, to: UserStatus): boolean {
    return (
      to === UserStatus.SUSPENDED || (from === UserStatus.SUSPENDED && to === UserStatus.ACTIVE)
    );
  }

  static getSeverity(from: UserStatus, to: UserStatus): 'low' | 'medium' | 'high' {
    if (to === UserStatus.SUSPENDED) return 'high';
    if (
      (from === UserStatus.SUSPENDED && to === UserStatus.ACTIVE) ||
      (from === UserStatus.ACTIVE && to === UserStatus.INACTIVE)
    )
      return 'medium';
    return 'low';
  }

  static shouldNotify(from: UserStatus, to: UserStatus): boolean {
    if (to === UserStatus.SUSPENDED) return true;
    if (from === UserStatus.SUSPENDED && to === UserStatus.ACTIVE) return true;
    if (from === UserStatus.PENDING && to === UserStatus.ACTIVE) return true;
    return false;
  }

  static createTransition(
    from: UserStatusVO,
    to: UserStatus,
    reason?: string
  ): UserStatusTransition {
    if (!UserStatusPolicy.canTransition(from, to)) {
      throw new BusinessRuleError(
        `Invalid status transition from ${from.value} to ${to}.`,
        'CANNOT_CREATE_TRANSITION',
        {
          fromStatus: from.value,
          toStatus: to,
          reason: reason || '',
        }
      );
    }
    return {
      fromStatus: from.value,
      toStatus: to,
      reason: reason || '',
      requiresApproval: UserStatusPolicy.requiresApproval(from.value, to),
      severity: UserStatusPolicy.getSeverity(from.value, to),
      notificationRequired: UserStatusPolicy.shouldNotify(from.value, to),
    };
  }
}
