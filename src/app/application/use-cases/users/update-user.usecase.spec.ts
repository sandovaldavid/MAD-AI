import { TestBed } from '@angular/core/testing';
import { UpdateUserUseCase } from './update-user.usecase';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { UpdateUserRequest, UpdateUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { BusinessRuleError } from '@domain/errors/business-rule-error.entity';
import { BusinessRuleErrorCode } from '@domain/enums/business-rule-error-code.enum';
import { InfrastructureError } from '@infrastructure/errors/infrastructure-error';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { UpdateUserPatchContract } from '@domain/repositories/business/user.contract';

/**
 * Test Suite for UpdateUserUseCase
 *
 * Tests the orchestration logic for user update operations following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and audit logging.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for user updates with comprehensive scenarios:
 * - Successful user updates with various field combinations
 * - Proper delegation to Domain repository (all validation handled there)
 * - Error handling and transformation from Domain/Infrastructure to Application layer
 * - Audit logging for security and compliance purposes
 * - Proper dependency coordination and error propagation
 * - Context preservation through error transformation pipeline
 *
 * @architecture
 * - **Layer**: Application Layer Testing (Orchestration Testing)
 * - **Pattern**: Pure orchestration testing - no business logic validation
 * - **Mocks**: All external dependencies (Repository, Logger, ErrorTransformer)
 * - **Coverage**: 95% requirement for Application layer orchestration logic
 *
 * @dependencies
 * - UserRepository mock (domain contract interface)
 * - Logger mock (core service interface)
 * - ApplicationErrorTransformer mock (application service)
 *
 * @scenarios
 * ✅ Successful user update orchestration with audit logging
 * ✅ Repository error handling and transformation
 * ✅ Domain validation error transformation (ValidationError)
 * ✅ Business rule violation error transformation (BusinessRuleError)
 * ✅ Infrastructure error transformation (InfrastructureError)
 * ✅ Context preservation during error transformation
 * ✅ Proper logging with operation context and user ID
 * ✅ Error propagation to calling facade
 *
 * @since 1.0.0
 * @layer Application Testing
 */
describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let mockExistingUser: User;
  let mockUpdatedUser: User;
  let testRole: Role;

  beforeEach(() => {
    // Create mocks using Jasmine following established patterns
    mockUserRepository = jasmine.createSpyObj('UserRepository', [
      'getById',
      'getByEmail',
      'getByUsername',
      'create',
      'update',
      'delete',
      'list',
    ]);
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'info', 'warn', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Create test role entity
    testRole = Role.create({
      id: 2,
      name: 'Developer',
      accessLevel: 3,
      isActive: true,
      description: 'Software developer role',
    });

    // Create mock User entities using the factory method with string parameters
    mockExistingUser = User.create({
      id: 1,
      username: 'johndoe',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      role: testRole,
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T10:00:00.000Z',
      status: 'active',
      isEmailConfirmed: true,
      notificationPreferences: { email: true, system: true, task: true },
    });

    mockUpdatedUser = User.create({
      id: 1,
      username: 'johndoe2',
      email: 'john.doe@example.com',
      firstName: 'Jonathan',
      lastName: 'Doe',
      isActive: true,
      role: testRole,
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z',
      status: 'active',
      isEmailConfirmed: true,
      notificationPreferences: { email: true, system: true, task: true },
    });

    // Setup TestBed with dependency injection
    TestBed.configureTestingModule({
      providers: [
        UpdateUserUseCase,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(UpdateUserUseCase);

    // Setup default mock behaviors for successful scenarios
    mockUserRepository.update.and.returnValue(Promise.resolve(mockUpdatedUser));
  });

  afterEach(() => {
    // Clear all mocks to prevent cross-test interference
    mockUserRepository.update.calls.reset();
    mockLogger.info.calls.reset();
    mockLogger.error.calls.reset();
    mockErrorTransformer.transform.calls.reset();
  });

  describe('Successful User Update Orchestration', () => {
    it('should successfully orchestrate user update with audit logging', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        userId: 1,
        updateData: {
          username: 'john.doe',
          email: 'john.doe@example.com',
          firstName: 'Jonathan',
        },
        requesterId: 123,
        notifyUser: true,
      };

      // Act
      const result: UpdateUserResult = await useCase.execute(updateRequest);

      // Assert - Verify orchestration flow
      expect(mockUserRepository.update).toHaveBeenCalledWith(1, updateRequest.updateData);
      expect(result).toEqual(mockUpdatedUser);

      // Assert - Verify audit logging
      expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', {
        operation: 'update_user',
        userId: '1',
      });

      // Assert - Verify no error transformation occurred
      expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
    });

    it('should handle minimal update data correctly', async () => {
      // Arrange
      const minimalUpdateRequest: UpdateUserRequest = {
        userId: 42,
        updateData: {
          firstName: 'UpdatedName',
        },
        requesterId: 456,
      };

      // Act
      const result: UpdateUserResult = await useCase.execute(minimalUpdateRequest);

      // Assert - Verify delegation to repository with exact parameters
      expect(mockUserRepository.update).toHaveBeenCalledWith(42, { firstName: 'UpdatedName' });
      expect(result).toEqual(mockUpdatedUser);

      // Assert - Verify audit logging with correct user ID
      expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', {
        operation: 'update_user',
        userId: '1', // From mockUpdatedUser.id
      });
    });

    it('should handle comprehensive update data correctly', async () => {
      // Arrange
      const comprehensiveUpdateRequest: UpdateUserRequest = {
        userId: 999,
        updateData: {
          username: 'newusername',
          email: 'newemail@example.com',
          firstName: 'NewFirst',
          lastName: 'NewLast',
          isActive: false,
        },
        requesterId: 789,
        notifyUser: false,
      };

      // Act
      const result: UpdateUserResult = await useCase.execute(comprehensiveUpdateRequest);

      // Assert - Verify all update data is passed through
      expect(mockUserRepository.update).toHaveBeenCalledWith(999, {
        username: 'newusername',
        email: 'newemail@example.com',
        firstName: 'NewFirst',
        lastName: 'NewLast',
        isActive: false,
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('Domain Error Transformation', () => {
    it('should transform ValidationError from domain repository', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        userId: 1,
        updateData: { email: 'invalid-email' },
        requesterId: 123,
      };

      const domainValidationError = ValidationError.fromMessage(
        'Invalid email format',
        'email',
        ValidationErrorCode.EMAIL_INVALID,
        { value: 'invalid-email' }
      );

      const transformedApplicationError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Validation failed during user update',
        'The provided data is invalid',
        { operation: 'update_user', userId: '1' }
      );

      // Setup mocks for error scenario
      mockUserRepository.update.and.returnValue(Promise.reject(domainValidationError));
      mockErrorTransformer.transform.and.returnValue(transformedApplicationError);

      // Act & Assert
      await expectAsync(useCase.execute(updateRequest)).toBeRejectedWith(
        transformedApplicationError
      );

      // Assert - Verify error transformation with proper context
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainValidationError, {
        operation: 'update_user',
        userId: '1',
      });

      // Assert - Verify no success logging occurred
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should transform BusinessRuleError from domain repository', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        userId: 5,
        updateData: { username: 'admin' },
        requesterId: 123,
      };

      const businessRuleError = new BusinessRuleError(
        'Cannot change username to reserved name',
        BusinessRuleErrorCode.ROLE_NAME_RESERVED,
        { reservedName: 'admin', attemptedBy: 123 }
      );

      const transformedApplicationError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Business rule violation during user update',
        'The requested change violates business rules',
        { operation: 'update_user', userId: '5' }
      );

      // Setup mocks for error scenario
      mockUserRepository.update.and.returnValue(Promise.reject(businessRuleError));
      mockErrorTransformer.transform.and.returnValue(transformedApplicationError);

      // Act & Assert
      await expectAsync(useCase.execute(updateRequest)).toBeRejectedWith(
        transformedApplicationError
      );

      // Assert - Verify error transformation with proper context
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(businessRuleError, {
        operation: 'update_user',
        userId: '5',
      });
    });

    it('should transform InfrastructureError from repository', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        userId: 7,
        updateData: { email: 'test@example.com' },
        requesterId: 456,
      };

      const infrastructureError = new InfrastructureError(
        'Database connection failed',
        'DATABASE_ERROR',
        'NETWORK',
        true,
        { connectionPool: 'primary', retryCount: 3 },
        500,
        new Error('Connection timeout'),
        '/api/users/7'
      );

      const transformedApplicationError = new ApplicationError(
        ApplicationErrorCode.SERVICE_UNAVAILABLE,
        'Service unavailable during user update',
        'The service is temporarily unavailable',
        { operation: 'update_user', userId: '7' }
      );

      // Setup mocks for error scenario
      mockUserRepository.update.and.returnValue(Promise.reject(infrastructureError));
      mockErrorTransformer.transform.and.returnValue(transformedApplicationError);

      // Act & Assert
      await expectAsync(useCase.execute(updateRequest)).toBeRejectedWith(
        transformedApplicationError
      );

      // Assert - Verify error transformation with proper context
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(infrastructureError, {
        operation: 'update_user',
        userId: '7',
      });
    });

    it('should transform generic unknown error from repository', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        userId: 10,
        updateData: { firstName: 'Test' },
        requesterId: 789,
      };

      const genericError = new Error('Unexpected error occurred');
      const transformedApplicationError = new ApplicationError(
        ApplicationErrorCode.UNEXPECTED_ERROR,
        'Unknown error during user update',
        'An unexpected error occurred',
        { operation: 'update_user', userId: '10' }
      );

      // Setup mocks for error scenario
      mockUserRepository.update.and.returnValue(Promise.reject(genericError));
      mockErrorTransformer.transform.and.returnValue(transformedApplicationError);

      // Act & Assert
      await expectAsync(useCase.execute(updateRequest)).toBeRejectedWith(
        transformedApplicationError
      );

      // Assert - Verify error transformation with proper context
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(genericError, {
        operation: 'update_user',
        userId: '10',
      });
    });
  });

  describe('Context Preservation and Error Handling', () => {
    it('should preserve user context through error transformation pipeline', async () => {
      // Arrange
      const updateRequest: UpdateUserRequest = {
        userId: 888,
        updateData: { username: 'conflicting-name' },
        requesterId: 999,
        notifyUser: true,
      };

      const mockValidationError = ValidationError.fromMessage(
        'Username already exists',
        'username',
        ValidationErrorCode.FIELD_NOT_UNIQUE
      );

      const transformedApplicationError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Validation failed',
        'User validation failed',
        { operation: 'update_user', userId: '9' }
      );

      const mockUpdateRequest: UpdateUserRequest = {
        userId: 9,
        updateData: { username: 'conflicting-username' },
        requesterId: 123,
      };

      mockUserRepository.update.and.returnValue(Promise.reject(mockValidationError));
      mockErrorTransformer.transform.and.returnValue(transformedApplicationError);

      // Act & Assert
      await expectAsync(useCase.execute(mockUpdateRequest)).toBeRejected();

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(mockValidationError, {
        operation: 'update_user',
        userId: '9', // Converted to string as expected
      });

      // Assert - Verify no success logging in error scenarios
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should handle edge case of zero user ID correctly', async () => {
      // Arrange - Test edge case with ID 0
      const edgeUpdateRequest: UpdateUserRequest = {
        userId: 0,
        updateData: { firstName: 'EdgeCase' },
        requesterId: 1,
      };

      const mockUserWithZeroId = User.create({
        id: 0,
        username: 'zerouser',
        email: 'zero@example.com',
        firstName: 'Zero',
        lastName: 'User',
        isActive: true,
        role: testRole,
        notificationPreferences: { email: true, system: true, task: true },
      });

      mockUserRepository.update.and.returnValue(Promise.resolve(mockUserWithZeroId));

      // Act
      const result: UpdateUserResult = await useCase.execute(edgeUpdateRequest);

      // Assert - Verify edge case handling
      expect(mockUserRepository.update).toHaveBeenCalledWith(0, { firstName: 'EdgeCase' });
      expect(result).toEqual(mockUserWithZeroId);
      expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', {
        operation: 'update_user',
        userId: '0',
      });
    });
  });

  describe('Orchestration Integration Tests', () => {
    it('should execute complete orchestration workflow without side effects', async () => {
      // Arrange
      const completeUpdateRequest: UpdateUserRequest = {
        userId: 555,
        updateData: {
          email: 'complete@test.com',
          firstName: 'Complete',
          lastName: 'Test',
          isActive: true,
        },
        requesterId: 666,
        notifyUser: false,
      };

      // Act
      const result: UpdateUserResult = await useCase.execute(completeUpdateRequest);

      // Assert - Verify complete orchestration chain
      expect(mockUserRepository.update).toHaveBeenCalledOnceWith(555, {
        email: 'complete@test.com',
        firstName: 'Complete',
        lastName: 'Test',
        isActive: true,
      });

      expect(result).toEqual(mockUpdatedUser);

      expect(mockLogger.info).toHaveBeenCalledOnceWith('User updated successfully', {
        operation: 'update_user',
        userId: '1', // From mockUpdatedUser
      });

      // Assert - Verify proper dependency coordination
      expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
    });

    it('should handle concurrent execution scenarios correctly', async () => {
      // Arrange
      const request1: UpdateUserRequest = {
        userId: 100,
        updateData: { firstName: 'User1' },
        requesterId: 1,
      };

      const request2: UpdateUserRequest = {
        userId: 200,
        updateData: { firstName: 'User2' },
        requesterId: 2,
      };

      // Act - Execute concurrently
      const [result1, result2] = await Promise.all([
        useCase.execute(request1),
        useCase.execute(request2),
      ]);

      // Assert - Verify both executions completed properly
      expect(result1).toEqual(mockUpdatedUser);
      expect(result2).toEqual(mockUpdatedUser);

      // Assert - Verify all repository calls were made
      expect(mockUserRepository.update).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.update).toHaveBeenCalledWith(100, { firstName: 'User1' });
      expect(mockUserRepository.update).toHaveBeenCalledWith(200, { firstName: 'User2' });

      // Assert - Verify all logging was performed
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('Parameter Type Safety and Validation Delegation', () => {
    it('should properly delegate parameter validation to domain layer', async () => {
      // Arrange - Note: This test verifies delegation, not actual validation
      const requestWithComplexData: UpdateUserRequest = {
        userId: 12345,
        updateData: {
          username: 'complex.user-name_123',
          email: 'complex.email+test@subdomain.example.com',
          firstName: 'François', // Unicode character
          lastName: "O'Connor", // Apostrophe
          isActive: false,
        },
        requesterId: 9999,
        notifyUser: true,
      };

      // Act
      const result: UpdateUserResult = await useCase.execute(requestWithComplexData);

      // Assert - Verify exact parameter passing (validation is domain responsibility)
      expect(mockUserRepository.update).toHaveBeenCalledWith(12345, {
        username: 'complex.user-name_123',
        email: 'complex.email+test@subdomain.example.com',
        firstName: 'François',
        lastName: "O'Connor",
        isActive: false,
      });

      expect(result).toEqual(mockUpdatedUser);

      // Assert - Use case should not perform any validation itself
      expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', {
        operation: 'update_user',
        userId: '1',
      });
    });

    it('should handle empty update data correctly by delegating to domain', async () => {
      // Arrange
      const emptyUpdateRequest: UpdateUserRequest = {
        userId: 777,
        updateData: {}, // Empty update data - domain should handle
        requesterId: 888,
      };

      // Act
      const result: UpdateUserResult = await useCase.execute(emptyUpdateRequest);

      // Assert - Verify delegation occurs even with empty data
      expect(mockUserRepository.update).toHaveBeenCalledWith(777, {});
      expect(result).toEqual(mockUpdatedUser);
      expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully', {
        operation: 'update_user',
        userId: '1',
      });
    });
  });
});
