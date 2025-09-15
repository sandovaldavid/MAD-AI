import { TestBed } from '@angular/core/testing';
import { UpdateNotification } from './update-notification.usecase';
import { NOTIFICATION_PORT, LOGGER_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import { NotificationType } from '@domain/enums/notification-type.enum';
import { NotificationChannel } from '@domain/entities/notification.entity';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';
import type { Logger } from '@core/interfaces/logger.interface';
import type { Notification } from '@domain/entities/notification.entity';

describe('UpdateNotification UseCase', () => {
  let useCase: UpdateNotification;
  let mockNotificationPort: jasmine.SpyObj<NotificationPort>;
  let mockLogger: jasmine.SpyObj<Logger>;
  let mockNotification: jasmine.SpyObj<Notification>;

  beforeEach(() => {
    mockNotificationPort = jasmine.createSpyObj('NotificationPort', ['findById', 'save']);
    mockLogger = jasmine.createSpyObj('Logger', ['info', 'error']);

    mockNotification = jasmine.createSpyObj('Notification', [
      'updateMessage',
      'updateType',
      'updateTitle',
      'updateChannel',
      'markAsRead',
    ]);

    TestBed.configureTestingModule({
      providers: [
        UpdateNotification,
        { provide: NOTIFICATION_PORT, useValue: mockNotificationPort },
        { provide: LOGGER_PORT, useValue: mockLogger },
      ],
    });

    useCase = TestBed.inject(UpdateNotification);

    mockNotificationPort.findById.and.resolveTo(mockNotification);
    mockNotificationPort.save.and.resolveTo();
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    const notificationId = 'notif-123';

    it('should mark notification as read', async () => {
      const request = { notificationId, updateData: { isRead: true } };

      await useCase.execute(request);

      expect(mockNotificationPort.findById).toHaveBeenCalledWith(notificationId);
      expect(mockNotification.markAsRead).toHaveBeenCalled();
      expect(mockNotificationPort.save).toHaveBeenCalledWith(mockNotification);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Notification ${notificationId} updated successfully`
      );
    });

    it('should update notification message', async () => {
      const newMessage = 'New message content';
      const request = { notificationId, updateData: { message: newMessage } };

      await useCase.execute(request);

      expect(mockNotification.updateMessage).toHaveBeenCalledWith(newMessage);
      expect(mockNotificationPort.save).toHaveBeenCalledWith(mockNotification);
    });

    it('should update multiple properties at once', async () => {
      const request = {
        notificationId,
        updateData: {
          title: 'New Title',
          type: NotificationType.SUCCESS,
          isRead: true,
        },
      };

      await useCase.execute(request);

      expect(mockNotification.updateTitle).toHaveBeenCalledWith('New Title');
      expect(mockNotification.updateType).toHaveBeenCalledWith(NotificationType.SUCCESS);
      expect(mockNotification.markAsRead).toHaveBeenCalled();
      expect(mockNotificationPort.save).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw an ApplicationError if notification is not found', async () => {
      mockNotificationPort.findById.and.resolveTo(null);
      const request = { notificationId, updateData: {} };
      let caughtError: any;

      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(caughtError.message).toBe('Notification not found');
      expect(mockNotificationPort.save).not.toHaveBeenCalled();
    });

    it('should throw an ApplicationError if findById rejects', async () => {
      const dbError = new Error('Database connection lost');
      mockNotificationPort.findById.and.rejectWith(dbError);
      const request = { notificationId, updateData: {} };
      let caughtError: any;

      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(caughtError.message).toBe(dbError.message);
    });

    it('should throw an ApplicationError if save rejects', async () => {
      const dbError = new Error('Failed to write to database');
      mockNotificationPort.save.and.rejectWith(dbError);
      const request = { notificationId, updateData: { isRead: true } };
      let caughtError: any;

      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.INVALID_INPUT);
      expect(caughtError.message).toBe(dbError.message);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should update notification channel', async () => {
      const request = {
        notificationId,
        updateData: { channel: NotificationChannel.EMAIL },
      };

      await useCase.execute(request);

      expect(mockNotification.updateChannel).toHaveBeenCalledWith(NotificationChannel.EMAIL);
      expect(mockNotificationPort.save).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw an unexpected error for non-Error exceptions', async () => {
      const nonError = { message: 'this is not an error instance' };
      mockNotificationPort.findById.and.rejectWith(nonError);
      const request = { notificationId, updateData: {} };
      let caughtError: any;

      try {
        await useCase.execute(request);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(ApplicationError);
      expect(caughtError.code).toBe(ApplicationErrorCode.UNEXPECTED_ERROR);
    });
  });
});
