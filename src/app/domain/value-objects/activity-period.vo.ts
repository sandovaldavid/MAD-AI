import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { FieldError } from '../errors/field-error.type';

/**
 * Activity Period Value Object
 *
 * Represents business rules for user activity periods and time-based calculations.
 * This VO encapsulates the domain knowledge about what constitutes "recent activity"
 * and provides methods for calculating time-based user statistics.
 *
 * **Business Rules:**
 * - Recent activity period is defined as 30 days (business rule)
 * - Activity calculations must use UTC time to avoid timezone issues
 * - Period must be positive and reasonable for business analysis
 *
 * **Invariants:**
 * - Period days must be > 0 and <= 365 (technical constraints)
 * - All date calculations are timezone-agnostic
 *
 * @example
 * ```typescript
 * // Use predefined recent activity period
 * const period = ActivityPeriod.recentActivity();
 * const cutoffDate = period.getCutoffDate();
 *
 * // Create custom period
 * const quarterPeriod = ActivityPeriod.create(90); // 90 days
 * const isRecent = period.isWithinPeriod(someDate);
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 * @layer Domain
 */
export class ActivityPeriod {
  private constructor(public readonly days: number) {}

  /**
   * Business rule: Recent activity is defined as 30 days
   * This is a domain constant that represents business knowledge
   */
  private static readonly RECENT_ACTIVITY_DAYS = 30;

  /**
   * Technical constraint: Maximum reasonable period for analysis
   */
  private static readonly MAX_PERIOD_DAYS = 365;

  /**
   * Creates a validated ActivityPeriod value object.
   *
   * @param days - Number of days for the activity period
   * @returns A validated ActivityPeriod instance
   * @throws {ValidationError} When validation fails
   */
  static create(days: number): ActivityPeriod {
    const errors: FieldError[] = [];

    if (typeof days !== 'number' || isNaN(days)) {
      errors.push({
        field: 'activityPeriod',
        value: days,
        message: 'Activity period must be a valid number',
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    } else if (days <= 0) {
      errors.push({
        field: 'activityPeriod',
        value: days,
        message: 'Activity period must be greater than 0',
        code: ValidationErrorCode.VALUE_TOO_LOW,
      });
    } else if (days > this.MAX_PERIOD_DAYS) {
      errors.push({
        field: 'activityPeriod',
        value: days,
        message: `Activity period cannot exceed ${this.MAX_PERIOD_DAYS} days`,
        code: ValidationErrorCode.VALUE_TOO_HIGH,
      });
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new ActivityPeriod(days);
  }

  /**
   * Creates an ActivityPeriod for recent activity based on business rules.
   * This encapsulates the domain knowledge of what "recent" means.
   *
   * @returns ActivityPeriod representing recent activity (30 days)
   */
  static recentActivity(): ActivityPeriod {
    return new ActivityPeriod(this.RECENT_ACTIVITY_DAYS);
  }

  /**
   * Gets the cutoff date for this activity period from now.
   * All dates after this cutoff are considered within the period.
   *
   * @returns Date representing the start of the activity period
   */
  getCutoffDate(): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.days);
    return cutoff;
  }

  /**
   * Checks if a given date falls within this activity period.
   *
   * @param date - The date to check (Date object, ISO string, or timestamp)
   * @returns True if the date is within the activity period
   */
  isWithinPeriod(date: Date | string | number): boolean {
    if (!date) return false;

    let checkDate: Date;
    if (date instanceof Date) {
      checkDate = date;
    } else if (typeof date === 'string') {
      checkDate = new Date(date);
    } else if (typeof date === 'number') {
      checkDate = new Date(date);
    } else {
      return false;
    }

    // Invalid date check
    if (isNaN(checkDate.getTime())) {
      return false;
    }

    const cutoff = this.getCutoffDate();
    return checkDate >= cutoff;
  }

  /**
   * Gets the number of days in this period.
   *
   * @returns Number of days
   */
  getDays(): number {
    return this.days;
  }

  /**
   * Checks value equality with another ActivityPeriod.
   *
   * @param other - The other ActivityPeriod to compare
   * @returns True if both have the same number of days
   */
  equals(other: ActivityPeriod): boolean {
    return this.days === other.days;
  }

  /**
   * Returns string representation of the activity period.
   *
   * @returns String description of the period
   */
  toString(): string {
    return `${this.days} days`;
  }
}
