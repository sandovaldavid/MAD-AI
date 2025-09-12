import { DateTimeService, DateTimeOptions, DateRange, BusinessHours } from './date-time.service';

describe('DateTimeService', () => {
  let service: DateTimeService;

  beforeEach(() => {
    // ZERO MOCKS: Direct instantiation as per Core Layer testing guide
    service = new DateTimeService();
  });

  describe('Basic Date Operations', () => {
    it('should return current date when calling now()', () => {
      const before = Date.now();
      const result = service.now();
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.getTime()).toBeLessThanOrEqual(after);
    });

    it('should return today without time components', () => {
      const result = service.today();
      const expected = new Date();

      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should create date with specified components', () => {
      const result = service.createDate(2023, 12, 25, 14, 30, 45);

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // Month is 0-indexed
      expect(result.getDate()).toBe(25);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(45);
    });

    it('should create date with default time components when not provided', () => {
      const result = service.createDate(2023, 6, 15);

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should parse valid date string', () => {
      const result = service.parseDate('2023-12-25T10:30:00Z');

      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2023);
      expect(result!.getMonth()).toBe(11);
      expect(result!.getDate()).toBe(25);
    });

    it('should return null for invalid date string', () => {
      const result = service.parseDate('invalid-date-string');

      expect(result).toBeNull();
    });

    it('should return null for empty date string', () => {
      const result = service.parseDate('');

      expect(result).toBeNull();
    });
  });

  describe('Date Formatting', () => {
    let testDate: Date;

    beforeEach(() => {
      testDate = new Date(2023, 11, 25, 14, 30, 45); // December 25, 2023, 14:30:45
    });

    it('should format date with default format', () => {
      const result = service.formatDate(testDate);

      // Should follow DD/MM/YYYY format
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toContain('2023');
    });

    it('should format date with custom options', () => {
      const options: DateTimeOptions = {
        locale: 'en-US',
        timezone: 'UTC',
      };

      const result = service.formatDate(testDate, 'DD/MM/YYYY', options);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should fallback to basic format when Intl fails', () => {
      // Simulate Intl failure by using invalid timezone
      const options: DateTimeOptions = {
        timezone: 'Invalid/Timezone',
      };

      const result = service.formatDate(testDate, 'DD/MM/YYYY', options);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format time with default format', () => {
      const result = service.formatTime(testDate);

      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should format time with seconds when specified', () => {
      const result = service.formatTime(testDate, 'HH:mm:ss');

      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Date Calculations', () => {
    let baseDate: Date;

    beforeEach(() => {
      baseDate = new Date(2023, 5, 15); // June 15, 2023
    });

    it('should add days correctly', () => {
      const result = service.addDays(baseDate, 10);

      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(5);
      expect(result.getFullYear()).toBe(2023);
    });

    it('should subtract days correctly', () => {
      const result = service.addDays(baseDate, -5);

      expect(result.getDate()).toBe(10);
      expect(result.getMonth()).toBe(5);
      expect(result.getFullYear()).toBe(2023);
    });

    it('should add hours correctly', () => {
      const result = service.addHours(baseDate, 5);

      expect(result.getHours()).toBe(5);
      expect(result.getDate()).toBe(15);
    });

    it('should add hours across day boundary', () => {
      const lateDate = new Date(2023, 5, 15, 23, 0, 0);
      const result = service.addHours(lateDate, 2);

      expect(result.getHours()).toBe(1);
      expect(result.getDate()).toBe(16);
    });

    it('should add minutes correctly', () => {
      const result = service.addMinutes(baseDate, 45);

      expect(result.getMinutes()).toBe(45);
      expect(result.getHours()).toBe(0);
    });

    it('should add minutes across hour boundary', () => {
      const timeDate = new Date(2023, 5, 15, 10, 45, 0);
      const result = service.addMinutes(timeDate, 30);

      expect(result.getMinutes()).toBe(15);
      expect(result.getHours()).toBe(11);
    });

    it('should add months correctly', () => {
      const result = service.addMonths(baseDate, 3);

      expect(result.getMonth()).toBe(8); // September (0-indexed)
      expect(result.getFullYear()).toBe(2023);
    });

    it('should add months across year boundary', () => {
      const result = service.addMonths(baseDate, 8);

      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });

    it('should add years correctly', () => {
      const result = service.addYears(baseDate, 2);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
    });

    it('should handle leap year correctly when adding years', () => {
      const leapYearFeb29 = service.createDate(2020, 2, 29); // Feb 29, 2020
      const result = service.addYears(leapYearFeb29, 1);

      expect(result.getFullYear()).toBe(2021);
      expect(result.getMonth()).toBe(2); // March (0-indexed) - JavaScript auto-adjusts to March 1
      expect(result.getDate()).toBe(1); // Feb 29 -> March 1 in non-leap year
    });
  });

  describe('Date Comparisons', () => {
    let date1: Date;
    let date2: Date;
    let date3: Date;

    beforeEach(() => {
      date1 = new Date(2023, 5, 15, 10, 30, 0);
      date2 = new Date(2023, 5, 15, 14, 45, 0); // Same day, different time
      date3 = new Date(2023, 5, 16, 10, 30, 0); // Different day, same time
    });

    it('should correctly identify same day', () => {
      expect(service.isSameDay(date1, date2)).toBe(true);
      expect(service.isSameDay(date1, date3)).toBe(false);
    });

    it('should correctly identify same month', () => {
      const sameMonth = new Date(2023, 5, 25);
      const differentMonth = new Date(2023, 6, 15);

      expect(service.isSameMonth(date1, sameMonth)).toBe(true);
      expect(service.isSameMonth(date1, differentMonth)).toBe(false);
    });

    it('should correctly identify same year', () => {
      const sameYear = new Date(2023, 11, 31);
      const differentYear = new Date(2024, 5, 15);

      expect(service.isSameYear(date1, sameYear)).toBe(true);
      expect(service.isSameYear(date1, differentYear)).toBe(false);
    });

    it('should correctly compare if date is before another', () => {
      expect(service.isBefore(date1, date2)).toBe(true);
      expect(service.isBefore(date2, date1)).toBe(false);
      expect(service.isBefore(date1, date1)).toBe(false);
    });

    it('should correctly compare if date is after another', () => {
      expect(service.isAfter(date2, date1)).toBe(true);
      expect(service.isAfter(date1, date2)).toBe(false);
      expect(service.isAfter(date1, date1)).toBe(false);
    });

    it('should correctly identify if date is between two dates', () => {
      expect(service.isBetween(date2, date1, date3)).toBe(true);
      expect(service.isBetween(date1, date2, date3)).toBe(false);
      expect(service.isBetween(date3, date1, date2)).toBe(false);
    });

    it('should include boundaries when checking if date is between', () => {
      expect(service.isBetween(date1, date1, date2)).toBe(true);
      expect(service.isBetween(date2, date1, date2)).toBe(true);
    });
  });

  describe('Business Time Calculations', () => {
    let monday: Date;
    let wednesday: Date;
    let saturday: Date;
    let sunday: Date;
    let customBusinessHours: BusinessHours;

    beforeEach(() => {
      // June 2023: 5th (Monday), 7th (Wednesday), 10th (Saturday), 11th (Sunday)
      monday = new Date(2023, 5, 5, 10, 0, 0);
      wednesday = new Date(2023, 5, 7, 14, 0, 0);
      saturday = new Date(2023, 5, 10, 10, 0, 0);
      sunday = new Date(2023, 5, 11, 10, 0, 0);

      customBusinessHours = {
        start: '09:00',
        end: '17:00',
        timezone: 'America/Bogota',
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      };
    });

    it('should identify business days correctly', () => {
      expect(service.isBusinessDay(monday, customBusinessHours)).toBe(true);
      expect(service.isBusinessDay(wednesday, customBusinessHours)).toBe(true);
      expect(service.isBusinessDay(saturday, customBusinessHours)).toBe(false);
      expect(service.isBusinessDay(sunday, customBusinessHours)).toBe(false);
    });

    it('should identify business hours correctly', () => {
      // Test with default business hours (08:00-18:00, Monday-Friday)
      const mondayMorning = new Date(2023, 5, 5, 10, 0, 0); // Monday 10:00 AM
      expect(service.isBusinessHours(mondayMorning)).toBe(true);

      // Test with custom business hours
      const businessHour = new Date(2023, 5, 5, 14, 0, 0); // Monday 14:00
      const afterHours = new Date(2023, 5, 5, 19, 0, 0); // Monday 19:00
      const beforeHours = new Date(2023, 5, 5, 7, 0, 0); // Monday 07:00

      expect(service.isBusinessHours(businessHour, customBusinessHours)).toBe(true);
      expect(service.isBusinessHours(afterHours, customBusinessHours)).toBe(false);
      expect(service.isBusinessHours(beforeHours, customBusinessHours)).toBe(false);
    });

    it('should return false for business hours on non-business days', () => {
      const saturdayBusinessHour = new Date(2023, 5, 10, 14, 0, 0);

      expect(service.isBusinessHours(saturdayBusinessHour, customBusinessHours)).toBe(false);
    });

    it('should get next business day correctly', () => {
      const fridayResult = service.getNextBusinessDay(
        new Date(2023, 5, 9), // Friday June 9th
        customBusinessHours
      );

      expect(fridayResult.getDay()).toBe(1); // Should be Monday
      expect(fridayResult.getDate()).toBe(12); // June 12th
    });

    it('should skip weekends when getting next business day', () => {
      const result = service.getNextBusinessDay(saturday, customBusinessHours);

      expect(result.getDay()).toBe(1); // Should be Monday
      expect(result.getDate()).toBe(12); // June 12th
    });

    it('should calculate business days correctly', () => {
      const startDate = new Date(2023, 5, 5); // Monday June 5th
      const endDate = new Date(2023, 5, 9); // Friday June 9th

      const businessDays = service.calculateBusinessDays(startDate, endDate, customBusinessHours);

      expect(businessDays).toBe(5); // Monday to Friday inclusive
    });

    it('should exclude weekends from business days calculation', () => {
      const startDate = new Date(2023, 5, 5); // Monday June 5th
      const endDate = new Date(2023, 5, 11); // Sunday June 11th

      const businessDays = service.calculateBusinessDays(startDate, endDate, customBusinessHours);

      expect(businessDays).toBe(5); // Only Monday to Friday
    });
  });

  describe('Utility Methods', () => {
    let testDate: Date;

    beforeEach(() => {
      testDate = new Date(2023, 5, 15, 14, 30, 45, 123); // June 15, 2023, 14:30:45.123
    });

    it('should get start of day correctly', () => {
      const result = service.getStartOfDay(testDate);

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should get end of day correctly', () => {
      const result = service.getEndOfDay(testDate);

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should get start of week correctly (Monday start)', () => {
      // June 15, 2023 is Thursday
      const result = service.getStartOfWeek(testDate, 1);

      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(12); // June 12th (Monday of that week)
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should get start of week correctly (Sunday start)', () => {
      const result = service.getStartOfWeek(testDate, 0);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(11); // June 11th (Sunday of that week)
    });

    it('should get end of week correctly', () => {
      const result = service.getEndOfWeek(testDate, 1);

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(18); // June 18th (Sunday of that week)
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });

    it('should get start of month correctly', () => {
      const result = service.getStartOfMonth(testDate);

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    it('should get end of month correctly', () => {
      const result = service.getEndOfMonth(testDate);

      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(30); // June has 30 days
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });

    it('should handle February correctly for end of month', () => {
      const febDate = new Date(2023, 1, 15); // February 15, 2023
      const result = service.getEndOfMonth(febDate);

      expect(result.getDate()).toBe(28); // 2023 is not a leap year
    });

    it('should handle leap year February correctly', () => {
      const leapFebDate = new Date(2020, 1, 15); // February 15, 2020
      const result = service.getEndOfMonth(leapFebDate);

      expect(result.getDate()).toBe(29); // 2020 is a leap year
    });
  });

  describe('Validation', () => {
    it('should validate correct Date objects', () => {
      const validDate = new Date(2023, 5, 15);

      expect(service.isValidDate(validDate)).toBe(true);
    });

    it('should reject invalid Date objects', () => {
      const invalidDate = new Date('invalid-date');

      expect(service.isValidDate(invalidDate)).toBe(false);
    });

    it('should reject non-Date objects', () => {
      expect(service.isValidDate('2023-06-15')).toBe(false);
      expect(service.isValidDate(null)).toBe(false);
      expect(service.isValidDate(undefined)).toBe(false);
      expect(service.isValidDate(123456789)).toBe(false);
    });

    it('should validate correct date ranges', () => {
      const validRange: DateRange = {
        start: new Date(2023, 5, 15),
        end: new Date(2023, 5, 20),
      };

      expect(service.isValidDateRange(validRange)).toBe(true);
    });

    it('should reject date ranges where start is after end', () => {
      const invalidRange: DateRange = {
        start: new Date(2023, 5, 20),
        end: new Date(2023, 5, 15),
      };

      expect(service.isValidDateRange(invalidRange)).toBe(false);
    });

    it('should reject date ranges with invalid dates', () => {
      const invalidRange: DateRange = {
        start: new Date('invalid'),
        end: new Date(2023, 5, 15),
      };

      expect(service.isValidDateRange(invalidRange)).toBe(false);
    });

    it('should accept date ranges where start equals end', () => {
      const sameDate = new Date(2023, 5, 15);
      const validRange: DateRange = {
        start: sameDate,
        end: sameDate,
      };

      expect(service.isValidDateRange(validRange)).toBe(true);
    });
  });

  describe('Relative Time', () => {
    let now: Date;

    beforeEach(() => {
      now = new Date(2023, 5, 15, 12, 0, 0); // June 15, 2023, 12:00:00
    });

    it('should return "ahora mismo" for dates less than a minute ago', () => {
      const recent = new Date(now.getTime() - 30 * 1000); // 30 seconds ago

      const result = service.getRelativeTime(recent, now);

      expect(result).toBe('ahora mismo');
    });

    it('should return minutes for dates less than an hour ago', () => {
      const minutesAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

      const result = service.getRelativeTime(minutesAgo, now);

      expect(result).toBe('hace 30 minutos');
    });

    it('should return singular minute for 1 minute ago', () => {
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      const result = service.getRelativeTime(oneMinuteAgo, now);

      expect(result).toBe('hace 1 minuto');
    });

    it('should return hours for dates less than a day ago', () => {
      const hoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago

      const result = service.getRelativeTime(hoursAgo, now);

      expect(result).toBe('hace 5 horas');
    });

    it('should return singular hour for 1 hour ago', () => {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const result = service.getRelativeTime(oneHourAgo, now);

      expect(result).toBe('hace 1 hora');
    });

    it('should return days for dates less than a week ago', () => {
      const daysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      const result = service.getRelativeTime(daysAgo, now);

      expect(result).toBe('hace 3 días');
    });

    it('should return singular day for 1 day ago', () => {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const result = service.getRelativeTime(oneDayAgo, now);

      expect(result).toBe('hace 1 día');
    });

    it('should return formatted date for dates more than a week ago', () => {
      const longAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const result = service.getRelativeTime(longAgo, now);

      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('Configuration', () => {
    it('should allow setting and getting default business hours', () => {
      const customHours: BusinessHours = {
        start: '07:00',
        end: '19:00',
        timezone: 'UTC',
        workingDays: [1, 2, 3, 4, 5, 6],
      };

      service.setDefaultBusinessHours(customHours);
      const result = service.getDefaultBusinessHours();

      expect(result).toEqual(customHours);
    });

    it('should return a copy of business hours to prevent mutation', () => {
      const original = service.getDefaultBusinessHours();
      const retrieved = service.getDefaultBusinessHours();

      retrieved.start = '00:00';

      expect(service.getDefaultBusinessHours().start).not.toBe('00:00');
      expect(service.getDefaultBusinessHours()).toEqual(original);
    });
  });

  describe('Timezone Operations', () => {
    let testDate: Date;

    beforeEach(() => {
      testDate = new Date(2023, 5, 15, 12, 0, 0);
    });

    it('should attempt timezone conversion', () => {
      const result = service.convertTimezone(testDate, 'UTC', 'America/New_York');

      expect(result).toBeInstanceOf(Date);
      // Note: Actual timezone conversion is simplified in this implementation
    });

    it('should return original date when timezone conversion fails', () => {
      spyOn(console, 'warn');

      const result = service.convertTimezone(testDate, 'Invalid/Zone', 'Another/Invalid');

      expect(result).toBe(testDate);
      expect(console.warn).toHaveBeenCalledWith(
        'Timezone conversion failed, returning original date'
      );
    });

    it('should calculate timezone offset', () => {
      const offset = service.getTimezoneOffset('UTC');

      expect(typeof offset).toBe('number');
    });

    it('should return 0 offset for invalid timezone', () => {
      const offset = service.getTimezoneOffset('Invalid/Timezone');

      expect(offset).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      // Service handles null/undefined gracefully by returning null or false
      expect(service.parseDate(null as any)).toBeNull();
      expect(service.parseDate(undefined as any)).toBeNull();

      // Invalid operations return reasonable defaults or false
      expect(service.isValidDate(null as any)).toBe(false);
      expect(service.isValidDate(undefined as any)).toBe(false);
    });

    it('should handle extreme date values', () => {
      const farFuture = new Date(2999, 11, 31);
      const farPast = new Date(1900, 0, 1);

      expect(service.isValidDate(farFuture)).toBe(true);
      expect(service.isValidDate(farPast)).toBe(true);
      expect(service.isBefore(farPast, farFuture)).toBe(true);
    });

    it('should handle large number additions gracefully', () => {
      const testDate = new Date(2023, 5, 15);

      const result = service.addDays(testDate, 1000000);

      expect(service.isValidDate(result)).toBe(true);
    });

    it('should maintain immutability of original dates', () => {
      const original = new Date(2023, 5, 15, 12, 0, 0);
      const originalTime = original.getTime();

      service.addDays(original, 5);
      service.addHours(original, 10);
      service.getStartOfDay(original);

      expect(original.getTime()).toBe(originalTime);
    });
  });

  describe('Framework Independence Validation', () => {
    it('should work without Angular-specific dependencies', () => {
      // This test ensures the service can work outside Angular context
      const service = new DateTimeService();

      expect(service.now()).toBeInstanceOf(Date);
      expect(service.isValidDate(new Date())).toBe(true);
    });

    it('should handle missing Intl gracefully', () => {
      // Mock missing Intl support
      const originalIntl = (globalThis as any).Intl;
      (globalThis as any).Intl = undefined;

      spyOn(console, 'warn');

      const service = new DateTimeService();
      const testDate = new Date(2023, 5, 15);
      const result = service.formatDate(testDate);

      expect(console.warn).toHaveBeenCalledWith(
        'Intl.DateTimeFormat not available, date formatting may be limited'
      );
      expect(typeof result).toBe('string');

      // Restore Intl
      (globalThis as any).Intl = originalIntl;
    });
  });
});
