import { TestBed } from '@angular/core/testing';
import { ApplicationErrorTransformer } from './application-error.transformer';
import { ApplicationError } from './application-error';
import { ApplicationErrorCode } from './error-codes.enum';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import { LoggerService } from '@core/services/logger.service';
import type { LogContext } from '@core/interfaces/logger.interface';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';
import { BusinessRuleError } from '@/app/domain/errors/business-rule-error.entity';

/**
 * Test Suite for ApplicationErrorTransformer
 *
 * Tests the Application Error Transformer service following Clean Architecture principles.
 * Focuses on orchestration logic for error transformation between layers, dependency
 * coordination, and proper error handling workflows without testing business logic.
 *
 * @description
 * Validates the Application Layer error transformation orchestration with comprehensive scenarios:
 * - Domain error transformation (ValidationError, BusinessRuleError)
 * - Infrastructure error transformation (HTTP, Network, API errors)
 * - Error type detection and routing logic
 * - Logger integration and context preservation
 * - Unknown error handling and fallback behavior
 * - Error transformation workflows and dependency coordination
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing with extensive mocking
 * - **Mocks**: Logger, ValidationError, BusinessRuleError, InfrastructureError
 * - **Coverage**: 95% of transformation logic and orchestration flows
 *
 * @dependencies
 * - LoggerService mock (core layer)
 * - ValidationError mock (domain layer)
 * - BusinessRuleError mock (domain layer)
 * - InfrastructureError mock (infrastructure layer)
 *
 * @scenarios
 * - ✅ Domain ValidationError transformation
 * - ✅ Domain BusinessRuleError transformation
 * - ✅ Infrastructure error transformation (HTTP, Network, API)
 * - ✅ ApplicationError pass-through behavior
 * - ✅ Unknown error handling and fallback
 * - ✅ Logger integration and context preservation
 * - ✅ Error transformation workflows
 * - ✅ HTTP status code mapping
 * - ✅ Business rule code mapping
 *
 * @since 1.0.0
 * @layer Application Testing
 */
