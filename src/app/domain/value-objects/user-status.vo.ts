import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { UserStatus } from '../enums/user-status.enum';

// Value Object for UserStatus
export class UserStatusVO {
  private static allowed: UserStatus[] = [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
    UserStatus.PENDING,
  ];

  readonly value: UserStatus;

  private constructor(value: UserStatus) {
    this.value = value;
  }

  static create(raw: string | UserStatus): UserStatusVO {
    if (typeof raw !== 'string' && !Object.values(UserStatus).includes(raw)) {
      throw ValidationError.createFromFields([
        {
          field: 'userStatus',
          value: raw,
          message: 'User status is required and must be a valid string',
          code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        },
      ]);
    }

    const normalized = typeof raw === 'string' ? raw.trim().toLowerCase() : raw;

    if (typeof normalized === 'string' && normalized.length === 0) {
      throw ValidationError.createFromFields([
        {
          field: 'userStatus',
          value: raw,
          message: 'User status cannot be empty',
          code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        },
      ]);
    }

    const found = UserStatusVO.allowed.find((status) => status.toLowerCase() === normalized);
    if (!found) {
      const validOptions = UserStatusVO.allowed.join(', ');
      throw ValidationError.createFromFields([
        {
          field: 'userStatus',
          value: raw,
          message: `Invalid user status. Must be one of: ${validOptions}`,
          code: ValidationErrorCode.FIELD_FORMAT_INVALID,
        },
      ]);
    }

    return new UserStatusVO(found);
  }

  static isValid(raw: string | null | undefined): boolean {
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return false;
    }
    const normalized = raw.trim().toLowerCase();
    return UserStatusVO.allowed.some((status) => status.toLowerCase() === normalized);
  }

  static getAllowedValues(): UserStatus[] {
    return [...UserStatusVO.allowed];
  }

  static createDefault(): UserStatusVO {
    return new UserStatusVO(UserStatus.PENDING);
  }

  equals(other: UserStatusVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  // Simple helpers
  isActive(): boolean {
    return this.value === UserStatus.ACTIVE;
  }

  isInactive(): boolean {
    return this.value === UserStatus.INACTIVE;
  }

  isSuspended(): boolean {
    return this.value === UserStatus.SUSPENDED;
  }

  requiresVerification(): boolean {
    return this.value === UserStatus.PENDING;
  }

  canAuthenticate(): boolean {
    return [UserStatus.ACTIVE, UserStatus.PENDING].includes(this.value);
  }

  isOperational(): boolean {
    return this.value === UserStatus.ACTIVE;
  }
}
