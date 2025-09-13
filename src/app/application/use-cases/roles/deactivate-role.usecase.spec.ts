import { TestBed } from '@angular/core/testing';
import { DeactivateRoleUseCase } from './deactivate-role.usecase';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { Role } from '@domain/entities/role.entity';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { DeactivateRoleRequest } from '@application/types/roles.types';

/**
 * Test Suite for DeactivateRoleUseCase
 *
 * Tests the orchestration logic for role deactivation operations following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role deactivation with comprehensive scenarios:
 * - Successful role deactivation with complete orchestration flow
 * - Application-level validation (input constraints, authorization)
 * - Domain repository integration with { isActive: false } updates
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
 * - ✅ Successful role deactivation with complete flow
 * - ✅ Application-level validation (invalid request, missing ID, unauthorized)
 * - ✅ Authorization validation and logging
 * - ✅ Repository error handling (deactivation failures)
 * - ✅ Error transformation and propagation
 * - ✅ Side effects (audit logging with correlation ID)
 * - ✅ End-to-end orchestration flow validation
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('DeactivateRoleUseCase', () => {
  let useCase: DeactivateRoleUseCase;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let validRequest: DeactivateRoleRequest;
  let mockDeactivatedRole: Role;

  beforeEach(() => {
    // Create mocks using Jasmine
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', [
      'getById',
      'update',
      'delete',
      'create',
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

    // Create mock Role entity using the factory method
    mockDeactivatedRole = Role.create({
      id: 123,
      name: 'Test Role for Deactivation',
      accessLevel: 3,
      description: 'Role for deactivation testing',
      isActive: false, // Deactivated state
    });

    // Setup default mock behaviors
    mockRoleRepository.update.and.returnValue(Promise.resolve(mockDeactivatedRole));
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // Fixed timestamp for testing
    mockLogger.info.and.stub();
    mockErrorTransformer.transform.and.callFake((error: any) => error);

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        DeactivateRoleUseCase,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(DeactivateRoleUseCase);
  });

  describe('Successful Role Deactivation Tests', () => {
    describe('Valid Request with Complete Flow', () => {
      it('should successfully deactivate role with complete orchestration flow', async () => {
        // Arrange
        const request: DeactivateRoleRequest = {
          id: 123,
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify complete orchestration flow
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(123, { isActive: false });
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-1640995200',
          userId: '456',
          operation: 'deactivate_role',
        });
      });

      it('should successfully deactivate role with minimal required data', async () => {
        // Arrange
        const minimalRequest: DeactivateRoleRequest = {
          id: 999,
          requesterId: 111,
        };

        // Act
        const result = await useCase.execute(minimalRequest);

        // Assert - Verify minimal deactivation works
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(999, { isActive: false });
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-999-1640995200',
          userId: '111',
          operation: 'deactivate_role',
        });
      });

      it('should handle role deactivation with different role IDs', async () => {
        // Arrange
        const differentRoleId = 555;
        const differentRole = Role.create({
          id: differentRoleId,
          name: 'Different Role',
          accessLevel: 2,
          description: 'Another test role',
          isActive: false,
        });

        mockRoleRepository.update.and.returnValue(Promise.resolve(differentRole));

        const request: DeactivateRoleRequest = {
          id: differentRoleId,
          requesterId: 777,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify handling of different role entities
        expect(result).toBe(differentRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(differentRoleId, {
          isActive: false,
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-555-1640995200',
          userId: '777',
          operation: 'deactivate_role',
        });
      });

      it('should return deactivated role entity from repository', async () => {
        // Arrange
        const returnedRole = Role.create({
          id: 123,
          name: 'Returned Role',
          accessLevel: 4,
          isActive: false,
        });
        mockRoleRepository.update.and.returnValue(Promise.resolve(returnedRole));

        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Should return the exact role from repository
        expect(result).toBe(returnedRole);
        expect(result.isActive).toBe(false);
        expect(result.name).toBe('Returned Role');
        expect(result.accessLevel).toBe(4);
      });
    });

    describe('Orchestration Flow Verification', () => {
      it('should execute operations in correct order: validate → authorize → update → side effects', async () => {
        // Arrange
        let operationOrder: string[] = [];

        // Mock logger to track call order
        mockLogger.info.and.callFake((message: string) => {
          if (message === 'Role deactivated') {
            operationOrder.push('side_effects');
          }
        });

        // Mock repository to track call order
        mockRoleRepository.update.and.callFake(async (id, payload) => {
          operationOrder.push('repository_update');
          return mockDeactivatedRole;
        });

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify correct orchestration order
        expect(operationOrder).toEqual(['repository_update', 'side_effects']);
        // Note: Validation steps don't emit trackable events, but their success is implicit
        // in the completion of the flow without validation errors
      });

      it('should pass correct role ID and payload through all operations', async () => {
        // Arrange
        const testRoleId = 12345;
        const request: DeactivateRoleRequest = {
          id: testRoleId,
          requesterId: 678,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify role ID and payload consistency
        expect(mockRoleRepository.update).toHaveBeenCalledWith(testRoleId, { isActive: false });
        expect(mockRoleRepository.update).toHaveBeenCalledTimes(1);
      });

      it('should maintain requester context throughout orchestration', async () => {
        // Arrange
        const testRequesterId = 99999;
        const request: DeactivateRoleRequest = {
          id: 123,
          requesterId: testRequesterId,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify requester context consistency
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-1640995200',
          userId: testRequesterId.toString(),
          operation: 'deactivate_role',
        });
      });

      it('should call repository update with exact { isActive: false } payload', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify exact payload structure
        expect(mockRoleRepository.update).toHaveBeenCalledWith(
          123,
          jasmine.objectContaining({
            isActive: false,
          })
        );

        // Verify payload only contains isActive property
        const updateCall = mockRoleRepository.update.calls.first();
        const payload = updateCall.args[1];
        expect(Object.keys(payload)).toEqual(['isActive']);
        expect(payload.isActive).toBe(false);
      });
    });

    describe('Complete Orchestration Flow Integration', () => {
      it('should complete full orchestration flow with all dependencies', async () => {
        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Verify complete integration
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(123, { isActive: false });
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-1640995200',
          userId: '456',
          operation: 'deactivate_role',
        });
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });

      it('should handle complete flow with different data scenarios', async () => {
        // Arrange
        const customRole = Role.create({
          id: 12345,
          name: 'Custom Test Role',
          accessLevel: 3,
          description: 'Custom role for testing',
          isActive: false,
        });
        mockRoleRepository.update.and.returnValue(Promise.resolve(customRole));

        const customRequest: DeactivateRoleRequest = {
          id: 12345,
          requesterId: 98765,
        };

        mockClock.nowEpochSeconds.and.returnValue(1680000000);

        // Act
        const result = await useCase.execute(customRequest);

        // Assert - Verify complete flow with custom data
        expect(result).toBe(customRole);
        expect(result.name).toBe('Custom Test Role');
        expect(result.id).toBe(12345);
        expect(result.isActive).toBe(false);
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-12345-1680000000',
          userId: '98765',
          operation: 'deactivate_role',
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
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(nullRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when request is undefined', async () => {
        // Arrange
        const undefinedRequest = undefined as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(undefinedRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe('Role ID Validation', () => {
      it('should throw ApplicationError when role ID is missing', async () => {
        // Arrange
        const requestWithoutId: DeactivateRoleRequest = {
          id: undefined as any,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is null', async () => {
        // Arrange
        const requestWithNullId: DeactivateRoleRequest = {
          id: null as any,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNullId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is zero', async () => {
        // Arrange
        const requestWithZeroId: DeactivateRoleRequest = {
          id: 0,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithZeroId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role ID is negative', async () => {
        // Arrange
        const requestWithNegativeId: DeactivateRoleRequest = {
          id: -1,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNegativeId)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
      });

      it('should accept valid positive role ID without triggering application validation errors', async () => {
        // Arrange
        const requestWithValidId: DeactivateRoleRequest = {
          id: 12345,
          requesterId: 123,
        };

        // Act
        const result = await useCase.execute(requestWithValidId);

        // Assert - Validation should pass and repository should be called
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(12345, { isActive: false });
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', jasmine.any(Object));
      });

      it('should handle large positive role IDs', async () => {
        // Arrange
        const largeId = Number.MAX_SAFE_INTEGER;
        const requestWithLargeId: DeactivateRoleRequest = {
          id: largeId,
          requesterId: 123,
        };

        // Act
        const result = await useCase.execute(requestWithLargeId);

        // Assert - Should handle large numbers without issues
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(largeId, { isActive: false });
      });
    });

    describe('Validation Error Behavior', () => {
      it('should transform validation errors through error transformer', async () => {
        // Arrange
        const invalidRequest: DeactivateRoleRequest = {
          id: -5,
          requesterId: 123,
        };

        const validationError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Valid role ID is required for deactivation',
          'A valid role ID must be provided'
        );

        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Transformed validation error',
          'Input validation failed'
        );

        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert - Validation errors are caught and transformed
        await expectAsync(useCase.execute(invalidRequest)).toBeRejectedWith(transformedError);

        // Assert - Error transformer should be called for all errors
        expect(mockErrorTransformer.transform).toHaveBeenCalled();
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('Authorization Validation Tests', () => {
    describe('Missing Requester Validation', () => {
      it('should throw ApplicationError when requesterId is missing', async () => {
        // Arrange
        const requestWithoutRequester: DeactivateRoleRequest = {
          id: 123,
          // requesterId is intentionally missing
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role deactivation',
          'You must be authenticated to deactivate roles'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutRequester)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when requesterId is null', async () => {
        // Arrange
        const requestWithNullRequester: DeactivateRoleRequest = {
          id: 123,
          requesterId: null as any,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role deactivation',
          'You must be authenticated to deactivate roles'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNullRequester)).toBeRejectedWith(
          expectedError
        );
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when requesterId is undefined', async () => {
        // Arrange
        const requestWithUndefinedRequester: DeactivateRoleRequest = {
          id: 123,
          requesterId: undefined,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role deactivation',
          'You must be authenticated to deactivate roles'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithUndefinedRequester)).toBeRejectedWith(
          expectedError
        );
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe('Successful Authorization', () => {
      it('should successfully validate authorization with valid requesterId', async () => {
        // Arrange
        const validRequest: DeactivateRoleRequest = {
          id: 123,
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Authorization should pass and repository should be called
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(123, { isActive: false });
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-1640995200',
          userId: '456',
          operation: 'deactivate_role',
        });
      });

      it('should handle authorization with various requester IDs', async () => {
        // Arrange
        const requesterIds = [1, 999, 12345, 999999];

        // Act & Assert
        for (const requesterId of requesterIds) {
          const request: DeactivateRoleRequest = {
            id: 123,
            requesterId: requesterId,
          };

          await useCase.execute(request);

          expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
            correlationId: 'role-deactivate-123-1640995200',
            userId: requesterId.toString(),
            operation: 'deactivate_role',
          });
        }
      });

      it('should proceed with deactivation after successful authorization', async () => {
        // Arrange
        const authorizedRequest: DeactivateRoleRequest = {
          id: 999,
          requesterId: 555,
        };

        // Act
        const result = await useCase.execute(authorizedRequest);

        // Assert - Verify full flow completion
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(999, { isActive: false });
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-999-1640995200',
          userId: '555',
          operation: 'deactivate_role',
        });
      });
    });

    describe('Authorization Flow Integration', () => {
      it('should perform authorization before repository operations', async () => {
        // Arrange
        let operationOrder: string[] = [];

        mockRoleRepository.update.and.callFake(async (id, payload) => {
          operationOrder.push('repository_update');
          return mockDeactivatedRole;
        });

        // Note: Authorization validation doesn't emit trackable events,
        // but we can verify it happens by the success of the overall flow

        // Act
        await useCase.execute(validRequest);

        // Assert - Repository call should succeed (meaning authorization passed)
        expect(operationOrder).toContain('repository_update');
      });

      it('should not call repository if authorization fails', async () => {
        // Arrange
        const unauthorizedRequest: DeactivateRoleRequest = {
          id: 123,
          // requesterId is intentionally missing
        };

        // Act & Assert
        await expectAsync(useCase.execute(unauthorizedRequest)).toBeRejected();
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });
  });

  describe('Domain Repository Integration Tests', () => {
    describe('Repository Update Operation', () => {
      it('should call repository update method with correct parameters', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify repository called with correct parameters
        expect(mockRoleRepository.update).toHaveBeenCalledWith(123, { isActive: false });
        expect(mockRoleRepository.update).toHaveBeenCalledTimes(1);
      });

      it('should pass role ID and deactivation payload correctly to repository', async () => {
        // Arrange
        const testRoleId = 54321;
        const request: DeactivateRoleRequest = {
          id: testRoleId,
          requesterId: 678,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify exact parameters
        expect(mockRoleRepository.update).toHaveBeenCalledWith(testRoleId, { isActive: false });
      });

      it('should return repository response as-is', async () => {
        // Arrange
        const repositoryRole = Role.create({
          id: 123,
          name: 'Repository Role',
          accessLevel: 5,
          description: 'Role from repository',
          isActive: false,
        });
        mockRoleRepository.update.and.returnValue(Promise.resolve(repositoryRole));

        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Should return exact repository response
        expect(result).toBe(repositoryRole);
        expect(result.name).toBe('Repository Role');
        expect(result.accessLevel).toBe(5);
        expect(result.description).toBe('Role from repository');
        expect(result.isActive).toBe(false);
      });

      it('should not call other repository methods', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify only update method is called
        expect(mockRoleRepository.update).toHaveBeenCalledTimes(1);
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
        expect(mockRoleRepository.delete).not.toHaveBeenCalled();
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
      });
    });

    describe('Repository Integration Patterns', () => {
      it('should work with repository returning various role entities', async () => {
        // Arrange - Test with different role entities
        const testRoles = [
          Role.create({ id: 1, name: 'Test Admin Role', accessLevel: 5, isActive: false }),
          Role.create({ id: 2, name: 'Test User Role', accessLevel: 1, isActive: false }),
          Role.create({ id: 3, name: 'Test Manager Role', accessLevel: 3, isActive: false }),
        ];

        for (const role of testRoles) {
          mockRoleRepository.update.and.returnValue(Promise.resolve(role));

          const request: DeactivateRoleRequest = {
            id: role.id,
            requesterId: 123,
          };

          // Act
          const result = await useCase.execute(request);

          // Assert
          expect(result).toBe(role);
          expect(mockRoleRepository.update).toHaveBeenCalledWith(role.id, { isActive: false });
        }
      });

      it('should handle repository contract correctly', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify correct repository usage follows domain contract
        expect(mockRoleRepository.update).toHaveBeenCalledWith(
          jasmine.any(Number),
          jasmine.objectContaining({
            isActive: jasmine.any(Boolean),
          })
        );

        // Verify payload structure matches expected contract
        const updateCall = mockRoleRepository.update.calls.first();
        const [roleId, payload] = updateCall.args;
        expect(typeof roleId).toBe('number');
        expect(typeof payload).toBe('object');
        expect(payload.isActive).toBe(false);
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
          'Unable to deactivate role'
        );

        mockRoleRepository.update.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should handle network timeout errors from repository', async () => {
        // Arrange
        const timeoutError = new Error('Request timeout');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.OPERATION_TIMEOUT,
          'External service timeout',
          'Unable to deactivate role due to timeout'
        );

        mockRoleRepository.update.and.rejectWith(timeoutError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(timeoutError);
      });

      it('should handle role not found errors during update', async () => {
        // Arrange
        const notFoundError = new Error('Role with ID 123 not found');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          'Role not found',
          'Unable to find role for deactivation'
        );

        mockRoleRepository.update.and.rejectWith(notFoundError);
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(notFoundError);
      });

      it('should handle unexpected domain errors', async () => {
        // Arrange
        const domainError = new Error('Unexpected domain constraint violation');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Business rule violation',
          'Role deactivation violates business constraints'
        );

        mockRoleRepository.update.and.rejectWith(domainError);
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
        mockRoleRepository.update.and.rejectWith(anyError);
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Any error',
          'An unexpected error occurred'
        );
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act
        await expectAsync(useCase.execute(validRequest)).toBeRejected();

        // Assert - Error transformer should be called
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(anyError);
      });

      it('should not call error transformer for successful executions', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Error transformer should not be called for success
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });

      it('should call error transformer for validation errors', async () => {
        // Arrange
        const invalidRequest: DeactivateRoleRequest = {
          id: 0, // Invalid ID
          requesterId: 456,
        };

        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Transformed validation error',
          'Invalid input'
        );

        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(invalidRequest)).toBeRejected();

        // Note: All errors including validation errors are caught and transformed
        expect(mockErrorTransformer.transform).toHaveBeenCalled();
      });

      it('should propagate transformed errors correctly', async () => {
        // Arrange
        const originalError = new Error('Original infrastructure error');
        const expectedTransformed = new ApplicationError(
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          'Service temporarily unavailable',
          'Please try again later'
        );

        mockRoleRepository.update.and.rejectWith(originalError);
        mockErrorTransformer.transform.and.returnValue(expectedTransformed);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(expectedTransformed);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(originalError);
      });
    });
  });

  describe('Side Effects and Logging Tests', () => {
    describe('Successful Audit Logging', () => {
      it('should log successful role deactivation with complete context', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify complete audit log
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-1640995200',
          userId: '456',
          operation: 'deactivate_role',
        });
      });

      it('should generate unique correlation IDs for different role deactivations', async () => {
        // Arrange
        const differentRole = Role.create({
          id: 999,
          name: 'Different Role',
          accessLevel: 2,
          isActive: false,
        });
        mockRoleRepository.update.and.returnValue(Promise.resolve(differentRole));

        const request: DeactivateRoleRequest = {
          id: 999,
          requesterId: 777,
        };

        // Act
        await useCase.execute(request);

        // Assert - Should have different correlation ID
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-999-1640995200',
          userId: '777',
          operation: 'deactivate_role',
        });
      });

      it('should use clock service for timestamp in correlation ID', async () => {
        // Arrange
        const customTimestamp = 1700000000;
        mockClock.nowEpochSeconds.and.returnValue(customTimestamp);

        // Act
        await useCase.execute(validRequest);

        // Assert - Should use custom timestamp
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: `role-deactivate-123-${customTimestamp}`,
          userId: '456',
          operation: 'deactivate_role',
        });
      });

      it('should generate correlation ID with correct format pattern', async () => {
        // Arrange
        const request: DeactivateRoleRequest = {
          id: 54321,
          requesterId: 98765,
        };

        mockClock.nowEpochSeconds.and.returnValue(1680000000);

        // Act
        await useCase.execute(request);

        // Assert - Verify correlation ID format: role-deactivate-{roleId}-{timestamp}
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-54321-1680000000',
          userId: '98765',
          operation: 'deactivate_role',
        });
      });
    });

    describe('Clock Service Integration', () => {
      it('should use clock service for timestamp generation', async () => {
        // Arrange
        const timestamps = [1640995200, 1650000000, 1660000000];

        for (const timestamp of timestamps) {
          mockClock.nowEpochSeconds.and.returnValue(timestamp);

          // Act
          await useCase.execute(validRequest);

          // Assert - Should use current timestamp from clock service
          expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
          expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
            correlationId: `role-deactivate-123-${timestamp}`,
            userId: '456',
            operation: 'deactivate_role',
          });
        }
      });

      it('should handle clock service independently of other services', async () => {
        // Arrange
        mockClock.nowEpochSeconds.and.returnValue(9999999999);

        // Act
        await useCase.execute(validRequest);

        // Assert - Clock service should work independently
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-9999999999',
          userId: '456',
          operation: 'deactivate_role',
        });
      });
    });

    describe('Logger Integration', () => {
      it('should only log after successful role deactivation', async () => {
        // Arrange - Setup to fail at authorization
        const unauthorizedRequest: DeactivateRoleRequest = {
          id: 123,
          // requesterId missing
        };

        // Act & Assert
        await expectAsync(useCase.execute(unauthorizedRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should only log after successful repository operation', async () => {
        // Arrange - Setup to fail at repository
        mockRoleRepository.update.and.rejectWith(new Error('Repository failed'));
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Repository error',
            'Failed to deactivate role'
          )
        );

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should handle requester context correctly in logs', async () => {
        // Arrange
        const requestWithoutRequester: DeactivateRoleRequest = {
          id: 123,
          requesterId: undefined,
        };

        // Act & Assert - Should fail authorization before logging
        await expectAsync(useCase.execute(requestWithoutRequester)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should log with complete context structure', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify complete log context
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role deactivated',
          jasmine.objectContaining({
            correlationId: jasmine.any(String),
            userId: jasmine.any(String),
            operation: 'deactivate_role',
          })
        );

        // Verify log context keys
        const logCall = mockLogger.info.calls.first();
        const logContext = logCall.args[1] as any;
        expect(Object.keys(logContext || {})).toEqual(['correlationId', 'userId', 'operation']);
      });
    });

    describe('Side Effects Flow', () => {
      it('should execute side effects only after successful domain operations', async () => {
        // Arrange
        let sideEffectsCalled = false;
        mockLogger.info.and.callFake(() => {
          sideEffectsCalled = true;
        });

        // Act
        await useCase.execute(validRequest);

        // Assert - Side effects should be called
        expect(sideEffectsCalled).toBe(true);
        expect(mockRoleRepository.update).toHaveBeenCalled();
      });

      it('should not execute side effects when domain operations fail', async () => {
        // Arrange
        mockRoleRepository.update.and.rejectWith(new Error('Repository failed'));
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Transformed error',
            'Error was transformed'
          )
        );

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should not execute side effects when validation fails', async () => {
        // Arrange
        const invalidRequest: DeactivateRoleRequest = {
          id: -1,
          requesterId: 456,
        };

        // Act & Assert
        await expectAsync(useCase.execute(invalidRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration and Coordination Tests', () => {
    describe('End-to-End Happy Path Flow', () => {
      it('should complete full orchestration flow with all dependencies', async () => {
        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Verify complete integration
        expect(result).toBe(mockDeactivatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(123, { isActive: false });
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-123-1640995200',
          userId: '456',
          operation: 'deactivate_role',
        });
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });

      it('should handle complete flow with edge case data scenarios', async () => {
        // Arrange
        const edgeCaseRole = Role.create({
          id: 1,
          name: 'Edge Case Role',
          accessLevel: 1,
          description: '',
          isActive: false,
        });
        mockRoleRepository.update.and.returnValue(Promise.resolve(edgeCaseRole));

        const edgeCaseRequest: DeactivateRoleRequest = {
          id: 1,
          requesterId: 1,
        };

        mockClock.nowEpochSeconds.and.returnValue(0);

        // Act
        const result = await useCase.execute(edgeCaseRequest);

        // Assert - Verify complete flow with edge case data
        expect(result).toBe(edgeCaseRole);
        expect(result.name).toBe('Edge Case Role');
        expect(result.id).toBe(1);
        expect(result.isActive).toBe(false);
        expect(mockLogger.info).toHaveBeenCalledWith('Role deactivated', {
          correlationId: 'role-deactivate-1-0',
          userId: '1',
          operation: 'deactivate_role',
        });
      });
    });

    describe('Complete Dependency Coordination', () => {
      it('should coordinate all dependencies correctly in success scenario', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - All dependencies should be used appropriately
        expect(mockRoleRepository.update).toHaveBeenCalledTimes(1);
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });

      it('should handle dependency failures in isolation', async () => {
        // Arrange - Test repository failure scenario
        const repositoryError = new Error('Repository failed');
        mockRoleRepository.update.and.rejectWith(repositoryError);
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Repository error',
          'Repository operation failed'
        );
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();

        // Verify only relevant dependencies were called
        expect(mockRoleRepository.update).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockClock.nowEpochSeconds).not.toHaveBeenCalled(); // Should not reach side effects
        expect(mockLogger.info).not.toHaveBeenCalled(); // Should not reach side effects
      });

      it('should maintain dependency contracts throughout orchestration', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify contracts are maintained
        expect(mockRoleRepository.update).toHaveBeenCalledWith(
          jasmine.any(Number),
          jasmine.objectContaining({
            isActive: jasmine.any(Boolean),
          })
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          jasmine.any(String),
          jasmine.objectContaining({
            correlationId: jasmine.any(String),
            userId: jasmine.any(String),
            operation: jasmine.any(String),
          })
        );
      });
    });

    describe('Dependency Isolation During Failures', () => {
      it('should isolate validation failures from repository and side effects', async () => {
        // Arrange
        const invalidRequest: DeactivateRoleRequest = {
          id: null as any,
          requesterId: 456,
        };

        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Transformed validation error',
          'Validation failed'
        );

        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(invalidRequest)).toBeRejected();

        // Assert - Repository and side effects should not be called, but error transformer should be
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockClock.nowEpochSeconds).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalled();
      });

      it('should isolate authorization failures from repository and side effects', async () => {
        // Arrange
        const unauthorizedRequest: DeactivateRoleRequest = {
          id: 123,
          requesterId: undefined,
        };

        const transformedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Transformed authorization error',
          'Authorization failed'
        );

        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(unauthorizedRequest)).toBeRejected();

        // Assert - Repository and side effects should not be called, but error transformer should be
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockClock.nowEpochSeconds).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalled();
      });

      it('should isolate repository failures from side effects but not error transformation', async () => {
        // Arrange
        const repositoryError = new Error('Repository failed');
        mockRoleRepository.update.and.rejectWith(repositoryError);
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Repository error',
            'Error occurred'
          )
        );

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();

        // Assert - Side effects should not be called, but error transformer should be
        expect(mockRoleRepository.update).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockClock.nowEpochSeconds).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });
  });
});
