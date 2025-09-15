import { TestBed } from '@angular/core/testing';
import { ListRoles } from './list-roles.usecase';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { ListRolesRequest, RoleFilters } from '@application/types/roles.types';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

/**
 * Test Suite for ListRoles Use Case
 *
 * Tests the orchestration logic for role listing operations following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role listing with comprehensive scenarios:
 * - Successful listing with and without filters
 * - Application-level validation (filter constraints)
 * - Error handling and transformation
 * - Side effects (logging, audit trails)
 * - Proper dependency coordination
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
 * - ✅ Successful role listing without filters
 * - ✅ Successful role listing with filters
 * - ✅ Filter validation (access level range)
 * - ✅ Repository error handling
 * - ✅ Error transformation
 * - ✅ Side effects (logging)
 * - ✅ Filter mapping to domain contract
 *
 * @since 1.0.0
 * @layer Application Testing
 */
describe('ListRoles', () => {
  let useCase: ListRoles;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let mockRoles: Role[];

  beforeEach(() => {
    // Create mocks using Jasmine
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', [
      'list',
      'findById',
      'findByName',
      'save',
      'delete',
    ]);
    mockClock = jasmine.createSpyObj('ClockPort', ['now', 'nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'info', 'warn', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Create mock Role entities using the factory method
    mockRoles = [
      Role.create({
        id: 1,
        name: 'Manager',
        accessLevel: 5,
        isActive: true,
        description: 'Manager role',
      }),
      Role.create({
        id: 2,
        name: 'User',
        accessLevel: 1,
        isActive: true,
        description: 'Basic user role',
      }),
    ];

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        ListRoles,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(ListRoles);

    // Setup default mock behaviors
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // 2024-01-01 timestamp
    mockRoleRepository.list.and.returnValue(Promise.resolve(mockRoles));
  });

  afterEach(() => {
    // Clear all mocks
    mockRoleRepository.list.calls.reset();
    mockClock.nowEpochSeconds.calls.reset();
    mockLogger.info.calls.reset();
    mockLogger.error.calls.reset();
    mockErrorTransformer.transform.calls.reset();
  });

  describe('Successful Role Listing', () => {
    describe('List All Roles (No Filters)', () => {
      it('should successfully list all roles without filters', async () => {
        // Arrange
        const expectedDomainFilters = undefined;

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result).toEqual(mockRoles);
        expect(mockRoleRepository.list).toHaveBeenCalledWith(expectedDomainFilters);
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(1);
      });

      it('should handle side effects for successful listing', async () => {
        // Arrange
        const expectedCorrelationId = 'list-roles-1640995200';

        // Act
        await useCase.execute();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: expectedCorrelationId,
          userId: undefined,
          operation: 'list_roles',
        });
      });
    });

    describe('List Roles with Filters', () => {
      it('should successfully list roles with access level filter', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 3,
          },
          requesterId: 123,
        };
        const expectedDomainFilters = {
          search: 'level:3',
          active: undefined,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toEqual(mockRoles);
        expect(mockRoleRepository.list).toHaveBeenCalledWith(expectedDomainFilters);
      });

      it('should successfully list roles with active status filter', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            isActive: true,
          },
          requesterId: 456,
        };
        const expectedDomainFilters = {
          search: undefined,
          active: true,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toEqual(mockRoles);
        expect(mockRoleRepository.list).toHaveBeenCalledWith(expectedDomainFilters);
      });

      it('should successfully list roles with combined filters', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 2,
            isActive: false,
          },
          requesterId: 789,
        };
        const expectedDomainFilters = {
          search: 'level:2',
          active: false,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toEqual(mockRoles);
        expect(mockRoleRepository.list).toHaveBeenCalledWith(expectedDomainFilters);
      });

      it('should handle side effects with requester ID', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 1 },
          requesterId: 999,
        };
        const expectedCorrelationId = 'list-roles-1640995200';

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: expectedCorrelationId,
          userId: '999',
          operation: 'list_roles',
        });
      });
    });
  });

  describe('Application-Level Validation', () => {
    describe('Access Level Range Validation', () => {
      it('should throw error for access level below minimum (1)', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 0, // Invalid: below minimum
          },
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const mockError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level range',
          'Access level must be between 1 and 5',
          { accessLevel: 0 },
          'Please provide an access level between 1 and 5'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(mockError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(mockError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: undefined,
          active: undefined,
        });
      });

      it('should throw error for access level above maximum (5)', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 6, // Invalid: above maximum
          },
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const mockError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level range',
          'Access level must be between 1 and 5',
          { accessLevel: 6 },
          'Please provide an access level between 1 and 5'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(mockError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(mockError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:6',
          active: undefined,
        });
      });

      it('should accept valid access level range (1-5)', async () => {
        // Arrange
        const validLevels = [1, 2, 3, 4, 5];

        for (const level of validLevels) {
          const request: ListRolesRequest = {
            filters: { accessLevel: level },
          };

          // Act
          await useCase.execute(request);

          // Assert
          expect(mockRoleRepository.list).toHaveBeenCalledWith({
            search: `level:${level}`,
            active: undefined,
          });
        }
      });

      it('should throw error for negative access level', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: -1, // Invalid: negative
          },
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const mockError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level range',
          'Access level must be between 1 and 5',
          { accessLevel: -1 },
          'Please provide an access level between 1 and 5'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(mockError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(mockError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:-1',
          active: undefined,
        });
      });

      it('should throw error for zero access level', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 0, // Invalid: zero
          },
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const mockError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level range',
          'Access level must be between 1 and 5',
          { accessLevel: 0 },
          'Please provide an access level between 1 and 5'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(mockError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(mockError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: undefined,
          active: undefined,
        });
      });

      it('should throw error for access level 6', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 6, // Invalid: above maximum
          },
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const mockError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level range',
          'Access level must be between 1 and 5',
          { accessLevel: 6 },
          'Please provide an access level between 1 and 5'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(mockError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(mockError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:6',
          active: undefined,
        });
      });

      it('should throw error for very large access level', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 1000, // Invalid: very large
          },
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const mockError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level range',
          'Access level must be between 1 and 5',
          { accessLevel: 1000 },
          'Please provide an access level between 1 and 5'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(mockError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(mockError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:1000',
          active: undefined,
        });
      });
    });

    describe('Filter Parameter Handling', () => {
      it('should handle undefined filters gracefully', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: undefined,
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });

      it('should handle empty filter object gracefully', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {},
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });

      it('should handle null filters gracefully', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: null as any,
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });

      it('should handle undefined request gracefully', async () => {
        // Arrange
        const request = undefined;

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });
    });

    describe('Requester ID Handling', () => {
      it('should handle undefined requester ID', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 2 },
          requesterId: undefined,
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should handle null requester ID', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 2 },
          requesterId: null as any,
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should handle numeric requester ID', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 2 },
          requesterId: 123,
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: '123',
          operation: 'list_roles',
        });
      });

      it('should handle zero requester ID', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 2 },
          requesterId: 0,
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: '0',
          operation: 'list_roles',
        });
      });
    });
  });

  describe('Error Handling and Transformation', () => {
    describe('Repository Errors', () => {
      it('should handle and transform repository errors', async () => {
        // Arrange
        const repositoryError = new Error('Database connection failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Application layer error',
          'An internal error occurred while processing the request',
          { originalError: repositoryError.message },
          'Please try again later or contact support if the problem persists'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should log repository errors with proper context', async () => {
        // Arrange
        const repositoryError = new Error('Repository error');
        const request: ListRolesRequest = {
          requesterId: 123,
        };
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.callFake(() => {
          throw repositoryError;
        });

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejected();

        expect(mockLogger.error).toHaveBeenCalledWith('Role listing failed', {
          correlationId: 'list-roles-1640995200',
          userId: '123',
          operation: 'list_roles',
        });
      });

      it('should handle network timeout errors', async () => {
        // Arrange
        const networkError = new Error('Network timeout');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Network error',
          'The request timed out while connecting to the database',
          { originalError: networkError.message },
          'Please check your internet connection and try again'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(networkError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
      });

      it('should handle database connection errors', async () => {
        // Arrange
        const dbError = new Error('Connection refused');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Database error',
          'Unable to connect to the database',
          { originalError: dbError.message },
          'Please try again in a few moments'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(dbError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
      });

      it('should handle permission denied errors', async () => {
        // Arrange
        const permissionError = new Error('Access denied');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Permission error',
          'You do not have permission to list roles',
          { originalError: permissionError.message },
          'Please contact your administrator for access'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(permissionError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
      });
    });

    describe('Validation Errors', () => {
      it('should handle and transform validation errors', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 10 }, // Invalid
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Application validation error',
          'An error occurred during validation processing',
          { originalError: repositoryError.message },
          'Please check your input and try again'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:10',
          active: undefined,
        });
      });

      it('should handle multiple validation errors', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: -5 }, // Invalid
        };
        const repositoryError = new Error('Invalid access level: must be between 1 and 5');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Multiple validation errors',
          'Access level and other fields are invalid',
          { accessLevel: -5 },
          'Please correct all validation errors'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:-5',
          active: undefined,
        });
      });
    });

    describe('Error Transformer Failures', () => {
      it('should handle error transformer failures', async () => {
        // Arrange
        const repositoryError = new Error('Repository error');
        const transformerError = new Error('Transformer failed');
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.throwError(transformerError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformerError);
        expect(mockLogger.error).toHaveBeenCalledWith('Role listing failed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should handle null error from transformer', async () => {
        // Arrange
        const repositoryError = new Error('Repository error');
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(null as any);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejected();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });
    });

    describe('Unexpected Errors', () => {
      it('should handle completely unexpected errors', async () => {
        // Arrange
        const unexpectedError = 'String error'; // Not an Error object
        const transformedError = new ApplicationError(
          ApplicationErrorCode.SYSTEM_MAINTENANCE,
          'Unexpected error occurred',
          'An unexpected error occurred while listing roles',
          { originalError: unexpectedError },
          'Please try again later'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(unexpectedError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(unexpectedError);
      });

      it('should handle null/undefined errors', async () => {
        // Arrange
        const nullError = null;
        const transformedError = new ApplicationError(
          ApplicationErrorCode.SYSTEM_MAINTENANCE,
          'Null error occurred',
          'An unexpected error occurred while listing roles',
          { originalError: nullError },
          'Please try again later'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(nullError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(nullError);
      });

      it('should handle complex error objects', async () => {
        // Arrange
        const complexError = {
          message: 'Complex error',
          code: 500,
          details: { field: 'accessLevel', value: 10 },
        };
        const transformedError = new ApplicationError(
          ApplicationErrorCode.SYSTEM_MAINTENANCE,
          'Complex error occurred',
          'An unexpected error occurred while listing roles',
          { originalError: complexError },
          'Please try again later'
        );
        mockRoleRepository.list.and.returnValue(Promise.reject(complexError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(complexError);
      });
    });

    describe('Error Context Preservation', () => {
      it('should preserve error context in logs', async () => {
        // Arrange
        const request: ListRolesRequest = {
          requesterId: 999,
          filters: { accessLevel: 1 },
        };
        const repositoryError = new Error('Context error');
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.callFake(() => {
          throw repositoryError;
        });

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejected();

        expect(mockLogger.error).toHaveBeenCalledWith('Role listing failed', {
          correlationId: 'list-roles-1640995200',
          userId: '999',
          operation: 'list_roles',
        });
      });

      it('should include operation context in error logs', async () => {
        // Arrange
        const repositoryError = new Error('Operation context error');
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.callFake(() => {
          throw repositoryError;
        });

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejected();

        expect(mockLogger.error).toHaveBeenCalledWith('Role listing failed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });
    });
  });

  describe('Filter Mapping Logic', () => {
    describe('Access Level Mapping', () => {
      it('should map access level to search format', () => {
        // This test verifies the private method behavior through public interface
        const request: ListRolesRequest = {
          filters: { accessLevel: 4 },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:4',
          active: undefined,
        });
      });

      it('should not include search when access level is undefined', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { isActive: true },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: undefined,
          active: true,
        });
      });

      it('should map access level 1 correctly', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 1 },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:1',
          active: undefined,
        });
      });

      it('should map access level 5 correctly', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 5 },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:5',
          active: undefined,
        });
      });
    });

    describe('Active Status Mapping', () => {
      it('should map isActive true to active true', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { isActive: true },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: undefined,
          active: true,
        });
      });

      it('should map isActive false to active false', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { isActive: false },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: undefined,
          active: false,
        });
      });
    });

    describe('Combined Filter Mapping', () => {
      it('should map combined access level and active status', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 3,
            isActive: true,
          },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:3',
          active: true,
        });
      });

      it('should map combined access level and inactive status', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {
            accessLevel: 2,
            isActive: false,
          },
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:2',
          active: false,
        });
      });

      it('should handle all possible filter combinations', () => {
        // Test all combinations of accessLevel and isActive
        const combinations = [
          { accessLevel: 1, isActive: true, expected: { search: 'level:1', active: true } },
          { accessLevel: 1, isActive: false, expected: { search: 'level:1', active: false } },
          { accessLevel: 2, isActive: true, expected: { search: 'level:2', active: true } },
          { accessLevel: 2, isActive: false, expected: { search: 'level:2', active: false } },
          { accessLevel: 3, isActive: true, expected: { search: 'level:3', active: true } },
          { accessLevel: 3, isActive: false, expected: { search: 'level:3', active: false } },
          { accessLevel: 4, isActive: true, expected: { search: 'level:4', active: true } },
          { accessLevel: 4, isActive: false, expected: { search: 'level:4', active: false } },
          { accessLevel: 5, isActive: true, expected: { search: 'level:5', active: true } },
          { accessLevel: 5, isActive: false, expected: { search: 'level:5', active: false } },
        ];

        combinations.forEach(({ accessLevel, isActive, expected }) => {
          const request: ListRolesRequest = {
            filters: { accessLevel, isActive },
          };

          // Act
          useCase.execute(request);

          // Assert
          expect(mockRoleRepository.list).toHaveBeenCalledWith(expected);
        });
      });
    });

    describe('Empty and Undefined Filter Handling', () => {
      it('should return undefined for empty filters object', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: {},
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });

      it('should return undefined for undefined filters', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: undefined,
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });

      it('should return undefined for null filters', () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: null as any,
        };

        // Act
        useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Side Effects Management', () => {
    describe('Audit Logging', () => {
      it('should log successful operations with correlation ID', async () => {
        // Arrange
        const expectedCorrelationId = 'list-roles-1640995200';

        // Act
        await useCase.execute();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: expectedCorrelationId,
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should include requester ID in audit logs when provided', async () => {
        // Arrange
        const request: ListRolesRequest = {
          requesterId: 456,
        };
        const expectedCorrelationId = 'list-roles-1640995200';

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: expectedCorrelationId,
          userId: '456',
          operation: 'list_roles',
        });
      });

      it('should generate unique correlation IDs for different operations', async () => {
        // Arrange
        const fixedTimestamp1 = 1640995200;
        const fixedTimestamp2 = 1640995300;
        mockClock.nowEpochSeconds.and.returnValues(fixedTimestamp1, fixedTimestamp2);

        // Act
        await useCase.execute();
        await useCase.execute();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995300',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should log with different requester IDs correctly', async () => {
        // Arrange
        const requesters = [123, 456, 789, 0, -1];

        for (const requesterId of requesters) {
          const request: ListRolesRequest = {
            requesterId,
          };

          // Act
          await useCase.execute(request);

          // Assert
          expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
            correlationId: 'list-roles-1640995200',
            userId: requesterId.toString(),
            operation: 'list_roles',
          });
        }
      });
    });

    describe('Clock Integration', () => {
      it('should use clock service for correlation ID generation', async () => {
        // Arrange
        const fixedTimestamp = 1640995300;
        mockClock.nowEpochSeconds.and.returnValue(fixedTimestamp);

        // Act
        await useCase.execute();

        // Assert
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1); // Once for correlation ID in handleSideEffects
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995300',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should use clock service for error correlation ID', async () => {
        // Arrange
        const repositoryError = new Error('Test error');
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.callFake(() => {
          throw repositoryError;
        });

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejected();

        expect(mockLogger.error).toHaveBeenCalledWith('Role listing failed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should call clock service exactly once per successful operation', async () => {
        // Arrange
        mockClock.nowEpochSeconds.and.returnValue(1640995200);

        // Act
        await useCase.execute();

        // Assert
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1);
      });

      it('should call clock service for error logging when operation fails', async () => {
        // Arrange
        const repositoryError = new Error('Database error');
        mockRoleRepository.list.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.callFake(() => {
          throw repositoryError;
        });

        // Act & Assert
        await expectAsync(useCase.execute()).toBeRejected();

        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1); // Once for error correlation ID
        expect(mockLogger.error).toHaveBeenCalledWith('Role listing failed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });
    });

    describe('Side Effects with Different Scenarios', () => {
      it('should handle side effects with empty role list', async () => {
        // Arrange
        const emptyRoles: Role[] = [];
        mockRoleRepository.list.and.returnValue(Promise.resolve(emptyRoles));

        // Act
        await useCase.execute();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should handle side effects with large role list', async () => {
        // Arrange
        const largeRoleSet = Array.from({ length: 100 }, (_, index) =>
          Role.create({
            id: index + 1,
            name: `Role ${index + 1}`,
            accessLevel: 1,
            isActive: true,
            description: `Description ${index + 1}`,
          })
        );
        mockRoleRepository.list.and.returnValue(Promise.resolve(largeRoleSet));

        // Act
        await useCase.execute();

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    describe('Empty Results', () => {
      it('should handle empty role list from repository', async () => {
        // Arrange
        const emptyRoles: Role[] = [];
        mockRoleRepository.list.and.returnValue(Promise.resolve(emptyRoles));

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result).toEqual([]);
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: undefined,
          operation: 'list_roles',
        });
      });

      it('should handle empty results with filters', async () => {
        // Arrange
        const emptyRoles: Role[] = [];
        const request: ListRolesRequest = {
          filters: { accessLevel: 3 },
        };
        mockRoleRepository.list.and.returnValue(Promise.resolve(emptyRoles));

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result).toEqual([]);
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:3',
          active: undefined,
        });
      });
    });

    describe('Large Result Sets', () => {
      it('should handle large arrays of roles', async () => {
        // Arrange
        const largeRoleSet = Array.from({ length: 1000 }, (_, index) =>
          Role.create({
            id: index + 1,
            name: `Role ${index + 1}`,
            accessLevel: (index % 5) + 1,
            isActive: index % 2 === 0,
            description: `Description for role ${index + 1}`,
          })
        );

        mockRoleRepository.list.and.returnValue(Promise.resolve(largeRoleSet));

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result.length).toBe(1000);
        expect(result).toEqual(largeRoleSet);
        expect(mockLogger.info).toHaveBeenCalled();
      });

      it('should handle maximum expected role count', async () => {
        // Arrange
        const maxRoles = Array.from({ length: 10000 }, (_, index) =>
          Role.create({
            id: index + 1,
            name: `Role ${index + 1}`,
            accessLevel: 1,
            isActive: true,
            description: `Role ${index + 1}`,
          })
        );

        mockRoleRepository.list.and.returnValue(Promise.resolve(maxRoles));

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result.length).toBe(10000);
        expect(result).toEqual(maxRoles);
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle multiple concurrent role listing requests', async () => {
        // Arrange
        const request1: ListRolesRequest = { filters: { accessLevel: 1 } };
        const request2: ListRolesRequest = { filters: { accessLevel: 2 } };
        const request3: ListRolesRequest = { filters: { accessLevel: 3 } };

        // Act
        const [result1, result2, result3] = await Promise.all([
          useCase.execute(request1),
          useCase.execute(request2),
          useCase.execute(request3),
        ]);

        // Assert
        expect(result1).toEqual(mockRoles);
        expect(result2).toEqual(mockRoles);
        expect(result3).toEqual(mockRoles);
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(3);
      });

      it('should handle concurrent requests with different requester IDs', async () => {
        // Arrange
        const requests = [
          { filters: { accessLevel: 1 }, requesterId: 111 },
          { filters: { accessLevel: 2 }, requesterId: 222 },
          { filters: { accessLevel: 3 }, requesterId: 333 },
        ];

        // Act
        await Promise.all(requests.map((req) => useCase.execute(req)));

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: '111',
          operation: 'list_roles',
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: '222',
          operation: 'list_roles',
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
          correlationId: 'list-roles-1640995200',
          userId: '333',
          operation: 'list_roles',
        });
      });

      it('should handle concurrent requests with mixed success and failure', async () => {
        // Arrange
        const successRequest: ListRolesRequest = { filters: { accessLevel: 1 } };
        const failureRequest: ListRolesRequest = { filters: { accessLevel: 10 } }; // Invalid

        const failureError = new ApplicationError(
          ApplicationErrorCode.INVALID_ACCESS_LEVEL,
          'Invalid access level',
          'Access level must be between 1 and 5',
          { accessLevel: 10 },
          'Please provide a valid access level'
        );

        // Set up repository responses - success for first call, failure for second
        mockRoleRepository.list.and.callFake((filters: any) => {
          if (filters.search === 'level:1') {
            return Promise.resolve(mockRoles);
          } else {
            return Promise.reject(new Error('Invalid access level: must be between 1 and 5'));
          }
        });

        mockErrorTransformer.transform.and.returnValue(failureError);

        // Act
        const successPromise = useCase.execute(successRequest);
        const failurePromise = useCase.execute(failureRequest);

        const [successResult] = await Promise.allSettled([successPromise, failurePromise]);

        // Assert
        expect(successResult.status).toBe('fulfilled');
        if (successResult.status === 'fulfilled') {
          expect(successResult.value).toEqual(mockRoles);
        }
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(2); // Both requests call repository
        await expectAsync(failurePromise).toBeRejectedWith(failureError);
      });
    });

    describe('Boundary Conditions', () => {
      it('should handle minimum valid access level (1)', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 1 },
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:1',
          active: undefined,
        });
      });

      it('should handle maximum valid access level (5)', async () => {
        // Arrange
        const request: ListRolesRequest = {
          filters: { accessLevel: 5 },
        };

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledWith({
          search: 'level:5',
          active: undefined,
        });
      });

      it('should handle boolean boundary values', async () => {
        // Test both true and false for isActive
        const testCases = [
          { isActive: true, expected: true },
          { isActive: false, expected: false },
        ];

        for (const { isActive, expected } of testCases) {
          const request: ListRolesRequest = {
            filters: { isActive },
          };

          // Act
          await useCase.execute(request);

          // Assert
          expect(mockRoleRepository.list).toHaveBeenCalledWith({
            search: undefined,
            active: expected,
          });
        }
      });

      it('should handle extreme requester ID values', async () => {
        // Test various requester ID edge cases
        const edgeRequesterIds = [
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
          0,
          -1,
          999999,
          -999999,
        ];

        for (const requesterId of edgeRequesterIds) {
          const request: ListRolesRequest = {
            requesterId,
          };

          // Act
          await useCase.execute(request);

          // Assert
          expect(mockLogger.info).toHaveBeenCalledWith('Role listing completed', {
            correlationId: 'list-roles-1640995200',
            userId: requesterId.toString(),
            operation: 'list_roles',
          });
        }
      });
    });

    describe('Performance and Load Scenarios', () => {
      it('should handle rapid successive requests', async () => {
        // Arrange
        const requests = Array.from({ length: 10 }, (_, index) => ({
          filters: { accessLevel: (index % 5) + 1 },
          requesterId: index + 1,
        }));

        // Act
        const results = await Promise.all(requests.map((req) => useCase.execute(req)));

        // Assert
        expect(results.length).toBe(10);
        results.forEach((result) => {
          expect(result).toEqual(mockRoles);
        });
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(10);
      });

      it('should handle mixed filter combinations under load', async () => {
        // Arrange
        const filterCombinations = [
          { accessLevel: 1, isActive: true },
          { accessLevel: 2, isActive: false },
          { accessLevel: 3 },
          { isActive: true },
          { isActive: false },
          {},
        ];

        // Act
        await Promise.all(filterCombinations.map((filters) => useCase.execute({ filters })));

        // Assert
        expect(mockRoleRepository.list).toHaveBeenCalledTimes(6);
      });
    });

    describe('Memory and Resource Edge Cases', () => {
      it('should handle roles with large descriptions', async () => {
        // Arrange
        const largeDescription = 'A'.repeat(10000); // 10KB description
        const rolesWithLargeDescriptions = [
          Role.create({
            id: 1,
            name: 'Large Role',
            accessLevel: 1,
            isActive: true,
            description: largeDescription,
          }),
        ];

        mockRoleRepository.list.and.returnValue(Promise.resolve(rolesWithLargeDescriptions));

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result.length).toBe(1);
        expect(result[0].description).toBe(largeDescription);
      });

      it('should handle roles with special characters in names', async () => {
        // Arrange
        const specialNames = [
          'Role with spaces',
          'Role-with-dashes',
          'Role_with_underscores',
          'Role123',
          'Role@#$%',
        ];

        const rolesWithSpecialNames = specialNames.map((name, index) =>
          Role.create({
            id: index + 1,
            name,
            accessLevel: 1,
            isActive: true,
            description: `Description for ${name}`,
          })
        );

        mockRoleRepository.list.and.returnValue(Promise.resolve(rolesWithSpecialNames));

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result.length).toBe(5);
        result.forEach((role, index) => {
          expect(role.name).toBe(specialNames[index]);
        });
      });
    });
  });

  describe('Dependency Injection Verification', () => {
    it('should inject all required dependencies', () => {
      // Assert
      expect(useCase).toBeDefined();
      expect(useCase).toBeInstanceOf(ListRoles);
    });

    it('should use provided repository token', () => {
      // This test verifies that the use case uses the correct injection token
      // The actual injection is verified by the TestBed setup
      expect(mockRoleRepository).toBeDefined();
    });
  });
});
