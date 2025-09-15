import { TestBed } from '@angular/core/testing';
import { ActivateUser } from './activate-user.usecase';
import { USER_REPOSITORY, CLOCK_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { LoggerService } from '@core/services/logger.service';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { UserStatus } from '@domain/enums/user-status.enum';
import { ApplicationError } from '@application/errors/application-error';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import type { Logger } from '@core/interfaces/logger.interface';

const mockRole = Role.create({ id: 1, name: 'User' });

describe('ActivateUser UseCase', () => {
  let useCase: ActivateUser;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockClock: jasmine.SpyObj<ClockPort>;
  let mockLogger: jasmine.SpyObj<Logger>;

  const mockUserEntity = User.create({
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    role: mockRole,
    status: UserStatus.ACTIVE,
    notificationPreferences: { email: true, system: true, task: true },
  });

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['activate', 'getById']);
    mockClock = jasmine.createSpyObj('ClockPort', ['nowEpochSeconds']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error', 'warn']);

    TestBed.configureTestingModule({
      providers: [
        ActivateUser,
        ApplicationErrorTransformer,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: CLOCK_PORT, useValue: mockClock },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(ActivateUser);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const userId = 1;
    const request = { userId };
    const mockTimestamp = 1234567890;

    beforeEach(() => {
      mockClock.nowEpochSeconds.and.returnValue(mockTimestamp);
    });

    it('should activate a user, retrieve them, and log the operation', async () => {
      // Arrange
      mockUserRepository.activate.and.resolveTo();
      mockUserRepository.getById.and.resolveTo(mockUserEntity);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(mockUserRepository.activate).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.getById).toHaveBeenCalledWith(userId);
      expect(mockLogger.info).toHaveBeenCalledWith('User activated successfully', {
        correlationId: `user-activate-${userId}-${mockTimestamp}`,
        userId: userId.toString(),
        operation: 'activate_user',
      });
      expect(result).toBe(mockUserEntity);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw a transformed error if userRepo.activate fails', async () => {
      // Arrange
      const repoError = new Error('Activation failed');
      mockUserRepository.activate.and.rejectWith(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockUserRepository.getById).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('User activation failed', {
        correlationId: `activate-user-${userId}-${mockTimestamp}`,
        userId: userId.toString(),
        operation: 'activate_user',
      });
    });

    it('should throw a transformed error if userRepo.getById fails', async () => {
      // Arrange
      const repoError = new Error('User not found after activation');
      mockUserRepository.activate.and.resolveTo();
      mockUserRepository.getById.and.rejectWith(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(mockUserRepository.activate).toHaveBeenCalledWith(userId);
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('User activation failed', {
        correlationId: `activate-user-${userId}-${mockTimestamp}`,
        userId: userId.toString(),
        operation: 'activate_user',
      });
    });
  });
});
