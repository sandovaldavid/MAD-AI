import { TestBed } from '@angular/core/testing';
import { CreateUser } from './create-user.usecase';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { UserStatus } from '@domain/enums/user-status.enum';
import { ApplicationError } from '@application/errors/application-error';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { LoggerService } from '@core/services/logger.service';
import type { CreateUserContract } from '@/app/domain/repositories/business/user.contract';

// Mock Role entity for testing purposes
const mockRole = Role.create({
  id: 1,
  name: 'User',
});

describe('CreateUser UseCase', () => {
  let useCase: CreateUser;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;

  const mockUserEntity = User.create({
    id: 123,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    role: mockRole,
    status: UserStatus.ACTIVE,
    notificationPreferences: {
      email: true,
      system: false,
      task: true,
    },
  });

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['create']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        CreateUser,
        ApplicationErrorTransformer, // Use the real transformer
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger }, // Provide mock for the transformer's dependency
      ],
    });

    useCase = TestBed.inject(CreateUser);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const validUserData: CreateUserContract = {
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      roleId: 1,
    };

    it('should successfully create a user and log the operation', async () => {
      // Arrange
      mockUserRepository.create.and.resolveTo(mockUserEntity);
      const request = { userData: validUserData };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(mockUserRepository.create).toHaveBeenCalledWith(validUserData);
      expect(mockLogger.info).toHaveBeenCalledWith('User created successfully', {
        userId: '123',
        operation: 'create_user',
      });
      expect(result).toBe(mockUserEntity);
    });

    it('should throw a transformed validation error if required fields are missing', async () => {
      // Arrange
      const incompleteUserData = { ...validUserData, email: null } as any;
      const request = { userData: incompleteUserData };
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      // Check the user-friendly message from the real transformer
      expect(caughtError.userMessage).toBe(
        'Please correct the following: email: The email field is required.'
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should throw a generic error if the repository fails', async () => {
      // Arrange
      const repositoryError = new Error('Repository failed');
      mockUserRepository.create.and.rejectWith(repositoryError);
      const request = { userData: validUserData };
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      // The real transformer will convert a generic error to an UNEXPECTED_ERROR
      expect(caughtError.message).toBe('An unexpected error occurred');
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
