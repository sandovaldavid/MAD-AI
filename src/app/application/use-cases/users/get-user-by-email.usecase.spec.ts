import { TestBed } from '@angular/core/testing';
import { GetUserByEmail } from './get-user-by-email.usecase';
import { USER_REPOSITORY, LOGGER_PORT } from '@di/tokens';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import type { GetUserByEmailRequest, GetUserResult } from '@application/types/users.types';
import type { UserRepository } from '@domain/repositories/business/user.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import { User } from '@domain/entities/user.entity';
import { Role } from '@domain/entities/role.entity';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';

describe('GetUserByEmail', () => {
  let useCase: GetUserByEmail;
  let mockUserRepository: jasmine.SpyObj<UserRepository>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockErrorTransformer: jasmine.SpyObj<ApplicationErrorTransformer>;

  let mockUser: User;

  beforeEach(() => {
    mockUserRepository = jasmine.createSpyObj('UserRepository', ['getByEmail']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);
    mockErrorTransformer = jasmine.createSpyObj('ApplicationErrorTransformer', ['transform']);

    const testRole = Role.create({
      id: 1,
      name: 'User',
      accessLevel: 2,
      isActive: true,
    });

    mockUser = User.create({
      id: 123,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      role: testRole,
      notificationPreferences: { email: true, system: true, task: true },
    });

    TestBed.configureTestingModule({
      providers: [
        GetUserByEmail,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: LOGGER_PORT, useValue: mockLogger },
        { provide: ApplicationErrorTransformer, useValue: mockErrorTransformer },
      ],
    });

    useCase = TestBed.inject(GetUserByEmail);

    // Default success behavior
    mockUserRepository.getByEmail.and.returnValue(Promise.resolve(mockUser));
    mockErrorTransformer.transform.and.callFake(
      (error: any) =>
        new ApplicationError(
          ApplicationErrorCode.UNEXPECTED_ERROR,
          error?.message || 'Unhandled error',
          'An unexpected error occurred'
        )
    );
  });

  describe('Successful Execution', () => {
    it('should call validateApplicationRules with the correct email', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      spyOn(useCase as any, 'validateApplicationRules').and.callThrough();
      await useCase.execute(request);
      expect((useCase as any).validateApplicationRules).toHaveBeenCalledWith('test@example.com');
    });

    it('should call userRepository.getByEmail with the correct email', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      await useCase.execute(request);
      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should call handleUserLookupSideEffects if a user is found', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      spyOn(useCase as any, 'handleUserLookupSideEffects').and.callThrough();
      await useCase.execute(request);
      expect((useCase as any).handleUserLookupSideEffects).toHaveBeenCalledWith(mockUser);
    });

    it('should return the user found by the repository', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      const result = await useCase.execute(request);
      expect(result).toEqual(mockUser);
    });

    it('should not transform errors on successful execution', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      await useCase.execute(request);
      expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
    });
  });

  describe('User Not Found', () => {
    it('should return null if userRepository.getByEmail returns null', async () => {
      const request: GetUserByEmailRequest = { email: 'nonexistent@example.com' };
      mockUserRepository.getByEmail.and.returnValue(Promise.resolve(null));

      const result = await useCase.execute(request);
      expect(result).toBeNull();
    });

    it('should not call handleUserLookupSideEffects if user is not found', async () => {
      const request: GetUserByEmailRequest = { email: 'nonexistent@example.com' };
      mockUserRepository.getByEmail.and.returnValue(Promise.resolve(null));
      spyOn(useCase as any, 'handleUserLookupSideEffects').and.callThrough();

      await useCase.execute(request);
      expect((useCase as any).handleUserLookupSideEffects).not.toHaveBeenCalled();
    });

    it('should not transform errors if user is not found (returns null)', async () => {
      const request: GetUserByEmailRequest = { email: 'nonexistent@example.com' };
      mockUserRepository.getByEmail.and.returnValue(Promise.resolve(null));

      await useCase.execute(request);
      expect(mockErrorTransformer.transform).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling (from userRepository.getByEmail)', () => {
    it('should transform and throw an error if the repository rejects', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      const repositoryError = new Error('Database connection failed');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.SERVICE_UNAVAILABLE,
        'Service is down',
        'The user service is currently unavailable'
      );

      mockUserRepository.getByEmail.and.returnValue(Promise.reject(repositoryError));
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(repositoryError);
    });

    it('should not call handleUserLookupSideEffects if repository rejects', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.getByEmail.and.returnValue(Promise.reject(repositoryError));
      spyOn(useCase as any, 'handleUserLookupSideEffects').and.callThrough();

      await expectAsync(useCase.execute(request)).toBeRejected();
      expect((useCase as any).handleUserLookupSideEffects).not.toHaveBeenCalled();
    });

    it('should not log a success message if the repository fails', async () => {
      const request: GetUserByEmailRequest = { email: 'test@example.com' };
      const repositoryError = new Error('Database connection failed');
      mockUserRepository.getByEmail.and.returnValue(Promise.reject(repositoryError));

      try {
        await useCase.execute(request);
      } catch (error) {
        // Expected error
      }

      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation (from validateApplicationRules)', () => {
    it('should transform and throw an error if email is null', async () => {
      const request: GetUserByEmailRequest = { email: null as any };
      const validationError = new Error('Email is required for user lookup');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Email is required',
        'Please provide a valid email address'
      );

      spyOn(useCase as any, 'validateApplicationRules').and.callThrough();
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect((useCase as any).validateApplicationRules).toHaveBeenCalledWith(null);
      expect(mockUserRepository.getByEmail).not.toHaveBeenCalled();
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(validationError);
    });

    it('should transform and throw an error if email is undefined', async () => {
      const request: GetUserByEmailRequest = { email: undefined as any };
      const validationError = new Error('Email is required for user lookup');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Email is required',
        'Please provide a valid email address'
      );

      spyOn(useCase as any, 'validateApplicationRules').and.callThrough();
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect((useCase as any).validateApplicationRules).toHaveBeenCalledWith(undefined);
      expect(mockUserRepository.getByEmail).not.toHaveBeenCalled();
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(validationError);
    });

    it('should transform and throw an error if email is an empty string', async () => {
      const request: GetUserByEmailRequest = { email: '' };
      const validationError = new Error('Email is required for user lookup');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Email is required',
        'Please provide a valid email address'
      );

      spyOn(useCase as any, 'validateApplicationRules').and.callThrough();
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect((useCase as any).validateApplicationRules).toHaveBeenCalledWith('');
      expect(mockUserRepository.getByEmail).not.toHaveBeenCalled();
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(validationError);
    });

    it('should transform and throw an error if email is only whitespace', async () => {
      const request: GetUserByEmailRequest = { email: '   ' };
      const validationError = new Error('Email is required for user lookup');
      const transformedError = new ApplicationError(
        ApplicationErrorCode.INVALID_INPUT,
        'Email is required',
        'Please provide a valid email address'
      );

      spyOn(useCase as any, 'validateApplicationRules').and.callThrough();
      mockErrorTransformer.transform.and.returnValue(transformedError);

      await expectAsync(useCase.execute(request)).toBeRejectedWith(transformedError);

      expect((useCase as any).validateApplicationRules).toHaveBeenCalledWith('   ');
      expect(mockUserRepository.getByEmail).not.toHaveBeenCalled();
      expect(mockErrorTransformer.transform).toHaveBeenCalledWith(validationError);
    });
  });
});
