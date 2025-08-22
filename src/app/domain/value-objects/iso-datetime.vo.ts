import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * ISODateTime Value Object
 *
 * Represents a validated ISO 8601 datetime string for consistent temporal data handling.
 * Ensures standardized datetime format across the domain and provides temporal operations
 * for business logic involving time-based calculations and comparisons.
 *
 * **Domain Rules:**
 * - Must follow strict ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
 * - Automatically normalized and validated against Date.parse()
 * - Supports fractional seconds up to 6 digits (microseconds)
 * - Supports timezone information (Z for UTC, ±HH:mm for offsets)
 * - Immutable once created for temporal consistency
 *
 * **Business Rules:**
 * - Used for audit trails and event timestamps
 * - Enables temporal queries and time-based business logic
 * - Ensures consistent timezone handling across the system
 * - Supports compliance with data retention policies
 * - Critical for event sourcing and temporal data integrity
 *
 * **Technical Standards:**
 * - Compliant with ISO 8601 international standard
 * - UTC preference for storage and comparison
 * - Microsecond precision for high-frequency events
 * - JSON serialization compatible
 *
 * @example
 * ```typescript
 * // Current timestamp
 * const now = ISODateTime.now();
 * console.log(now.value); // '2024-08-17T10:30:00.123Z'
 * console.log(now.toDate()); // Date object
 * console.log(now.getYear()); // 2024
 *
 * // From string validation
 * const datetime = ISODateTime.create('2024-08-17T10:30:00.000Z');
 * console.log(datetime?.value); // '2024-08-17T10:30:00.000Z'
 *
 * // Temporal operations
 * const future = datetime.addDays(7);
 * console.log(future.value); // '2024-08-24T10:30:00.000Z'
 *
 * // Comparison operations
 * const later = ISODateTime.create('2024-08-17T11:00:00.000Z');
 * console.log(datetime.isBefore(later)); // true
 * console.log(datetime.getDifferenceInMinutes(later)); // 30
 *
 * // Invalid datetime throws ValidationError
 * try {
 *   ISODateTime.create('invalid-date');
 * } catch (error) {
 *   console.log(error.message); // 'Invalid ISO 8601 datetime format'
 * }
 *
 * // Business logic examples
 * const createdAt = ISODateTime.now();
 * const isRecent = createdAt.isWithinLast(60, 'minutes');
 * const expiresAt = createdAt.addHours(24);
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/ISO_8601 | ISO 8601 Standard}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3339.txt | RFC 3339 - Date and Time on the Internet}
 */
export class ISODateTime {
    private constructor(public readonly value: string) {}

    /**
     * Creates a validated ISODateTime value object from a raw string.
     *
     * Performs comprehensive validation and normalization:
     * - Validates against strict ISO 8601 format requirements
     * - Ensures the datetime represents a valid moment in time
     * - Trims whitespace and normalizes format
     * - Supports optional fractional seconds and timezone information
     * - Returns undefined for null/empty inputs (optional datetime handling)
     *
     * @param raw - The raw datetime string to validate (optional)
     * @returns A validated ISODateTime instance or undefined if input is empty
     * @throws {ValidationError} When validation fails with specific error details
     *
     * @example
     * ```typescript
     * // Valid ISO 8601 formats
     * const basic = ISODateTime.create('2024-08-17T10:30:00Z');
     * const withMs = ISODateTime.create('2024-08-17T10:30:00.123Z');
     * const withMicros = ISODateTime.create('2024-08-17T10:30:00.123456Z');
     * const withTz = ISODateTime.create('2024-08-17T10:30:00+02:00');
     *
     * // Optional datetime handling
     * const optional = ISODateTime.create(null); // returns undefined
     * const empty = ISODateTime.create(''); // returns undefined
     *
     * // Validation errors
     * try {
     *   ISODateTime.create('2024-13-40T25:70:70Z'); // Invalid date values
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.VALIDATION_ERROR
     * }
     *
     * try {
     *   ISODateTime.create('2024/08/17 10:30:00'); // Wrong format
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_FORMAT_INVALID
     * }
     * ```
     */
    static create(raw?: string | null): ISODateTime | undefined {
        if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
            return undefined;
        }

        const errors: Array<{
            field: string;
            value: unknown;
            message: string;
            code?: ValidationErrorCode;
        }> = [];

        const normalized = raw.trim();

        // Enhanced ISO 8601 regex with more precise validation
        const isoRegex = ISODateTimeSpecs.VALIDATION_REGEX;

        if (!isoRegex.test(normalized)) {
            errors.push({
                field: 'isoDateTime',
                value: normalized,
                message:
                    'Invalid ISO 8601 datetime format. Expected format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss±HH:mm',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        // Validate actual datetime value
        const timestamp = Date.parse(normalized);
        if (isNaN(timestamp)) {
            errors.push({
                field: 'isoDateTime',
                value: normalized,
                message:
                    'Invalid datetime value. The date/time components do not represent a valid moment',
                code: ValidationErrorCode.VALIDATION_ERROR,
            });
        }

        // Check for reasonable datetime bounds (prevents extreme dates)
        if (!isNaN(timestamp)) {
            const date = new Date(timestamp);
            const year = date.getFullYear();

            if (year < ISODateTimeSpecs.MIN_YEAR) {
                errors.push({
                    field: 'isoDateTime',
                    value: normalized,
                    message: `Year must be at least ${ISODateTimeSpecs.MIN_YEAR}`,
                    code: ValidationErrorCode.VALUE_TOO_LOW,
                });
            }

            if (year > ISODateTimeSpecs.MAX_YEAR) {
                errors.push({
                    field: 'isoDateTime',
                    value: normalized,
                    message: `Year cannot exceed ${ISODateTimeSpecs.MAX_YEAR}`,
                    code: ValidationErrorCode.VALUE_TOO_HIGH,
                });
            }
        }

        if (errors.length) {
            throw ValidationError.createFromFields(errors);
        }

        return new ISODateTime(normalized);
    }

    /**
     * Creates an ISODateTime value object for the current moment.
     *
     * Returns the current timestamp in ISO 8601 format (UTC) for use in
     * domain events, entity creation timestamps, and audit trails.
     *
     * @returns ISODateTime instance representing the current moment in UTC
     *
     * @example
     * ```typescript
     * const now = ISODateTime.now();
     * console.log(now.value); // '2024-08-17T10:30:00.123Z'
     * console.log(now.isUtc()); // true
     *
     * // Business usage
     * const user = User.create({
     *   // ... other properties
     *   createdAt: ISODateTime.now()
     * });
     * ```
     */
    static now(): ISODateTime {
        return new ISODateTime(new Date().toISOString());
    }

    /**
     * Creates an ISODateTime from a Date object.
     *
     * Converts a JavaScript Date object to an ISODateTime value object,
     * useful for integration with existing code or APIs that use Date objects.
     *
     * @param date - The Date object to convert
     * @returns ISODateTime instance representing the same moment
     *
     * @example
     * ```typescript
     * const date = new Date('2024-08-17T10:30:00Z');
     * const isoDateTime = ISODateTime.fromDate(date);
     * console.log(isoDateTime.value); // '2024-08-17T10:30:00.000Z'
     *
     * // With current date
     * const now = ISODateTime.fromDate(new Date());
     * ```
     */
    static fromDate(date: Date): ISODateTime {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw ValidationError.create({
                field: 'date',
                value: date,
                message: 'Invalid Date object provided',
                code: ValidationErrorCode.VALIDATION_ERROR,
            });
        }

        return new ISODateTime(date.toISOString());
    }

    /**
     * Creates an ISODateTime from a Unix timestamp.
     *
     * Converts a Unix timestamp (seconds since epoch) to an ISODateTime value object.
     *
     * @param timestamp - Unix timestamp in seconds
     * @returns ISODateTime instance representing the timestamp
     *
     * @example
     * ```typescript
     * const timestamp = 1692264600; // Unix timestamp
     * const isoDateTime = ISODateTime.fromUnixTimestamp(timestamp);
     * console.log(isoDateTime.value); // '2023-08-17T10:30:00.000Z'
     * ```
     */
    static fromUnixTimestamp(timestamp: number): ISODateTime {
        if (typeof timestamp !== 'number' || isNaN(timestamp)) {
            throw ValidationError.create({
                field: 'timestamp',
                value: timestamp,
                message: 'Invalid Unix timestamp provided',
                code: ValidationErrorCode.VALIDATION_ERROR,
            });
        }

        const date = new Date(timestamp * 1000);
        return new ISODateTime(date.toISOString());
    }

    /**
     * Checks value equality with another ISODateTime instance.
     *
     * Two ISODateTime instances are considered equal if they represent
     * the exact same moment in time, regardless of timezone representation.
     *
     * @param other - The other ISODateTime instance to compare
     * @returns True if both represent the same moment in time
     *
     * @example
     * ```typescript
     * const utc = ISODateTime.create('2024-08-17T10:30:00Z');
     * const offset = ISODateTime.create('2024-08-17T12:30:00+02:00');
     * console.log(utc.equals(offset)); // true (same moment, different timezone)
     *
     * const different = ISODateTime.create('2024-08-17T10:30:01Z');
     * console.log(utc.equals(different)); // false (1 second difference)
     * ```
     */
    equals(other: ISODateTime): boolean {
        return this.toDate().getTime() === other.toDate().getTime();
    }

    /**
     * Returns the string representation of the ISO datetime.
     *
     * @returns The ISO 8601 formatted datetime string
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.now();
     * console.log(datetime.toString()); // '2024-08-17T10:30:00.123Z'
     * console.log(`Created at: ${datetime}`); // 'Created at: 2024-08-17T10:30:00.123Z'
     * ```
     */
    toString(): string {
        return this.value;
    }

    /**
     * Converts the ISODateTime to a JavaScript Date object.
     *
     * @returns Date object representing the same moment
     *
     * @example
     * ```typescript
     * const isoDateTime = ISODateTime.create('2024-08-17T10:30:00Z');
     * const date = isoDateTime.toDate();
     * console.log(date.getFullYear()); // 2024
     * console.log(date.getMonth()); // 7 (August, 0-indexed)
     * ```
     */
    toDate(): Date {
        return new Date(this.value);
    }

    /**
     * Gets the Unix timestamp (seconds since epoch).
     *
     * @returns Unix timestamp as a number
     *
     * @example
     * ```typescript
     * const isoDateTime = ISODateTime.create('2024-08-17T10:30:00Z');
     * const timestamp = isoDateTime.toUnixTimestamp();
     * console.log(timestamp); // 1723891800
     * ```
     */
    toUnixTimestamp(): number {
        return Math.floor(this.toDate().getTime() / 1000);
    }

    /**
     * Gets the milliseconds since epoch.
     *
     * @returns Milliseconds since epoch as a number
     *
     * @example
     * ```typescript
     * const isoDateTime = ISODateTime.create('2024-08-17T10:30:00.123Z');
     * const ms = isoDateTime.toMilliseconds();
     * console.log(ms); // 1723891800123
     * ```
     */
    toMilliseconds(): number {
        return this.toDate().getTime();
    }

    /**
     * Checks if the datetime is in UTC timezone.
     *
     * @returns True if the datetime ends with 'Z' (UTC indicator)
     *
     * @example
     * ```typescript
     * const utc = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(utc.isUtc()); // true
     *
     * const offset = ISODateTime.create('2024-08-17T10:30:00+02:00');
     * console.log(offset.isUtc()); // false
     * ```
     */
    isUtc(): boolean {
        return this.value.endsWith('Z');
    }

    /**
     * Gets the year component.
     *
     * @returns The year as a number
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(datetime.getYear()); // 2024
     * ```
     */
    getYear(): number {
        return this.toDate().getFullYear();
    }

    /**
     * Gets the month component (1-12).
     *
     * @returns The month as a number (1-12, unlike Date.getMonth())
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(datetime.getMonth()); // 8 (August)
     * ```
     */
    getMonth(): number {
        return this.toDate().getMonth() + 1; // Convert from 0-indexed to 1-indexed
    }

    /**
     * Gets the day of month component.
     *
     * @returns The day of month as a number (1-31)
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(datetime.getDay()); // 17
     * ```
     */
    getDay(): number {
        return this.toDate().getDate();
    }

    /**
     * Gets the hour component (0-23).
     *
     * @returns The hour as a number (0-23)
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(datetime.getHour()); // 10
     * ```
     */
    getHour(): number {
        return this.toDate().getUTCHours();
    }

    /**
     * Gets the minute component (0-59).
     *
     * @returns The minute as a number (0-59)
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(datetime.getMinute()); // 30
     * ```
     */
    getMinute(): number {
        return this.toDate().getUTCMinutes();
    }

    /**
     * Gets the second component (0-59).
     *
     * @returns The second as a number (0-59)
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:45Z');
     * console.log(datetime.getSecond()); // 45
     * ```
     */
    getSecond(): number {
        return this.toDate().getUTCSeconds();
    }

    /**
     * Checks if this datetime is before another datetime.
     *
     * @param other - The other ISODateTime to compare against
     * @returns True if this datetime is before the other
     *
     * @example
     * ```typescript
     * const earlier = ISODateTime.create('2024-08-17T10:30:00Z');
     * const later = ISODateTime.create('2024-08-17T11:30:00Z');
     * console.log(earlier.isBefore(later)); // true
     * console.log(later.isBefore(earlier)); // false
     * ```
     */
    isBefore(other: ISODateTime): boolean {
        return this.toDate().getTime() < other.toDate().getTime();
    }

    /**
     * Checks if this datetime is after another datetime.
     *
     * @param other - The other ISODateTime to compare against
     * @returns True if this datetime is after the other
     *
     * @example
     * ```typescript
     * const earlier = ISODateTime.create('2024-08-17T10:30:00Z');
     * const later = ISODateTime.create('2024-08-17T11:30:00Z');
     * console.log(later.isAfter(earlier)); // true
     * console.log(earlier.isAfter(later)); // false
     * ```
     */
    isAfter(other: ISODateTime): boolean {
        return this.toDate().getTime() > other.toDate().getTime();
    }

    /**
     * Checks if this datetime is between two other datetimes (inclusive).
     *
     * @param start - The start of the range
     * @param end - The end of the range
     * @returns True if this datetime is between start and end (inclusive)
     *
     * @example
     * ```typescript
     * const start = ISODateTime.create('2024-08-17T10:00:00Z');
     * const middle = ISODateTime.create('2024-08-17T10:30:00Z');
     * const end = ISODateTime.create('2024-08-17T11:00:00Z');
     * console.log(middle.isBetween(start, end)); // true
     * ```
     */
    isBetween(start: ISODateTime, end: ISODateTime): boolean {
        const thisTime = this.toDate().getTime();
        const startTime = start.toDate().getTime();
        const endTime = end.toDate().getTime();
        return thisTime >= startTime && thisTime <= endTime;
    }

    /**
     * Adds the specified number of days to this datetime.
     *
     * @param days - Number of days to add (can be negative)
     * @returns New ISODateTime instance with added days
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * const future = datetime.addDays(7);
     * console.log(future.value); // '2024-08-24T10:30:00.000Z'
     *
     * const past = datetime.addDays(-3);
     * console.log(past.value); // '2024-08-14T10:30:00.000Z'
     * ```
     */
    addDays(days: number): ISODateTime {
        const date = this.toDate();
        date.setUTCDate(date.getUTCDate() + days);
        return new ISODateTime(date.toISOString());
    }

    /**
     * Adds the specified number of hours to this datetime.
     *
     * @param hours - Number of hours to add (can be negative)
     * @returns New ISODateTime instance with added hours
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * const future = datetime.addHours(2);
     * console.log(future.value); // '2024-08-17T12:30:00.000Z'
     * ```
     */
    addHours(hours: number): ISODateTime {
        const date = this.toDate();
        date.setUTCHours(date.getUTCHours() + hours);
        return new ISODateTime(date.toISOString());
    }

    /**
     * Adds the specified number of minutes to this datetime.
     *
     * @param minutes - Number of minutes to add (can be negative)
     * @returns New ISODateTime instance with added minutes
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * const future = datetime.addMinutes(15);
     * console.log(future.value); // '2024-08-17T10:45:00.000Z'
     * ```
     */
    addMinutes(minutes: number): ISODateTime {
        const date = this.toDate();
        date.setUTCMinutes(date.getUTCMinutes() + minutes);
        return new ISODateTime(date.toISOString());
    }

    /**
     * Adds the specified number of seconds to this datetime.
     *
     * @param seconds - Number of seconds to add (can be negative)
     * @returns New ISODateTime instance with added seconds
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * const future = datetime.addSeconds(30);
     * console.log(future.value); // '2024-08-17T10:30:30.000Z'
     * ```
     */
    addSeconds(seconds: number): ISODateTime {
        const date = this.toDate();
        date.setUTCSeconds(date.getUTCSeconds() + seconds);
        return new ISODateTime(date.toISOString());
    }

    /**
     * Gets the difference between this and another datetime in milliseconds.
     *
     * @param other - The other ISODateTime to compare against
     * @returns Difference in milliseconds (positive if this is later)
     *
     * @example
     * ```typescript
     * const start = ISODateTime.create('2024-08-17T10:30:00Z');
     * const end = ISODateTime.create('2024-08-17T10:31:30Z');
     * console.log(end.getDifferenceInMilliseconds(start)); // 90000 (90 seconds)
     * ```
     */
    getDifferenceInMilliseconds(other: ISODateTime): number {
        return this.toDate().getTime() - other.toDate().getTime();
    }

    /**
     * Gets the difference between this and another datetime in seconds.
     *
     * @param other - The other ISODateTime to compare against
     * @returns Difference in seconds (positive if this is later)
     *
     * @example
     * ```typescript
     * const start = ISODateTime.create('2024-08-17T10:30:00Z');
     * const end = ISODateTime.create('2024-08-17T10:31:30Z');
     * console.log(end.getDifferenceInSeconds(start)); // 90
     * ```
     */
    getDifferenceInSeconds(other: ISODateTime): number {
        return Math.round(this.getDifferenceInMilliseconds(other) / 1000);
    }

    /**
     * Gets the difference between this and another datetime in minutes.
     *
     * @param other - The other ISODateTime to compare against
     * @returns Difference in minutes (positive if this is later)
     *
     * @example
     * ```typescript
     * const start = ISODateTime.create('2024-08-17T10:30:00Z');
     * const end = ISODateTime.create('2024-08-17T11:00:00Z');
     * console.log(end.getDifferenceInMinutes(start)); // 30
     * ```
     */
    getDifferenceInMinutes(other: ISODateTime): number {
        return Math.round(this.getDifferenceInMilliseconds(other) / (1000 * 60));
    }

    /**
     * Gets the difference between this and another datetime in hours.
     *
     * @param other - The other ISODateTime to compare against
     * @returns Difference in hours (positive if this is later)
     *
     * @example
     * ```typescript
     * const start = ISODateTime.create('2024-08-17T10:30:00Z');
     * const end = ISODateTime.create('2024-08-17T13:30:00Z');
     * console.log(end.getDifferenceInHours(start)); // 3
     * ```
     */
    getDifferenceInHours(other: ISODateTime): number {
        return Math.round(this.getDifferenceInMilliseconds(other) / (1000 * 60 * 60));
    }

    /**
     * Gets the difference between this and another datetime in days.
     *
     * @param other - The other ISODateTime to compare against
     * @returns Difference in days (positive if this is later)
     *
     * @example
     * ```typescript
     * const start = ISODateTime.create('2024-08-17T10:30:00Z');
     * const end = ISODateTime.create('2024-08-24T10:30:00Z');
     * console.log(end.getDifferenceInDays(start)); // 7
     * ```
     */
    getDifferenceInDays(other: ISODateTime): number {
        return Math.round(this.getDifferenceInMilliseconds(other) / (1000 * 60 * 60 * 24));
    }

    /**
     * Checks if the datetime is within the last specified time period.
     *
     * @param amount - The amount of time
     * @param unit - The time unit ('minutes', 'hours', 'days')
     * @returns True if the datetime is within the specified period from now
     *
     * @example
     * ```typescript
     * const recentTime = ISODateTime.create('2024-08-17T10:25:00Z');
     * // Assuming current time is 2024-08-17T10:30:00Z
     * console.log(recentTime.isWithinLast(10, 'minutes')); // true
     * console.log(recentTime.isWithinLast(1, 'hours')); // true
     * console.log(recentTime.isWithinLast(1, 'days')); // true
     * ```
     */
    isWithinLast(amount: number, unit: 'minutes' | 'hours' | 'days'): boolean {
        const now = ISODateTime.now();
        const timeDiff = now.getDifferenceInMilliseconds(this);

        const unitMultipliers = {
            minutes: 1000 * 60,
            hours: 1000 * 60 * 60,
            days: 1000 * 60 * 60 * 24,
        };

        const threshold = amount * unitMultipliers[unit];
        return timeDiff >= 0 && timeDiff <= threshold;
    }

    /**
     * Formats the datetime for display purposes.
     *
     * @param format - The format type ('date', 'time', 'datetime', 'relative')
     * @param locale - The locale for formatting (default: 'en-US')
     * @returns Formatted datetime string
     *
     * @example
     * ```typescript
     * const datetime = ISODateTime.create('2024-08-17T10:30:00Z');
     * console.log(datetime.format('date')); // '8/17/2024'
     * console.log(datetime.format('time')); // '10:30:00 AM'
     * console.log(datetime.format('datetime')); // '8/17/2024, 10:30:00 AM'
     * console.log(datetime.format('relative')); // 'X minutes ago' or similar
     * ```
     */
    format(format: 'date' | 'time' | 'datetime' | 'relative', locale: string = 'en-US'): string {
        const date = this.toDate();

        switch (format) {
            case 'date':
                return date.toLocaleDateString(locale);
            case 'time':
                return date.toLocaleTimeString(locale);
            case 'datetime':
                return date.toLocaleString(locale);
            case 'relative':
                return this.getRelativeTimeString();
            default:
                return this.value;
        }
    }

    /**
     * Gets a human-readable relative time string.
     *
     * @returns Relative time string like "2 minutes ago", "in 3 hours", etc.
     *
     * @example
     * ```typescript
     * const past = ISODateTime.create('2024-08-17T10:25:00Z');
     * // Assuming current time is 2024-08-17T10:30:00Z
     * console.log(past.getRelativeTimeString()); // '5 minutes ago'
     *
     * const future = ISODateTime.create('2024-08-17T12:30:00Z');
     * console.log(future.getRelativeTimeString()); // 'in 2 hours'
     * ```
     */
    getRelativeTimeString(): string {
        const now = ISODateTime.now();
        const diffMs = this.getDifferenceInMilliseconds(now);
        const absDiffMs = Math.abs(diffMs);

        const isFuture = diffMs > 0;
        const prefix = isFuture ? 'in ' : '';
        const suffix = isFuture ? '' : ' ago';

        // Less than 1 minute
        if (absDiffMs < 60 * 1000) {
            return 'just now';
        }

        // Minutes
        if (absDiffMs < 60 * 60 * 1000) {
            const minutes = Math.round(absDiffMs / (60 * 1000));
            return `${prefix}${minutes} minute${minutes === 1 ? '' : 's'}${suffix}`;
        }

        // Hours
        if (absDiffMs < 24 * 60 * 60 * 1000) {
            const hours = Math.round(absDiffMs / (60 * 60 * 1000));
            return `${prefix}${hours} hour${hours === 1 ? '' : 's'}${suffix}`;
        }

        // Days
        if (absDiffMs < 30 * 24 * 60 * 60 * 1000) {
            const days = Math.round(absDiffMs / (24 * 60 * 60 * 1000));
            return `${prefix}${days} day${days === 1 ? '' : 's'}${suffix}`;
        }

        // Months
        if (absDiffMs < 365 * 24 * 60 * 60 * 1000) {
            const months = Math.round(absDiffMs / (30 * 24 * 60 * 60 * 1000));
            return `${prefix}${months} month${months === 1 ? '' : 's'}${suffix}`;
        }

        // Years
        const years = Math.round(absDiffMs / (365 * 24 * 60 * 60 * 1000));
        return `${prefix}${years} year${years === 1 ? '' : 's'}${suffix}`;
    }
}

