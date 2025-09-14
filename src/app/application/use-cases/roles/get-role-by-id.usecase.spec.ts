import { TestBed } from '@angular/core/testing';
import { GetRoleById } from './get-role-by-id.usecase';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { Role } from '@domain/entities/role.entity';
import { RoleRepository } from '@domain/repositories/business/role.repository';
import { ClockPort } from '@domain/repositories/system/clock.repository';
import { Logger } from '@core/interfaces/logger.interface';
import { GetRoleByIdRequest } from '@application/types/roles.types';

/**
 * Test Suite for GetRoleByIdUseCase
 *
 * Tests the orchestration logic for role retrieval by ID following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role retrieval by ID with comprehensive scenarios:
 * - Successful role retrieval with exact ID matching
 * - Application-level validation (input constraints, ID format validation)
 * - Role existence verification through repository exception handling
 * - Error handling and transformation
 * - Side effects (audit logging with correlation tracking)
 * - Proper dependency coordination
 * - Data flow between application and domain layers
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All external dependencies (Repository, Logger, Clock, ErrorTransformer)
 * - **Coverage**: 100% of orchestration logic, error paths, and side effects
 *
 * @dependencies
 * - RoleRepository mock (domain contract)
 * - ClockPort mock (system service)
 * - Logger mock (core service)
 * - ApplicationErrorTransformer mock (application service)
 *
 * @scenarios
 * - ✅ Successful role retrieval with complete flow
 * - ✅ Application-level validation (invalid request, invalid ID, missing ID)
 * - ✅ Repository error handling (role not found scenarios)
 * - ✅ Error transformation and propagation
 * - ✅ Side effects (audit logging with correlation ID)
 * - ✅ End-to-end orchestration flow validation
 * - ✅ Safe logging for error scenarios with null/undefined requests
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('GetRoleByIdUseCase', () => {
  let useCase: GetRoleById;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let validRequest: GetRoleByIdRequest;
  let mockRole: Role;

  beforeEach(() => {
    // Create mocks using Jasmine
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', [
      'getById',
      'create',
      'update',
      'delete',
      'list',
    ]);
    mockClock = jasmine.createSpyObj('ClockPort', ['now', 'nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'info', 'warn', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Setup test data
    validRequest = {
      id: 123,
      requesterId: 456,
    };

    // Create mock Role entity for testing
    mockRole = Role.create({
      id: 123,
      name: 'Test Admin Role',
      accessLevel: 5,
      description: 'System administrator role',
      isActive: true,
    });

    // Setup default mock behaviors
    mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // Fixed timestamp for testing
    mockLogger.info.and.stub();
    mockLogger.error.and.stub();
    mockErrorTransformer.transform.and.callFake((error: any) => error);

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        GetRoleById,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(GetRoleById);
  });

  describe('Successful Role Retrieval Tests', () => {
    describe('Valid Request with Role ID', () => {
      it('should successfully retrieve role by valid ID', async () => {
        // Arrange
        const request: GetRoleByIdRequest = {
          id: 123,
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify complete orchestration flow
        expect(result).toBe(mockRole);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(123);
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval completed', {
          correlationId: 'get-role-123-1640995200',
          userId: '456',
          operation: 'get_role_by_id',
        });
      });

      it('should successfully retrieve role without requesterId', async () => {
        // Arrange
        const request: GetRoleByIdRequest = {
          id: 789,
          // requesterId is optional
        };

        const role = Role.create({
          id: 789,
          name: 'Manager',
          accessLevel: 3,
          isActive: true,
        });

        mockRoleRepository.getById.and.returnValue(Promise.resolve(role));

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toBe(role);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(789);
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval completed', {
          correlationId: 'get-role-789-1640995200',
          userId: undefined, // Should handle undefined requesterId
          operation: 'get_role_by_id',
        });
      });
    });

    describe('Complete Orchestration Flow Verification', () => {
      it('should execute operations in correct order: validate → delegate → side effects', async () => {
        // Arrange
        let operationOrder: string[] = [];

        // Mock logger to track call order
        mockLogger.info.and.callFake((message: string) => {
          if (message === 'Role retrieval completed') {
            operationOrder.push('side_effects');
          }
        });

        // Mock repository to track call order
        mockRoleRepository.getById.and.callFake(async (id) => {
          operationOrder.push('repository_getById');
          return mockRole;
        });

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify correct orchestration order
        expect(operationOrder).toEqual(['repository_getById', 'side_effects']);
        // Note: Validation steps don't emit trackable events, but their success is implicit
        // in the completion of the flow without validation errors
      });

      it('should pass correct ID parameter through all operations', async () => {
        // Arrange
        const testRoleId = 999;
        const request: GetRoleByIdRequest = {
          id: testRoleId,
          requesterId: 12345,
        };

        const testRole = Role.create({
          id: testRoleId,
          name: 'Test Role',
          accessLevel: 2,
          isActive: true,
        });

        mockRoleRepository.getById.and.returnValue(Promise.resolve(testRole));

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify ID propagation through flow
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(testRoleId);
        expect(result).toBe(testRole);
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval completed', {
          correlationId: `get-role-${testRoleId}-1640995200`,
          userId: '12345',
          operation: 'get_role_by_id',
        });
      });
    });
  });

  describe('Application Rules Validation Tests', () => {
    describe('Invalid Request Validation', () => {
      it('should throw ApplicationError when request is null', async () => {
        // Arrange
        const nullRequest = null as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Request is required for role retrieval',
          'Request is required for role retrieval'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(nullRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.objectContaining({
            message: 'Request is required for role retrieval',
          })
        );
      });

      it('should throw ApplicationError when request is undefined', async () => {
        // Arrange
        const undefinedRequest = undefined as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Request is required for role retrieval',
          'Request is required for role retrieval'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(undefinedRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe('Role ID Validation', () => {
      it('should throw ApplicationError when role ID is missing', async () => {
        // Arrange
        const requestWithoutId: GetRoleByIdRequest = {
          id: undefined as any,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Role ID must be a positive integer',
          'Role ID must be a positive integer'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is null', async () => {
        // Arrange
        const requestWithNullId: GetRoleByIdRequest = {
          id: null as any,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Role ID must be a positive integer',
          'Role ID must be a positive integer'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNullId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is zero', async () => {
        // Arrange
        const requestWithZeroId: GetRoleByIdRequest = {
          id: 0,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Role ID must be a positive integer',
          'Role ID must be a positive integer'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(requestWithZeroId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is negative', async () => {
        // Arrange
        const requestWithNegativeId: GetRoleByIdRequest = {
          id: -5,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Role ID must be a positive integer',
          'Role ID must be a positive integer'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNegativeId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is not an integer', async () => {
        // Arrange
        const requestWithFloatId: GetRoleByIdRequest = {
          id: 123.45,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Role ID must be a positive integer',
          'Role ID must be a positive integer'
        );

        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(requestWithFloatId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Transformation Tests', () => {
    describe('Repository Error Scenarios', () => {
      it('should transform repository errors through ApplicationErrorTransformer', async () => {
        // Arrange
        const repositoryError = new Error('Database connection failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Internal system error',
          'Unable to retrieve role information'
        );

        mockRoleRepository.getById.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should handle role not found errors from repository', async () => {
        // Arrange
        const notFoundError = new Error('Role not found');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          'Role not found',
          'The requested role does not exist'
        );

        mockRoleRepository.getById.and.rejectWith(notFoundError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(notFoundError);
      });

      it('should handle network timeout errors from repository', async () => {
        // Arrange
        const timeoutError = new Error('Request timeout');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.OPERATION_TIMEOUT,
          'External service timeout',
          'Unable to retrieve role due to timeout'
        );

        mockRoleRepository.getById.and.rejectWith(timeoutError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(timeoutError);
      });

      it('should handle unexpected domain errors', async () => {
        // Arrange
        const domainError = new Error('Unexpected domain constraint violation');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Business rule violation',
          'Role retrieval violates business constraints'
        );

        mockRoleRepository.getById.and.rejectWith(domainError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
      });
    });

    describe('Error Transformation Integration', () => {
      it('should call error transformer for any caught exception', async () => {
        // Arrange
        const anyError = new Error('Any error');
        mockRoleRepository.getById.and.rejectWith(anyError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(anyError);
      });

      it('should preserve original error for transformation', async () => {
        // Arrange
        const originalError = new Error('Original repository error');
        mockRoleRepository.getById.and.rejectWith(originalError);

        // Act & Assert
        try {
          await useCase.execute(validRequest);
        } catch (error) {
          // Should not throw, but if it does, verify transformer was called correctly
        }

        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(originalError);
      });
    });

    describe('Safe Error Logging Tests', () => {
      it('should safely log error when request is null', async () => {
        // Arrange
        const nullRequest = null as any;
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.INVALID_INPUT,
            'Transformed error',
            'Invalid input provided'
          )
        );

        // Act
        try {
          await useCase.execute(nullRequest);
        } catch (error) {
          // Expected to throw, we're testing logging
        }

        // Assert - Verify safe logging with null request
        expect(mockLogger.error).toHaveBeenCalledWith('Role retrieval failed', {
          correlationId: 'get-role-unknown-1640995200',
          userId: undefined,
          operation: 'get_role_by_id',
        });
      });

      it('should safely log error when request is undefined', async () => {
        // Arrange
        const undefinedRequest = undefined as any;
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.INVALID_INPUT,
            'Transformed error',
            'Invalid input provided'
          )
        );

        // Act
        try {
          await useCase.execute(undefinedRequest);
        } catch (error) {
          // Expected to throw, we're testing logging
        }

        // Assert - Verify safe logging with undefined request
        expect(mockLogger.error).toHaveBeenCalledWith('Role retrieval failed', {
          correlationId: 'get-role-unknown-1640995200',
          userId: undefined,
          operation: 'get_role_by_id',
        });
      });

      it('should safely log error when request has missing ID', async () => {
        // Arrange
        const requestWithoutId = { requesterId: 456 } as any;
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.INVALID_INPUT,
            'Transformed error',
            'Invalid input provided'
          )
        );

        // Act
        try {
          await useCase.execute(requestWithoutId);
        } catch (error) {
          // Expected to throw, we're testing logging
        }

        // Assert - Verify safe logging when ID is missing
        expect(mockLogger.error).toHaveBeenCalledWith('Role retrieval failed', {
          correlationId: 'get-role-unknown-1640995200',
          userId: '456',
          operation: 'get_role_by_id',
        });
      });

      it('should log error correctly for repository failures', async () => {
        // Arrange
        const repositoryError = new Error('Repository failed');
        mockRoleRepository.getById.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Transformed error',
            'Internal system error'
          )
        );

        // Act
        try {
          await useCase.execute(validRequest);
        } catch (error) {
          // Expected to throw, we're testing logging
        }

        // Assert - Verify proper error logging with valid request
        expect(mockLogger.error).toHaveBeenCalledWith('Role retrieval failed', {
          correlationId: 'get-role-123-1640995200',
          userId: '456',
          operation: 'get_role_by_id',
        });
      });
    });
  });

  describe('Side Effects and Audit Logging Tests', () => {
    describe('Successful Operation Logging', () => {
      it('should log role retrieval completion with correct correlation ID', async () => {
        // Arrange
        const request: GetRoleByIdRequest = { id: 555, requesterId: 777 };
        const role = Role.create({
          id: 555,
          name: 'Test Role',
          accessLevel: 4,
          isActive: true,
        });

        mockRoleRepository.getById.and.returnValue(Promise.resolve(role));

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval completed', {
          correlationId: 'get-role-555-1640995200',
          userId: '777',
          operation: 'get_role_by_id',
        });
      });

      it('should handle undefined requesterId in logging', async () => {
        // Arrange
        const request: GetRoleByIdRequest = { id: 888 };
        const role = Role.create({
          id: 888,
          name: 'Another Role',
          accessLevel: 2,
          isActive: true,
        });

        mockRoleRepository.getById.and.returnValue(Promise.resolve(role));

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval completed', {
          correlationId: 'get-role-888-1640995200',
          userId: undefined,
          operation: 'get_role_by_id',
        });
      });
    });

    describe('Correlation ID Generation', () => {
      it('should generate correlation IDs using role ID and timestamp', async () => {
        // Arrange
        const currentTime = 1234567890;
        mockClock.nowEpochSeconds.and.returnValue(currentTime);

        const request: GetRoleByIdRequest = { id: 999, requesterId: 123 };
        const role = Role.create({
          id: 999,
          name: 'Correlation Test Role',
          accessLevel: 1,
          isActive: true,
        });

        mockRoleRepository.getById.and.returnValue(Promise.resolve(role));

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval completed', {
          correlationId: `get-role-999-${currentTime}`,
          userId: '123',
          operation: 'get_role_by_id',
        });
      });

      it('should use same timestamp for correlation ID in successful and error scenarios', async () => {
        // Arrange
        const fixedTime = 9876543210;
        mockClock.nowEpochSeconds.and.returnValue(fixedTime);

        // Test successful scenario first
        await useCase.execute(validRequest);

        // Reset mocks
        mockLogger.info.calls.reset();
        mockLogger.error.calls.reset();

        // Test error scenario
        mockRoleRepository.getById.and.rejectWith(new Error('Test error'));
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Transformed error',
            'Internal system error'
          )
        );

        try {
          await useCase.execute(validRequest);
        } catch (error) {
          // Expected
        }

        // Assert - Both should use same timestamp format
        expect(mockLogger.error).toHaveBeenCalledWith('Role retrieval failed', {
          correlationId: `get-role-123-${fixedTime}`,
          userId: '456',
          operation: 'get_role_by_id',
        });
      });
    });
  });

  describe('Integration and End-to-End Tests', () => {
    describe('Complete Success Flow', () => {
      it('should execute complete happy path without any mocking side effects', async () => {
        // Arrange - Use realistic test data
        const request: GetRoleByIdRequest = {
          id: 42,
          requesterId: 100,
        };

        const expectedRole = Role.create({
          id: 42,
          name: 'Product Manager',
          accessLevel: 3,
          description: 'Manages product development',
          isActive: true,
        });

        mockRoleRepository.getById.and.returnValue(Promise.resolve(expectedRole));

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify complete flow execution
        expect(result).toBe(expectedRole);

        // Verify all dependencies were called correctly
        expect(mockRoleRepository.getById).toHaveBeenCalledTimes(1);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(42);
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });
    });

    describe('Dependency Interaction Verification', () => {
      it('should not call repository when validation fails', async () => {
        // Arrange
        const invalidRequest = null as any;
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.INVALID_INPUT,
            'Validation error',
            'Invalid input provided'
          )
        );

        // Act & Assert
        await expectAsync(useCase.execute(invalidRequest)).toBeRejected();

        // Verify repository was never called
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
      });

      it('should not log success when repository fails', async () => {
        // Arrange
        mockRoleRepository.getById.and.rejectWith(new Error('Repository error'));
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Transformed error',
            'Internal system error'
          )
        );

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();

        // Verify success logging was not called
        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });
  });
});
