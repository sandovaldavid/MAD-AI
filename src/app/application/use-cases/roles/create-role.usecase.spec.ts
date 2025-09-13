import { TestBed } from '@angular/core/testing';
import { CreateRoleUseCase } from './create-role.usecase';
import { ROLE_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { Role } from '@domain/entities/role.entity';
import type { CreateRoleRequest } from '@application/types/roles.types';
import type { CreateRoleContract } from '@domain/repositories/business/role.contract';

/**
 * Test Suite for CreateRoleUseCase
 *
 * Tests the orchestration logic for role creation operations following Clean Architecture principles.
 * Focuses on coordination between domain repository, validation, error handling, and side effects.
 * Does not test business logic (handled by Domain layer) or infrastructure (handled by Infrastructure layer).
 *
 * @description
 * Validates the Application Layer orchestration for role creation with comprehensive scenarios:
 * - Successful role creation with various field combinations
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
 * - ✅ Successful role creation with all fields
 * - ✅ Successful role creation with minimal fields
 * - ✅ Application-level validation (invalid request, missing name, unauthorized)
 * - ✅ Repository error handling (creation failures)
 * - ✅ Error transformation and propagation
 * - ✅ Side effects (logging with correlation ID)
 * - ✅ Data transformation to domain contract
 * - ✅ Authorization validation and logging
 *
 * @since 2.0.0
 * @layer Application Testing
 */
describe('CreateRoleUseCase', () => {
  let useCase: CreateRoleUseCase;
  let mockRoleRepository: jasmine.SpyObj<RoleRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  // Test data
  let validRequest: CreateRoleRequest;
  let mockCreatedRole: Role;
  let validDomainContract: CreateRoleContract;

  beforeEach(() => {
    // Create mocks using Jasmine
    mockRoleRepository = jasmine.createSpyObj('RoleRepository', [
      'create',
      'getById',
      'update',
      'delete',
      'list',
    ]);
    mockClock = jasmine.createSpyObj('ClockPort', ['now', 'nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'info', 'warn', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    // Setup test data
    validRequest = {
      name: 'Project Manager',
      accessLevel: 3,
      description: 'Manages project execution',
      canLeadProjects: true,
      isUniquePerTeam: false,
      requesterId: 123,
    };

    validDomainContract = {
      name: 'Project Manager',
      accessLevel: 3,
      description: 'Manages project execution',
      canLeadProjects: true,
      isUniquePerTeam: false,
      createdByUserId: 123,
    };

    // Create mock Role entity using the factory method
    mockCreatedRole = Role.create({
      id: 1,
      name: 'Project Manager',
      accessLevel: 3,
      description: 'Manages project execution',
      isActive: true,
    });

    // Setup default mock behaviors
    mockRoleRepository.create.and.returnValue(Promise.resolve(mockCreatedRole));
    mockClock.nowEpochSeconds.and.returnValue(1640995200); // Fixed timestamp for testing
    mockLogger.info.and.stub();
    mockErrorTransformer.transform.and.callFake((error: any) => error);

    // Setup TestBed
    TestBed.configureTestingModule({
      providers: [
        CreateRoleUseCase,
        { provide: ROLE_REPOSITORY, useValue: mockRoleRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(CreateRoleUseCase);
  });

  describe('Successful Role Creation', () => {
    describe('Role Creation with Complete Data', () => {
      it('should successfully create role with all fields provided', async () => {
        // Arrange
        const request: CreateRoleRequest = {
          name: 'Senior Developer',
          accessLevel: 4,
          description: 'Experienced software developer',
          canLeadProjects: true,
          isUniquePerTeam: false,
          requesterId: 456,
        };
        const expectedContract: CreateRoleContract = {
          name: 'Senior Developer',
          accessLevel: 4,
          description: 'Experienced software developer',
          canLeadProjects: true,
          isUniquePerTeam: false,
          createdByUserId: 456,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert - Verify orchestration order and parameters
        expect(mockRoleRepository.create).toHaveBeenCalledWith(expectedContract);
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '456',
          operation: 'create_role_authorization'
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', {
          operation: 'create_role',
          userId: '456',
          correlationId: 'role-create-1-1640995200',
        });
        expect(result).toEqual(mockCreatedRole);
      });

      it('should successfully create role with minimal required fields', async () => {
        // Arrange
        const minimalRequest: CreateRoleRequest = {
          name: 'Basic Role',
          accessLevel: 1,
          requesterId: 123,
        };
        const expectedContract: CreateRoleContract = {
          name: 'Basic Role',
          accessLevel: 1,
          description: undefined,
          canLeadProjects: undefined,
          isUniquePerTeam: undefined,
          createdByUserId: 123,
        };

        // Act
        const result = await useCase.execute(minimalRequest);

        // Assert
        expect(mockRoleRepository.create).toHaveBeenCalledWith(expectedContract);
        expect(result).toEqual(mockCreatedRole);
      });

      it('should successfully create role with optional fields set to false', async () => {
        // Arrange
        const request: CreateRoleRequest = {
          name: 'Limited Role',
          accessLevel: 5,
          canLeadProjects: false,
          isUniquePerTeam: false,
          requesterId: 789,
        };
        const expectedContract: CreateRoleContract = {
          name: 'Limited Role',
          accessLevel: 5,
          description: undefined,
          canLeadProjects: false,
          isUniquePerTeam: false,
          createdByUserId: 789,
        };

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(mockRoleRepository.create).toHaveBeenCalledWith(expectedContract);
        expect(result).toEqual(mockCreatedRole);
      });
    });

    describe('Orchestration Flow Verification', () => {
      it('should execute operations in correct order: validate → authorize → create → side effects', async () => {
        // Arrange
        let operationOrder: string[] = [];
        
        // Mock logger to track call order
        mockLogger.info.and.callFake((message: string) => {
          if (message === 'Authorization validated for role creation') {
            operationOrder.push('authorization');
          } else if (message === 'Role created successfully') {
            operationOrder.push('side_effects');
          }
        });
        
        // Mock repository to track call order
        mockRoleRepository.create.and.callFake(async (contract) => {
          operationOrder.push('repository_create');
          return mockCreatedRole;
        });

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify correct orchestration order
        expect(operationOrder).toEqual(['authorization', 'repository_create', 'side_effects']);
      });

      it('should map application request to domain contract correctly', async () => {
        // Arrange - Already set up in beforeEach

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify exact mapping
        expect(mockRoleRepository.create).toHaveBeenCalledWith(validDomainContract);
        expect(mockRoleRepository.create).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Application Rules Validation', () => {
    describe('Invalid Request Validation', () => {
      it('should throw ApplicationError when request is null', async () => {
        // Arrange
        const nullRequest = null as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Request is null or undefined',
          'Request data is required for role creation'
        );

        // Act & Assert
        await expectAsync(useCase.execute(nullRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when request is undefined', async () => {
        // Arrange
        const undefinedRequest = undefined as any;
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Request is null or undefined',
          'Request data is required for role creation'
        );

        // Act & Assert
        await expectAsync(useCase.execute(undefinedRequest)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('Name Validation', () => {
      it('should throw ApplicationError when name is missing', async () => {
        // Arrange
        const requestWithoutName: CreateRoleRequest = {
          name: undefined as any,
          accessLevel: 2,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required',
          'Role name must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutName)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when name is empty string', async () => {
        // Arrange
        const requestWithEmptyName: CreateRoleRequest = {
          name: '',
          accessLevel: 2,
          requesterId: 123,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INVALID_INPUT,
          'Invalid input provided: Role name is required',
          'Role name must be provided'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithEmptyName)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
      });

      it('should accept valid name without triggering application validation errors', async () => {
        // Arrange
        const requestWithValidName: CreateRoleRequest = {
          name: 'Valid Role Name',
          accessLevel: 2,
          requesterId: 123,
        };

        // Act
        await useCase.execute(requestWithValidName);

        // Assert - Validation should pass and repository should be called
        expect(mockRoleRepository.create).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', jasmine.any(Object));
      });
    });

    describe('Business Logic Delegation', () => {
      it('should delegate business logic validation to domain layer', async () => {
        // Arrange
        const requestWithPotentialBusinessRuleViolation: CreateRoleRequest = {
          name: 'admin', // This might be a reserved name (business rule)
          accessLevel: 5,
          requesterId: 123,
        };

        // Note: Business logic validation (reserved names, length limits) 
        // should be handled by Role.create() in domain layer
        // Application layer only validates presence and basic structure

        // Act
        await useCase.execute(requestWithPotentialBusinessRuleViolation);

        // Assert - Application layer should pass request to domain
        expect(mockRoleRepository.create).toHaveBeenCalledWith({
          name: 'admin',
          accessLevel: 5,
          description: undefined,
          canLeadProjects: undefined,
          isUniquePerTeam: undefined,
          createdByUserId: 123,
        });
      });
    });
  });

  describe('Authorization Validation', () => {
    describe('Missing Requester Validation', () => {
      it('should throw ApplicationError when requesterId is missing', async () => {
        // Arrange
        const requestWithoutRequester: CreateRoleRequest = {
          name: 'Test Role',
          accessLevel: 2,
          // requesterId is intentionally missing
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role creation',
          'You must be authenticated to create roles'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithoutRequester)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when requesterId is null', async () => {
        // Arrange
        const requestWithNullRequester: CreateRoleRequest = {
          name: 'Test Role',
          accessLevel: 2,
          requesterId: null as any,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role creation',
          'You must be authenticated to create roles'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithNullRequester)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
      });

      it('should throw ApplicationError when requesterId is undefined', async () => {
        // Arrange
        const requestWithUndefinedRequester: CreateRoleRequest = {
          name: 'Test Role',
          accessLevel: 2,
          requesterId: undefined,
        };
        const expectedError = new ApplicationError(
          ApplicationErrorCode.INSUFFICIENT_PERMISSIONS,
          'Requester ID is required for role creation',
          'You must be authenticated to create roles'
        );

        // Act & Assert
        await expectAsync(useCase.execute(requestWithUndefinedRequester)).toBeRejectedWith(expectedError);
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('Successful Authorization', () => {
      it('should successfully validate authorization with valid requesterId', async () => {
        // Arrange
        const validRequest: CreateRoleRequest = {
          name: 'Authorized Role',
          accessLevel: 3,
          description: 'Role created by authorized user',
          requesterId: 456,
        };

        // Act
        await useCase.execute(validRequest);

        // Assert - Verify authorization logging
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '456',
          operation: 'create_role_authorization'
        });
        expect(mockRoleRepository.create).toHaveBeenCalled();
      });

      it('should log authorization validation with correct user context', async () => {
        // Arrange
        const requestWithDifferentUser: CreateRoleRequest = {
          name: 'Manager Role',
          accessLevel: 3,
          requesterId: 789,
        };

        // Act
        await useCase.execute(requestWithDifferentUser);

        // Assert - Verify correct user ID is logged
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '789',
          operation: 'create_role_authorization'
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', jasmine.objectContaining({
          operation: 'create_role',
          userId: '789',
        }));
      });

      it('should proceed with creation after successful authorization', async () => {
        // Arrange
        const authorizedRequest: CreateRoleRequest = {
          name: 'Executive Role',
          accessLevel: 5,
          canLeadProjects: true,
          requesterId: 999,
        };

        // Act
        const result = await useCase.execute(authorizedRequest);

        // Assert - Verify full flow completion
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', jasmine.any(Object));
        expect(mockRoleRepository.create).toHaveBeenCalledWith({
          name: 'Executive Role',
          accessLevel: 5,
          description: undefined,
          canLeadProjects: true,
          isUniquePerTeam: undefined,
          createdByUserId: 999,
        });
        expect(result).toEqual(mockCreatedRole);
      });
    });

    describe('Authorization Flow Integration', () => {
      it('should perform authorization before repository operations', async () => {
        // Arrange
        let operationOrder: string[] = [];
        
        mockLogger.info.and.callFake((message: string) => {
          if (message === 'Authorization validated for role creation') {
            operationOrder.push('authorization');
          }
        });
        
        mockRoleRepository.create.and.callFake(async () => {
          operationOrder.push('repository');
          return mockCreatedRole;
        });

        // Act
        await useCase.execute(validRequest);

        // Assert - Authorization must happen before repository call
        expect(operationOrder).toEqual(['authorization', 'repository']);
      });

      it('should not call repository if authorization fails', async () => {
        // Arrange
        const unauthorizedRequest: CreateRoleRequest = {
          name: 'Unauthorized Role',
          accessLevel: 2,
          // requesterId is intentionally missing
        };

        // Act & Assert
        await expectAsync(useCase.execute(unauthorizedRequest)).toBeRejected();
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
        expect(mockLogger.info).not.toHaveBeenCalledWith('Authorization validated for role creation', jasmine.any(Object));
      });
    });
  });

  describe('Error Handling and Transformation', () => {
    describe('Repository Error Handling', () => {
      it('should transform repository errors through ApplicationErrorTransformer', async () => {
        // Arrange
        const domainError = new Error('Domain validation failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Role creation failed due to business rule violation',
          'Domain validation failed'
        );
        
        mockRoleRepository.create.and.returnValue(Promise.reject(domainError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(domainError);
      });

      it('should handle repository connection failures', async () => {
        // Arrange
        const connectionError = new Error('Database connection failed');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.SERVICE_UNAVAILABLE,
          'External service error',
          'Database connection failed'
        );
        
        mockRoleRepository.create.and.returnValue(Promise.reject(connectionError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(connectionError);
      });

      it('should handle unexpected repository errors', async () => {
        // Arrange
        const unexpectedError = new Error('Unexpected repository failure');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Internal server error occurred',
          'Unexpected repository failure'
        );
        
        mockRoleRepository.create.and.returnValue(Promise.reject(unexpectedError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(unexpectedError);
      });
    });

    describe('Error Transformation Verification', () => {
      it('should always call error transformer when catching exceptions', async () => {
        // Arrange
        const originalError = new Error('Any error');
        mockRoleRepository.create.and.returnValue(Promise.reject(originalError));

        // Act
        try {
          await useCase.execute(validRequest);
        } catch (error) {
          // Ignoring the error for this test
        }

        // Assert - Error transformer should always be called
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(originalError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledTimes(1);
      });

      it('should propagate transformed errors to caller', async () => {
        // Arrange
        const originalError = new Error('Original error');
        const customTransformedError = new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          'Custom transformed error',
          'Custom description'
        );
        
        mockRoleRepository.create.and.returnValue(Promise.reject(originalError));
        mockErrorTransformer.transform.and.returnValue(customTransformedError);

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejectedWith(customTransformedError);
      });

      it('should not call repository or side effects when application validation fails', async () => {
        // Arrange
        const invalidRequest: CreateRoleRequest = {
          name: '',
          accessLevel: 1,
          requesterId: 123,
        };

        // Act & Assert
        await expectAsync(useCase.execute(invalidRequest)).toBeRejected();
        
        // Verify no external calls were made after validation failure
        expect(mockRoleRepository.create).not.toHaveBeenCalled();
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled(); // Application errors are not transformed
        expect(mockLogger.info).not.toHaveBeenCalledWith('Role created successfully', jasmine.any(Object));
      });
    });

    describe('Error Propagation Chain', () => {
      it('should handle errors at each stage of the orchestration', async () => {
        // Test that errors from different stages are properly handled
        
        // Stage 1: Application validation errors (not transformed)
        const invalidRequestError = useCase.execute({ name: '', accessLevel: 1, requesterId: 123 });
        await expectAsync(invalidRequestError).toBeRejectedWithError(ApplicationError);
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled();

        // Reset mocks
        mockErrorTransformer.transform.calls.reset();

        // Stage 2: Repository errors (transformed)
        const repositoryError = new Error('Repository failed');
        mockRoleRepository.create.and.returnValue(Promise.reject(repositoryError));
        
        const repositoryFailure = useCase.execute(validRequest);
        await expectAsync(repositoryFailure).toBeRejected();
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
      });

      it('should maintain error context through transformation', async () => {
        // Arrange
        const contextualError = new Error('Role with name "admin" already exists');
        const transformedError = new ApplicationError(
          ApplicationErrorCode.ROLE_IN_USE,
          'Duplicate resource error',
          'Role with name "admin" already exists'
        );
        
        mockRoleRepository.create.and.returnValue(Promise.reject(contextualError));
        mockErrorTransformer.transform.and.returnValue(transformedError);

        const duplicateRequest: CreateRoleRequest = {
          name: 'admin',
          accessLevel: 5,
          requesterId: 123,
        };

        // Act & Assert
        await expectAsync(useCase.execute(duplicateRequest)).toBeRejectedWith(transformedError);
        expect(mockErrorTransformer.transform).toHaveBeenCalledWith(contextualError);
      });
    });
  });

  describe('Side Effects and Audit Logging', () => {
    describe('Successful Creation Logging', () => {
      it('should log role creation success with correlation ID', async () => {
        // Arrange
        const fixedTimestamp = 1640995200;
        mockClock.nowEpochSeconds.and.returnValue(fixedTimestamp);

        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Verify success logging with correlation ID
        const expectedCorrelationId = `role-create-${result.id}-${fixedTimestamp}`;
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', {
          operation: 'create_role',
          userId: validRequest.requesterId!.toString(),
          correlationId: expectedCorrelationId,
        });
      });

      it('should generate unique correlation IDs for different role creations', async () => {
        // Arrange
        const firstTimestamp = 1640995200;
        const secondTimestamp = 1640995260;
        
        // First creation
        mockClock.nowEpochSeconds.and.returnValue(firstTimestamp);
        const firstResult = await useCase.execute(validRequest);
        
        // Second creation with different timestamp
        mockClock.nowEpochSeconds.and.returnValue(secondTimestamp);
        const secondResult = await useCase.execute({
          ...validRequest,
          name: 'Another Role',
        });

        // Assert - Different correlation IDs
        const firstCorrelationId = `role-create-${firstResult.id}-${firstTimestamp}`;
        const secondCorrelationId = `role-create-${secondResult.id}-${secondTimestamp}`;
        
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({ correlationId: firstCorrelationId }));
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({ correlationId: secondCorrelationId }));
        expect(firstCorrelationId).not.toBe(secondCorrelationId);
      });

      it('should log with correct user context for different requesters', async () => {
        // Arrange
        const adminRequest: CreateRoleRequest = {
          name: 'Admin Role',
          accessLevel: 5,
          requesterId: 999,
        };

        // Act
        await useCase.execute(adminRequest);

        // Assert - Verify user context is correctly logged
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({
            operation: 'create_role',
            userId: '999',
          }));
      });
    });

    describe('Audit Trail Completeness', () => {
      it('should create complete audit trail for successful operations', async () => {
        // Arrange
        const auditRequest: CreateRoleRequest = {
          name: 'Audited Role',
          accessLevel: 4,
          description: 'Role with complete audit trail',
          canLeadProjects: true,
          isUniquePerTeam: false,
          requesterId: 555,
        };

        // Act
        await useCase.execute(auditRequest);

        // Assert - Complete audit trail
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '555',
          operation: 'create_role_authorization'
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({
            operation: 'create_role',
            userId: '555',
            correlationId: jasmine.stringMatching(/^role-create-\d+-\d+$/)
          }));
      });

      it('should maintain audit sequence: authorization → creation', async () => {
        // Arrange
        let auditOrder: string[] = [];
        
        mockLogger.info.and.callFake((message: string, context?: any) => {
          if (message === 'Authorization validated for role creation') {
            auditOrder.push('authorization');
          } else if (message === 'Role created successfully') {
            auditOrder.push('creation');
          }
        });

        // Act
        await useCase.execute(validRequest);

        // Assert - Correct audit sequence
        expect(auditOrder).toEqual(['authorization', 'creation']);
      });

      it('should not log success when operation fails', async () => {
        // Arrange
        mockRoleRepository.create.and.returnValue(Promise.reject(new Error('Creation failed')));

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        
        // Verify authorization was logged but not success
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', jasmine.any(Object));
        expect(mockLogger.info).not.toHaveBeenCalledWith('Role created successfully', jasmine.any(Object));
      });
    });

    describe('Clock Dependency Usage', () => {
      it('should use clock service for timestamp generation in correlation IDs', async () => {
        // Arrange
        const customTimestamp = 1735689600; // Jan 1, 2025
        mockClock.nowEpochSeconds.and.returnValue(customTimestamp);

        // Act
        const result = await useCase.execute(validRequest);

        // Assert - Clock service was called and timestamp was used
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({
            correlationId: `role-create-${result.id}-${customTimestamp}`
          }));
      });

      it('should handle clock service consistently across multiple calls', async () => {
        // Arrange
        const timestamps = [1640995200, 1640995260, 1640995320];
        let callCount = 0;
        
        mockClock.nowEpochSeconds.and.callFake(() => {
          return timestamps[callCount++] || timestamps[timestamps.length - 1];
        });

        // Act
        await useCase.execute({ name: 'First Role', accessLevel: 1, requesterId: 123 });
        await useCase.execute({ name: 'Second Role', accessLevel: 2, requesterId: 456 });

        // Assert - Clock was called for each operation
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(2);
      });
    });

    describe('Domain Event Simulation', () => {
      it('should simulate domain event publishing through structured logging', async () => {
        // Arrange
        const eventRequest: CreateRoleRequest = {
          name: 'Event Role',
          accessLevel: 2,
          description: 'Role for event testing',
          requesterId: 777,
        };

        // Act
        const result = await useCase.execute(eventRequest);

        // Assert - Verify structured logging simulates domain events
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({
            operation: 'create_role', // Event type
            userId: '777',            // Event context
            correlationId: jasmine.stringMatching(/^role-create-\d+-\d+$/) // Event correlation
          }));
      });

      it('should include relevant role context in event logging', async () => {
        // Arrange
        const contextRequest: CreateRoleRequest = {
          name: 'Context Role',
          accessLevel: 5,
          canLeadProjects: true,
          requesterId: 888,
        };

        // Act
        const result = await useCase.execute(contextRequest);

        // Assert - Event contains contextual information
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', {
          operation: 'create_role',
          userId: '888',
          correlationId: `role-create-${result.id}-${mockClock.nowEpochSeconds()}`,
        });
      });
    });
  });

  describe('Integration and Data Transformation', () => {
    describe('Application to Domain Contract Mapping', () => {
      it('should correctly map all application request fields to domain contract', async () => {
        // Arrange
        const fullRequest: CreateRoleRequest = {
          name: 'Full Mapping Test',
          accessLevel: 4,
          description: 'Complete field mapping',
          canLeadProjects: true,
          isUniquePerTeam: false,
          requesterId: 101,
        };
        const expectedContract = {
          name: 'Full Mapping Test',
          accessLevel: 4,
          description: 'Complete field mapping',
          canLeadProjects: true,
          isUniquePerTeam: false,
          createdByUserId: 101,
        };

        // Act
        await useCase.execute(fullRequest);

        // Assert - Verify exact mapping
        expect(mockRoleRepository.create).toHaveBeenCalledWith(expectedContract);
      });

      it('should handle optional fields correctly in domain contract', async () => {
        // Arrange
        const partialRequest: CreateRoleRequest = {
          name: 'Partial Mapping Test',
          accessLevel: 2,
          // description is undefined
          // canLeadProjects is undefined
          // isUniquePerTeam is undefined
          requesterId: 202,
        };
        const expectedContract = {
          name: 'Partial Mapping Test',
          accessLevel: 2,
          description: undefined,
          canLeadProjects: undefined,
          isUniquePerTeam: undefined,
          createdByUserId: 202,
        };

        // Act
        await useCase.execute(partialRequest);

        // Assert - Verify optional fields are preserved as undefined
        expect(mockRoleRepository.create).toHaveBeenCalledWith(expectedContract);
      });

      it('should handle boolean false values correctly', async () => {
        // Arrange
        const booleanFalseRequest: CreateRoleRequest = {
          name: 'Boolean False Test',
          accessLevel: 2,
          canLeadProjects: false,
          isUniquePerTeam: false,
          requesterId: 303,
        };
        const expectedContract = {
          name: 'Boolean False Test',
          accessLevel: 2,
          description: undefined,
          canLeadProjects: false,
          isUniquePerTeam: false,
          createdByUserId: 303,
        };

        // Act
        await useCase.execute(booleanFalseRequest);

        // Assert - Verify false booleans are preserved
        expect(mockRoleRepository.create).toHaveBeenCalledWith(expectedContract);
      });

      it('should transform requesterId to createdByUserId consistently', async () => {
        // Arrange
        const requests = [
          { name: 'Test 1', accessLevel: 1, requesterId: 111 },
          { name: 'Test 2', accessLevel: 2, requesterId: 222 },
          { name: 'Test 3', accessLevel: 3, requesterId: 333 }
        ];

        // Act & Assert
        for (const request of requests) {
          await useCase.execute(request);
          expect(mockRoleRepository.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ createdByUserId: request.requesterId })
          );
        }
      });
    });

    describe('End-to-End Orchestration Flow', () => {
      it('should execute complete flow: validation → authorization → mapping → creation → side effects', async () => {
        // Arrange
        let executionOrder: string[] = [];
        const testRequest: CreateRoleRequest = {
          name: 'E2E Flow Test',
          accessLevel: 3,
          description: 'End-to-end orchestration test',
          canLeadProjects: true,
          isUniquePerTeam: true,
          requesterId: 404,
        };

        // Mock repository to track execution order
        mockRoleRepository.create.and.callFake(async (contract) => {
          executionOrder.push('repository_create');
          return mockCreatedRole;
        });

        // Mock logger to track execution order
        mockLogger.info.and.callFake((message: string, context?: any) => {
          if (message === 'Authorization validated for role creation') {
            executionOrder.push('authorization');
          } else if (message === 'Role created successfully') {
            executionOrder.push('side_effects');
          }
        });

        // Act
        const result = await useCase.execute(testRequest);

        // Assert - Complete orchestration flow
        expect(executionOrder).toEqual(['authorization', 'repository_create', 'side_effects']);
        expect(result).toEqual(mockCreatedRole);
        
        // Verify all stages executed with correct data
        expect(mockRoleRepository.create).toHaveBeenCalledWith({
          name: 'E2E Flow Test',
          accessLevel: 3,
          description: 'End-to-end orchestration test',
          canLeadProjects: true,
          isUniquePerTeam: true,
          createdByUserId: 404,
        });
      });

      it('should maintain data integrity throughout the orchestration', async () => {
        // Arrange
        const integrityRequest: CreateRoleRequest = {
          name: 'Data Integrity Test',
          accessLevel: 5,
          description: 'Testing data consistency',
          canLeadProjects: false,
          isUniquePerTeam: true,
          requesterId: 505,
        };

        // Act
        const result = await useCase.execute(integrityRequest);

        // Assert - Verify data consistency across all layers
        
        // 1. Authorization used correct requesterId
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '505',
          operation: 'create_role_authorization'
        });

        // 2. Repository received correctly mapped contract
        expect(mockRoleRepository.create).toHaveBeenCalledWith({
          name: 'Data Integrity Test',
          accessLevel: 5,
          description: 'Testing data consistency',
          canLeadProjects: false,
          isUniquePerTeam: true,
          createdByUserId: 505,
        });

        // 3. Side effects logged with consistent user context
        expect(mockLogger.info).toHaveBeenCalledWith('Role created successfully', 
          jasmine.objectContaining({
            operation: 'create_role',
            userId: '505',
          }));

        // 4. Correct domain entity returned
        expect(result).toEqual(mockCreatedRole);
      });

      it('should handle complex role configuration end-to-end', async () => {
        // Arrange
        const complexRequest: CreateRoleRequest = {
          name: 'Senior Technical Lead',
          accessLevel: 6,
          description: 'Senior technical leadership role with project management responsibilities',
          canLeadProjects: true,
          isUniquePerTeam: true,
          requesterId: 606,
        };

        // Act
        const result = await useCase.execute(complexRequest);

        // Assert - Complex configuration handled correctly
        expect(mockRoleRepository.create).toHaveBeenCalledWith({
          name: 'Senior Technical Lead',
          accessLevel: 6,
          description: 'Senior technical leadership role with project management responsibilities',
          canLeadProjects: true,
          isUniquePerTeam: true,
          createdByUserId: 606,
        });
        
        expect(result).toEqual(mockCreatedRole);
      });
    });

    describe('Dependency Coordination', () => {
      it('should coordinate all injected dependencies correctly', async () => {
        // Arrange
        const coordinationRequest: CreateRoleRequest = {
          name: 'Dependency Coordination Test',
          accessLevel: 3,
          requesterId: 707,
        };

        // Act
        await useCase.execute(coordinationRequest);

        // Assert - All dependencies were used appropriately
        expect(mockRoleRepository.create).toHaveBeenCalled(); // Repository dependency
        expect(mockLogger.info).toHaveBeenCalled(); // Logger dependency
        expect(mockClock.nowEpochSeconds).toHaveBeenCalled(); // Clock dependency
        expect(mockErrorTransformer.transform).not.toHaveBeenCalled(); // Error transformer (not needed on success)
      });

      it('should handle dependency failures gracefully', async () => {
        // Arrange
        mockClock.nowEpochSeconds.and.throwError(new Error('Clock service unavailable'));

        // Act & Assert
        await expectAsync(useCase.execute(validRequest)).toBeRejected();
        expect(mockErrorTransformer.transform).toHaveBeenCalled();
      });

      it('should use dependencies in correct isolation - no cross-contamination', async () => {
        // Arrange
        const firstRequest: CreateRoleRequest = { name: 'First Role', accessLevel: 1, requesterId: 801 };
        const secondRequest: CreateRoleRequest = { name: 'Second Role', accessLevel: 2, requesterId: 802 };

        // Reset all mocks to ensure clean state
        mockRoleRepository.create.calls.reset();
        mockLogger.info.calls.reset();
        mockClock.nowEpochSeconds.calls.reset();

        // Act
        await useCase.execute(firstRequest);
        await useCase.execute(secondRequest);

        // Assert - Dependencies called independently for each request
        expect(mockRoleRepository.create).toHaveBeenCalledTimes(2);
        expect(mockLogger.info).toHaveBeenCalledTimes(4); // 2 auth + 2 success
        expect(mockClock.nowEpochSeconds).toHaveBeenCalledTimes(2);

        // Verify no cross-contamination between calls
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '801',
          operation: 'create_role_authorization'
        });
        expect(mockLogger.info).toHaveBeenCalledWith('Authorization validated for role creation', {
          userId: '802',
          operation: 'create_role_authorization'
        });
      });
    });
  });
});