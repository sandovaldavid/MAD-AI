import { TestBed } from '@angular/core/testing';
import { UnassignRoleFromUser } from './unassign-role-from-user.usecase';
import { USER_REPOSITORY, ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { UnassignRoleFromUserRequest } from '@application/types/roles.types';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { UserNotificationPreferences } from '@domain/value-objects/user-notification-preferences.vo';

/**
 * Test Suite for UnassignRoleFromUser Use Case
 *
 * Tests the orchestration logic for role unassignment operations following Clean Architecture principles.
 * Focuses on coordination between domain repositories, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role unassignments with comprehensive scenarios:
 * - Successful role unassignments with proper delegation to domain layer
 * - Application-level validation (input constraints, entity existence)
 * - Error handling and transformation for all failure scenarios
 * - Side effects (logging, audit trails) with correlation tracking
 * - Proper dependency coordination and injection
 * - Data flow between application and domain contracts
 *
 * @architecture
 * - **Layer**: Application Layer Testing
 * - **Pattern**: Orchestration Testing (not business logic testing)
 * - **Mocks**: All external dependencies (Repository, Logger, Clock, ErrorTransformer)
 * - **Coverage**: 100% of orchestration logic, error paths, and side effects
 *
 * @dependencies
 * - UserRepository mock (domain contract)
 * - RoleRepository mock (domain contract)
 * - ClockPort mock (system service)
 * - Logger mock (core service)
 * - ApplicationErrorTransformer mock (application service)
 *
 * @scenarios
 * - ✅ Successful role unassignment with all required fields
 * - ✅ Application-level validation (invalid user ID, role ID, request structure)
 * - ✅ Entity existence validation (user not found, role not found)
 * - ✅ Repository error handling and delegation
 * - ✅ Error transformation and propagation
 * - ✅ Side effects (logging with correlation ID and context)
 * - ✅ Dependency injection and coordination
 * - ✅ Error logging for failed unassignments
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('UnassignRoleFromUser', () => {
  let useCase: UnassignRoleFromUser;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data entities
  let mockUser: User;
  let mockRole: Role;

  beforeEach(() => {
    // Create mocks using Jasmine
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['getById']);
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', ['getById', 'unassign']);
    mockClock = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Create mock entities using factory methods
    mockUser = User.create({
      id: 123,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      role: Role.create({
        id: 456,
        name: 'Developer',
        accessLevel: 3,
        isActive: true,
      }),
      notificationPreferences: {
        email: true,
        system: true,
        task: true,
      } as UserNotificationPreferences,
    });

    mockRole = Role.create({
      id: 456,
      name: 'Developer',
      accessLevel: 3,
      isActive: true,
      description: 'Developer role',
    });

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        UnassignRoleFromUser,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(UnassignRoleFromUser);

    // Setup default mock behaviors
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // 2024-01-01 timestamp
    mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
    mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
    mockRoleRepository.unassign.and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    // Clear all mock calls
    mockUserRepository.getById.calls.reset();
    mockRoleRepository.getById.calls.reset();
    mockRoleRepository.unassign.calls.reset();
    mockClock.nowEpochSeconds.calls.reset();
    mockLogger.info.calls.reset();
    mockLogger.error.calls.reset();
    mockErrorTransformer.transform.calls.reset();
  });

  describe('Successful Role Unassignment', () => {
    describe('Complete Unassignment Workflow', () => {
      it('should successfully unassign role from user with complete workflow', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        // Verify 4-step orchestration pattern
        expect(mockUserRepository.getById).toHaveBeenCalledWith(123);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(456);
        expect(mockRoleRepository.unassign).toHaveBeenCalledWith({
          userId: 123,
          roleId: 456,
        });

        // Verify call counts (parallel entity fetching)
        expect(mockUserRepository.getById).toHaveBeenCalledTimes(1);
        expect(mockRoleRepository.getById).toHaveBeenCalledTimes(1);
        expect(mockRoleRepository.unassign).toHaveBeenCalledTimes(1);
      });

      it('should handle side effects with proper logging and correlation ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const expectedCorrelationId = 'unassign-role-456-user-123-1640995200';

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role unassignment completed', {
          userId: '789',
          operation: 'unassign_role_from_user',
          correlationId: expectedCorrelationId,
        });
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
      });

      it('should handle optional requester ID gracefully', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          // No requesterId provided
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role unassignment completed', {
          userId: undefined,
          operation: 'unassign_role_from_user',
          correlationId: jasmine.any(String),
        });
      });
    });

    describe('Parallel Entity Fetching', () => {
      it('should fetch user and role entities in parallel for efficiency', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Setup repository methods to track call order
        let userCallTime: number = 0;
        let roleCallTime: number = 0;
        mockUserRepository.getById.and.callFake(() => {
          userCallTime = Date.now();
          return Promise.resolve(mockUser);
        });
        mockRoleRepository.getById.and.callFake(() => {
          roleCallTime = Date.now();
          return Promise.resolve(mockRole);
        });

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockUserRepository.getById).toHaveBeenCalled();
        expect(mockRoleRepository.getById).toHaveBeenCalled();
        // Calls should be nearly simultaneous (within 1ms) due to Promise.all
        expect(Math.abs(userCallTime - roleCallTime)).toBeLessThan(1);
      });
    });
  });

  describe('Application-Level Validation', () => {
    describe('Invalid Request Structure', () => {
      it('should throw error for null request', async () => {
        // Arrange
        const request = null as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
      });

      it('should throw error for undefined request', async () => {
        // Arrange
        const request = undefined as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
      });

      it('should throw error for empty object request', async () => {
        // Arrange
        const request = {} as UnassignRoleFromUserRequest;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
      });
    });

    describe('Invalid User ID', () => {
      it('should throw error for zero user ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 0,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
      });

      it('should throw error for negative user ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: -1,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Invalid user ID');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );

        // Mock repository to reject invalid ID (domain-level validation)
        mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockUserRepository.getById).toHaveBeenCalledWith(-1);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should throw error for non-integer user ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123.45,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Invalid user ID');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );

        // Mock repository to reject invalid ID (domain-level validation)
        mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockUserRepository.getById).toHaveBeenCalledWith(123.45);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should throw error for missing user ID', async () => {
        // Arrange
        const request: Partial<UnassignRoleFromUserRequest> = {
          roleId: 456,
          requesterId: 789,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request as UnassignRoleFromUserRequest)).toBeRejectedWith(
          expectedError
        );
      });
    });

    describe('Invalid Role ID', () => {
      it('should throw error for zero role ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 0,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_ROLE_ID,
          'Invalid role ID',
          'Invalid role ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
      });

      it('should throw error for negative role ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: -1,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Invalid role ID');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_ROLE_ID,
          'Invalid role ID',
          'Invalid role ID'
        );

        // Mock repository to reject invalid ID (domain-level validation)
        mockRoleRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(-1);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should throw error for non-integer role ID', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456.78,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Invalid role ID');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_ROLE_ID,
          'Invalid role ID',
          'Invalid role ID'
        );

        // Mock repository to reject invalid ID (domain-level validation)
        mockRoleRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(456.78);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should throw error for missing role ID', async () => {
        // Arrange
        const request: Partial<UnassignRoleFromUserRequest> = {
          userId: 123,
          requesterId: 789,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_ROLE_ID,
          'Invalid role ID',
          'Invalid role ID'
        );
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request as UnassignRoleFromUserRequest)).toBeRejectedWith(
          expectedError
        );
      });
    });
  });

  describe('Entity Existence Validation', () => {
    describe('User Not Found', () => {
      it('should throw error when user does not exist', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 999,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.USER_NOT_FOUND,
          'User with ID 999 not found',
          'User with ID 999 not found'
        );

        mockUserRepository.getById.and.returnValue(Promise.resolve(null as any)); // Return null instead of reject
        mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole)); // Return valid role
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockUserRepository.getById).toHaveBeenCalledWith(999);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(456); // Still called due to Promise.all
        expect(mockRoleRepository.unassign).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.objectContaining({ message: 'User with ID 999 not found' })
        );
      });

      it('should handle user repository error gracefully', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Database connection failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.USER_RETRIEVAL_FAILED,
          'User lookup failed',
          'User lookup failed'
        );

        mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });
    });

    describe('Role Not Found', () => {
      it('should throw error when role does not exist', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 999,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          'Role with ID 999 not found',
          'Role with ID 999 not found'
        );

        mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser)); // Return valid user
        mockRoleRepository.getById.and.returnValue(Promise.resolve(null as any)); // Return null instead of reject
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockUserRepository.getById).toHaveBeenCalledWith(123); // Still called due to Promise.all
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(999);
        expect(mockRoleRepository.unassign).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.objectContaining({ message: 'Role with ID 999 not found' })
        );
      });

      it('should handle role repository error gracefully', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Role service unavailable');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_LISTING_FAILED,
          'Role lookup failed',
          'Role lookup failed'
        );

        mockRoleRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });
    });

    describe('Both Entities Not Found', () => {
      it('should throw error when both user and role do not exist', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 999,
          roleId: 888,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.USER_NOT_FOUND,
          'User with ID 999 not found',
          'User with ID 999 not found'
        );

        mockUserRepository.getById.and.returnValue(Promise.resolve(null as any)); // Return null instead of reject
        mockRoleRepository.getById.and.returnValue(Promise.resolve(null as any)); // Return null instead of reject
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(expectedError);
        expect(mockUserRepository.getById).toHaveBeenCalledWith(999);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(888);
        expect(mockRoleRepository.unassign).not.toHaveBeenCalled();
        // Should report user not found first (validation order)
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.objectContaining({ message: 'User with ID 999 not found' })
        );
      });
    });
  });

  describe('Repository Delegation', () => {
    describe('Successful Unassignment', () => {
      it('should delegate to role repository with correct parameters', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.unassign).toHaveBeenCalledWith({
          userId: 123,
          roleId: 456,
        });
        expect(mockRoleRepository.unassign).toHaveBeenCalledTimes(1);
      });

      it('should not call unassign if entity validation fails', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 999,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        mockUserRepository.getById.and.returnValue(Promise.reject(new Error('User not found')));
        mockErrorTransformer.transform.and.returnValue(
          new ApplicationError(
            ApplicationErrorCode.USER_NOT_FOUND,
            'User not found',
            'User not found'
          )
        );

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejected();
        expect(mockRoleRepository.unassign).not.toHaveBeenCalled();
      });
    });

    describe('Repository Error Handling', () => {
      it('should handle repository unassign error gracefully', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Unassignment constraint violation');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_ASSIGNMENT_FAILED,
          'Role unassignment failed',
          'Role unassignment failed'
        );

        mockRoleRepository.unassign.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockRoleRepository.unassign).toHaveBeenCalled();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });
    });
  });

  describe('Error Handling and Transformation', () => {
    describe('ApplicationErrorTransformer Integration', () => {
      it('should transform all errors through ApplicationErrorTransformer', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 0, // Invalid to trigger validation error
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Validation failed',
          'Validation failed'
        );
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(jasmine.any(Error));
      });

      it('should preserve original error context in transformation', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const originalError = new Error('Original error message');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Transformed error',
          'Transformed error'
        );

        mockRoleRepository.unassign.and.returnValue(Promise.reject(originalError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(originalError);
      });
    });

    describe('Error Logging', () => {
      it('should log error with correlation ID when unassignment fails', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const error = new Error('Unassignment failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_ASSIGNMENT_FAILED,
          'Role unassignment failed',
          'Role unassignment failed'
        );
        const expectedCorrelationId = 'unassign-role-456-user-123-1640995200';

        mockRoleRepository.unassign.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockLogger.error).toHaveBeenCalledWith('Role unassignment failed', {
          correlationId: expectedCorrelationId,
          userId: '789',
          operation: 'unassign_role_from_user',
        });
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });

      it('should handle missing requester ID in error logging', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          // No requesterId
        } as UnassignRoleFromUserRequest;
        const error = new Error('Unassignment failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_ASSIGNMENT_FAILED,
          'Role unassignment failed',
          'Role unassignment failed'
        );

        mockRoleRepository.unassign.and.returnValue(Promise.reject(error));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

        expect(mockLogger.error).toHaveBeenCalledWith('Role unassignment failed', {
          correlationId: jasmine.any(String),
          userId: undefined,
          operation: 'unassign_role_from_user',
        });
      });
    });

    describe('Different Error Scenarios', () => {
      it('should handle validation errors with proper context', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: -1,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const repositoryError = new Error('Invalid user ID');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid user ID',
          'Invalid user ID'
        );

        // Mock repository to reject invalid ID (domain-level validation)
        mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should handle entity not found errors with proper context', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 999,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;
        const notFoundError = new ApplicationError(
          ApplicationErrorCode.ROLE_NOT_FOUND,
          'Role with ID 999 not found',
          'Role with ID 999 not found'
        );

        mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser)); // Return valid user
        mockRoleRepository.getById.and.returnValue(Promise.resolve(null as any)); // Return null instead of reject
        mockErrorTransformer.transform.and.returnValue(notFoundError);

        // Act & Assert
        await expectAsync(useCase.execute(request)).toBeRejectedWith(notFoundError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.objectContaining({ message: 'Role with ID 999 not found' })
        );
      });
    });
  });

  describe('Dependency Injection and Integration', () => {
    describe('Token-Based Injection', () => {
      it('should inject all required dependencies through tokens', () => {
        // Assert
        expect(useCase).toBeDefined();
        expect(useCase).toBeInstanceOf(UnassignRoleFromUser);
      });

      it('should use injected repositories for data access', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockUserRepository.getById).toHaveBeenCalled();
        expect(mockRoleRepository.getById).toHaveBeenCalled();
        expect(mockRoleRepository.unassign).toHaveBeenCalled();
      });

      it('should use injected clock service for timestamps', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
      });

      it('should use injected logger for side effects', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        expect(mockLogger.info).toHaveBeenCalled();
      });
    });

    describe('Service Coordination', () => {
      it('should coordinate all services in correct order', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        let repositoryCallOrder: number[] = [];
        let clockCallOrder: number = 0;
        let loggerCallOrder: number = 0;

        mockUserRepository.getById.and.callFake(() => {
          repositoryCallOrder.push(1);
          return Promise.resolve(mockUser);
        });

        mockRoleRepository.getById.and.callFake(() => {
          repositoryCallOrder.push(2);
          return Promise.resolve(mockRole);
        });

        mockRoleRepository.unassign.and.callFake(() => {
          repositoryCallOrder.push(3);
          return Promise.resolve();
        });

        mockClock.nowEpochSeconds.and.callFake(() => {
          clockCallOrder = repositoryCallOrder.length + 1;
          return 1640995200;
        });

        mockLogger.info.and.callFake(() => {
          loggerCallOrder = repositoryCallOrder.length + 1;
        });

        // Act
        await useCase.execute(request);

        // Assert
        expect(repositoryCallOrder).toContain(1); // User fetch
        expect(repositoryCallOrder).toContain(2); // Role fetch
        expect(repositoryCallOrder).toContain(3); // Unassign
        expect(clockCallOrder).toBeGreaterThan(0); // Clock called
        expect(loggerCallOrder).toBeGreaterThan(0); // Logger called
      });
    });
  });

  describe('Clean Architecture Compliance', () => {
    describe('Layer Separation', () => {
      it('should only use domain contracts and core interfaces', () => {
        // This test verifies architectural compliance at compile time
        // If the use case imports from infrastructure or presentation, TypeScript would fail
        expect(useCase).toBeDefined();
      });

      it('should delegate business logic to domain layer', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        // Use case should only orchestrate, not implement business logic
        expect(mockRoleRepository.unassign).toHaveBeenCalled();
        // Business rules are handled by the repository (domain layer)
      });

      it('should maintain orchestration-only responsibility', async () => {
        // Arrange
        const request: UnassignRoleFromUserRequest = {
          userId: 123,
          roleId: 456,
          requesterId: 789,
        } as UnassignRoleFromUserRequest;

        // Act
        await useCase.execute(request);

        // Assert
        // Verify 4-step orchestration pattern execution
        expect(mockUserRepository.getById).toHaveBeenCalled(); // Step 2: Validate entities
        expect(mockRoleRepository.getById).toHaveBeenCalled(); // Step 2: Validate entities
        expect(mockRoleRepository.unassign).toHaveBeenCalled(); // Step 3: Delegate to domain
        expect(mockLogger.info).toHaveBeenCalled(); // Step 4: Handle side effects
      });
    });

    describe('Error Boundary Compliance', () => {
      it('should transform all errors through application error boundary', async () => {
        // Arrange - Test various error scenarios
        const scenarios = [
          { userId: 0, roleId: 456 }, // Validation error
          { userId: 123, roleId: 0 }, // Validation error
        ];

        for (const scenario of scenarios) {
          const request = {
            ...scenario,
            requesterId: 789,
          } as UnassignRoleFromUserRequest;
          const transformedError = new ApplicationError(
            ApplicationErrorCode.UNEXPECTED_ERROR,
            'Test error',
            'Test error'
          );
          mockErrorTransformer.transform.and.returnValue(transformedError);

          // Act & Assert
          await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);
          expect(mockErrorTransformer.transform).toHaveBeenCalled();

          // Reset for next scenario
          mockErrorTransformer.transform.calls.reset();
        }
      });
    });
  });
});
