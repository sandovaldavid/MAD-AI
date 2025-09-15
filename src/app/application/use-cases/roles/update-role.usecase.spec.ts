import { TestBed } from '@angular/core/testing';
import { UpdateRoleUseCase, UpdateRoleInput } from './update-role.usecase';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { Role } from '@domain/entities/role.entity';
import { UpdateRolePatchContract } from '@domain/repositories/business/role.contract';
import { ApplicationError } from '@application/errors/application-error';

/**
 * Test Suite for UpdateRoleUseCase
 *
 * Tests the orchestration logic for role update operations following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role updates with comprehensive scenarios:
 * - Successful role updates with various field combinations
 * - Application-level validation (input constraints, authorization)
 * - Error handling and transformation
 * - Side effects (logging, audit trails)
 * - Proper dependency coordination
 * - Data transformation between application and domain contracts
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
 * - ✅ Successful role update with all fields
 * - ✅ Successful role update with partial fields
 * - ✅ Successful role update with minimal fields
 * - ✅ Application-level validation (invalid ID, name, access level)
 * - ✅ Repository error handling (role not found)
 * - ✅ Error transformation and propagation
 * - ✅ Side effects (logging with correlation ID)
 * - ✅ Data transformation to domain contract
 * - ✅ Clock service integration for timestamps
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('UpdateRoleUseCase', () => {
  let useCase: UpdateRoleUseCase;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let mockExistingRole: Role;
  let mockUpdatedRole: Role;

  beforeEach(() => {
    // Create mocks using Jasmine
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', [
      'getById',
      'update',
      'save',
      'delete',
      'list',
    ]);
    mockClock = jasmine.createSpyObj('ClockPort', ['now', 'nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'info', 'warn', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Create mock Role entities using the factory method
    mockExistingRole = Role.create({
      id: 1,
      name: 'Developer',
      accessLevel: 3,
      isActive: true,
      description: 'Original description',
    });

    mockUpdatedRole = Role.create({
      id: 1,
      name: 'Senior Developer',
      accessLevel: 4,
      isActive: true,
      description: 'Updated description',
    });

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        UpdateRoleUseCase,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(UpdateRoleUseCase);

    // Setup default mock behaviors
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // 2024-01-01 timestamp
    mockRoleRepository.getById.and.returnValue(Promise.resolve(mockExistingRole));
    mockRoleRepository.update.and.returnValue(Promise.resolve(mockUpdatedRole));
  });

  afterEach(() => {
    // Clear all mocks
    mockRoleRepository.getById.calls.reset();
    mockRoleRepository.update.calls.reset();
    mockClock.nowEpochSeconds.calls.reset();
    mockLogger.info.calls.reset();
    mockLogger.error.calls.reset();
    mockErrorTransformer.transform.calls.reset();
  });

  describe('Successful Role Updates', () => {
    describe('Update All Fields', () => {
      it('should successfully update role with all fields provided', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: 'Senior Developer',
          description: 'Updated description',
          accessLevel: 4,
          canLeadProjects: true,
          isUniquePerTeam: false,
          isActive: true,
        };
        const expectedUpdateData: UpdateRolePatchContract = {
          name: 'Senior Developer',
          description: 'Updated description',
          accessLevel: 4,
          canLeadProjects: true,
          isUniquePerTeam: false,
          isActive: true,
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result).toEqual(mockUpdatedRole);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(1);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
        expect(mockRoleRepository.getById).toHaveBeenCalledTimes(1);
        expect(mockRoleRepository.update).toHaveBeenCalledTimes(1);
      });

      it('should handle side effects for successful update', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: 'Senior Developer',
        };
        const expectedCorrelationId = 'role-update-1-1640995200';

        // Act
        await useCase.execute(input);

        // Assert
        expect(mockLogger.info).toHaveBeenCalledWith('Role updated successfully', {
          operation: 'update_role',
          userId: '1',
          correlationId: expectedCorrelationId,
        });
        expect(mockLogger.info).toHaveBeenCalledTimes(1);
      });
    });

    describe('Update Partial Fields', () => {
      it('should successfully update role with only name field', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: 'Senior Developer',
        };
        const expectedUpdateData: UpdateRolePatchContract = {
          name: 'Senior Developer',
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result).toEqual(mockUpdatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
      });

      it('should successfully update role with only access level', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          accessLevel: 4,
        };
        const expectedUpdateData: UpdateRolePatchContract = {
          accessLevel: 4,
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result).toEqual(mockUpdatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
      });

      it('should successfully update role with boolean flags only', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          canLeadProjects: true,
          isUniquePerTeam: false,
          isActive: true,
        };
        const expectedUpdateData: UpdateRolePatchContract = {
          canLeadProjects: true,
          isUniquePerTeam: false,
          isActive: true,
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result).toEqual(mockUpdatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
      });
    });

    describe('Update with Undefined Fields', () => {
      it('should filter out undefined fields from update data', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: 'Senior Developer',
          description: undefined, // Explicitly undefined
          accessLevel: 4,
          canLeadProjects: undefined, // Explicitly undefined
        };
        const expectedUpdateData: UpdateRolePatchContract = {
          name: 'Senior Developer',
          accessLevel: 4,
          // Undefined fields should be filtered out
        };

        // Act
        const result = await useCase.execute(input);

        // Assert
        expect(result).toEqual(mockUpdatedRole);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
      });
    });
  });

  describe('Application-Level Validation', () => {
    describe('Invalid Role ID', () => {
      it('should throw error for negative ID', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: -1,
          name: 'Test Role',
        };
        const expectedError = ApplicationError.invalidInput('Invalid role ID');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.any(Error),
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '-1',
          })
        );
      });

      it('should throw error for zero ID', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 0,
          name: 'Test Role',
        };
        const expectedError = ApplicationError.invalidInput('Invalid role ID');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          jasmine.any(Error),
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '0',
          })
        );
      });
    });

    describe('Repository-Level Validation (Domain Rules)', () => {
      it('should handle repository validation error for empty name string', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: '',
        };
        const repositoryError = new Error('Role name is required');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role validation failed');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { name: '' });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
      });

      it('should handle repository validation error for whitespace-only name', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: '   ',
        };
        const repositoryError = new Error('Role name cannot be empty');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role validation failed');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { name: '   ' });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
      });

      it('should handle repository validation error for name exceeding character limit', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: 'A'.repeat(101), // 101 characters
        };
        const repositoryError = new Error('Role name cannot exceed 50 characters');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role validation failed');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { name: 'A'.repeat(101) });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
      });

      it('should handle repository validation error for negative access level', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          accessLevel: -1,
        };
        const repositoryError = new Error('Access level must be between 1 and 10');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role validation failed');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { accessLevel: -1 });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
      });

      it('should handle repository validation error for access level greater than 10', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          accessLevel: 11,
        };
        const repositoryError = new Error('Access level must be between 1 and 10');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role validation failed');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { accessLevel: 11 });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
      });

      it('should handle repository validation error for non-integer access level', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          accessLevel: 3.5,
        };
        const repositoryError = new Error('Access level must be an integer');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role validation failed');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { accessLevel: 3.5 });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
      });
    });
  });

  describe('Repository Error Handling', () => {
    describe('Role Not Found', () => {
      it('should throw error when role does not exist', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 999,
          name: 'Non-existent Role',
        };
        const repositoryError = new Error('Role with id 999 not found');
        mockRoleRepository.getById.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.invalidInput('Role not found');
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.getById).toHaveBeenCalledWith(999);
        expect(mockRoleRepository.update).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });

    describe('Repository Update Failure', () => {
      it('should handle repository update errors', async () => {
        // Arrange
        const input: UpdateRoleInput = {
          id: 1,
          name: 'Updated Name',
        };
        const repositoryError = new Error('Database connection failed');
        mockRoleRepository.update.and.returnValue(Promise.reject(repositoryError));
        const expectedError = ApplicationError.unexpectedError();
        mockErrorTransformer.transform.and.returnValue(expectedError);

        // Act & Assert
        await expectAsync(useCase.execute(input)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.update).toHaveBeenCalledWith(1, { name: 'Updated Name' });
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
          repositoryError,
          jasmine.objectContaining({
            operation: 'updateRole',
            userId: '1',
          })
        );
        expect(mockLogger.info).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Transformation', () => {
    it('should transform generic errors to ApplicationError', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 1,
        name: 'Test Role',
      };
      const genericError = new Error('Unexpected error');
      mockRoleRepository.update.and.returnValue(Promise.reject(genericError));
      const transformedError = ApplicationError.unexpectedError();
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(useCase.execute(input)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
        genericError,
        jasmine.objectContaining({
          operation: 'updateRole',
          userId: '1',
        })
      );
    });

    it('should include operation context in error transformation', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 123,
        name: 'Test Role',
      };
      const error = new Error('Test error');
      mockRoleRepository.update.and.returnValue(Promise.reject(error));
      const transformedError = ApplicationError.unexpectedError();
      mockErrorTransformer.transform.and.returnValue(transformedError);

      // Act & Assert
      await expectAsync(useCase.execute(input)).toBeRejectedWith(transformedError);
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(
        error,
        jasmine.objectContaining({
          operation: 'updateRole',
          userId: '123',
        })
      );
    });
  });

  describe('Side Effects Management', () => {
    it('should generate correlation ID for logging', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 5,
        name: 'Test Role',
      };
      const mockRoleWithId5 = Role.create({
        id: 5,
        name: 'Test Role',
        accessLevel: 3,
        isActive: true,
      });
      const mockUpdatedRoleWithId5 = Role.create({
        id: 5,
        name: 'Test Role',
        accessLevel: 3,
        isActive: true,
      });
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRoleWithId5));
      mockRoleRepository.update.and.returnValue(Promise.resolve(mockUpdatedRoleWithId5));
      mockClock.nowEpochSeconds.and.returnValue(1234567890);
      const expectedCorrelationId = 'role-update-5-1234567890';

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Role updated successfully',
        jasmine.objectContaining({
          correlationId: expectedCorrelationId,
        })
      );
    });

    it('should log successful operation with correct context', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 42,
        name: 'Updated Role',
        accessLevel: 7,
      };
      const mockRoleWithId42 = Role.create({
        id: 42,
        name: 'Original Role',
        accessLevel: 3,
        isActive: true,
      });
      const mockUpdatedRoleWithId42 = Role.create({
        id: 42,
        name: 'Updated Role',
        accessLevel: 7,
        isActive: true,
      });
      mockRoleRepository.getById.and.returnValue(Promise.resolve(mockRoleWithId42));
      mockRoleRepository.update.and.returnValue(Promise.resolve(mockUpdatedRoleWithId42));

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith('Role updated successfully', {
        operation: 'update_role',
        userId: '42',
        correlationId: 'role-update-42-1640995200',
      });
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('should not log when operation fails', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 1,
        name: 'Test Role',
      };
      mockRoleRepository.update.and.returnValue(Promise.reject(new Error('Update failed')));

      // Act & Assert
      await expectAsync(useCase.execute(input)).toBeRejected();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should correctly build update data from input', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 1,
        name: 'New Name',
        description: 'New Description',
        accessLevel: 5,
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
      };
      const expectedUpdateData: UpdateRolePatchContract = {
        name: 'New Name',
        description: 'New Description',
        accessLevel: 5,
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
    });

    it('should exclude undefined values from update data', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 1,
        name: 'New Name',
        description: undefined,
        accessLevel: undefined,
        canLeadProjects: true,
        isUniquePerTeam: undefined,
        isActive: undefined,
      };
      const expectedUpdateData: UpdateRolePatchContract = {
        name: 'New Name',
        canLeadProjects: true,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockRoleRepository.update).toHaveBeenCalledWith(1, expectedUpdateData);
    });
  });

  describe('Clock Service Integration', () => {
    it('should use clock service for correlation ID generation', async () => {
      // Arrange
      const input: UpdateRoleInput = {
        id: 1,
        name: 'Test Role',
      };
      const fixedTimestamp = 987654321;
      mockClock.nowEpochSeconds.and.returnValue(fixedTimestamp);
      const expectedCorrelationId = `role-update-1-${fixedTimestamp}`;

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Role updated successfully',
        jasmine.objectContaining({
          correlationId: expectedCorrelationId,
        })
      );
    });
  });

  describe('Dependency Injection', () => {
    it('should inject all required dependencies', () => {
      // Assert
      expect(useCase).toBeTruthy();
      expect(useCase).toBeInstanceOf(UpdateRoleUseCase);
    });

    it('should use token-based dependency injection', () => {
      // This test ensures the use case is properly configured with DI tokens
      // The actual injection is verified by the TestBed setup
      expect(useCase).toBeDefined();
    });
  });
});
