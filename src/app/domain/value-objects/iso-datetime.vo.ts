import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { FieldError } from '../errors/field-error.type';
import {
  ISO_DATETIME_VALIDATION_REGEX,
  IsoDatetimeUnitMs,
  IsoDatetimeYearRange,
} from '../enums/iso-datetime.enum';

/**
 * ISODateTime Value Object
 *
 * Represents a validated ISO 8601 compliant datetime with immutable operations.
 * This VO only validates technical invariants (ISO format, year range).
 * Business rules and presentation logic are handled by separate services.
 *
 * **Invariant Rules:**
 * - Must be valid ISO 8601 format (technical constraint)
 * - Must be parseable by JavaScript Date (technical constraint)
 * - Year must be within acceptable range (technical constraint)
 * - Automatically normalized to string format
 *
 * **Business Rules (handled elsewhere):**
 * - Temporal business policies → DateTimeBusinessRules specification
 * - Formatting/display logic → DateTimeFormatterService
 * - Session timeouts → Application layer
 *
 * @example
 * ```typescript
 * // Valid creation
 * const dateTime = ISODateTime.create('2024-01-15T14:30:00Z');
 * console.log(dateTime.value); // '2024-01-15T14:30:00Z'
 * console.log(dateTime.getYear()); // 2024
 *
 * // Invalid creation throws ValidationError
 * try {
 *   ISODateTime.create('invalid-date');
 * } catch (error) {
 *   console.log(error.message); // 'Invalid ISO 8601 datetime format'
 * }
 *
 * // Mathematical operations (pure)
 * const later = dateTime.addHours(5);
 * const diff = later.getDifferenceInHours(dateTime); // 5
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class ISODateTime {
  private constructor(public readonly value: string) {}

  /**
   * Creates a validated ISODateTime value object from a raw string.
   *
   * Performs comprehensive validation:
   * - Validates ISO 8601 format compliance
   * - Validates that the date is parseable
   * - Validates year is within acceptable range
   * - Returns undefined for null/empty inputs (optional pattern)
   *
   * @param raw - The raw ISO datetime string to validate
   * @returns A validated ISODateTime instance or undefined for empty input
   * @throws {ValidationError} When validation fails
   */
  static create(raw?: string | null): ISODateTime | undefined {
    // Allow null/empty - return undefined (optional pattern)
    if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
      return undefined;
    }

    const normalized = raw.trim();
    const errors: FieldError[] = [];

    // ISO 8601 format validation (invariant)
    if (!ISO_DATETIME_VALIDATION_REGEX.test(normalized)) {
      errors.push({
        field: 'isoDateTime',
        value: normalized,
        message: 'Invalid ISO 8601 datetime format',
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      });
    }

    // Parseable date validation (invariant)
    const timestamp = Date.parse(normalized);
    if (isNaN(timestamp)) {
      errors.push({
        field: 'isoDateTime',
        value: normalized,
        message: 'Invalid datetime value',
        code: ValidationErrorCode.VALIDATION_ERROR,
      });
    } else {
      // Year range validation (technical constraint)
      const year = new Date(timestamp).getFullYear();
      if (year < IsoDatetimeYearRange.MIN) {
        errors.push({
          field: 'isoDateTime',
          value: normalized,
          message: `Year must be >= ${IsoDatetimeYearRange.MIN}`,
          code: ValidationErrorCode.VALUE_TOO_LOW,
        });
      }
      if (year > IsoDatetimeYearRange.MAX) {
        errors.push({
          field: 'isoDateTime',
          value: normalized,
          message: `Year must be <= ${IsoDatetimeYearRange.MAX}`,
          code: ValidationErrorCode.VALUE_TOO_HIGH,
        });
      }
    }

    if (errors.length > 0) {
      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new ISODateTime(normalized);
  }

  /**
   * Creates an ISODateTime for the current moment.
   *
   * @returns ISODateTime representing now
   */
  static now(): ISODateTime {
    return new ISODateTime(new Date().toISOString());
  }

  /**
   * Creates an ISODateTime from a JavaScript Date object.
   *
   * @param date - The Date object to convert
   * @returns ISODateTime representation
   * @throws {ValidationError} When Date object is invalid
   */
  static fromDate(date: Date): ISODateTime {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw ValidationError.fromMessage(
        'Invalid Date object provided',
        'date',
        ValidationErrorCode.INVALID_FORMAT
      );
    }
    return ISODateTime.create(date.toISOString())!;
  }

  /**
   * Creates an ISODateTime from a Unix timestamp (seconds since epoch).
   *
   * @param timestamp - Unix timestamp in seconds
   * @returns ISODateTime representation
   * @throws {ValidationError} When timestamp is invalid
   */
  static fromUnixTimestamp(timestamp: number): ISODateTime {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      throw ValidationError.fromMessage(
        'Invalid Unix timestamp provided',
        'timestamp',
        ValidationErrorCode.INVALID_FORMAT
      );
    }
    return new ISODateTime(new Date(timestamp * 1000).toISOString());
  }

  // ---- Equality & Conversion ----

  /**
   * Checks value equality with another ISODateTime instance.
   *
   * Compares the underlying timestamp values for equality.
   *
   * @param other - The other ISODateTime instance to compare
   * @returns True if both represent the same moment in time
   */
  equals(other: ISODateTime): boolean {
    return this.toDate().getTime() === other.toDate().getTime();
  }

  /**
   * Returns the string representation (ISO 8601 format).
   *
   * @returns The ISO 8601 datetime string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Converts to JavaScript Date object.
   *
   * @returns JavaScript Date representation
   */
  toDate(): Date {
    return new Date(this.value);
  }

  /**
   * Converts to Unix timestamp (seconds since epoch).
   *
   * @returns Unix timestamp in seconds
   */
  toUnixTimestamp(): number {
    return Math.floor(this.toDate().getTime() / 1000);
  }

  /**
   * Converts to milliseconds since epoch.
   *
   * @returns Milliseconds since epoch
   */
  toMilliseconds(): number {
    return this.toDate().getTime();
  }

  // ---- Component Getters ----

  /**
   * Checks if the datetime is in UTC format.
   *
   * @returns True if ends with 'Z' (UTC indicator)
   */
  isUtc(): boolean {
    return this.value.endsWith('Z');
  }

  /**
   * Gets the year component.
   *
   * @returns Year as number
   */
  getYear(): number {
    return this.toDate().getFullYear();
  }

  /**
   * Gets the month component (1-12).
   *
   * @returns Month as number (1 = January, 12 = December)
   */
  getMonth(): number {
    return this.toDate().getMonth() + 1;
  }

  /**
   * Gets the day component (1-31).
   *
   * @returns Day of month as number
   */
  getDay(): number {
    return this.toDate().getDate();
  }

  /**
   * Gets the hour component in UTC (0-23).
   *
   * @returns Hour as number
   */
  getHour(): number {
    return this.toDate().getUTCHours();
  }

  /**
   * Gets the minute component in UTC (0-59).
   *
   * @returns Minute as number
   */
  getMinute(): number {
    return this.toDate().getUTCMinutes();
  }

  /**
   * Gets the second component in UTC (0-59).
   *
   * @returns Second as number
   */
  getSecond(): number {
    return this.toDate().getUTCSeconds();
  }

  // ---- Temporal Comparisons ----

  /**
   * Checks if this datetime is before another.
   *
   * @param other - The other ISODateTime to compare
   * @returns True if this is before other
   */
  isBefore(other: ISODateTime): boolean {
    return this.toDate().getTime() < other.toDate().getTime();
  }

  /**
   * Checks if this datetime is after another.
   *
   * @param other - The other ISODateTime to compare
   * @returns True if this is after other
   */
  isAfter(other: ISODateTime): boolean {
    return this.toDate().getTime() > other.toDate().getTime();
  }

  /**
   * Checks if this datetime falls between two others (inclusive).
   *
   * @param start - The start of the range
   * @param end - The end of the range
   * @returns True if this falls within the range
   */
  isBetween(start: ISODateTime, end: ISODateTime): boolean {
    const t = this.toDate().getTime();
    return t >= start.toDate().getTime() && t <= end.toDate().getTime();
  }

  // ---- Temporal Operations (Pure) ----

  /**
   * Adds the specified number of days.
   *
   * @param days - Number of days to add (can be negative)
   * @returns New ISODateTime instance
   */
  addDays(days: number): ISODateTime {
    return ISODateTime.fromDate(new Date(this.toDate().getTime() + days * IsoDatetimeUnitMs.DAYS));
  }

  /**
   * Adds the specified number of hours.
   *
   * @param hours - Number of hours to add (can be negative)
   * @returns New ISODateTime instance
   */
  addHours(hours: number): ISODateTime {
    return ISODateTime.fromDate(
      new Date(this.toDate().getTime() + hours * IsoDatetimeUnitMs.HOURS)
    );
  }

  /**
   * Adds the specified number of minutes.
   *
   * @param minutes - Number of minutes to add (can be negative)
   * @returns New ISODateTime instance
   */
  addMinutes(minutes: number): ISODateTime {
    return ISODateTime.fromDate(
      new Date(this.toDate().getTime() + minutes * IsoDatetimeUnitMs.MINUTES)
    );
  }

  /**
   * Adds the specified number of seconds.
   *
   * @param seconds - Number of seconds to add (can be negative)
   * @returns New ISODateTime instance
   */
  addSeconds(seconds: number): ISODateTime {
    return ISODateTime.fromDate(
      new Date(this.toDate().getTime() + seconds * IsoDatetimeUnitMs.SECONDS)
    );
  }

  // ---- Temporal Differences (Pure) ----

  /**
   * Gets the difference in milliseconds from another datetime.
   *
   * @param other - The other datetime to compare
   * @returns Difference in milliseconds (positive if this is after other)
   */
  getDifferenceInMilliseconds(other: ISODateTime): number {
    return this.toDate().getTime() - other.toDate().getTime();
  }

  /**
   * Gets the difference in seconds from another datetime.
   *
   * @param other - The other datetime to compare
   * @returns Difference in seconds (rounded)
   */
  getDifferenceInSeconds(other: ISODateTime): number {
    return Math.round(this.getDifferenceInMilliseconds(other) / IsoDatetimeUnitMs.SECONDS);
  }

  /**
   * Gets the difference in minutes from another datetime.
   *
   * @param other - The other datetime to compare
   * @returns Difference in minutes (rounded)
   */
  getDifferenceInMinutes(other: ISODateTime): number {
    return Math.round(this.getDifferenceInMilliseconds(other) / IsoDatetimeUnitMs.MINUTES);
  }

  /**
   * Gets the difference in hours from another datetime.
   *
   * @param other - The other datetime to compare
   * @returns Difference in hours (rounded)
   */
  getDifferenceInHours(other: ISODateTime): number {
    return Math.round(this.getDifferenceInMilliseconds(other) / IsoDatetimeUnitMs.HOURS);
  }

  /**
   * Gets the difference in days from another datetime.
   *
   * @param other - The other datetime to compare
   * @returns Difference in days (rounded)
   */
  getDifferenceInDays(other: ISODateTime): number {
    return Math.round(this.getDifferenceInMilliseconds(other) / IsoDatetimeUnitMs.DAYS);
  }
}
