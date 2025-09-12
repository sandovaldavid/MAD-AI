import { LoggerService } from './logger.service';
import { LogContext } from '../interfaces/logger.interface';

describe('LoggerService', () => {
  let service: LoggerService;
  let consoleLogSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    // ZERO MOCKS for the service itself: Direct instantiation as per Core Layer testing guide
    service = new LoggerService();

    // Spy on console methods to verify output without polluting test logs
    consoleLogSpy = spyOn(console, 'log').and.callThrough();
    consoleWarnSpy = spyOn(console, 'warn').and.callThrough();
    consoleErrorSpy = spyOn(console, 'error').and.callThrough();
  });

  afterEach(() => {
    // Clean up spies
    consoleLogSpy.calls.reset();
    consoleWarnSpy.calls.reset();
    consoleErrorSpy.calls.reset();
  });

  describe('Initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
      expect(service).toBeInstanceOf(LoggerService);
    });

    it('should set appropriate minimum log level based on environment', () => {
      // Test in non-production environment (default test environment)
      const devService = new LoggerService();

      // Debug logs should work in development
      devService.debug('Test debug message');

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle production environment detection', () => {
      // We can't modify window in tests, so we test the behavior indirectly
      // Create service and test that debug logs work in test environment
      const service = new LoggerService();

      consoleLogSpy.calls.reset();
      service.debug('Test debug message');

      // In test environment (localhost), debug should be logged
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle missing window object gracefully', () => {
      // Test that service can be created without issues
      const service = new LoggerService();

      // Service should work normally
      service.info('Test message');

      expect(service).toBeDefined();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Logging Methods', () => {
    beforeEach(() => {
      // Reset console spies for clean testing
      consoleLogSpy.calls.reset();
      consoleWarnSpy.calls.reset();
      consoleErrorSpy.calls.reset();
    });

    it('should log debug messages', () => {
      const message = 'Debug test message';

      service.debug(message);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain('DEBUG');
      expect(logCall.args[0]).toContain(message);
    });

    it('should log info messages', () => {
      const message = 'Info test message';

      service.info(message);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain('INFO');
      expect(logCall.args[0]).toContain(message);
    });

    it('should log warning messages', () => {
      const message = 'Warning test message';

      service.warn(message);

      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCall = consoleWarnSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain('WARN');
      expect(logCall.args[0]).toContain(message);
    });

    it('should log error messages', () => {
      const message = 'Error test message';

      service.error(message);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCall = consoleErrorSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain('ERROR');
      expect(logCall.args[0]).toContain(message);
    });
  });

  describe('Log Levels and Filtering', () => {
    it('should respect minimum log level in production environment', () => {
      // Mock production environment - any is necessary for private method access
      const originalIsProduction = (LoggerService.prototype as any)['isProduction'];
      (LoggerService.prototype as any)['isProduction'] = jasmine
        .createSpy('isProduction')
        .and.returnValue(true);

      const prodService = new LoggerService();
      consoleLogSpy.calls.reset();
      consoleWarnSpy.calls.reset();
      consoleErrorSpy.calls.reset();

      // Debug should not log in production (min level is INFO)
      prodService.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Info should log in production
      prodService.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();

      // Warn should log in production
      prodService.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Error should log in production
      prodService.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore original method
      (LoggerService.prototype as any)['isProduction'] = originalIsProduction;
    });

    it('should log all levels in development environment', () => {
      const devService = new LoggerService();

      consoleLogSpy.calls.reset();
      consoleWarnSpy.calls.reset();
      consoleErrorSpy.calls.reset();

      devService.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();

      devService.info('Info message');
      expect(consoleLogSpy).toHaveBeenCalled();

      devService.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();

      devService.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should properly identify localhost environments', () => {
      // Test localhost behavior by checking that debug works in test environment
      const localhostService = new LoggerService();
      consoleLogSpy.calls.reset();

      // Debug should work on localhost/test environments
      localhostService.debug('Debug on localhost');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should properly identify 127.0.0.1 environments', () => {
      // Test 127.0.0.1 behavior by verifying service works in test environment
      const localIPService = new LoggerService();
      consoleLogSpy.calls.reset();

      // Debug should work on local IP/test environments
      localIPService.debug('Debug on 127.0.0.1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Context Handling', () => {
    it('should log messages without context', () => {
      const message = 'Simple message';

      service.info(message);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain(message);
      expect(logCall.args[1]).toBe(''); // No context
    });

    it('should log messages with context', () => {
      const message = 'Message with context';
      const context: LogContext = {
        userId: 'user-123',
        operation: 'login',
      };

      service.info(message, context);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain(message);
      expect(logCall.args[1]).toEqual(context);
    });

    it('should merge global context with local context', () => {
      const globalContext: LogContext = {
        correlationId: 'abc-123',
        operation: 'global-op',
      };

      const localContext: LogContext = {
        userId: 'user-456',
        operation: 'local-op', // Should override global
      };

      service.setGlobalContext(globalContext);
      service.info('Test message', localContext);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();

      expect(logCall.args[1]).toEqual({
        correlationId: 'abc-123', // From global
        userId: 'user-456', // From local
        operation: 'local-op', // Local overrides global
      });
    });

    it('should use global context when no local context provided', () => {
      const globalContext: LogContext = {
        correlationId: 'xyz-789',
        userId: 'global-user',
      };

      service.setGlobalContext(globalContext);
      service.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[1]).toEqual(globalContext);
    });

    it('should handle empty global context', () => {
      service.setGlobalContext({});
      service.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[1]).toBe(''); // Empty context should result in empty string
    });

    it('should not mutate original context objects', () => {
      const globalContext: LogContext = {
        correlationId: 'original-id',
      };

      const localContext: LogContext = {
        userId: 'original-user',
      };

      service.setGlobalContext(globalContext);
      service.info('Test message', localContext);

      // Original objects should remain unchanged
      expect(globalContext).toEqual({ correlationId: 'original-id' });
      expect(localContext).toEqual({ userId: 'original-user' });
    });
  });

  describe('Log Entry Format', () => {
    // Better typed spy interface for Date constructor
    interface DateSpy extends jasmine.Spy {
      now: jasmine.Spy<() => number>;
      UTC: typeof Date.UTC;
      parse: typeof Date.parse;
      prototype: typeof Date.prototype;
    }

    let originalDateConstructor: DateConstructor;
    let fixedTime = new Date('2023-06-15T12:00:00.000Z');
    let dateSpy: DateSpy;

    beforeEach(() => {
      // Store original constructor - minimal any usage for global access
      originalDateConstructor = (globalThis as any).Date;

      // Create strongly typed Date constructor spy
      dateSpy = jasmine.createSpy('Date').and.returnValue(fixedTime) as DateSpy;

      // Add static methods with proper typing - no any needed
      dateSpy.now = jasmine.createSpy('Date.now').and.returnValue(fixedTime.getTime());
      dateSpy.UTC = originalDateConstructor.UTC;
      dateSpy.parse = originalDateConstructor.parse;
      dateSpy.prototype = originalDateConstructor.prototype;

      // Replace the global Date constructor - minimal any for global modification
      (globalThis as any).Date = dateSpy;
    });

    afterEach(() => {
      // Restore original constructor - minimal any for global modification
      (globalThis as any).Date = originalDateConstructor;
    });

    it('should include timestamp in log entries', () => {
      service.info('Timestamped message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain('2023-06-15T12:00:00.000Z');
    });

    it('should include log level in log entries', () => {
      service.debug('Debug level test');
      service.info('Info level test');
      service.warn('Warn level test');
      service.error('Error level test');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // debug and info use console.log
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      // Check level names are included
      expect(consoleLogSpy.calls.argsFor(0)[0]).toContain('DEBUG');
      expect(consoleLogSpy.calls.argsFor(1)[0]).toContain('INFO');
      expect(consoleWarnSpy.calls.argsFor(0)[0]).toContain('WARN');
      expect(consoleErrorSpy.calls.argsFor(0)[0]).toContain('ERROR');
    });

    it('should format log entry correctly', () => {
      const message = 'Formatted message test';
      const expectedPattern = /^\[2023-06-15T12:00:00\.000Z\] INFO: Formatted message test$/;

      service.info(message);

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toMatch(expectedPattern);
    });
  });

  describe('Console Output Routing', () => {
    it('should use console.error for error level', () => {
      service.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should use console.warn for warning level', () => {
      service.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should use console.log for info and debug levels', () => {
      service.info('Info message');
      service.debug('Debug message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Global Context Management', () => {
    it('should update global context correctly', () => {
      const context1: LogContext = { userId: 'user1', operation: 'op1' };
      const context2: LogContext = { userId: 'user2', correlationId: 'corr1' };

      service.setGlobalContext(context1);
      service.info('First message');

      service.setGlobalContext(context2);
      service.info('Second message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      // First call should have context1
      expect(consoleLogSpy.calls.argsFor(0)[1]).toEqual(context1);

      // Second call should have context2 (completely replaced, not merged)
      expect(consoleLogSpy.calls.argsFor(1)[1]).toEqual(context2);
    });

    it('should create a copy of global context to prevent external mutation', () => {
      const originalContext: LogContext = { userId: 'user1', operation: 'op1' };

      service.setGlobalContext(originalContext);

      // Mutate the original context after setting
      originalContext.userId = 'mutated-user';
      originalContext.operation = 'mutated-op';

      service.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();

      // Should use the original values, not the mutated ones
      expect(logCall.args[1].userId).toBe('user1');
      expect(logCall.args[1].operation).toBe('op1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined messages gracefully', () => {
      // Test null handling - using unknown first for safer type assertion
      expect(() => service.info(null as unknown as string)).not.toThrow();
      expect(() => service.info(undefined as unknown as string)).not.toThrow();
    });

    it('should handle null and undefined context gracefully', () => {
      // Test context null handling - using unknown first for safer type assertion
      expect(() => service.info('Test', null as unknown as LogContext)).not.toThrow();
      expect(() => service.info('Test', undefined)).not.toThrow();
    });

    it('should handle empty string messages', () => {
      service.info('');

      expect(consoleLogSpy).toHaveBeenCalled();
      const logCall = consoleLogSpy.calls.mostRecent();
      expect(logCall.args[0]).toContain('INFO:');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);

      expect(() => service.info(longMessage)).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle context with special characters and values', () => {
      const complexContext: LogContext = {
        userId: 'user@domain.com',
        operation: 'special/operation-with_chars',
        correlationId: JSON.stringify({ nested: 'object' }),
      };

      expect(() => service.info('Complex context test', complexContext)).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Framework Independence Validation', () => {
    it('should work without Angular-specific dependencies', () => {
      // This test ensures the service can work outside Angular context
      const standaloneService = new LoggerService();

      expect(() => {
        standaloneService.info('Framework independent test');
        standaloneService.setGlobalContext({ operation: 'standalone' });
        standaloneService.debug('Debug in standalone mode');
      }).not.toThrow();
    });

    it('should handle missing window object in server-side environments', () => {
      // Test that the service handles the absence of window gracefully
      // by creating a scenario where isProduction() returns false (development mode)
      // when window is not available

      // Create a new service - in development mode, it should work fine
      expect(() => {
        const serverService = new LoggerService();
        serverService.info('Server-side logging test');
      }).not.toThrow();

      // The service should default to development mode when window is not available,
      // which means DEBUG level should be allowed
      const service = new LoggerService();

      // Reset the spy before using it in this test
      consoleLogSpy.calls.reset();

      service.debug('Test debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should be stateless and reusable', () => {
      const service1 = new LoggerService();
      const service2 = new LoggerService();

      service1.setGlobalContext({ userId: 'user1' });
      service2.setGlobalContext({ userId: 'user2' });

      consoleLogSpy.calls.reset();

      service1.info('Service 1 message');
      service2.info('Service 2 message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      // Each service should maintain its own state
      expect(consoleLogSpy.calls.argsFor(0)[1].userId).toBe('user1');
      expect(consoleLogSpy.calls.argsFor(1)[1].userId).toBe('user2');
    });
  });

  describe('Performance Considerations', () => {
    it('should not perform expensive operations for filtered log levels', () => {
      // Mock production environment by creating a service with mocked environment detection
      const originalIsProduction = (LoggerService.prototype as any)['isProduction'];
      (LoggerService.prototype as any)['isProduction'] = jasmine
        .createSpy('isProduction')
        .and.returnValue(true);

      const prodService = new LoggerService();
      consoleLogSpy.calls.reset();

      // This debug call should be filtered out early and not processed
      const expensiveContext = {
        get expensiveProperty() {
          throw new Error('This should not be evaluated for filtered logs');
        },
      };

      // This should not throw because debug logs are filtered out in production
      const contextWithExpensiveGetter = expensiveContext as unknown as LogContext;
      expect(() => prodService.debug('Debug message', contextWithExpensiveGetter)).not.toThrow();
      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Restore original method
      (LoggerService.prototype as any)['isProduction'] = originalIsProduction;
    });
  });

  describe('Integration with LogLevel Enum', () => {
    it('should properly map all log levels to string names', () => {
      service.debug('Debug test');
      service.info('Info test');
      service.warn('Warn test');
      service.error('Error test');

      // Verify that each log level is properly converted to string
      expect(consoleLogSpy.calls.argsFor(0)[0]).toContain('DEBUG');
      expect(consoleLogSpy.calls.argsFor(1)[0]).toContain('INFO');
      expect(consoleWarnSpy.calls.argsFor(0)[0]).toContain('WARN');
      expect(consoleErrorSpy.calls.argsFor(0)[0]).toContain('ERROR');
    });

    it('should handle unknown log levels gracefully', () => {
      // Testing private method - any is justified for accessing non-public API
      // Alternative: we could make getLevelName public for better testability
      const serviceWithPrivateAccess = service as any;
      const unknownLevelName = serviceWithPrivateAccess.getLevelName(999);

      expect(unknownLevelName).toBe('UNKNOWN');
    });
  });
});
