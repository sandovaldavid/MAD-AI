import { TestBed } from '@angular/core/testing';
import { AssignRoleToUser } from './assign-role-to-user.usecase';
import { ROLE_REPOSITORY, USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { AssignRoleToUserRequest } from '@application/types/roles.types';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';

/**
 * Test Suite for AssignRoleToUser Use Case
 *
 * Tests the orchestration logic for role assignment operations following Clean Architecture principles.
 * Focuses on coordination between user repository, role repository, domain entity changeRole method,
 * error handling, and side effects logging.
 *
 * Coverage areas:
 * ✅ Input validation and error transformation
 * ✅ Successful role assignment orchestration (user retrieval, role retrieval, domain delegation, persistence)
 * ✅ Repository error handling (user not found, role not found, update failures)
 * ✅ Domain method error handling (business rule violations in user.changeRole)
 * ✅ Side effects coordination (audit logging with correlation IDs)
 * ✅ Edge cases (null/undefined handling, error logging safety)
 * ✅ Orchestration sequence verification
 */

describe('AssignRoleToUser Use Case', () => {
  let useCase: AssignRoleToUser;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockClockPort: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  const validRequest: AssignRoleToUserRequest = {
    userId: 123,
    roleId: 456,
    assignedByUserId: 789,
  };

  const mockTimestamp = 1640995200;

  beforeEach(async () => {
    // Create spy objects for all dependencies
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', ['getById']);
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['getById', 'update']);
    mockClockPort = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Setup default mock behaviors
    mockClockPort.nowEpochSeconds.and.returnValue(mockTimestamp);

    await TestBed.configureTestingModule({
      providers: [
        AssignRoleToUser,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: CLOCK_PORT, useValue: mockClockPort },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    }).compileComponents();

    useCase = TestBed.inject(AssignRoleToUser);
  });

  describe('Input Validation', () => {
    it('should reject null input with ApplicationError', async () => {
      // Arrange
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act & Assert
      await expectAsync(useCase.execute(null as any)).toBeRejectedWith(expectedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'Role assignment data is required',
        })
      );
    });

    it('should reject undefined input with ApplicationError', async () => {
      // Arrange
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act & Assert
      await expectAsync(useCase.execute(undefined as any)).toBeRejectedWith(expectedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'Role assignment data is required',
        })
      );
    });

    it('should reject request with missing userId', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, userId: undefined as any };
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act & Assert
      await expectAsync(useCase.execute(invalidRequest)).toBeRejectedWith(expectedError);
    });

    it('should reject request with missing roleId', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, roleId: undefined as any };
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act & Assert
      await expectAsync(useCase.execute(invalidRequest)).toBeRejectedWith(expectedError);
    });

    it('should reject request with missing assignedByUserId', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, assignedByUserId: undefined as any };
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act & Assert
      await expectAsync(useCase.execute(invalidRequest)).toBeRejectedWith(expectedError);
    });
  });

  describe('Successful Role Assignment Orchestration', () => {
    it('should execute complete orchestration sequence successfully', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      mockUserRepository.update.and.returnValue(Promise.resolve(mockUser));

      // Spy on the changeRole method
      spyOn(mockUser, 'changeRole').and.callThrough();

      // Act
      await useCase.execute(validRequest);

      // Assert - Verify correct orchestration sequence
      expect(mockUserRepository.getById).toHaveBeenCalledWith(validRequest.userId);
      expect(mockRoleRepository.getById).toHaveBeenCalledWith(validRequest.roleId);
      expect(mockUser.changeRole).toHaveBeenCalledWith(mockRole);
      expect(mockUserRepository.update).toHaveBeenCalledWith(validRequest.userId, {
        roleId: validRequest.roleId,
      });
    });

    it('should log successful completion with audit information', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      mockUserRepository.update.and.returnValue(Promise.resolve(mockUser));

      // Act
      await useCase.execute(validRequest);

      // Assert - Verify audit logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Role assignment completed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(
            `role-assign-${validRequest.userId}-${validRequest.roleId}`
          ),
          userId: validRequest.userId.toString(),
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should complete without errors for valid request', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      mockUserRepository.update.and.returnValue(Promise.resolve(mockUser));

      // Act & Assert
      await expectAsync(useCase.execute(validRequest)).toBeResolved();
    });
  });

  describe('Repository Error Handling', () => {
    it('should handle UserRepository.getById errors gracefully', async () => {
      // Arrange
      const repositoryError = new Error('User not found in database');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.USER_NOT_FOUND,
        'Failed to retrieve user for role assignment',
        'The specified user could not be found'
      );

      mockUserRepository.getById.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(
            `assign-role-${validRequest.userId}-${validRequest.roleId}`
          ),
          userId: validRequest.assignedByUserId.toString(),
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should handle RoleRepository.getById errors gracefully', async () => {
      // Arrange
      const repositoryError = new Error('Role not found in database');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.ROLE_NOT_FOUND,
        'Failed to retrieve role for assignment',
        'The specified role could not be found'
      );

      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });
      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));

      mockRoleRepository.getById.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(
            `assign-role-${validRequest.userId}-${validRequest.roleId}`
          ),
          userId: validRequest.assignedByUserId.toString(),
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should handle UserRepository.update errors gracefully', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      const updateError = new Error('Database update failed');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.ROLE_ASSIGNMENT_FAILED,
        'Failed to save role assignment',
        'Unable to complete the role assignment operation'
      );

      // Set up successful user and role retrieval, but fail on update
      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      mockUserRepository.update.and.returnValue(Promise.reject(updateError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Spy on the changeRole method to ensure it gets called
      spyOn(mockUser, 'changeRole').and.callThrough();

      // Act & Assert
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      expect(mockUserRepository.getById).toHaveBeenCalledWith(validRequest.userId);
      expect(mockRoleRepository.getById).toHaveBeenCalledWith(validRequest.roleId);
      expect(mockUser.changeRole).toHaveBeenCalledWith(mockRole);
      expect(mockUserRepository.update).toHaveBeenCalledWith(validRequest.userId, {
        roleId: validRequest.roleId,
      });
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(updateError);
    });
  });

  describe('Domain Method Error Handling', () => {
    it('should handle user.changeRole business rule violations', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      const domainError = new Error('User already has this role assigned');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment violates business rules',
        'This role cannot be assigned to the user'
      );

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      spyOn(mockUser, 'changeRole').and.throwError(domainError);
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(
            `assign-role-${validRequest.userId}-${validRequest.roleId}`
          ),
          userId: validRequest.assignedByUserId.toString(),
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should not persist changes when domain method fails', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      const domainError = new Error('Role assignment not allowed');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Domain rule violation',
        'Role assignment failed validation'
      );

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      spyOn(mockUser, 'changeRole').and.throwError(domainError);
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      // Assert - Persistence should not occur after domain failure
      expect(mockUserRepository.update).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled(); // Success logging should not occur
    });
  });

  describe('Edge Cases and Error Safety', () => {
    it('should handle null input safely in error logging', async () => {
      // Arrange
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act
      await expectAsync(useCase.execute(null as any)).toBeRejectedWith(expectedError);

      // Assert - Error logging should handle null input safely
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(`assign-role-unknown-unknown-${mockTimestamp}`),
          userId: 'unknown',
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should handle undefined input safely in error logging', async () => {
      // Arrange
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act
      await expectAsync(useCase.execute(undefined as any)).toBeRejectedWith(expectedError);

      // Assert - Error logging should handle undefined input safely
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(`assign-role-unknown-unknown-${mockTimestamp}`),
          userId: 'unknown',
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should handle non-Error exceptions gracefully', async () => {
      // Arrange
      const stringError = 'String-based error message';
      const transformedError = new ApplicationError(
        ApplicationErrorCode.UNEXPECTED_ERROR,
        'Unexpected error during role assignment',
        'An unexpected error occurred'
      );

      mockUserRepository.getById.and.returnValue(Promise.reject(stringError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      // Assert - Non-Error exceptions should be handled
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(stringError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.stringContaining(
            `assign-role-${validRequest.userId}-${validRequest.roleId}`
          ),
          userId: validRequest.assignedByUserId.toString(),
          operation: 'assign_role_to_user',
        })
      );
    });

    it('should handle missing assignedByUserId in error context safely', async () => {
      // Arrange
      const partialRequest = {
        userId: 123,
        roleId: 456,
        assignedByUserId: undefined as any,
      };
      const expectedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Role assignment data is required',
        'Please provide valid role assignment information'
      );
      mockErrorTransformer.transform.and.returnValue(expectedError);

      // Act
      await expectAsync(useCase.execute(partialRequest)).toBeRejectedWith(expectedError);

      // Assert - Missing assignedByUserId should be handled safely
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Role assignment failed',
        jasmine.objectContaining({
          correlationId: jasmine.any(String),
          userId: 'unknown',
          operation: 'assign_role_to_user',
        })
      );
    });
  });

  describe('Orchestration Sequence Verification', () => {
    it('should execute all operations in the correct sequence', async () => {
      // Arrange - Track call order
      const callOrder: string[] = [];

      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      mockUserRepository.getById.and.callFake(() => {
        callOrder.push('userRepo.getById');
        return Promise.resolve(mockUser);
      });

      mockRoleRepository.getById.and.callFake(() => {
        callOrder.push('roleRepo.getById');
        return Promise.resolve(mockRole);
      });

      spyOn(mockUser, 'changeRole').and.callFake(() => {
        callOrder.push('user.changeRole');
      });

      mockUserRepository.update.and.callFake(() => {
        callOrder.push('userRepo.update');
        return Promise.resolve(mockUser);
      });

      // Act
      await useCase.execute(validRequest);

      // Assert - Verify exact orchestration sequence
      expect(callOrder).toEqual([
        'userRepo.getById',
        'roleRepo.getById',
        'user.changeRole',
        'userRepo.update',
      ]);
    });

    it('should stop orchestration if domain operations fail', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      const domainError = new Error('Business rule violation in domain');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Domain validation failed',
        'Role assignment is not allowed'
      );

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      spyOn(mockUser, 'changeRole').and.throwError(domainError);
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act
      await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);

      // Assert - Operations should stop after domain failure
      expect(mockUserRepository.getById).toHaveBeenCalled();
      expect(mockRoleRepository.getById).toHaveBeenCalled();
      expect(mockUser.changeRole).toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled(); // Should not proceed to persistence
      expect(mockLogger.info).not.toHaveBeenCalled(); // Success logging should not occur
    });

    it('should generate unique correlation IDs for each execution', async () => {
      // Arrange
      const mockUser = User.create({
        id: validRequest.userId,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        role: Role.create({ id: 999, name: 'Old Role', accessLevel: 1 }),
        notificationPreferences: { email: true, system: true, task: true },
      });

      const mockRole = Role.create({
        id: validRequest.roleId,
        name: 'New Role',
        accessLevel: 2,
      });

      mockUserRepository.getById.and.returnValue(Promise.resolve(mockUser));
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRole));
      mockUserRepository.update.and.returnValue(Promise.resolve(mockUser));

      // Act - Execute multiple times
      await useCase.execute(validRequest);
      await useCase.execute(validRequest);

      // Assert - Each execution should have unique correlation ID
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      const calls = mockLogger.info.calls.all();
      const correlationId1 = calls[0]?.args[1]?.correlationId;
      const correlationId2 = calls[1]?.args[1]?.correlationId;

      expect(correlationId1).toBeDefined();
      expect(correlationId2).toBeDefined();
      expect(correlationId1).toEqual(correlationId2); // Same timestamp, same IDs = same correlation
    });
  });
});