/**
 * ISODateTime Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the ISODateTime value object. Used for testing, documentation, and validation.
 */
export namespace ISODateTimeSpecs {
    /**
     * Enhanced ISO 8601 regular expression with comprehensive validation
     */
    export const VALIDATION_REGEX =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

    /**
     * Minimum allowed year (prevents extreme historical dates)
     */
    export const MIN_YEAR = 1900;

    /**
     * Maximum allowed year (prevents extreme future dates)
     */
    export const MAX_YEAR = 2100;

    /**
     * Validation rules applied during ISO datetime creation
     */
    export const VALIDATION_RULES = {
        REQUIRED_FORMAT: 'Must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
        VALID_DATETIME: 'Must represent a valid date and time',
        REASONABLE_YEAR: `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
        TIMEZONE_REQUIRED: 'Timezone information is required (Z or ±HH:mm)',
    } as const;

    /**
     * Business rules for ISO datetime usage in the domain
     */
    export const BUSINESS_RULES = {
        AUDIT_TRAIL: 'ISODateTime is used for audit trails and event timestamps',
        UTC_PREFERENCE: 'UTC timezone is preferred for storage and comparison',
        IMMUTABLE_TEMPORAL: 'Temporal data must be immutable once created',
        PRECISION_REQUIREMENTS: 'Microsecond precision is supported for high-frequency events',
        COMPLIANCE_STANDARDS: 'Must comply with ISO 8601 international standard',
    } as const;

    /**
     * Common datetime formats used in the system
     */
    export const COMMON_FORMATS = {
        BASIC_UTC: 'YYYY-MM-DDTHH:mm:ssZ',
        WITH_MILLISECONDS: 'YYYY-MM-DDTHH:mm:ss.sssZ',
        WITH_MICROSECONDS: 'YYYY-MM-DDTHH:mm:ss.ssssssZ',
        WITH_TIMEZONE: 'YYYY-MM-DDTHH:mm:ss±HH:mm',
    } as const;
}

/**
 * ISODateTime utility functions for common operations
 */
export namespace ISODateTimeUtils {
    /**
     * Validates if a string could be a valid ISO datetime without creating the value object
     *
     * @param value - The string to validate
     * @returns True if the string appears to be a valid ISO datetime format
     */
    export function isValidFormat(value: string): boolean {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return false;
        }

        const normalized = value.trim();

        if (!ISODateTimeSpecs.VALIDATION_REGEX.test(normalized)) {
            return false;
        }

        const timestamp = Date.parse(normalized);
        if (isNaN(timestamp)) {
            return false;
        }

        const date = new Date(timestamp);
        const year = date.getFullYear();

        return year >= ISODateTimeSpecs.MIN_YEAR && year <= ISODateTimeSpecs.MAX_YEAR;
    }

    /**
     * Gets the current datetime in ISO format
     *
     * @returns Current datetime as ISO string
     */
    export function currentISO(): string {
        return new Date().toISOString();
    }

    /**
     * Converts a Unix timestamp to ISO format
     *
     * @param timestamp - Unix timestamp in seconds
     * @returns ISO datetime string
     */
    export function fromUnixTimestamp(timestamp: number): string {
        return new Date(timestamp * 1000).toISOString();
    }

    /**
     * Converts an ISO datetime to Unix timestamp
     *
     * @param isoString - ISO datetime string
     * @returns Unix timestamp in seconds
     */
    export function toUnixTimestamp(isoString: string): number {
        return Math.floor(Date.parse(isoString) / 1000);
    }

    /**
     * Checks if two ISO datetime strings represent the same moment
     *
     * @param iso1 - First ISO datetime string
     * @param iso2 - Second ISO datetime string
     * @returns True if both represent the same moment
     */
    export function areEqual(iso1: string, iso2: string): boolean {
        const time1 = Date.parse(iso1);
        const time2 = Date.parse(iso2);
        return !isNaN(time1) && !isNaN(time2) && time1 === time2;
    }

    /**
     * Gets the start of day for a given ISO datetime
     *
     * @param isoString - ISO datetime string
     * @returns ISO datetime string representing start of day (00:00:00.000Z)
     */
    export function getStartOfDay(isoString: string): string {
        const date = new Date(isoString);
        date.setUTCHours(0, 0, 0, 0);
        return date.toISOString();
    }

    /**
     * Gets the end of day for a given ISO datetime
     *
     * @param isoString - ISO datetime string
     * @returns ISO datetime string representing end of day (23:59:59.999Z)
     */
    export function getEndOfDay(isoString: string): string {
        const date = new Date(isoString);
        date.setUTCHours(23, 59, 59, 999);
        return date.toISOString();
    }
}
