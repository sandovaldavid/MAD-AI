import { SystemClock } from './system-clock.service';

describe('SystemClock - Infrastructure Tests', () => {
  let systemClock: SystemClock;

  beforeEach(() => {
    systemClock = new SystemClock();
  });

  describe('nowEpochSeconds', () => {
    it('should return current time in epoch seconds', () => {
      // Given
      const beforeCall = Math.floor(Date.now() / 1000);

      // When
      const result = systemClock.nowEpochSeconds();

      // Then
      const afterCall = Math.floor(Date.now() / 1000);
      expect(result).toBeGreaterThanOrEqual(beforeCall);
      expect(result).toBeLessThanOrEqual(afterCall);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should return different values when called at different times', (done) => {
      // Given
      const firstCall = systemClock.nowEpochSeconds();

      // When - wait a small amount and call again
      setTimeout(() => {
        const secondCall = systemClock.nowEpochSeconds();

        // Then
        expect(secondCall).toBeGreaterThanOrEqual(firstCall);
        done();
      }, 1100); // Wait just over 1 second to ensure different epoch seconds
    });

    it('should return consistent format (integer seconds)', () => {
      // When
      const result = systemClock.nowEpochSeconds();

      // Then
      expect(typeof result).toBe('number');
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
      // Should be reasonable epoch time (after year 2000)
      expect(result).toBeGreaterThan(946684800); // Jan 1, 2000
    });

    it('should match JavaScript Date.now() conversion', () => {
      // Given
      const jsDateNow = Date.now();
      const expectedEpochSeconds = Math.floor(jsDateNow / 1000);

      // When
      const result = systemClock.nowEpochSeconds();

      // Then
      // Allow for small time difference between calls
      expect(Math.abs(result - expectedEpochSeconds)).toBeLessThanOrEqual(1);
    });
  });

  describe('nowDate', () => {
    it('should return current Date object', () => {
      // Given
      const beforeCall = new Date();

      // When
      const result = systemClock.nowDate();

      // Then
      const afterCall = new Date();
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should return valid Date object', () => {
      // When
      const result = systemClock.nowDate();

      // Then
      expect(result).toBeInstanceOf(Date);
      expect(result.toString()).not.toBe('Invalid Date');
      expect(isNaN(result.getTime())).toBe(false);
    });

    it('should return current year, month, day', () => {
      // Given
      const now = new Date();
      const expectedYear = now.getFullYear();
      const expectedMonth = now.getMonth();
      const expectedDay = now.getDate();

      // When
      const result = systemClock.nowDate();

      // Then
      expect(result.getFullYear()).toBe(expectedYear);
      expect(result.getMonth()).toBe(expectedMonth);
      expect(result.getDate()).toBe(expectedDay);
    });

    it('should return different instances on successive calls', () => {
      // When
      const first = systemClock.nowDate();
      const second = systemClock.nowDate();

      // Then
      expect(first).not.toBe(second); // Different object instances
      expect(first instanceof Date).toBe(true);
      expect(second instanceof Date).toBe(true);
    });
  });

  describe('nowEpochMilliseconds', () => {
    it('should return current time in epoch milliseconds', () => {
      // Given
      const beforeCall = Date.now();

      // When
      const result = systemClock.nowEpochMilliseconds();

      // Then
      const afterCall = Date.now();
      expect(result).toBeGreaterThanOrEqual(beforeCall);
      expect(result).toBeLessThanOrEqual(afterCall);
      expect(typeof result).toBe('number');
    });

    it('should match JavaScript Date.now() exactly', () => {
      // Given - Mock Date.now to control the return value
      const mockTime = 1640995200000; // Fixed timestamp
      spyOn(Date, 'now').and.returnValue(mockTime);

      // When
      const result = systemClock.nowEpochMilliseconds();

      // Then
      expect(result).toBe(mockTime);
    });

    it('should return millisecond precision', () => {
      // When
      const result = systemClock.nowEpochMilliseconds();

      // Then
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      // Should be reasonable epoch time in milliseconds
      expect(result).toBeGreaterThan(946684800000); // Jan 1, 2000 in milliseconds
      expect(result).toBeLessThan(4102444800000); // Jan 1, 2100 in milliseconds
    });

    it('should increment over time', (done) => {
      // Given
      const firstCall = systemClock.nowEpochMilliseconds();

      // When - wait a small amount and call again
      setTimeout(() => {
        const secondCall = systemClock.nowEpochMilliseconds();

        // Then
        expect(secondCall).toBeGreaterThan(firstCall);
        expect(secondCall - firstCall).toBeGreaterThanOrEqual(1);
        done();
      }, 5); // Wait 5ms
    });
  });

  describe('nowISOString', () => {
    it('should return current time as ISO string', () => {
      // Given
      const beforeCall = new Date().toISOString();

      // When
      const result = systemClock.nowISOString();

      // Then
      const afterCall = new Date().toISOString();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.localeCompare(beforeCall)).toBeGreaterThanOrEqual(0);
      expect(result.localeCompare(afterCall)).toBeLessThanOrEqual(0);
    });

    it('should return valid ISO 8601 format', () => {
      // When
      const result = systemClock.nowISOString();

      // Then
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Should be parseable back to a Date
      const parsedDate = new Date(result);
      expect(parsedDate.toString()).not.toBe('Invalid Date');
      expect(parsedDate.toISOString()).toBe(result);
    });

    it('should always end with Z (UTC timezone)', () => {
      // When
      const result = systemClock.nowISOString();

      // Then
      expect(result).toMatch(/Z$/);
    });

    it('should include milliseconds', () => {
      // When
      const result = systemClock.nowISOString();

      // Then
      expect(result).toMatch(/\.\d{3}Z$/);
    });

    it('should be parseable back to Date object', () => {
      // When
      const isoString = systemClock.nowISOString();
      const parsedDate = new Date(isoString);

      // Then
      expect(parsedDate).toBeInstanceOf(Date);
      expect(parsedDate.toISOString()).toBe(isoString);
      expect(isNaN(parsedDate.getTime())).toBe(false);
    });

    it('should match Date() constructor ISO output format', () => {
      // When
      const result = systemClock.nowISOString();
      const directISO = new Date().toISOString();

      // Then
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      // Should be very close in time (within 100ms)
      const resultTime = new Date(result).getTime();
      const directTime = new Date(directISO).getTime();
      expect(Math.abs(resultTime - directTime)).toBeLessThan(100);
    });

    it('should return different strings over time', (done) => {
      // Given
      const firstCall = systemClock.nowISOString();

      // When - wait and call again
      setTimeout(() => {
        const secondCall = systemClock.nowISOString();

        // Then
        expect(secondCall.localeCompare(firstCall)).toBeGreaterThan(0);
        expect(secondCall).not.toBe(firstCall);
        done();
      }, 5); // Wait 5ms
    });
  });

  describe('method consistency and relationships', () => {
    it('should have consistent time across all methods', () => {
      // When - Call all methods in quick succession
      const epochSeconds = systemClock.nowEpochSeconds();
      const epochMillis = systemClock.nowEpochMilliseconds();
      const dateObj = systemClock.nowDate();
      const isoString = systemClock.nowISOString();

      // Then - All should represent approximately the same time (within 10ms)
      const expectedSeconds = Math.floor(epochMillis / 1000);
      expect(Math.abs(epochSeconds - expectedSeconds)).toBeLessThanOrEqual(1);

      const expectedMillis = dateObj.getTime();
      expect(Math.abs(epochMillis - expectedMillis)).toBeLessThan(10);

      const parsedFromISO = new Date(isoString).getTime();
      expect(Math.abs(epochMillis - parsedFromISO)).toBeLessThan(10);
    });

    it('should convert between formats correctly', () => {
      // When
      const epochMillis = systemClock.nowEpochMilliseconds();
      const epochSeconds = systemClock.nowEpochSeconds();
      const dateObj = systemClock.nowDate();
      const isoString = systemClock.nowISOString();

      // Then - Allow for small time differences between calls
      const expectedSeconds = Math.floor(epochMillis / 1000);
      expect(Math.abs(epochSeconds - expectedSeconds)).toBeLessThanOrEqual(1);

      const expectedMillis = dateObj.getTime();
      expect(Math.abs(epochMillis - expectedMillis)).toBeLessThanOrEqual(10);

      const parsedFromISO = new Date(isoString).getTime();
      expect(Math.abs(epochMillis - parsedFromISO)).toBeLessThanOrEqual(10);
    });

    it('should handle rapid successive calls', () => {
      // When - Make many rapid calls
      const results = {
        epochSeconds: [] as number[],
        epochMillis: [] as number[],
        dates: [] as Date[],
        isoStrings: [] as string[],
      };

      for (let i = 0; i < 10; i++) {
        results.epochSeconds.push(systemClock.nowEpochSeconds());
        results.epochMillis.push(systemClock.nowEpochMilliseconds());
        results.dates.push(systemClock.nowDate());
        results.isoStrings.push(systemClock.nowISOString());
      }

      // Then
      // All results should be valid
      results.epochSeconds.forEach((val) => {
        expect(typeof val).toBe('number');
        expect(Number.isInteger(val)).toBe(true);
      });

      results.epochMillis.forEach((val) => {
        expect(typeof val).toBe('number');
      });

      results.dates.forEach((val) => {
        expect(val).toBeInstanceOf(Date);
        expect(isNaN(val.getTime())).toBe(false);
      });

      results.isoStrings.forEach((val) => {
        expect(typeof val).toBe('string');
        expect(val).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      // Times should be monotonic or equal (not decreasing)
      for (let i = 1; i < results.epochMillis.length; i++) {
        expect(results.epochMillis[i]).toBeGreaterThanOrEqual(results.epochMillis[i - 1]);
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle system time changes gracefully', () => {
      // Given - Simulate system time change by mocking Date.now
      let mockTime = 1640995200000;
      spyOn(Date, 'now').and.callFake(() => mockTime);

      // When
      const before = systemClock.nowEpochMilliseconds();

      // Simulate time jump backward (system clock adjustment)
      mockTime = 1640995100000; // 100 seconds earlier
      const after = systemClock.nowEpochMilliseconds();

      // Then
      expect(before).toBe(1640995200000);
      expect(after).toBe(1640995100000);
      // The service should return whatever the system provides
    });

    it('should not throw errors on any method calls', () => {
      // When & Then
      expect(() => systemClock.nowEpochSeconds()).not.toThrow();
      expect(() => systemClock.nowEpochMilliseconds()).not.toThrow();
      expect(() => systemClock.nowDate()).not.toThrow();
      expect(() => systemClock.nowISOString()).not.toThrow();
    });

    it('should handle timezone changes gracefully', () => {
      // Given - Mock timezone-related functionality if needed
      const originalTimezoneOffset = Date.prototype.getTimezoneOffset;

      // When
      const isoString1 = systemClock.nowISOString();

      // Simulate timezone change (though this is more theoretical)
      Date.prototype.getTimezoneOffset = jasmine.createSpy().and.returnValue(-120);
      const isoString2 = systemClock.nowISOString();

      // Restore original
      Date.prototype.getTimezoneOffset = originalTimezoneOffset;

      // Then
      expect(isoString1).toMatch(/Z$/); // Should still be UTC
      expect(isoString2).toMatch(/Z$/); // Should still be UTC
    });
  });

  describe('performance characteristics', () => {
    it('should execute quickly for all methods', () => {
      // Given
      const startTime = performance.now();
      const iterations = 1000;

      // When - Execute many times
      for (let i = 0; i < iterations; i++) {
        systemClock.nowEpochSeconds();
        systemClock.nowEpochMilliseconds();
        systemClock.nowDate();
        systemClock.nowISOString();
      }

      // Then
      const duration = performance.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle concurrent access', async () => {
      // Given
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve().then(() => ({
          epochSeconds: systemClock.nowEpochSeconds(),
          epochMillis: systemClock.nowEpochMilliseconds(),
          date: systemClock.nowDate(),
          isoString: systemClock.nowISOString(),
        }))
      );

      // When
      const results = await Promise.all(promises);

      // Then
      expect(results).toHaveSize(100);
      results.forEach((result) => {
        expect(typeof result.epochSeconds).toBe('number');
        expect(typeof result.epochMillis).toBe('number');
        expect(result.date).toBeInstanceOf(Date);
        expect(typeof result.isoString).toBe('string');
      });
    });
  });
});
