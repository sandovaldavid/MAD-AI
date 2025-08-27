import { ISODateTime } from '@domain/value-objects/iso-datetime.vo';
import {
  DateTimeFormat,
  DEFAULT_LOCALE,
  RELATIVE_TIME_CONFIG,
  IsoDatetimeUnitMs,
} from '@domain/enums/iso-datetime.enum';

/**
 * DateTime Formatter Service
 *
 * @description
 * Handles presentation-specific formatting of ISODateTime value objects.
 * This service contains logic that is NOT part of the VO invariants but
 * rather business/presentation formatting rules.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
export class DateTimeFormatterService {
  /**
   * Formats an ISODateTime for display according to specified format and locale
   *
   * @param dateTime - The ISODateTime to format
   * @param format - The desired format type
   * @param locale - The locale for formatting (defaults to en-US)
   * @returns Formatted date/time string
   *
   * @example
   * ```typescript
   * const now = ISODateTime.now();
   * const formatter = new DateTimeFormatterService();
   *
   * formatter.format(now, DateTimeFormat.DATE); // "12/25/2024"
   * formatter.format(now, DateTimeFormat.TIME); // "10:30:45 AM"
   * formatter.format(now, DateTimeFormat.RELATIVE); // "5 minutes ago"
   * ```
   */
  static format(
    dateTime: ISODateTime,
    format: DateTimeFormat,
    locale: string = DEFAULT_LOCALE
  ): string {
    const date = dateTime.toDate();

    switch (format) {
      case DateTimeFormat.DATE:
        return date.toLocaleDateString(locale);
      case DateTimeFormat.TIME:
        return date.toLocaleTimeString(locale);
      case DateTimeFormat.DATETIME:
        return date.toLocaleString(locale);
      case DateTimeFormat.RELATIVE:
        return this.formatRelativeTime(dateTime);
      default:
        return dateTime.toString();
    }
  }

  /**
   * Formats relative time strings (e.g., "5 minutes ago", "in 2 hours")
   *
   * @param dateTime - The ISODateTime to format relatively
   * @returns Human-readable relative time string
   *
   * @example
   * ```typescript
   * const pastTime = ISODateTime.now().addMinutes(-30);
   * DateTimeFormatterService.formatRelativeTime(pastTime); // "30 minutes ago"
   *
   * const futureTime = ISODateTime.now().addHours(2);
   * DateTimeFormatterService.formatRelativeTime(futureTime); // "in 2 hours"
   * ```
   */
  static formatRelativeTime(dateTime: ISODateTime): string {
    const now = ISODateTime.now();
    const diffMs = dateTime.getDifferenceInMilliseconds(now);
    const absMs = Math.abs(diffMs);
    const isFuture = diffMs > 0;

    // Helper for building the relative string
    const buildRelativeString = (count: number, singular: string, plural: string): string => {
      const label = count === 1 ? singular : plural;
      return isFuture ? `in ${count} ${label}` : `${count} ${label} ago`;
    };

    // Just now threshold
    if (absMs < RELATIVE_TIME_CONFIG.THRESHOLDS.JUST_NOW) {
      return RELATIVE_TIME_CONFIG.LABELS.JUST_NOW;
    }

    // Minutes
    if (absMs < RELATIVE_TIME_CONFIG.THRESHOLDS.MINUTES) {
      const minutes = Math.round(absMs / IsoDatetimeUnitMs.MINUTES);
      return buildRelativeString(
        minutes,
        RELATIVE_TIME_CONFIG.LABELS.MINUTE_SINGULAR,
        RELATIVE_TIME_CONFIG.LABELS.MINUTE_PLURAL
      );
    }

    // Hours
    if (absMs < RELATIVE_TIME_CONFIG.THRESHOLDS.HOURS) {
      const hours = Math.round(absMs / IsoDatetimeUnitMs.HOURS);
      return buildRelativeString(
        hours,
        RELATIVE_TIME_CONFIG.LABELS.HOUR_SINGULAR,
        RELATIVE_TIME_CONFIG.LABELS.HOUR_PLURAL
      );
    }

    // Days
    const days = Math.round(absMs / IsoDatetimeUnitMs.DAYS);
    return buildRelativeString(
      days,
      RELATIVE_TIME_CONFIG.LABELS.DAY_SINGULAR,
      RELATIVE_TIME_CONFIG.LABELS.DAY_PLURAL
    );
  }

  /**
   * Formats datetime for specific business contexts
   *
   * @param dateTime - The ISODateTime to format
   * @param context - Business context for formatting
   * @returns Context-appropriate formatted string
   */
  static formatForContext(
    dateTime: ISODateTime,
    context: 'audit' | 'notification' | 'report' | 'user-display'
  ): string {
    switch (context) {
      case 'audit':
        return `${dateTime.toString()} (UTC)`;
      case 'notification':
        return this.formatRelativeTime(dateTime);
      case 'report':
        return this.format(dateTime, DateTimeFormat.DATETIME);
      case 'user-display':
        // Show relative if recent, otherwise show date
        const now = ISODateTime.now();
        const diffMs = Math.abs(dateTime.getDifferenceInMilliseconds(now));
        if (diffMs < IsoDatetimeUnitMs.DAYS) {
          return this.formatRelativeTime(dateTime);
        }
        return this.format(dateTime, DateTimeFormat.DATE);
      default:
        return dateTime.toString();
    }
  }

  /**
   * Creates a formatted date range string
   *
   * @param start - Start datetime
   * @param end - End datetime
   * @param locale - Locale for formatting
   * @returns Formatted date range string
   *
   * @example
   * ```typescript
   * const start = ISODateTime.create('2024-01-01T00:00:00Z');
   * const end = ISODateTime.create('2024-01-07T23:59:59Z');
   * DateTimeFormatterService.formatRange(start, end); // "1/1/2024 - 1/7/2024"
   * ```
   */
  static formatRange(
    start: ISODateTime,
    end: ISODateTime,
    locale: string = DEFAULT_LOCALE
  ): string {
    const startFormatted = this.format(start, DateTimeFormat.DATE, locale);
    const endFormatted = this.format(end, DateTimeFormat.DATE, locale);
    return `${startFormatted} - ${endFormatted}`;
  }
}
