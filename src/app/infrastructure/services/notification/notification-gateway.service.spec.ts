import { TestBed } from '@angular/core/testing';
import { NotificationGatewayService } from './notification-gateway.service';
import { NOTIFICATION_CONFIG } from '@di/tokens';
import {
  NewNotification,
  NotificationId,
  NotificationType,
  NotificationChannel,
} from '@domain/entities/notification.entity';
import { UINotificationPosition } from '@presentation/shared/components/toast/enums/ui-notification-position.enum';

describe('NotificationGatewayService - Infrastructure Tests', () => {
  let service: NotificationGatewayService;
  let mockConfig: any;

  const mockNotificationConfig = {
    defaults: {
      success: { duration: 3000 },
      info: { duration: 4000 },
      warning: { duration: 5000 },
      error: { duration: 0 }, // Sticky
      position: {
        desktop: 'top-right' as UINotificationPosition,
        mobile: 'top' as UINotificationPosition,
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationGatewayService,
        { provide: NOTIFICATION_CONFIG, useValue: mockNotificationConfig },
      ],
    });

    service = TestBed.inject(NotificationGatewayService);
    mockConfig = TestBed.inject(NOTIFICATION_CONFIG);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty notification list', () => {
      // When
      const notifications = service.snapshot();

      // Then
      expect(notifications).toEqual([]);
    });

    it('should inject notification config', () => {
      // Then
      expect(mockConfig).toBeTruthy();
      expect(mockConfig.defaults).toBeDefined();
      expect(mockConfig.defaults.success).toBeDefined();
    });
  });

  describe('push', () => {
    it('should create and add a notification', () => {
      // Given
      const newNotification: NewNotification = {
        type: NotificationType.SUCCESS,
        message: 'Test success message',
        title: 'Success',
        userId: 'user123',
        channel: NotificationChannel.EMAIL,
      };

      // When
      const id = service.push(newNotification);

      // Then
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');

      const notifications = service.snapshot();
      expect(notifications).toHaveSize(1);
      expect(notifications[0].id).toBe(id);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Test success message');
      expect(notifications[0].title).toBe('Success');
    });

    it('should add notification to the beginning of the list', () => {
      // Given
      const first: NewNotification = {
        type: NotificationType.INFO,
        message: 'First message',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      };
      const second: NewNotification = {
        type: NotificationType.SUCCESS,
        message: 'Second message',
        userId: 'user2',
        channel: NotificationChannel.EMAIL,
      };

      // When
      const firstId = service.push(first);
      const secondId = service.push(second);

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(2);
      expect(notifications[0].id).toBe(secondId); // Second notification should be first
      expect(notifications[1].id).toBe(firstId); // First notification should be second
    });

    it('should handle different notification types', () => {
      // Given
      const types: NotificationType[] = [
        NotificationType.SUCCESS,
        NotificationType.INFO,
        NotificationType.WARNING,
        NotificationType.ERROR,
      ];

      // When
      const ids = types.map((type, index) =>
        service.push({
          type,
          message: `Message ${index}`,
          userId: `user${index}`,
          channel: NotificationChannel.EMAIL,
        })
      );

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(4);
      types.reverse().forEach((type, index) => {
        expect(notifications[index].type).toBe(type);
      });
    });

    it('should handle different notification channels', () => {
      // Given
      const channels: NotificationChannel[] = [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
      ];

      // When
      const ids = channels.map((channel, index) =>
        service.push({
          type: NotificationType.INFO,
          message: `Message ${index}`,
          userId: `user${index}`,
          channel,
        })
      );

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(3);
      channels.reverse().forEach((channel, index) => {
        expect(notifications[index].channel).toBe(channel);
      });
    });

    it('should handle notifications with minimal required fields', () => {
      // Given
      const minimalNotification: NewNotification = {
        type: NotificationType.INFO,
        message: 'Minimal notification',
        userId: 'user123',
        channel: NotificationChannel.IN_APP,
      };

      // When
      const id = service.push(minimalNotification);

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(1);
      expect(notifications[0].message).toBe('Minimal notification');
      expect(notifications[0].title).toBeUndefined();
    });

    it('should generate unique IDs for each notification', () => {
      // Given
      const notification: NewNotification = {
        type: NotificationType.INFO,
        message: 'Test',
        userId: 'user123',
        channel: NotificationChannel.EMAIL,
      };

      // When
      const ids = Array.from({ length: 10 }, () => service.push(notification));

      // Then
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
      expect(service.snapshot()).toHaveSize(10);
    });
  });

  describe('update', () => {
    it('should update existing notification', () => {
      // Given
      const original: NewNotification = {
        type: NotificationType.INFO,
        message: 'Original message',
        title: 'Original title',
        userId: 'user123',
        channel: NotificationChannel.EMAIL,
      };
      const id = service.push(original);

      const patch: Partial<NewNotification> = {
        message: 'Updated message',
        type: NotificationType.SUCCESS,
      };

      // When
      service.update(id, patch);

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(1);
      expect(notifications[0].message).toBe('Updated message');
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].title).toBe('Original title'); // Unchanged
      expect(notifications[0].userId).toBe('user123'); // Unchanged
    });

    it('should handle partial updates', () => {
      // Given
      const original: NewNotification = {
        type: NotificationType.WARNING,
        message: 'Original message',
        title: 'Original title',
        userId: 'user123',
        channel: NotificationChannel.SMS,
      };
      const id = service.push(original);

      // When - Update only message
      service.update(id, { message: 'New message' });

      // Then
      const notifications = service.snapshot();
      expect(notifications[0].message).toBe('New message');
      expect(notifications[0].type).toBe('warning'); // Unchanged
      expect(notifications[0].title).toBe('Original title'); // Unchanged
      expect(notifications[0].channel).toBe('sms'); // Unchanged
    });

    it('should handle update of non-existent notification', () => {
      // Given
      const nonExistentId = 'non-existent-id';
      const originalCount = service.snapshot().length;

      // When
      service.update(nonExistentId, { message: 'Updated' });

      // Then
      expect(service.snapshot()).toHaveSize(originalCount);
    });

    it('should handle update with invalid data gracefully', () => {
      // Given
      const original: NewNotification = {
        type: NotificationType.INFO,
        message: 'Original message',
        userId: 'user123',
        channel: NotificationChannel.EMAIL,
      };
      const id = service.push(original);

      const consoleSpy = spyOn(console, 'warn');

      // When - Try to update with invalid message (empty string should trigger validation error)
      service.update(id, { message: '' });

      // Then
      // Should handle gracefully and warn about the error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to update notification:', jasmine.any(Error));
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(1);
      expect(notifications[0].message).toBe('Original message'); // Should remain unchanged
    });

    it('should preserve notification ID during update', () => {
      // Given
      const original: NewNotification = {
        type: NotificationType.INFO,
        message: 'Original',
        userId: 'user123',
        channel: NotificationChannel.EMAIL,
      };
      const originalId = service.push(original);

      // When
      service.update(originalId, { message: 'Updated' });

      // Then
      const notifications = service.snapshot();
      expect(notifications[0].id).toBe(originalId);
    });

    it('should update multiple notifications correctly', () => {
      // Given
      const first = service.push({
        type: NotificationType.INFO,
        message: 'First',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      const second = service.push({
        type: NotificationType.WARNING,
        message: 'Second',
        userId: 'user2',
        channel: NotificationChannel.IN_APP,
      });

      // When
      service.update(first, { message: 'Updated First' });
      service.update(second, { message: 'Updated Second' });

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(2);

      const firstNotif = notifications.find((n) => n.id === first);
      const secondNotif = notifications.find((n) => n.id === second);

      expect(firstNotif?.message).toBe('Updated First');
      expect(secondNotif?.message).toBe('Updated Second');
    });
  });

  describe('dismiss', () => {
    it('should remove notification by id', () => {
      // Given
      const notification1 = service.push({
        type: NotificationType.INFO,
        message: 'Message 1',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      const notification2 = service.push({
        type: NotificationType.SUCCESS,
        message: 'Message 2',
        userId: 'user2',
        channel: NotificationChannel.IN_APP,
      });

      // When
      service.dismiss(notification1);

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(1);
      expect(notifications[0].id).toBe(notification2);
      expect(notifications[0].message).toBe('Message 2');
    });

    it('should handle dismissing non-existent notification', () => {
      // Given
      service.push({
        type: NotificationType.INFO,
        message: 'Existing',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      const originalCount = service.snapshot().length;

      // When
      service.dismiss('non-existent-id');

      // Then
      expect(service.snapshot()).toHaveSize(originalCount);
    });

    it('should clear timers when dismissing', () => {
      // Given
      const id = service.push({
        type: NotificationType.INFO,
        message: 'Test',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });

      // Get access to timers map for testing
      const timersMap = (service as any).timers;
      timersMap.set(
        id,
        setTimeout(() => {}, 1000)
      );

      expect(timersMap.has(id)).toBe(true);

      // When
      service.dismiss(id);

      // Then
      expect(timersMap.has(id)).toBe(false);
    });

    it('should dismiss all notifications individually', () => {
      // Given
      const ids = Array.from({ length: 5 }, (_, i) =>
        service.push({
          type: NotificationType.INFO,
          message: `Message ${i}`,
          userId: `user${i}`,
          channel: NotificationChannel.EMAIL,
        })
      );

      // When
      ids.forEach((id) => service.dismiss(id));

      // Then
      expect(service.snapshot()).toHaveSize(0);
    });
  });

  describe('clear', () => {
    it('should remove all notifications', () => {
      // Given
      service.push({
        type: NotificationType.INFO,
        message: 'Message 1',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      service.push({
        type: NotificationType.SUCCESS,
        message: 'Message 2',
        userId: 'user2',
        channel: NotificationChannel.IN_APP,
      });
      service.push({
        type: NotificationType.ERROR,
        message: 'Message 3',
        userId: 'user3',
        channel: NotificationChannel.SMS,
      });

      // When
      service.clear();

      // Then
      expect(service.snapshot()).toHaveSize(0);
    });

    it('should clear all timers', () => {
      // Given
      const ids = Array.from({ length: 3 }, (_, i) =>
        service.push({
          type: NotificationType.INFO,
          message: `Message ${i}`,
          userId: `user${i}`,
          channel: NotificationChannel.EMAIL,
        })
      );

      // Set up timers
      const timersMap = (service as any).timers;
      ids.forEach((id) => {
        timersMap.set(
          id,
          setTimeout(() => {}, 1000)
        );
      });

      expect(timersMap.size).toBe(3);

      // When
      service.clear();

      // Then
      expect(timersMap.size).toBe(0);
    });

    it('should work when there are no notifications', () => {
      // Given
      expect(service.snapshot()).toHaveSize(0);

      // When & Then
      expect(() => service.clear()).not.toThrow();
      expect(service.snapshot()).toHaveSize(0);
    });
  });

  describe('onChange subscription', () => {
    it('should call subscriber immediately with current state', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');
      service.push({
        type: NotificationType.INFO,
        message: 'Existing',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });

      // When
      service.onChange(subscriber);

      // Then
      expect(subscriber).toHaveBeenCalledWith(jasmine.any(Array));
      expect(subscriber.calls.mostRecent().args[0]).toHaveSize(1);
    });

    it('should notify subscribers when notification is added', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');
      service.onChange(subscriber);
      subscriber.calls.reset();

      // When
      service.push({
        type: NotificationType.SUCCESS,
        message: 'New notification',
        userId: 'user1',
        channel: NotificationChannel.IN_APP,
      });

      // Then
      expect(subscriber).toHaveBeenCalledWith(jasmine.any(Array));
      expect(subscriber.calls.mostRecent().args[0]).toHaveSize(1);
    });

    it('should notify subscribers when notification is updated', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');
      const id = service.push({
        type: NotificationType.INFO,
        message: 'Original',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      service.onChange(subscriber);
      subscriber.calls.reset();

      // When
      service.update(id, { message: 'Updated' });

      // Then
      expect(subscriber).toHaveBeenCalled();
    });

    it('should notify subscribers when notification is dismissed', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');
      const id = service.push({
        type: NotificationType.INFO,
        message: 'To be dismissed',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      service.onChange(subscriber);
      subscriber.calls.reset();

      // When
      service.dismiss(id);

      // Then
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should notify subscribers when all notifications are cleared', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');
      service.push({
        type: NotificationType.INFO,
        message: 'Message 1',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      service.push({
        type: NotificationType.SUCCESS,
        message: 'Message 2',
        userId: 'user2',
        channel: NotificationChannel.IN_APP,
      });
      service.onChange(subscriber);
      subscriber.calls.reset();

      // When
      service.clear();

      // Then
      expect(subscriber).toHaveBeenCalledWith([]);
    });

    it('should return unsubscribe function', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');

      // When
      const unsubscribe = service.onChange(subscriber);

      // Then
      expect(typeof unsubscribe).toBe('function');
    });

    it('should stop notifications after unsubscribe', () => {
      // Given
      const subscriber = jasmine.createSpy('subscriber');
      const unsubscribe = service.onChange(subscriber);
      subscriber.calls.reset();

      // When
      unsubscribe();
      service.push({
        type: NotificationType.INFO,
        message: 'After unsubscribe',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });

      // Then
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      // Given
      const subscriber1 = jasmine.createSpy('subscriber1');
      const subscriber2 = jasmine.createSpy('subscriber2');

      service.onChange(subscriber1);
      service.onChange(subscriber2);

      subscriber1.calls.reset();
      subscriber2.calls.reset();

      // When
      service.push({
        type: NotificationType.INFO,
        message: 'Multi-subscriber test',
        userId: 'user1',
        channel: NotificationChannel.IN_APP,
      });

      // Then
      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it('should handle subscriber unsubscribing without affecting others', () => {
      // Given
      const subscriber1 = jasmine.createSpy('subscriber1');
      const subscriber2 = jasmine.createSpy('subscriber2');

      service.onChange(subscriber1);
      const unsubscribe2 = service.onChange(subscriber2);

      subscriber1.calls.reset();
      subscriber2.calls.reset();

      // When
      unsubscribe2();
      service.push({
        type: NotificationType.INFO,
        message: 'After partial unsubscribe',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });

      // Then
      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).not.toHaveBeenCalled();
    });
  });

  describe('snapshot', () => {
    it('should return current notification list', () => {
      // Given
      const id1 = service.push({
        type: NotificationType.INFO,
        message: 'Message 1',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      const id2 = service.push({
        type: NotificationType.SUCCESS,
        message: 'Message 2',
        userId: 'user2',
        channel: NotificationChannel.IN_APP,
      });

      // When
      const snapshot = service.snapshot();

      // Then
      expect(snapshot).toHaveSize(2);
      expect(snapshot[0].id).toBe(id2); // Most recent first
      expect(snapshot[1].id).toBe(id1);
    });

    it('should return immutable snapshot', () => {
      // Given
      service.push({
        type: NotificationType.INFO,
        message: 'Test',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      const snapshot1 = service.snapshot();

      // When
      service.push({
        type: NotificationType.SUCCESS,
        message: 'Another test',
        userId: 'user2',
        channel: NotificationChannel.IN_APP,
      });
      const snapshot2 = service.snapshot();

      // Then
      expect(snapshot1).toHaveSize(1);
      expect(snapshot2).toHaveSize(2);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle rapid successive operations', () => {
      // Given
      const operations = Array.from({ length: 100 }, (_, i) => ({
        type: 'info' as NotificationType,
        message: `Message ${i}`,
        userId: `user${i}`,
        channel: 'email' as NotificationChannel,
      }));

      // When
      const ids = operations.map((op) => service.push(op));

      // Rapid updates and dismissals
      ids.slice(0, 50).forEach((id, index) => {
        service.update(id, { message: `Updated ${index}` });
      });

      ids.slice(25, 75).forEach((id) => {
        service.dismiss(id);
      });

      // Then
      const finalNotifications = service.snapshot();
      expect(finalNotifications.length).toBeGreaterThan(0);
      expect(finalNotifications.length).toBeLessThan(100);
    });

    it('should handle empty or null update patches', () => {
      // Given
      const id = service.push({
        type: NotificationType.INFO,
        message: 'Original',
        userId: 'user1',
        channel: NotificationChannel.EMAIL,
      });
      const originalMessage = service.snapshot()[0].message;

      // When
      service.update(id, {});

      // Then
      expect(service.snapshot()[0].message).toBe(originalMessage);
    });

    it('should maintain notification order correctly', () => {
      // Given
      const messages = ['First', 'Second', 'Third', 'Fourth'];
      const ids: NotificationId[] = [];

      // When
      messages.forEach((message) => {
        ids.push(
          service.push({
            type: NotificationType.INFO,
            message,
            userId: 'user1',
            channel: NotificationChannel.EMAIL,
          })
        );
      });

      // Then
      const notifications = service.snapshot();
      expect(notifications).toHaveSize(4);

      // Should be in reverse order (newest first)
      const reversedMessages = [...messages].reverse();
      notifications.forEach((notification, index) => {
        expect(notification.message).toBe(reversedMessages[index]);
      });
    });
  });

  describe('mapCategoryToConfigKey', () => {
    it('should map notification types to config keys', () => {
      // Test the private method by accessing it
      const service_any = service as any;

      expect(service_any.mapCategoryToConfigKey('success')).toBe('success');
      expect(service_any.mapCategoryToConfigKey('info')).toBe('info');
      expect(service_any.mapCategoryToConfigKey('warning')).toBe('warning');
      expect(service_any.mapCategoryToConfigKey('error')).toBe('error');
    });

    it('should fallback to info for unknown types', () => {
      // Test the private method
      const service_any = service as any;

      expect(service_any.mapCategoryToConfigKey('unknown-type')).toBe('info');
    });
  });

  describe('defaultPosition', () => {
    it('should return desktop position for wide screens', () => {
      // Given
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(1024);

      // When
      const position = (service as any).defaultPosition();

      // Then
      expect(position).toBe('top-right');
    });

    it('should return mobile position for narrow screens', () => {
      // Given
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(600);

      // When
      const position = (service as any).defaultPosition();

      // Then
      expect(position).toBe('top');
    });

    it('should handle edge case at breakpoint', () => {
      // Given
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(768);

      // When
      const position = (service as any).defaultPosition();

      // Then
      expect(position).toBe('top-right'); // Should be desktop (>=768)
    });
  });
});