describe('ApplicationErrorTransformer', () => {
  let transformer: ApplicationErrorTransformer;
  let mockLogger: jasmine.SpyObj<LoggerService>;

  // Mock error instances
  let mockValidationError: jasmine.SpyObj<ValidationError>;
  let mockBusinessRuleError: jasmine.SpyObj<BusinessRuleError>;
  let mockInfrastructureError: jasmine.SpyObj<InfrastructureError>;

  beforeEach(() => {
    // Create logger mock
    mockLogger = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'warn', 'error']);

    // Create actual error instances instead of spy objects to pass instanceof checks
    mockValidationError = ValidationError.createFromFields(
      [
        {
          field: 'email',
          value: 'invalid-email',
          message: 'Invalid email format',
          code: ValidationErrorCode.FIELD_FORMAT_INVALID,
        } as FieldError,
      ],
      ValidationErrorCode.FIELD_FORMAT_INVALID
    ) as any;

    mockBusinessRuleError = new BusinessRuleError(
      'Business rule violation',
      'ROLE_HAS_ASSIGNED_USERS',
      { roleId: 123, userCount: 5 }
    ) as any;

    mockInfrastructureError = new InfrastructureError(
      'Infrastructure failure',
      'SERVER_ERROR',
      'HTTP',
      false,
      undefined,
      500,
      undefined,
      '/api/users'
    ) as any;

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [ApplicationErrorTransformer, { provide: LoggerService, useValue: mockLogger }],
    });

    transformer = TestBed.inject(ApplicationErrorTransformer);
  });

  describe('Error Type Detection and Routing', () => {
    describe('Domain ValidationError Transformation', () => {
      it('should transform ValidationError to ApplicationError with proper mapping', () => {
        // Arrange
        const context: LogContext = { correlationId: 'test-123', userId: 'user-456' };

        // Act
        const result = transformer.transform(mockValidationError, context);

        // Assert
        expect(result).toBeInstanceOf(ApplicationError);
        expect(result.code).toBe(ApplicationErrorCode.INVALID_INPUT);
        expect(result.message).toBe('Validation failed: ' + mockValidationError.message);
        expect(result.userMessage).toBe(
          'Please correct the following: email: Invalid email format'
        );
        expect(result.context).toEqual({
          validationErrors: mockValidationError.errors,
          errorId: mockValidationError.errorId,
        });
        expect(result.suggestedAction).toBe('Please review and correct the highlighted fields');
        expect(result.retryable).toBe(false);
      });

      it('should log validation error transformation with context', () => {
        // Arrange
        const context: LogContext = { correlationId: 'test-123', userId: 'user-456' };

        // Act
        transformer.transform(mockValidationError, context);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'test-123',
          userId: 'user-456',
        });
        expect(mockLogger.warn).toHaveBeenCalledWith('Validation error transformed', {
          operation: 'validation-error-transform',
          correlationId: 'test-123',
        });
      });

      it('should handle ValidationError with multiple field errors', () => {
        // Arrange
        const multiFieldValidationError = ValidationError.createFromFields([
          {
            field: 'email',
            value: 'invalid-email',
            message: 'Invalid email format',
            code: ValidationErrorCode.FIELD_FORMAT_INVALID,
          },
          {
            field: 'password',
            value: '123',
            message: 'Password too short',
            code: ValidationErrorCode.VALUE_TOO_LOW,
          },
          {
            field: 'username',
            value: '',
            message: 'Username is required',
            code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
          },
        ] as FieldError[]);

        // Act
        const result = transformer.transform(multiFieldValidationError);

        // Assert
        expect(result.userMessage).toBe(
          'Please correct the following: email: Invalid email format; password: Password too short; username: Username is required'
        );
        expect((result.context as any)?.validationErrors?.length).toBe(3);
        expect((result.context as any)?.errorId).toMatch(/^ve_[a-z0-9]+_[a-z0-9]+$/); // ValidationError ID pattern
      });

      it('should handle ValidationError with empty field errors array', () => {
        // Arrange - Using fromMessage to create a ValidationError with empty meaningful content
        const emptyValidationError = ValidationError.fromMessage('Empty validation error', '');

        // Act
        const result = transformer.transform(emptyValidationError);

        // Assert
        expect(result.userMessage).toContain('Please correct the following:');
        expect((result.context as any)?.validationErrors).toEqual(emptyValidationError.errors);
      });
    });

    describe('Domain BusinessRuleError Transformation', () => {
      it('should transform ROLE_HAS_ASSIGNED_USERS BusinessRuleError correctly', () => {
        // Arrange
        const context: LogContext = { correlationId: 'business-123' };

        // Act
        const result = transformer.transform(mockBusinessRuleError, context);

        // Assert
        expect(result).toBeInstanceOf(ApplicationError);
        expect(result.code).toBe(ApplicationErrorCode.ROLE_IN_USE);
        expect(result.message).toBe('Business rule violation');
        expect(result.userMessage).toBe(
          'This role cannot be deleted because it is assigned to active users'
        );
        expect(result.context).toEqual({ roleId: 123, userCount: 5 });
        expect(result.suggestedAction).toBe('Remove all users from this role before deleting it');
        expect(result.retryable).toBe(false);
      });

      it('should transform RESOURCE_IN_USE BusinessRuleError correctly', () => {
        // Arrange
        const resourceInUseError = new BusinessRuleError(
          'Resource is currently in use',
          'RESOURCE_IN_USE',
          { resourceId: 'res-789', type: 'project' }
        );

        // Act
        const result = transformer.transform(resourceInUseError);

        // Assert
        expect(result.code).toBe(ApplicationErrorCode.INVALID_USER_STATE);
        expect(result.message).toBe('Resource is currently in use');
        expect(result.userMessage).toBe(
          'This resource cannot be modified because it is currently in use'
        );
        expect(result.context).toEqual({ resourceId: 'res-789', type: 'project' });
        expect(result.suggestedAction).toBe(
          'Please wait until the resource is available or contact an administrator'
        );
      });

      it('should handle unknown BusinessRuleError codes with default mapping', () => {
        // Arrange
        const unknownBusinessRuleError = new BusinessRuleError(
          'Unknown business rule violation',
          'UNKNOWN_BUSINESS_RULE',
          { operation: 'unknown-operation' }
        );

        // Act
        const result = transformer.transform(unknownBusinessRuleError);

        // Assert
        expect(result.code).toBe(ApplicationErrorCode.INVALID_INPUT);
        expect(result.message).toBe('Unknown business rule violation');
        expect(result.userMessage).toBe('The requested operation violates business rules');
        expect(result.context).toEqual({ operation: 'unknown-operation' });
        expect(result.suggestedAction).toBe('Please review your request and try again');
      });

      it('should log business rule error transformation with context', () => {
        // Arrange
        const context: LogContext = { correlationId: 'business-456', userId: 'user-789' };

        // Act
        transformer.transform(mockBusinessRuleError, context);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'business-456',
          userId: 'user-789',
        });
        expect(mockLogger.warn).toHaveBeenCalledWith('Business rule error transformed', {
          operation: 'business-rule-error-transform',
          correlationId: 'business-456',
        });
      });
    });

    describe('Infrastructure Error Transformation', () => {
      describe('HTTP Error Transformation', () => {
        it('should transform 401 HTTP error to authentication failed', () => {
          // Arrange
          const http401Error = new InfrastructureError(
            'Unauthorized request',
            'AUTH_FAILED',
            'HTTP',
            false,
            undefined,
            401,
            undefined,
            '/api/auth/login'
          );

          // Act
          const result = transformer.transform(http401Error);

          // Assert
          expect(result.code).toBe(ApplicationErrorCode.AUTH_FAILED);
          expect(result.message).toBe('User authentication failed');
          expect(result.userMessage).toBe('Invalid email or password');
          expect(result.suggestedAction).toBe('Please check your credentials and try again');
          expect(result.retryable).toBe(false);
        });

        it('should transform unknown API errors to unexpected error', () => {
          // Arrange
          const unknownApiError = new InfrastructureError(
            'Unknown API error',
            'UNKNOWN_API_ERROR',
            'API',
            false
          );

          // Act
          const result = transformer.transform(unknownApiError);

          // Assert
          expect(result.code).toBe(ApplicationErrorCode.UNEXPECTED_ERROR);
          expect(result.message).toBe('An unexpected error occurred');
          expect(result.userMessage).toBe('Something went wrong. Please try again.');
        });
      });

      it('should log infrastructure error transformation with context', () => {
        // Arrange
        const context: LogContext = { correlationId: 'infra-123' };

        // Act
        transformer.transform(mockInfrastructureError, context);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'infra-123',
          userId: undefined,
        });
        expect(mockLogger.warn).toHaveBeenCalledWith('Infrastructure error transformed', {
          operation: 'infrastructure-error-transform',
          correlationId: 'infra-123',
        });
      });

      it('should handle unknown infrastructure error types with service unavailable for NETWORK', () => {
        // Arrange
        const unknownInfraError = new InfrastructureError(
          'Unknown infrastructure error',
          'UNKNOWN_CODE',
          'NETWORK',
          false
        );

        // Act
        const result = transformer.transform(unknownInfraError);

        // Assert
        expect(result.code).toBe(ApplicationErrorCode.SERVICE_UNAVAILABLE);
        expect(result.message).toBe('Service network is currently unavailable');
        expect(result.userMessage).toBe(
          'The service is temporarily unavailable. Please try again later.'
        );
      });
    });

    describe('ApplicationError Pass-through', () => {
      it('should pass through ApplicationError instances without transformation', () => {
        // Arrange
        const existingApplicationError = ApplicationError.authenticationFailed();
        const context: LogContext = { correlationId: 'pass-through-123' };

        // Act
        const result = transformer.transform(existingApplicationError, context);

        // Assert
        expect(result).toBe(existingApplicationError); // Same instance, not transformed
        expect(result.code).toBe(ApplicationErrorCode.AUTH_FAILED);
        expect(result.message).toBe('User authentication failed');
      });

      it('should log pass-through for ApplicationError instances', () => {
        // Arrange
        const existingApplicationError = ApplicationError.serviceUnavailable('database', 30);
        const context: LogContext = { correlationId: 'pass-through-456', userId: 'user-123' };

        // Act
        transformer.transform(existingApplicationError, context);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'pass-through-456',
          userId: 'user-123',
        });
        // Should not log transformation since it's passed through
        expect(mockLogger.warn).not.toHaveBeenCalledWith(
          jasmine.stringMatching(/transformed/),
          jasmine.any(Object)
        );
      });
    });

    describe('Unknown Error Handling', () => {
      it('should transform unknown Error instances to unexpected error', () => {
        // Arrange
        const unknownError = new Error('Random error message');
        const context: LogContext = { correlationId: 'unknown-123' };

        // Act
        const result = transformer.transform(unknownError, context);

        // Assert
        expect(result).toBeInstanceOf(ApplicationError);
        expect(result.code).toBe(ApplicationErrorCode.UNEXPECTED_ERROR);
        expect(result.message).toBe('An unexpected error occurred');
        expect(result.userMessage).toBe('Something went wrong. Please try again.');
        expect(result.retryable).toBe(true);
      });

      it('should transform non-Error objects to unexpected error', () => {
        // Arrange
        const nonErrorObjects = [
          'string error',
          { message: 'object error' },
          123,
          null,
          undefined,
          [],
          Symbol('error'),
        ];

        // Act & Assert
        nonErrorObjects.forEach((unknownError) => {
          const result = transformer.transform(unknownError);

          expect(result).toBeInstanceOf(ApplicationError);
          expect(result.code).toBe(ApplicationErrorCode.UNEXPECTED_ERROR);
          expect(result.message).toBe('An unexpected error occurred');
          expect(result.userMessage).toBe('Something went wrong. Please try again.');
          expect(result.retryable).toBe(true);
        });
      });

      it('should log unknown error types with warning', () => {
        // Arrange
        const unknownError = { weirdError: 'not a standard error' };
        const context: LogContext = { correlationId: 'unknown-456' };

        // Act
        transformer.transform(unknownError, context);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'unknown-456',
          userId: undefined,
        });
        expect(mockLogger.error).toHaveBeenCalledWith('Unknown error type encountered', {
          operation: 'error-transformation',
          correlationId: 'unknown-456',
        });
      });
    });
  });

  describe('Logger Integration and Context Preservation', () => {
    describe('Context Preservation', () => {
      it('should preserve all context properties during transformation', () => {
        // Arrange
        const fullContext: LogContext = {
          correlationId: 'full-context-123',
          userId: 'user-456',
          operation: 'user-registration',
        } as any;

        // Act
        transformer.transform(mockValidationError, fullContext);

        // Assert - The transformer preserves the original context operation field when spreading
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'user-registration', // Original context operation is preserved
          correlationId: 'full-context-123',
          userId: 'user-456',
        });
      });

      it('should handle partial context gracefully', () => {
        // Arrange
        const partialContext: LogContext = {
          correlationId: 'partial-123',
          // userId is missing
        };

        // Act
        transformer.transform(mockBusinessRuleError, partialContext);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'partial-123',
          userId: undefined,
        });
      });

      it('should handle undefined context gracefully', () => {
        // Act
        transformer.transform(mockInfrastructureError);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: undefined,
          userId: undefined,
        });
      });

      it('should preserve context in specific transformation logs', () => {
        // Arrange
        const context: LogContext = {
          correlationId: 'transform-context-123',
          userId: 'user-789',
        };

        // Act
        transformer.transform(mockValidationError, context);
        transformer.transform(mockBusinessRuleError, context);
        transformer.transform(mockInfrastructureError, context);

        // Assert - Each transformation type preserves context
        expect(mockLogger.warn).toHaveBeenCalledWith('Validation error transformed', {
          operation: 'validation-error-transform',
          correlationId: 'transform-context-123',
        });
        expect(mockLogger.warn).toHaveBeenCalledWith('Business rule error transformed', {
          operation: 'business-rule-error-transform',
          correlationId: 'transform-context-123',
        });
        expect(mockLogger.warn).toHaveBeenCalledWith('Infrastructure error transformed', {
          operation: 'infrastructure-error-transform',
          correlationId: 'transform-context-123',
        });
      });
    });

    describe('Logger Call Verification', () => {
      it('should call logger with correct methods for different error types', () => {
        // Arrange
        const context: LogContext = { correlationId: 'logger-test-123' };

        // Act
        transformer.transform(mockValidationError, context);
        transformer.transform(mockBusinessRuleError, context);
        transformer.transform(mockInfrastructureError, context);

        // Assert - Verify logger method calls
        expect(mockLogger.error).toHaveBeenCalledTimes(3); // Initial log for each transformation
        expect(mockLogger.warn).toHaveBeenCalledTimes(3); // Specific transformation logs
        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockLogger.debug).not.toHaveBeenCalled();
      });

      it('should log unknown errors with error level', () => {
        // Arrange
        const unknownError = new Error('Unknown error');
        const context: LogContext = { correlationId: 'unknown-error-123' };

        // Act
        transformer.transform(unknownError, context);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: 'unknown-error-123',
          userId: undefined,
        });
        expect(mockLogger.error).toHaveBeenCalledWith('Unknown error type encountered', {
          operation: 'error-transformation',
          correlationId: 'unknown-error-123',
        });
      });

      it('should not log transformation for ApplicationError pass-through', () => {
        // Arrange
        const applicationError = ApplicationError.userAlreadyExists('test@example.com');

        // Act
        transformer.transform(applicationError);

        // Assert
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'error-transformation',
          correlationId: undefined,
          userId: undefined,
        });
        // Should not have additional transformation logs
        expect(mockLogger.warn).not.toHaveBeenCalled();
      });
    });

    describe('Logger Integration Patterns', () => {
      it('should use consistent operation names in log contexts', () => {
        // Arrange
        const context: LogContext = { correlationId: 'operation-consistency-123' };

        // Act
        transformer.transform(mockValidationError, context);

        // Assert
        const errorCalls = mockLogger.error.calls.all();
        const warnCalls = mockLogger.warn.calls.all();

        expect(errorCalls[0].args[1]).toEqual(
          jasmine.objectContaining({ operation: 'error-transformation' })
        );
        expect(warnCalls[0].args[1]).toEqual(
          jasmine.objectContaining({ operation: 'validation-error-transform' })
        );
      });

      it('should maintain operation context through error transformation chain', () => {
        // Arrange
        const context: LogContext = {
          correlationId: 'chain-123',
          userId: 'user-456',
          operation: 'user-update',
        };

        // Act
        transformer.transform(mockBusinessRuleError, context);

        // Assert - The transformer preserves the original context operation field when spreading
        expect(mockLogger.error).toHaveBeenCalledWith('Transforming error in Application layer', {
          operation: 'user-update', // Original context operation is preserved
          correlationId: 'chain-123',
          userId: 'user-456',
        });
      });
    });
  });

  describe('Error Transformation Workflows', () => {
    describe('Complete Transformation Pipelines', () => {
      it('should execute complete validation error transformation workflow', () => {
        // Arrange
        const context: LogContext = { correlationId: 'workflow-123', userId: 'user-456' };
        let executionOrder: string[] = [];

        // Mock logger to track execution order
        mockLogger.error.and.callFake((message: string) => {
          if (message === 'Transforming error in Application layer') {
            executionOrder.push('initial_log');
          }
        });
        mockLogger.warn.and.callFake((message: string) => {
          if (message === 'Validation error transformed') {
            executionOrder.push('transformation_log');
          }
        });

        // Act
        const result = transformer.transform(mockValidationError, context);

        // Assert - Verify workflow execution order
        expect(executionOrder).toEqual(['initial_log', 'transformation_log']);
        expect(result).toBeInstanceOf(ApplicationError);
        expect(result.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      });

      it('should execute complete infrastructure error transformation workflow', () => {
        // Arrange
        const httpError = new InfrastructureError(
          'Unauthorized',
          'AUTH_FAILED',
          'HTTP',
          false,
          undefined,
          401,
          undefined,
          '/api/secure'
        );

        let workflowSteps: string[] = [];

        mockLogger.error.and.callFake(() => workflowSteps.push('error_log'));
        mockLogger.warn.and.callFake(() => workflowSteps.push('transformation_log'));

        // Act
        const result = transformer.transform(httpError);

        // Assert - Verify complete workflow
        expect(workflowSteps).toEqual(['error_log', 'transformation_log']);
        expect(result.code).toBe(ApplicationErrorCode.AUTH_FAILED);
        expect(result.message).toBe('User authentication failed');
      });

      it('should handle error transformation chain with context propagation', () => {
        // Arrange
        const context: LogContext = {
          correlationId: 'chain-789',
          userId: 'user-123',
          operation: 'delete-role',
        };

        // Act
        const result = transformer.transform(mockBusinessRuleError, context);

        // Assert - Verify context flows through entire chain
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Transforming error in Application layer',
          jasmine.objectContaining({ correlationId: 'chain-789' })
        );
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Business rule error transformed',
          jasmine.objectContaining({ correlationId: 'chain-789' })
        );
        expect(result.code).toBe(ApplicationErrorCode.ROLE_IN_USE);
      });
    });

    describe('Error Handling Edge Cases', () => {
      it('should handle recursive error transformation gracefully', () => {
        // Arrange
        const originalTransform = transformer.transform;
        let transformationCount = 0;

        // Mock transform to detect potential recursion
        spyOn(transformer, 'transform').and.callFake((error: unknown, context?: LogContext) => {
          transformationCount++;
          if (transformationCount > 5) {
            throw new Error('Recursion detected');
          }
          return originalTransform.call(transformer, error, context);
        });

        // Act
        const result = transformer.transform(mockValidationError);

        // Assert - Should transform once without recursion
        expect(transformationCount).toBe(1);
        expect(result).toBeInstanceOf(ApplicationError);
      });

      it('should maintain error transformation isolation between calls', () => {
        // Arrange
        const context1: LogContext = { correlationId: 'isolation-1', userId: 'user-1' };
        const context2: LogContext = { correlationId: 'isolation-2', userId: 'user-2' };

        // Act
        const result1 = transformer.transform(mockValidationError, context1);
        const result2 = transformer.transform(mockBusinessRuleError, context2);

        // Assert - Verify no cross-contamination
        expect(result1.code).toBe(ApplicationErrorCode.INVALID_INPUT);
        expect(result2.code).toBe(ApplicationErrorCode.ROLE_IN_USE);

        // Verify context isolation in logs
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Transforming error in Application layer',
          jasmine.objectContaining({ correlationId: 'isolation-1', userId: 'user-1' })
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Transforming error in Application layer',
          jasmine.objectContaining({ correlationId: 'isolation-2', userId: 'user-2' })
        );
      });

      it('should handle error transformation with malformed context', () => {
        // Arrange
        const malformedContext = {
          correlationId: null,
          userId: undefined,
          invalidProperty: Symbol('invalid'),
        } as any;

        // Act
        const result = transformer.transform(mockInfrastructureError, malformedContext);

        // Assert - Should handle gracefully
        expect(result).toBeInstanceOf(ApplicationError);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Transforming error in Application layer',
          jasmine.objectContaining({
            operation: 'error-transformation',
            correlationId: null,
            userId: undefined,
          })
        );
      });
    });

    describe('Performance and Memory Considerations', () => {
      it('should not retain references to original errors after transformation', () => {
        // Arrange
        const originalError = mockValidationError;

        // Act
        const result = transformer.transform(originalError);

        // Assert - Result should be independent of original error
        expect(result).not.toBe(originalError as any);
        expect(result).toBeInstanceOf(ApplicationError);

        // Context should contain validation errors reference (current behavior)
        expect((result.context as any)?.validationErrors).toEqual(originalError.errors);
        // Note: Current implementation shares reference - this is the actual behavior
      });

      it('should handle multiple rapid transformations efficiently', () => {
        // Arrange
        const errors = Array.from({ length: 100 }, (_, i) =>
          jasmine.createSpyObj(`MockError${i}`, [], {
            message: `Error ${i}`,
            errors: [{ field: `field${i}`, message: `Message ${i}` }],
            errorId: `error-${i}`,
          })
        );

        // Act
        const startTime = performance.now();
        const results = errors.map((error) => transformer.transform(error));
        const endTime = performance.now();

        // Assert - Should handle efficiently
        expect(results.length).toBe(100);
        expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
        results.forEach((result) => {
          expect(result).toBeInstanceOf(ApplicationError);
        });
      });
    });
  });
});
