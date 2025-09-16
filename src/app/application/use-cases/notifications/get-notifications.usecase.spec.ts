import { TestBed } from '@angular/core/testing';
import { GetNotifications } from './get-notifications.usecase';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { Notification } from '@domain/entities/notification.entity';

describe('GetNotifications UseCase', () => {
  let useCase: GetNotifications;
  let mockNotificationPort: jasmine.SpyObj<NotificationPort>;
  let mockLogger: jasmine.SpyObj<Logger>;

  const mockNotifications = [
    { userId: '123' },
    { userId: '456' },
    { userId: '123' },
    { userId: undefined },
  ] as Notification[];

  beforeEach(() => {
    mockNotificationPort = jasmine.createSpyObj('NotificationPort', ['snapshot']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        GetNotifications,
        { provide: NOTIFICATION_PORT, useValue: mockNotificationPort },
        { provide: LOGGER_PORT, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(GetNotifications);

    // Use callFake to return a direct value, matching the synchronous interface
    mockNotificationPort.snapshot.and.callFake(() => mockNotifications);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    it('should return all notifications when no requesterId is provided', async () => {
      const request = {};
      const result = await useCase.execute(request);

      expect(mockNotificationPort.snapshot).toHaveBeenCalled();
      expect(result.notifications.length).toBe(4);
      expect(result.totalCount).toBe(4);
      expect(mockLogger.info).toHaveBeenCalledWith(`Notifications retrieved: 4 total`);
    });

    it('should filter notifications by requesterId when provided', async () => {
      const request = { requesterId: 123 };
      const result = await useCase.execute(request);

      expect(result.notifications.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.notifications.every((n) => n.userId === '123')).toBeTrue();
      expect(mockLogger.info).toHaveBeenCalledWith(`Notifications retrieved: 2 total`);
    });

    it('should return an empty array if no notifications match the requesterId', async () => {
      const request = { requesterId: 999 };
      const result = await useCase.execute(request);

      expect(result.notifications.length).toBe(0);
      expect(result.totalCount).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith(`Notifications retrieved: 0 total`);
    });

    it('should throw an ApplicationError if the notification port fails', async () => {
      const repoError = new Error('Failed to get snapshot');
      // Use callFake to throw synchronously, matching the interface
      mockNotificationPort.snapshot.and.callFake(() => {
        throw repoError;
      });
      const request = {};
      let caughtError: any;

      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(caughtError.message).toBe('Failed to retrieve notifications');
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });
});
