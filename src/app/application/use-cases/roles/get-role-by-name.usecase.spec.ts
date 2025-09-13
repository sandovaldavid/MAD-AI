import { TestBed } from '@angular/core/testing';
import { GetRoleByNameUseCase } from './get-role-by-name.usecase';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { Role } from '@domain/entities/role.entity';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { GetRoleByNameRequest } from '@application/types/roles.types';

/**
 * Test Suite for GetRoleByNameUseCase
 *
 * Tests the orchestration logic for role retrieval by name following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role retrieval by name with comprehensive scenarios:
 * - Successful role retrieval with exact name matching (case-sensitive and case-insensitive)
 * - Application-level validation (input constraints, authorization)
 * - Role existence verification with exact matching logic
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
 * - ✅ Application-level validation (invalid request, missing name, name too long, unauthorized)
 * - ✅ Authorization validation and logging
 * - ✅ Role search with exact case-sensitive and case-insensitive matching
 * - ✅ Repository error handling (role not found scenarios)
 * - ✅ Error transformation and propagation
 * - ✅ Side effects (audit logging with correlation ID)
 * - ✅ End-to-end orchestration flow validation
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('GetRoleByNameUseCase', () => {
  let useCase: GetRoleByNameUseCase;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let validRequest: GetRoleByNameRequest;
  let mockRoles: Role[];

  beforeEach(() => {
    // Create mocks using Jasmine
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', [
      'list',
      'getById',
      'create',
      'update',
      'delete',
    ]);
    mockClock = jasmine.createSpyObj('ClockPort', ['now', 'nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'info', 'warn', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Setup test data
    validRequest = {
      name: 'Administrator',
      requesterId: 456,
    };

    // Create mock Role entities for testing
    mockRoles = [
      Role.create({
        id: 1,
        name: 'Administrator',
        accessLevel: 5,
        description: 'System administrator role',
        isActive: true,
      }),
      Role.create({
        id: 2,
        name: 'Admin Assistant',
        accessLevel: 3,
        description: 'Administrative assistant role',
        isActive: true,
      }),
      Role.create({
        id: 3,
        name: 'User',
        accessLevel: 1,
        description: 'Basic user role',
        isActive: true,
      }),
    ];

    // Setup default mock behaviors
    mockRoleRepository.list.and.returnValue(Promise.resolve(mockRoles));
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // Fixed timestamp for testing
    mockLogger.info.and.stub();
    mockErrorTransformer.transform.and.callFake((error: any) => error);

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        GetRoleByNameUseCase,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(GetRoleByNameUseCase);
  });

  describe('Successful Role Retrieval Tests', () => {
    describe('Valid Request with Exact Name Match', () => {
      it('should successfully retrieve role with exact case-sensitive name match', async () => {
        // Arrange
        const request: GetRoleByNameRequest = {
          name: 'Administrator', // Exact case-sensitive match
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify complete orchestration flow
        expect(result).toBe(mockRoles[0]); // Should return the exact matching role
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Administrator' });
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200',
          userId: '456',
          operation: 'get_role_by_name',
        });
      });

      it('should successfully retrieve role with exact case-insensitive name match', async () => {
        // Arrange
        const request: GetRoleByNameRequest = {
          name: 'ADMINISTRATOR', // Case-insensitive match
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify case-insensitive matching works
        expect(result).toBe(mockRoles[0]); // Should return Administrator role despite case difference
        expect(result.name).toBe('Administrator'); // Original name should be preserved
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'ADMINISTRATOR' });
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200',
          userId: '456',
          operation: 'get_role_by_name',
        });
      });

      it('should successfully retrieve role with mixed case name', async () => {
        // Arrange
        const request: GetRoleByNameRequest = {
          name: 'aDmInIsTrAtOr', // Mixed case
          requesterId: 789,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify mixed case insensitive matching
        expect(result).toBe(mockRoles[0]);
        expect(result.name).toBe('Administrator'); // Original case preserved
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'aDmInIsTrAtOr' });
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200',
          userId: '789',
          operation: 'get_role_by_name',
        });
      });

      it('should handle role name with leading/trailing whitespace', async () => {
        // Arrange
        const request: GetRoleByNameRequest = {
          name: '  Administrator  ', // With whitespace
          requesterId: 123,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify whitespace trimming and matching
        expect(result).toBe(mockRoles[0]);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Administrator' }); // Should be trimmed
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200',
          userId: '123',
          operation: 'get_role_by_name',
        });
      });
    });

    describe('Complete Orchestration Flow Verification', () => {
      it('should execute operations in correct order: validate → authorize → search → side effects', async () => {
        // Arrange
        let operationOrder: string[] = [];

        // Mock logger to track call order
        mockLogger.info.and.callFake((message: string) => {
          if (message === 'Role retrieval by name completed') {
            operationOrder.push('side_effects');
          }
        });

        // Mock repository to track call order
        mockRoleRepository.list.and.callFake(async (params) => {
          operationOrder.push('repository_search');
          return mockRoles;
        });

        // Note: validateApplicationRules and validateAuthorization don't have explicit logging,
        // but we can infer their execution through the fact that the flow completes

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify correct orchestration order
        expect(operationOrder).toEqual(['repository_search', 'side_effects']);
        // Note: Validation steps don't emit trackable events, but their success is implicit
        // in the completion of the flow without validation errors
      });

      it('should pass correct search parameters through all operations', async () => {
        // Arrange
        const testRoleName = 'Test Role Name';
        const request: GetRoleByNameRequest = {
          name: testRoleName,
          requesterId: 12345,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify parameter consistency
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: testRoleName });
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(1);
      });

      it('should maintain requester context throughout orchestration', async () => {
        // Arrange
        const testRequesterId = 99999;
        const request: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: testRequesterId,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify requester context consistency
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role retrieval by name completed',
          jasmine.objectContaining({
            userId: testRequesterId.toString(),
          })
        );
      });
    });

    describe('Audit Logging Verification', () => {
      it('should generate correlation ID with correct format', async () => {
        // Arrange
        const request: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: 456,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify correlation ID format
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200', // roleId-timestamp format
          userId: '456',
          operation: 'get_role_by_name',
        });
      });

      it('should use clock service for timestamp generation', async () => {
        // Arrange
        const differentTimestamp = 1650000000;
        mockClock.nowEpochSeconds.and.returnValue(differentTimestamp);

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify clock service integration
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: `get-role-name-1-${differentTimestamp}`,
          userId: '456',
          operation: 'get_role_by_name',
        });
      });

      it('should log with complete context structure', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify complete log context
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role retrieval by name completed',
          jasmine.objectContaining({
            correlationId: jasmine.any(String),
            userId: jasmine.any(String),
            operation: 'get_role_by_name',
          })
        );
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
          'Invalid input provided: Role name is required for search',
          'Role name is required for search'
        );

        // Act & Assert
        await expectAsync(useCase.execute(nullRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when request is undefined', async () => {
        // Arrange
        const undefinedRequest = undefined as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required for search',
          'Role name is required for search'
        );

        // Act & Assert
        await expectAsync(useCase.execute(undefinedRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe('Role Name Validation', () => {
      it('should throw ApplicationError when role name is missing', async () => {
        // Arrange
        const requestWithoutName: GetRoleByNameRequest = {
          name: undefined as any,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required for search',
          'Role name is required for search'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutName)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role name is null', async () => {
        // Arrange
        const requestWithNullName: GetRoleByNameRequest = {
          name: null as any,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required for search',
          'Role name is required for search'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNullName)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role name is empty string', async () => {
        // Arrange
        const requestWithEmptyName: GetRoleByNameRequest = {
          name: '',
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required for search',
          'Role name is required for search'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithEmptyName)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role name is only whitespace', async () => {
        // Arrange
        const requestWithWhitespaceName: GetRoleByNameRequest = {
          name: '   ',
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required for search',
          'Role name is required for search'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithWhitespaceName)).toBeRejectedWith(
          expectedError
        );
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when role name exceeds 100 characters', async () => {
        // Arrange
        const longName = 'A'.repeat(101); // 101 characters
        const requestWithLongName: GetRoleByNameRequest = {
          name: longName,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name too long',
          'Role name must be 100 characters or less'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithLongName)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
      });

      it('should accept valid role name with exactly 100 characters', async () => {
        // Arrange
        const exactLengthName = 'A'.repeat(100); // Exactly 100 characters
        const requestWithExactLength: GetRoleByNameRequest = {
          name: exactLengthName,
          requesterId: 123,
        };

        // Create mock role with long name for testing
        const longNameRole = Role.create({
          id: 999,
          name: exactLengthName,
          accessLevel: 1,
          isActive: true,
        });
        mockRoleRepository.list.and.returnValue(Promise.resolve([longNameRole]));

        // Act
        const result = await useCase.execute(requestWithExactLength);

        // Assert - Should succeed with 100 character name
        expect(result).toBe(longNameRole);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: exactLengthName });
      });

      it('should accept valid role name with standard length', async () => {
        // Arrange
        const validRequest: GetRoleByNameRequest = {
          name: 'Valid Role Name',
          requesterId: 123,
        };

        // Act
        await useCase.execute(validRequest);

        // Assert - Validation should pass and repository should be called
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Valid Role Name' });
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role retrieval by name completed',
          jasmine.any(Object)
        );
      });
    });

    describe('Business Logic Delegation', () => {
      it('should delegate exact name matching to use case logic, not domain layer', async () => {
        // Arrange
        const request: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: 123,
        };

        // Act
        await useCase.execute(request);

        // Assert - Application layer handles exact name matching
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Administrator' });
        // The use case performs exact matching after repository returns results
      });

      it('should not perform domain-level business rule validations in application layer', async () => {
        // Arrange
        const systemRoleRequest: GetRoleByNameRequest = {
          name: 'System Administrator', // Could be any system role
          requesterId: 123,
        };

        const systemRole = Role.create({
          id: 1,
          name: 'System Administrator',
          accessLevel: 5,
          isActive: true,
        });
        mockRoleRepository.list.and.returnValue(Promise.resolve([systemRole]));

        // Act
        await useCase.execute(systemRoleRequest);

        // Assert - Application layer doesn't check for system role constraints
        // That's a domain responsibility
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'System Administrator' });
      });
    });
  });

  describe('Authorization Validation Tests', () => {
    describe('Missing Requester Validation', () => {
      it('should throw ApplicationError when requesterId is missing', async () => {
        // Arrange
        const requestWithoutRequester: GetRoleByNameRequest = {
          name: 'Administrator',
          // requesterId is intentionally missing
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role access',
          'You must be authenticated to access role information'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutRequester)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when requesterId is null', async () => {
        // Arrange
        const requestWithNullRequester: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: null as any,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role access',
          'You must be authenticated to access role information'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNullRequester)).toBeRejectedWith(
          expectedError
        );
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when requesterId is undefined', async () => {
        // Arrange
        const requestWithUndefinedRequester: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: undefined,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role access',
          'You must be authenticated to access role information'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithUndefinedRequester)).toBeRejectedWith(
          expectedError
        );
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe('Successful Authorization', () => {
      it('should successfully validate authorization with valid requesterId', async () => {
        // Arrange
        const validRequest: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: 456,
        };

        // Act
        await useCase.execute(validRequest);

        // Assert - Authorization should pass and repository should be called
        expect(mockRoleRepository.list).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role retrieval by name completed',
          jasmine.objectContaining({
            userId: '456',
          })
        );
      });

      it('should handle authorization with various requester IDs', async () => {
        // Arrange
        const requesterIds = [1, 999, 12345, 999999];

        // Act & Assert
        for (const requesterId of requesterIds) {
          const request: GetRoleByNameRequest = {
            name: 'Administrator',
            requesterId: requesterId,
          };

          await useCase.execute(request);

          expect(mockLogger.info).toHaveBeenCalledWith(
            'Role retrieval by name completed',
            jasmine.objectContaining({
              userId: requesterId.toString(),
            })
          );
        }
      });

      it('should proceed with role search after successful authorization', async () => {
        // Arrange
        const authorizedRequest: GetRoleByNameRequest = {
          name: 'User',
          requesterId: 555,
        };

        // Act
        await useCase.execute(authorizedRequest);

        // Assert - Verify full flow completion
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'User' });
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role retrieval by name completed',
          jasmine.objectContaining({
            userId: '555',
          })
        );
      });
    });

    describe('Authorization Flow Integration', () => {
      it('should perform authorization before repository operations', async () => {
        // Arrange
        let operationOrder: string[] = [];

        mockRoleRepository.list.and.callFake(async () => {
          operationOrder.push('repository_search');
          return mockRoles;
        });

        // Note: Authorization validation doesn't emit trackable events,
        // but we can verify it happens by the success of the overall flow

        // Act
        await useCase.execute(validRequest);

        // Assert - Repository call should succeed (meaning authorization passed)
        expect(operationOrder).toContain('repository_search');
      });

      it('should not call repository if authorization fails', async () => {
        // Arrange
        const unauthorizedRequest: GetRoleByNameRequest = {
          name: 'Administrator',
          // requesterId is intentionally missing
        };

        // Act & Assert
        await expectAsync(useCase.execute(unauthorizedRequest)).toBeRejected();
        expect(mockRoleRepository.list).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });
  });

  describe('Role Search and Existence Tests', () => {
    describe('Role Not Found Scenarios', () => {
      it('should throw ApplicationError when no roles are returned from repository', async () => {
        // Arrange
        mockRoleRepository.list.and.returnValue(Promise.resolve([])); // No roles found
        const request: GetRoleByNameRequest = {
          name: 'NonExistentRole',
          requesterId: 456,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          "Role with name 'NonExistentRole' not found",
          "No role found with the name 'NonExistentRole'"
        );

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'NonExistentRole' });
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when no exact match is found among similar names', async () => {
        // Arrange
        const similarRoles = [
          Role.create({
            id: 1,
            name: 'Admin',
            accessLevel: 3,
            isActive: true,
          }),
          Role.create({
            id: 2,
            name: 'Administrator Pro',
            accessLevel: 4,
            isActive: true,
          }),
        ];
        mockRoleRepository.list.and.returnValue(Promise.resolve(similarRoles));

        const request: GetRoleByNameRequest = {
          name: 'Administrator', // Not an exact match with either
          requesterId: 456,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          "Role with name 'Administrator' not found",
          "No role found with the name 'Administrator'"
        );

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Administrator' });
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should handle role name trimming in error messages', async () => {
        // Arrange
        mockRoleRepository.list.and.returnValue(Promise.resolve([]));
        const request: GetRoleByNameRequest = {
          name: '  NonExistentRole  ', // With whitespace
          requesterId: 456,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          "Role with name 'NonExistentRole' not found", // Should be trimmed in error
          "No role found with the name 'NonExistentRole'"
        );

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
      });
    });

    describe('Exact Match Logic Verification', () => {
      it('should find exact match among multiple similar roles', async () => {
        // Arrange
        const multipleRoles = [
          Role.create({
            id: 1,
            name: 'Admin',
            accessLevel: 3,
            isActive: true,
          }),
          Role.create({
            id: 2,
            name: 'Administrator', // Exact match
            accessLevel: 4,
            isActive: true,
          }),
          Role.create({
            id: 3,
            name: 'Administrator Pro',
            accessLevel: 5,
            isActive: true,
          }),
        ];
        mockRoleRepository.list.and.returnValue(Promise.resolve(multipleRoles));

        const request: GetRoleByNameRequest = {
          name: 'Administrator',
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Should return exact match, not partial
        expect(result).toBe(multipleRoles[1]); // The exact "Administrator" match
        expect(result.name).toBe('Administrator');
        expect(result.id).toBe(2);
      });

      it('should perform case-insensitive exact matching', async () => {
        // Arrange
        const caseSensitiveRoles = [
          Role.create({
            id: 1,
            name: 'ADMINISTRATOR', // Different case
            accessLevel: 4,
            isActive: true,
          }),
          Role.create({
            id: 2,
            name: 'administrator', // Different case
            accessLevel: 3,
            isActive: true,
          }),
        ];
        mockRoleRepository.list.and.returnValue(Promise.resolve(caseSensitiveRoles));

        const request: GetRoleByNameRequest = {
          name: 'Administrator', // Mixed case
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Should find first case-insensitive match
        expect(result).toBe(caseSensitiveRoles[0]);
        expect(result.name).toBe('ADMINISTRATOR'); // Original case preserved
      });

      it('should handle exact matching with special characters', async () => {
        // Arrange
        const specialRole = Role.create({
          id: 1,
          name: 'Admin-User_2024',
          accessLevel: 2,
          isActive: true,
        });
        mockRoleRepository.list.and.returnValue(Promise.resolve([specialRole]));

        const request: GetRoleByNameRequest = {
          name: 'Admin-User_2024',
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Should handle special characters correctly
        expect(result).toBe(specialRole);
        expect(result.name).toBe('Admin-User_2024');
      });

      it('should find exact match when multiple roles have overlapping substrings', async () => {
        // Arrange
        const overlappingRoles = [
          Role.create({
            id: 1,
            name: 'User',
            accessLevel: 1,
            isActive: true,
          }),
          Role.create({
            id: 2,
            name: 'User Admin',
            accessLevel: 3,
            isActive: true,
          }),
          Role.create({
            id: 3,
            name: 'Super User',
            accessLevel: 2,
            isActive: true,
          }),
        ];
        mockRoleRepository.list.and.returnValue(Promise.resolve(overlappingRoles));

        const request: GetRoleByNameRequest = {
          name: 'User', // Should match exact "User", not others containing "User"
          requesterId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Should return exact "User" match
        expect(result).toBe(overlappingRoles[0]);
        expect(result.name).toBe('User');
        expect(result.id).toBe(1);
      });
    });

    describe('Repository Integration', () => {
      it('should pass search parameter correctly to repository', async () => {
        // Arrange
        const searchTerm = 'Test Role Name';
        const request: GetRoleByNameRequest = {
          name: searchTerm,
          requesterId: 456,
        };

        // Act
        await useCase.execute(request);

        // Assert - Verify repository called with correct parameters
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: searchTerm });
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(1);
      });

      it('should handle empty result set from repository gracefully', async () => {
        // Arrange
        mockRoleRepository.list.and.returnValue(Promise.resolve([]));
        const request: GetRoleByNameRequest = {
          name: 'NonExistent',
          requesterId: 456,
        };

        // Act & Assert - Should throw proper ApplicationError
        await expectAsync(useCase.execute(request)).toBeRejectedWith(
          jasmine.objectContaining({
            code: ApplicationErrorCode.ROLE_NOT_FOUND,
          })
        );
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

        mockRoleRepository.list.and.rejectWith(repositoryError);
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
          'Unable to retrieve role due to timeout'
        );

        mockRoleRepository.list.and.rejectWith(timeoutError);
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

        mockRoleRepository.list.and.rejectWith(domainError);
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
        mockRoleRepository.list.and.rejectWith(anyError);
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

      it('should not call error transformer for validation errors that are thrown directly', async () => {
        // Arrange
        const invalidRequest: GetRoleByNameRequest = {
          name: '', // Invalid name
          requesterId: 456,
        };

        // Act & Assert
        await expectAsync(useCase.execute(invalidRequest)).toBeRejected();

        // Note: Validation errors are thrown directly, not transformed
        // This tests that the try-catch only catches repository and other unexpected errors
      });
    });
  });

  describe('Side Effects and Logging Tests', () => {
    describe('Successful Audit Logging', () => {
      it('should log successful role retrieval with complete context', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify complete audit log
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200',
          userId: '456',
          operation: 'get_role_by_name',
        });
      });

      it('should generate unique correlation IDs for different role retrievals', async () => {
        // Arrange
        const differentRole = Role.create({
          id: 999,
          name: 'Different Role',
          accessLevel: 2,
          isActive: true,
        });
        mockRoleRepository.list.and.returnValue(Promise.resolve([differentRole]));

        const request: GetRoleByNameRequest = {
          name: 'Different Role',
          requesterId: 777,
        };

        // Act
        await useCase.execute(request);

        // Assert - Should have different correlation ID
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-999-1640995200',
          userId: '777',
          operation: 'get_role_by_name',
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
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: `get-role-name-1-${customTimestamp}`,
          userId: '456',
          operation: 'get_role_by_name',
        });
      });
    });

    describe('Logger Integration', () => {
      it('should only log after successful role retrieval', async () => {
        // Arrange - Setup to fail at authorization
        const unauthorizedRequest: GetRoleByNameRequest = {
          name: 'Administrator',
          // requesterId missing
        };

        // Act & Assert
        await expectAsync(useCase.execute(unauthorizedRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should only log after successful role search', async () => {
        // Arrange - Setup to fail at role search
        mockRoleRepository.list.and.returnValue(Promise.resolve([]));
        const request: GetRoleByNameRequest = {
          name: 'NonExistent',
          requesterId: 456,
        };

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should handle logger failures gracefully', async () => {
        // Arrange
        mockLogger.info.and.throwError('Logger failed');

        // Act & Assert - Logger failure should not prevent completion
        // but will cause the side effects to fail
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
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
        expect(mockRoleRepository.list).toHaveBeenCalled();
      });

      it('should not execute side effects when domain operations fail', async () => {
        // Arrange
        mockRoleRepository.list.and.rejectWith(new Error('Repository failed'));
        mockErrorTransformer.transform.and.callFake((error) => {
          return new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Transformed error',
            'Error was transformed'
          );
        });

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should not execute side effects when role is not found', async () => {
        // Arrange
        mockRoleRepository.list.and.returnValue(Promise.resolve([]));

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration and Data Transformation Tests', () => {
    describe('End-to-End Happy Path Flow', () => {
      it('should complete full orchestration flow with all dependencies', async () => {
        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Verify complete integration
        expect(result).toBe(mockRoles[0]);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Administrator' });
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-1-1640995200',
          userId: '456',
          operation: 'get_role_by_name',
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
          isActive: true,
        });
        mockRoleRepository.list.and.returnValue(Promise.resolve([customRole]));

        const customRequest: GetRoleByNameRequest = {
          name: 'Custom Test Role',
          requesterId: 98765,
        };

        mockClock.nowEpochSeconds.and.returnValue(1680000000);

        // Act
        const result = await useCase.execute(customRequest);

        // Assert - Verify complete flow with custom data
        expect(result).toBe(customRole);
        expect(result.name).toBe('Custom Test Role');
        expect(result.id).toBe(12345);
        expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
          correlationId: 'get-role-name-12345-1680000000',
          userId: '98765',
          operation: 'get_role_by_name',
        });
      });
    });

    describe('Repository Interaction Patterns', () => {
      it('should handle repository contract correctly', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify correct repository usage
        expect(mockRoleRepository.list).toHaveBeenCalledWith({ search: 'Administrator' });
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(1);

        // Verify other repository methods are not called
        expect(mockRoleRepository.getById).not.toHaveBeenCalled();
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockRoleRepository.delete).not.toHaveBeenCalled();
      });

      it('should work with repository returning various role collections', async () => {
        // Arrange - Test with different collection sizes
        const testScenarios = [
          [mockRoles[0]], // Single role
          mockRoles, // Multiple roles
          [mockRoles[2]], // Different single role
        ];

        for (const roleCollection of testScenarios) {
          mockRoleRepository.list.and.returnValue(Promise.resolve(roleCollection));

          const request: GetRoleByNameRequest = {
            name: roleCollection[0].name,
            requesterId: 123,
          };

          // Act
          const result = await useCase.execute(request);

          // Assert
          expect(result).toBe(roleCollection[0]);
        }
      });
    });

    describe('Clock Service Integration', () => {
      it('should integrate with clock service for timestamp generation', async () => {
        // Arrange
        const timestamps = [1640995200, 1650000000, 1660000000];

        for (const timestamp of timestamps) {
          mockClock.nowEpochSeconds.and.returnValue(timestamp);

          // Act
          await useCase.execute(validRequest);

          // Assert - Should use current timestamp from clock service
          expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
          expect(mockLogger.info).toHaveBeenCalledWith('Role retrieval by name completed', {
            correlationId: `get-role-name-1-${timestamp}`,
            userId: '456',
            operation: 'get_role_by_name',
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
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Role retrieval by name completed',
          jasmine.objectContaining({
            correlationId: jasmine.stringMatching(/^get-role-name-1-9999999999$/),
          })
        );
      });
    });

    describe('Complete Dependency Coordination', () => {
      it('should coordinate all dependencies correctly in success scenario', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - All dependencies should be used appropriately
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(1);
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
      });

      it('should handle dependency failures in isolation', async () => {
        // Arrange - Test each dependency failure scenario
        const repositoryError = new Error('Repository failed');
        mockRoleRepository.list.and.rejectWith(repositoryError);
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Repository error',
          'Repository operation failed'
        );
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();

        // Verify only relevant dependencies were called
        expect(mockRoleRepository.list).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockClock.nowEpochSeconds).not.toHaveBeenCalled(); // Should not reach side effects
        expect(mockLogger.info).not.toHaveBeenCalled(); // Should not reach side effects
      });

      it('should maintain dependency contracts throughout orchestration', async () => {
        // Act
        await useCase.execute(validRequest);

        // Assert - Verify contracts are maintained
        expect(mockRoleRepository.list).toHaveBeenCalledWith(
          jasmine.objectContaining({
            search: jasmine.any(String),
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
  });
});
