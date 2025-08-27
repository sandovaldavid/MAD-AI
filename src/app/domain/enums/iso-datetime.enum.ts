export enum IsoDatetimeFormat {
  ISO_8601 = 'YYYY-MM-DDTHH:mm:ss.sssZ',
  ISO_DATE = 'YYYY-MM-DD',
  ISO_TIME = 'HH:mm:ss',
}

export enum IsoDatetimeUnitMs {
  SECONDS = 1000,
  MINUTES = 60000,
  HOURS = 3600000,
  DAYS = 86400000,
}

export const ISO_DATETIME_VALIDATION_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;

export enum IsoDatetimeYearRange {
  MIN = 1900,
  MAX = 2100,
}

/**
 * Date/Time formatting options for presentation layer
 */
export enum DateTimeFormat {
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  RELATIVE = 'relative',
}

/**
 * Default locale for date/time formatting
 */
export const DEFAULT_LOCALE = 'en-US' as const;

/**
 * Relative time thresholds and labels (for presentation layer)
 */
export const RELATIVE_TIME_CONFIG = {
  THRESHOLDS: {
    JUST_NOW: IsoDatetimeUnitMs.MINUTES,
    MINUTES: IsoDatetimeUnitMs.HOURS,
    HOURS: IsoDatetimeUnitMs.DAYS,
  },
  LABELS: {
    JUST_NOW: 'just now',
    MINUTE_SINGULAR: 'minute',
    MINUTE_PLURAL: 'minutes',
    HOUR_SINGULAR: 'hour',
    HOUR_PLURAL: 'hours',
    DAY_SINGULAR: 'day',
    DAY_PLURAL: 'days',
  },
} as const;
