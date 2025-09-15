import { TestBed } from '@angular/core/testing';
import { SubscribeToNotifications } from './subscribe-to-notifications.usecase';
import { NOTIFICATION_PORT } from '@di/tokens';
import { ApplicationError } from '@application/errors/application-error';
import { ApplicationErrorCode } from '@application/errors/error-codes.enum';
import type { NotificationPort } from '@domain/repositories/business/notification.repository';

describe('SubscribeToNotifications UseCase', () => {
  let useCase: SubscribeToNotifications;
  let mockNotificationPort: jasmine.SpyObj<NotificationPort>;

  beforeEach(() => {
    mockNotificationPort = jasmine.createSpyObj('NotificationPort', ['onChange']);

    TestBed.configureTestingModule({
      providers: [
        SubscribeToNotifications,
        { provide: NOTIFICATION_PORT, useValue: mockNotificationPort },
      ],
    });

    useCase = TestBed.inject(SubscribeToNotifications);
  });

  it('should be created', () => {
    expect(useCase).toBeTruthy();
  });

  describe('execute', () => {
    it('should call onChange on the port and return the unsubscribe function', async () => {
      // Arrange
      const mockCallback = jasmine.createSpy('callback');
      const mockUnsubscribe = jasmine.createSpy('unsubscribe');
      mockNotificationPort.onChange.and.returnValue(mockUnsubscribe);
      const request = { callback: mockCallback };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(mockNotificationPort.onChange).toHaveBeenCalledWith(mockCallback);
      expect(result).toBe(mockUnsubscribe);
    });

    it('should throw an ApplicationError if callback is null', async () => {
      // Arrange
      const request = { callback: null as any };
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
      expect(caughtError.message).toBe('Invalid callback');
      expect(mockNotificationPort.onChange).not.toHaveBeenCalled();
    });

    it('should throw an ApplicationError if callback is not a function', async () => {
      // Arrange
      const request = { callback: {} as any }; // Pass an object instead of a function
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
      expect(caughtError.message).toBe('Invalid callback');
      expect(mockNotificationPort.onChange).not.toHaveBeenCalled();
    });
  });
});
