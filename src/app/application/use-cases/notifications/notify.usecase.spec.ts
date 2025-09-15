import { TestBed } from '@angular/core/testing';
import { Notify } from './notify.usecase';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { NotificationType } from '@domain/enums/notification-type.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { NotifyRequest } from '@application/types/notifications.types';
import type { NewNotification } from '@domain/entities/notification.entity';

describe('Notify UseCase', () => {
  let useCase: Notify;
  let mockNotificationPort: jasmine.SpyObj<NotificationPort>;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockNotificationPort = jasmine.createSpyObj('NotificationPort', ['push']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        Notify,
        { provide: NOTIFICATION_PORT, useValue: mockNotificationPort },
        { provide: LOGGER_PORT, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(Notify);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const request: NotifyRequest = {
      type: NotificationType.INFO,
      message: 'Test message',
      description: 'Test description',
      userId: 123,
    };

    it('should create a notification and log the operation', async () => {
      // Arrange
      const mockNotificationId = 'new-notif-id';
      mockNotificationPort.push.and.returnValue(mockNotificationId);

      // Act
      const result = await useCase.execute(request);

      // Assert
      const expectedDomainObject: NewNotification = {
        type: request.type,
        message: request.message,
        title: request.description,
        userId: request.userId?.toString(),
      };
      expect(mockNotificationPort.push).toHaveBeenCalledWith(expectedDomainObject);
      expect(mockLogger.info).toHaveBeenCalledWith(`Notification created: ${mockNotificationId}`);
      expect(result).toBe(mockNotificationId);
    });

    it('should throw an ApplicationError if the notification port fails', async () => {
      // Arrange
      const repoError = new Error('Repository push failed');
      mockNotificationPort.push.and.throwError(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(caughtError.message).toBe(repoError.message);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should throw an unexpected error for non-Error exceptions', async () => {
      // Arrange
      const nonError = { message: 'not an error instance' };
      // Use callFake to throw a non-Error object, as throwError wraps it
      mockNotificationPort.push.and.callFake(() => {
        throw nonError;
      });
      let caughtError: any;

      // Act
      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.UNEXPECTED_ERROR);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
