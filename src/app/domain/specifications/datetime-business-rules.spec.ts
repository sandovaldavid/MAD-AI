import { ISODateTime } from '../value-objects/iso-datetime.vo';
import { BusinessRuleError } from '../errors/business-rule-error.entity';
import { DateTimeBusinessRules } from './datetime-business-rules.specs';

/**
 * DateTime Business Rules - Domain Layer Tests
 *
 *      it('should return true for password changed within 90 days', () => {
        const currentTime = new Date();
        const passwordChanged = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const testTime = ISODateTime.create(passwordChanged.toISOString())!;
        const result = DateTimeBusinessRules.isPasswordValid(testTime);
        expect(result).toBe(true);
      });cription
 * Tests for DateTimeBusinessRules specification class that contains
 * business-specific temporal rules. These are pure unit tests without
 * any external dependencies or mocks.
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */
describe('DateTimeBusinessRules - Domain Tests', () => {
  let now: ISODateTime;
  let recentTime: ISODateTime;
  let oldTime: ISODateTime;
  let futureTime: ISODateTime;

  beforeEach(() => {
    // Setup test data using relative times that work with actual current time
    const currentTime = new Date();
    const thirtyMinutesAgo = new Date(currentTime.getTime() - 30 * 60 * 1000);
    const oneYearAgo = new Date(currentTime.getTime() - 365 * 24 * 60 * 60 * 1000);
    const oneMonthFuture = new Date(currentTime.getTime() + 30 * 24 * 60 * 60 * 1000);

    now = ISODateTime.create(currentTime.toISOString())!;
    recentTime = ISODateTime.create(thirtyMinutesAgo.toISOString())!; // 30 minutes ago
    oldTime = ISODateTime.create(oneYearAgo.toISOString())!; // 1 year ago
    futureTime = ISODateTime.create(oneMonthFuture.toISOString())!; // 1 month in future
  });

  describe('Business Rules - Time Period Validation', () => {
    describe('isWithinLast', () => {
      it('should return true when datetime is within specified minutes', () => {
        const result = DateTimeBusinessRules.isWithinLast(recentTime, 60, 'minutes');
        expect(result).toBe(true);
      });

      it('should return false when datetime is outside specified minutes', () => {
        const result = DateTimeBusinessRules.isWithinLast(oldTime, 60, 'minutes');
        expect(result).toBe(false);
      });

      it('should return true when datetime is exactly at the boundary', () => {
        const currentTime = new Date();
        const boundaryTime = new Date(currentTime.getTime() - 60 * 60 * 1000); // exactly 1 hour ago
        const testTime = ISODateTime.create(boundaryTime.toISOString())!;
        const result = DateTimeBusinessRules.isWithinLast(testTime, 60, 'minutes');
        expect(result).toBe(true);
      });

      it('should return false when datetime is just outside the boundary', () => {
        const currentTime = new Date();
        const outsideTime = new Date(currentTime.getTime() - 61 * 60 * 1000); // just over 1 hour ago
        const testTime = ISODateTime.create(outsideTime.toISOString())!;
        const result = DateTimeBusinessRules.isWithinLast(testTime, 60, 'minutes');
        expect(result).toBe(false);
      });

      it('should handle hours unit correctly', () => {
        const result = DateTimeBusinessRules.isWithinLast(recentTime, 2, 'hours');
        expect(result).toBe(true);
      });

      it('should handle days unit correctly', () => {
        const result = DateTimeBusinessRules.isWithinLast(recentTime, 1, 'days');
        expect(result).toBe(true);
      });
    });

    describe('assertNotTooOld', () => {
      it('should not throw when datetime is within allowed days', () => {
        const currentTime = new Date();
        const recentDate = new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        const testTime = ISODateTime.create(recentDate.toISOString())!;
        expect(() => {
          DateTimeBusinessRules.assertNotTooOld(testTime, 7);
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when datetime is too old', () => {
        expect(() => {
          DateTimeBusinessRules.assertNotTooOld(oldTime, 30);
        }).toThrowError(BusinessRuleError);
      });

      it('should include correct error details in BusinessRuleError', () => {
        try {
          DateTimeBusinessRules.assertNotTooOld(oldTime, 30);
          fail('Expected BusinessRuleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(BusinessRuleError);
          expect((error as BusinessRuleError).message).toContain('too far in the past');
        }
      });

      it('should use default max days when not specified', () => {
        const defaultOldTime = ISODateTime.create('2022-01-15T12:00:00Z')!; // 2 years ago
        expect(() => {
          DateTimeBusinessRules.assertNotTooOld(defaultOldTime);
        }).toThrowError(BusinessRuleError);
      });
    });

    describe('assertNotTooFuture', () => {
      it('should not throw when datetime is within allowed future days', () => {
        const currentTime = new Date();
        const nearFuture = new Date(currentTime.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days in future
        const testTime = ISODateTime.create(nearFuture.toISOString())!;
        expect(() => {
          DateTimeBusinessRules.assertNotTooFuture(testTime, 7);
        }).not.toThrow();
      });

      it('should throw BusinessRuleError when datetime is too far in future', () => {
        expect(() => {
          DateTimeBusinessRules.assertNotTooFuture(futureTime, 7);
        }).toThrowError(BusinessRuleError);
      });

      it('should include correct error details in BusinessRuleError', () => {
        try {
          DateTimeBusinessRules.assertNotTooFuture(futureTime, 7);
          fail('Expected BusinessRuleError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(BusinessRuleError);
          expect((error as BusinessRuleError).message).toContain('too far in the future');
        }
      });

      it('should use default max days when not specified', () => {
        const currentTime = new Date();
        const farFuture = new Date(currentTime.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days in future
        const testTime = ISODateTime.create(farFuture.toISOString())!;
        expect(() => {
          DateTimeBusinessRules.assertNotTooFuture(testTime);
        }).toThrowError(BusinessRuleError);
      });
    });
  });

  describe('Business Rules - Business Hours Validation', () => {
    describe('isWithinBusinessHours', () => {
      it('should return true for datetime within default business hours (9-17)', () => {
        const workTime = ISODateTime.create('2024-01-15T14:30:00Z')!; // 2:30 PM
        const result = DateTimeBusinessRules.isWithinBusinessHours(workTime);
        expect(result).toBe(true);
      });

      it('should return false for datetime outside default business hours', () => {
        const nightTime = ISODateTime.create('2024-01-15T22:00:00Z')!; // 10:00 PM
        const result = DateTimeBusinessRules.isWithinBusinessHours(nightTime);
        expect(result).toBe(false);
      });

      it('should return true for datetime at start of business hours', () => {
        const startTime = ISODateTime.create('2024-01-15T09:00:00Z')!; // 9:00 AM
        const result = DateTimeBusinessRules.isWithinBusinessHours(startTime);
        expect(result).toBe(true);
      });

      it('should return false for datetime at end of business hours', () => {
        const endTime = ISODateTime.create('2024-01-15T17:00:00Z')!; // 5:00 PM
        const result = DateTimeBusinessRules.isWithinBusinessHours(endTime);
        expect(result).toBe(false);
      });

      it('should support custom business hours', () => {
        const customTime = ISODateTime.create('2024-01-15T20:00:00Z')!; // 8:00 PM
        const result = DateTimeBusinessRules.isWithinBusinessHours(customTime, 18, 22);
        expect(result).toBe(true);
      });
    });

    describe('isWorkingDay', () => {
      it('should return true for Monday to Friday', () => {
        const monday = ISODateTime.create('2024-01-15T12:00:00Z')!; // Monday
        const wednesday = ISODateTime.create('2024-01-17T12:00:00Z')!; // Wednesday
        const friday = ISODateTime.create('2024-01-19T12:00:00Z')!; // Friday

        expect(DateTimeBusinessRules.isWorkingDay(monday)).toBe(true);
        expect(DateTimeBusinessRules.isWorkingDay(wednesday)).toBe(true);
        expect(DateTimeBusinessRules.isWorkingDay(friday)).toBe(true);
      });

      it('should return false for Saturday and Sunday', () => {
        const saturday = ISODateTime.create('2024-01-20T12:00:00Z')!; // Saturday
        const sunday = ISODateTime.create('2024-01-21T12:00:00Z')!; // Sunday

        expect(DateTimeBusinessRules.isWorkingDay(saturday)).toBe(false);
        expect(DateTimeBusinessRules.isWorkingDay(sunday)).toBe(false);
      });
    });
  });

  describe('Business Rules - Maintenance and Session Validation', () => {
    describe('isDuringMaintenance', () => {
      it('should return true when datetime is within maintenance window', () => {
        const maintenanceStart = ISODateTime.create('2024-01-15T10:00:00Z')!;
        const maintenanceEnd = ISODateTime.create('2024-01-15T14:00:00Z')!;
        const checkTime = ISODateTime.create('2024-01-15T12:00:00Z')!;

        const result = DateTimeBusinessRules.isDuringMaintenance(
          checkTime,
          maintenanceStart,
          maintenanceEnd
        );
        expect(result).toBe(true);
      });

      it('should return false when datetime is outside maintenance window', () => {
        const maintenanceStart = ISODateTime.create('2024-01-15T10:00:00Z')!;
        const maintenanceEnd = ISODateTime.create('2024-01-15T14:00:00Z')!;
        const checkTime = ISODateTime.create('2024-01-15T16:00:00Z')!;

        const result = DateTimeBusinessRules.isDuringMaintenance(
          checkTime,
          maintenanceStart,
          maintenanceEnd
        );
        expect(result).toBe(false);
      });

      it('should return true when datetime is at maintenance window boundaries', () => {
        const maintenanceStart = ISODateTime.create('2024-01-15T10:00:00Z')!;
        const maintenanceEnd = ISODateTime.create('2024-01-15T14:00:00Z')!;

        const resultStart = DateTimeBusinessRules.isDuringMaintenance(
          maintenanceStart,
          maintenanceStart,
          maintenanceEnd
        );
        const resultEnd = DateTimeBusinessRules.isDuringMaintenance(
          maintenanceEnd,
          maintenanceStart,
          maintenanceEnd
        );

        expect(resultStart).toBe(true);
        expect(resultEnd).toBe(true);
      });
    });

    describe('isSessionValid', () => {
      it('should return true for session within allowed duration', () => {
        const currentTime = new Date();
        const sessionStart = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
        const testTime = ISODateTime.create(sessionStart.toISOString())!;
        const result = DateTimeBusinessRules.isSessionValid(testTime, 180); // 3 hours max
        expect(result).toBe(true);
      });

      it('should return false for expired session', () => {
        const sessionStart = ISODateTime.create('2024-01-15T02:00:00Z')!; // 10 hours ago
        const result = DateTimeBusinessRules.isSessionValid(sessionStart, 180); // 3 hours max
        expect(result).toBe(false);
      });

      it('should use default session duration when not specified', () => {
        const currentTime = new Date();
        const sessionStart = new Date(currentTime.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago
        const testTime = ISODateTime.create(sessionStart.toISOString())!;
        const result = DateTimeBusinessRules.isSessionValid(testTime); // 8 hours default
        expect(result).toBe(false);
      });
    });

    describe('isPasswordValid', () => {
      it('should return true for password changed within allowed period', () => {
        const currentTime = new Date();
        const passwordChanged = new Date(currentTime.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        const testTime = ISODateTime.create(passwordChanged.toISOString())!;
        const result = DateTimeBusinessRules.isPasswordValid(testTime, 7);
        expect(result).toBe(true);
      });

      it('should return false for expired password', () => {
        const currentTime = new Date();
        const passwordChanged = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        const testTime = ISODateTime.create(passwordChanged.toISOString())!;
        const result = DateTimeBusinessRules.isPasswordValid(testTime, 7);
        expect(result).toBe(false);
      });

      it('should use default password age limit when not specified', () => {
        const currentTime = new Date();
        const passwordChanged = new Date(currentTime.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
        const testTime = ISODateTime.create(passwordChanged.toISOString())!;
        const result = DateTimeBusinessRules.isPasswordValid(testTime); // 90 days default
        expect(result).toBe(false);
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero time difference correctly', () => {
      const currentTime = new Date();
      const sameTime = ISODateTime.create(currentTime.toISOString())!;
      const result = DateTimeBusinessRules.isWithinLast(sameTime, 1, 'minutes');
      expect(result).toBe(true);
    });

    it('should handle negative amounts gracefully', () => {
      const result = DateTimeBusinessRules.isWithinLast(recentTime, -1, 'minutes');
      expect(result).toBe(false);
    });

    it('should handle very large time differences', () => {
      const ancientTime = ISODateTime.create('2000-01-15T12:00:00Z')!;
      const result = DateTimeBusinessRules.isWithinLast(ancientTime, 1, 'days');
      expect(result).toBe(false);
    });

    it('should handle leap year dates correctly', () => {
      const leapYearTime = ISODateTime.create('2024-02-29T12:00:00Z')!;
      const result = DateTimeBusinessRules.isWorkingDay(leapYearTime);
      expect(result).toBe(true); // February 29, 2024 is a Thursday
    });
  });

  describe('Domain Invariants', () => {
    it('should maintain business rules consistency across methods', () => {
      const testTime = ISODateTime.create('2024-01-15T14:30:00Z')!;

      // If it's within business hours, it should be a working day
      const isBusinessHours = DateTimeBusinessRules.isWithinBusinessHours(testTime);
      const isWorkingDay = DateTimeBusinessRules.isWorkingDay(testTime);

      if (isBusinessHours) {
        expect(isWorkingDay).toBe(true);
      }
    });

    it('should ensure time period validation is symmetric', () => {
      const testTime = ISODateTime.create('2024-01-15T11:30:00Z')!;

      // If it's within last 60 minutes, it should also be within last 24 hours
      const withinMinutes = DateTimeBusinessRules.isWithinLast(testTime, 60, 'minutes');
      const withinHours = DateTimeBusinessRules.isWithinLast(testTime, 24, 'hours');

      if (withinMinutes) {
        expect(withinHours).toBe(true);
      }
    });
  });
});
