import { TestBed } from '@angular/core/testing';
import { ClearNotifications } from './clear-notifications.usecase';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { Notification } from '@domain/entities/notification.entity';

describe('ClearNotifications UseCase', () => {
  let useCase: ClearNotifications;
  let mockNotificationPort: jasmine.SpyObj<NotificationPort>;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockNotificationPort = jasmine.createSpyObj('NotificationPort', ['snapshot', 'clear']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        ClearNotifications,
        { provide: NOTIFICATION_PORT, useValue: mockNotificationPort },
        { provide: LOGGER_PORT, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(ClearNotifications);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    it('should clear notifications and log the count', async () => {
      // Arrange
      const mockNotifications = [{}, {}, {}] as Notification[];
      mockNotificationPort.snapshot.and.returnValue(mockNotifications);

      // Act
      await useCase.execute({});

      // Assert
      expect(mockNotificationPort.snapshot).toHaveBeenCalled();
      expect(mockNotificationPort.clear).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        `All notifications cleared: 3 notifications removed`
      );
    });

    it('should throw an ApplicationError if snapshot fails', async () => {
      // Arrange
      const repoError = new Error('Snapshot failed');
      mockNotificationPort.snapshot.and.throwError(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute({});
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(mockNotificationPort.clear).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should throw an ApplicationError if clear fails', async () => {
      // Arrange
      mockNotificationPort.snapshot.and.returnValue([]);
      const repoError = new Error('Clear failed');
      mockNotificationPort.clear.and.throwError(repoError);
      let caughtError: any;

      // Act
      try {
        await useCase.execute({});
      } catch (error) {
        caughtError = error;
      }

      // Assert
      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
