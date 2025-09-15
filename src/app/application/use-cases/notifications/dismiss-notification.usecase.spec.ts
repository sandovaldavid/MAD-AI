import { TestBed } from '@angular/core/testing';
import { DismissNotification } from './dismiss-notification.usecase';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';

describe('DismissNotification UseCase', () => {
  let useCase: DismissNotification;
  let mockNotificationPort: jasmine.SpyObj<NotificationPort>;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockNotificationPort = jasmine.createSpyObj('NotificationPort', ['dismiss']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        DismissNotification,
        { provide: NOTIFICATION_PORT, useValue: mockNotificationPort },
        { provide: LOGGER_PORT, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(DismissNotification);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const notificationId = 'notif-abc-123';
    const request = { notificationId };

    it('should call dismiss on the port and log success', async () => {
      // Arrange
      // No arrangement needed for the mock, as it returns void

      // Act
      await useCase.execute(request);

      // Assert
      expect(mockNotificationPort.dismiss).toHaveBeenCalledWith(notificationId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Notification ${notificationId} dismissed successfully`
      );
    });

    it('should throw an ApplicationError if the notification port fails', async () => {
      // Arrange
      const repoError = new Error('Failed to dismiss');
      mockNotificationPort.dismiss.and.throwError(repoError);
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
      expect(caughtError.message).toBe('Failed to dismiss notification');
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
