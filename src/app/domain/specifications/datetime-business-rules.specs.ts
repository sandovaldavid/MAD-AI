import { ISODateTime } from '../value-objects/iso-datetime.vo';
import { IsoDatetimeUnitMs } from '../enums/iso-datetime.enum';
import { BusinessRuleError } from '../errors/business-rule-error.entity';

/**
 * DateTime Business Rules Specifications
 *
 * @description
 * This specification contains business-specific temporal rules that are NOT
 * invariants of the ISODateTime value object but rather domain policies.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class DateTimeBusinessRules {
  /**
   * Checks if a datetime is within the last specified time period
   *
   * @param dateTime - The datetime to check
   * @param amount - The amount of time units
   * @param unit - The time unit (minutes, hours, days)
   * @returns True if the datetime is within the specified period
   *
   * @example
   * ```typescript
   * const recentTime = ISODateTime.now().addMinutes(-10);
   * DateTimeBusinessRules.isWithinLast(recentTime, 15, 'minutes'); // true
   *
   * const oldTime = ISODateTime.now().addDays(-5);
   * DateTimeBusinessRules.isWithinLast(oldTime, 2, 'days'); // false
   * ```
   */
  static isWithinLast(
    dateTime: ISODateTime,
    amount: number,
    unit: 'minutes' | 'hours' | 'days'
  ): boolean {
    const now = ISODateTime.now();
    const diff = now.getDifferenceInMilliseconds(dateTime);

    const unitMs = IsoDatetimeUnitMs[unit.toUpperCase() as keyof typeof IsoDatetimeUnitMs];
    const threshold = amount * unitMs;

    return diff >= 0 && diff <= threshold;
  }

  /**
   * Validates that a datetime is not too far in the past (business rule)
   *
   * @param dateTime - The datetime to validate
   * @param maxDaysInPast - Maximum allowed days in the past
   * @throws {BusinessRuleError} When datetime is too old
   *
   * @example
   * ```typescript
   * const oldDate = ISODateTime.now().addDays(-400);
   * DateTimeBusinessRules.assertNotTooOld(oldDate, 365); // throws BusinessRuleError
   * ```
   */
  static assertNotTooOld(dateTime: ISODateTime, maxDaysInPast: number = 365): void {
    if (!this.isWithinLast(dateTime, maxDaysInPast, 'days')) {
      throw BusinessRuleError.dateTimeTooOld(dateTime.toString(), maxDaysInPast);
    }
  }

  /**
   * Validates that a datetime is not too far in the future (business rule)
   *
   * @param dateTime - The datetime to validate
   * @param maxDaysInFuture - Maximum allowed days in the future
   * @throws {BusinessRuleError} When datetime is too far ahead
   */
  static assertNotTooFuture(dateTime: ISODateTime, maxDaysInFuture: number = 30): void {
    const now = ISODateTime.now();
    const diff = dateTime.getDifferenceInMilliseconds(now);
    const threshold = maxDaysInFuture * IsoDatetimeUnitMs.DAYS;

    if (diff > threshold) {
      throw BusinessRuleError.dateTimeTooFuture(dateTime.toString(), maxDaysInFuture);
    }
  }

  /**
   * Validates that a datetime falls within business hours
   *
   * @param dateTime - The datetime to validate
   * @param startHour - Business start hour (0-23)
   * @param endHour - Business end hour (0-23)
   * @returns True if within business hours
   *
   * @example
   * ```typescript
   * const workTime = ISODateTime.create('2024-01-15T14:30:00Z');
   * DateTimeBusinessRules.isWithinBusinessHours(workTime, 9, 17); // true
   *
   * const nightTime = ISODateTime.create('2024-01-15T22:00:00Z');
   * DateTimeBusinessRules.isWithinBusinessHours(nightTime, 9, 17); // false
   * ```
   */
  static isWithinBusinessHours(
    dateTime: ISODateTime,
    startHour: number = 9,
    endHour: number = 17
  ): boolean {
    const hour = dateTime.getHour();
    return hour >= startHour && hour < endHour;
  }

  /**
   * Validates that a datetime represents a working day (business rule)
   *
   * @param dateTime - The datetime to validate
   * @returns True if it's a working day (Monday-Friday)
   */
  static isWorkingDay(dateTime: ISODateTime): boolean {
    const dayOfWeek = dateTime.toDate().getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
  }

  /**
   * Checks if a datetime is during a maintenance window (business rule)
   *
   * @param dateTime - The datetime to check
   * @param maintenanceStart - Start of maintenance window
   * @param maintenanceEnd - End of maintenance window
   * @returns True if during maintenance
   */
  static isDuringMaintenance(
    dateTime: ISODateTime,
    maintenanceStart: ISODateTime,
    maintenanceEnd: ISODateTime
  ): boolean {
    return dateTime.isBetween(maintenanceStart, maintenanceEnd);
  }

  /**
   * Validates session timeout rules (business rule)
   *
   * @param sessionStart - When the session started
   * @param maxSessionMinutes - Maximum session duration in minutes
   * @returns True if session is still valid
   */
  static isSessionValid(
    sessionStart: ISODateTime,
    maxSessionMinutes: number = 480 // 8 hours default
  ): boolean {
    return this.isWithinLast(sessionStart, maxSessionMinutes, 'minutes');
  }

  /**
   * Validates password age rules (business rule)
   *
   * @param passwordChanged - When password was last changed
   * @param maxPasswordAgeDays - Maximum password age in days
   * @returns True if password is still valid
   */
  static isPasswordValid(passwordChanged: ISODateTime, maxPasswordAgeDays: number = 90): boolean {
    return this.isWithinLast(passwordChanged, maxPasswordAgeDays, 'days');
  }
}
