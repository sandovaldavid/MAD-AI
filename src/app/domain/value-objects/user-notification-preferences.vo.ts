import { ValidationError } from '../errors/validation-error.entity';
import { ValidationErrorCode } from '../errors/validation-error-code.enum';
import { FieldError } from '../errors/field-error.type';

export interface UserNotificationPreferences {
  email: boolean;
  system: boolean;
  task: boolean;
}

export class UserNotificationPreferencesVO {
  public readonly email: boolean;
  public readonly system: boolean;
  public readonly task: boolean;

  private constructor(data: UserNotificationPreferences) {
    this.email = data.email;
    this.system = data.system;
    this.task = data.task;
  }

  /**
   * Factory method to create a validated VO instance.
   * Throws ValidationError if input is invalid.
   */
  static create(data: UserNotificationPreferences): UserNotificationPreferencesVO {
    const errors: FieldError[] = [];

    // Validate presence of all required keys
    if (typeof data !== 'object' || data === null) {
      errors.push({
        field: '',
        value: data,
        message: 'Preferences must be an object',
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
        severity: 'error' as const,
      });
    } else {
      for (const key of ['email', 'system', 'task']) {
        if (!(key in data)) {
          errors.push({
            field: key,
            value: undefined,
            message: `${key} is required`,
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            severity: 'error' as const,
          });
        } else if (typeof (data as any)[key] !== 'boolean') {
          errors.push({
            field: key,
            value: (data as any)[key],
            message: `${key} must be a boolean`,
            code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            severity: 'error' as const,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.FIELD_FORMAT_INVALID);
    }

    return new UserNotificationPreferencesVO(data);
  }

  public equals(other: UserNotificationPreferencesVO): boolean {
    return this.email === other.email && this.system === other.system && this.task === other.task;
  }

  public toObject(): UserNotificationPreferences {
    return {
      email: this.email,
      system: this.system,
      task: this.task,
    };
  }
}
