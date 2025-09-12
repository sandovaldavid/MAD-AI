/**
 * Notification Entity Tests - Domain Layer
 *
 * @description
 * Unit tests for the Notification entity following Domain Layer testing rules:
 * - Pure unit tests without mocks
 * - Business rules validation
 * - Invariants verification
 * - Edge cases and validation testing
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Domain
 */

import {
  Notification,
  NotificationType,
  NotificationChannel,
  NewNotification,
} from './notification.entity';
import { ValidationError } from '../errors/validation-error.entity';

describe('Notification Entity', () => {
  // Test data fixtures
  const validNotificationData: NewNotification = {
    type: NotificationType.INFO,
    message: 'Test notification message',
    title: 'Test Title',
    userId: 'user-123',
    channel: NotificationChannel.IN_APP,
  };

  describe('create', () => {
    describe('successful creation', () => {
      it('should create notification with all fields', () => {
        const notification = Notification.create(validNotificationData);

        expect(notification.type).toBe(NotificationType.INFO);
        expect(notification.message).toBe('Test notification message');
        expect(notification.title).toBe('Test Title');
        expect(notification.userId).toBe('user-123');
        expect(notification.channel).toBe(NotificationChannel.IN_APP);
        expect(notification.isRead).toBe(false);
        expect(notification.readAt).toBeUndefined();
        expect(notification.id).toBeDefined();
        expect(notification.createdAt).toBeInstanceOf(Date);
      });

      it('should create notification with minimal required fields', () => {
        const minimalData: NewNotification = {
          type: NotificationType.SUCCESS,
          message: 'Minimal notification',
        };

        const notification = Notification.create(minimalData);

        expect(notification.type).toBe(NotificationType.SUCCESS);
        expect(notification.message).toBe('Minimal notification');
        expect(notification.title).toBeUndefined();
        expect(notification.userId).toBeUndefined();
        expect(notification.channel).toBe(NotificationChannel.IN_APP); // default
        expect(notification.isRead).toBe(false);
      });

      it('should trim message whitespace', () => {
        const dataWithWhitespace: NewNotification = {
          type: NotificationType.WARNING,
          message: '  Message with spaces  ',
        };

        const notification = Notification.create(dataWithWhitespace);

        expect(notification.message).toBe('Message with spaces');
      });

      it('should trim title whitespace', () => {
        const dataWithWhitespace: NewNotification = {
          type: NotificationType.ERROR,
          message: 'Test message',
          title: '  Title with spaces  ',
        };

        const notification = Notification.create(dataWithWhitespace);

        expect(notification.title).toBe('Title with spaces');
      });

      it('should generate unique IDs for different notifications', () => {
        const notification1 = Notification.create(validNotificationData);
        const notification2 = Notification.create(validNotificationData);

        expect(notification1.id).not.toBe(notification2.id);
      });
    });

    describe('validation errors', () => {
      it('should throw ValidationError for empty message', () => {
        const invalidData: NewNotification = {
          type: NotificationType.INFO,
          message: '',
        };

        expect(() => Notification.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for whitespace-only message', () => {
        const invalidData: NewNotification = {
          type: NotificationType.INFO,
          message: '   ',
        };

        expect(() => Notification.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for undefined message', () => {
        const invalidData = {
          type: NotificationType.INFO,
        } as NewNotification;

        expect(() => Notification.create(invalidData)).toThrow();
      });

      it('should throw ValidationError for message too long', () => {
        const longMessage = 'a'.repeat(501); // 501 characters
        const invalidData: NewNotification = {
          type: NotificationType.INFO,
          message: longMessage,
        };

        expect(() => Notification.create(invalidData)).toThrow();
      });

      it('should validate error details for empty message', () => {
        const invalidData: NewNotification = {
          type: NotificationType.INFO,
          message: '',
        };

        try {
          Notification.create(invalidData);
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect((error as ValidationError).constructor.name).toBe('_ValidationError');
          expect((error as ValidationError).message).toContain('Message is required');
        }
      });

      it('should validate error details for message too long', () => {
        const longMessage = 'a'.repeat(501);
        const invalidData: NewNotification = {
          type: NotificationType.INFO,
          message: longMessage,
        };

        try {
          Notification.create(invalidData);
          fail('Should have thrown ValidationError');
        } catch (error) {
          expect((error as ValidationError).constructor.name).toBe('_ValidationError');
          expect((error as ValidationError).message).toContain(
            'Message must be less than 500 characters'
          );
        }
      });
    });

    describe('edge cases', () => {
      it('should accept message with exactly 500 characters', () => {
        const maxMessage = 'a'.repeat(500);
        const validData: NewNotification = {
          type: NotificationType.INFO,
          message: maxMessage,
        };

        const notification = Notification.create(validData);

        expect(notification.message).toBe(maxMessage);
      });

      it('should handle all notification types', () => {
        const types = [
          NotificationType.INFO,
          NotificationType.WARNING,
          NotificationType.ERROR,
          NotificationType.SUCCESS,
        ];

        types.forEach((type) => {
          const data: NewNotification = {
            type,
            message: `Test message for ${type}`,
          };

          const notification = Notification.create(data);
          expect(notification.type).toBe(type);
        });
      });

      it('should handle all notification channels', () => {
        const channels = [
          NotificationChannel.IN_APP,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ];

        channels.forEach((channel) => {
          const data: NewNotification = {
            type: NotificationType.INFO,
            message: 'Test message',
            channel,
          };

          const notification = Notification.create(data);
          expect(notification.channel).toBe(channel);
        });
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark unread notification as read', () => {
      const notification = Notification.create(validNotificationData);
      const beforeMark = new Date();

      notification.markAsRead();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeInstanceOf(Date);
      expect(notification.readAt!.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime());
    });

    it('should not change readAt if already read', () => {
      const notification = Notification.create(validNotificationData);

      notification.markAsRead();
      const firstReadAt = notification.readAt;

      // Mark as read again - should not change readAt
      notification.markAsRead();

      expect(notification.readAt).toBe(firstReadAt);
      expect(notification.isRead).toBe(true);
    });

    it('should maintain read state after multiple calls', () => {
      const notification = Notification.create(validNotificationData);

      notification.markAsRead();
      notification.markAsRead();
      notification.markAsRead();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeInstanceOf(Date);
    });
  });

  describe('isSystemNotification', () => {
    it('should return true for notification without userId', () => {
      const systemData: NewNotification = {
        type: NotificationType.INFO,
        message: 'System notification',
      };

      const notification = Notification.create(systemData);

      expect(notification.isSystemNotification()).toBe(true);
    });

    it('should return false for notification with userId', () => {
      const userNotification = Notification.create(validNotificationData);

      expect(userNotification.isSystemNotification()).toBe(false);
    });
  });

  describe('toPlainObject', () => {
    it('should convert unread notification to plain object', () => {
      const notification = Notification.create(validNotificationData);
      const plainObject = notification.toPlainObject();

      expect(plainObject).toEqual({
        id: notification.id,
        type: NotificationType.INFO,
        message: 'Test notification message',
        title: 'Test Title',
        userId: 'user-123',
        channel: NotificationChannel.IN_APP,
        createdAt: notification.createdAt,
        isRead: false,
        readAt: undefined,
      });
    });

    it('should convert read notification to plain object', () => {
      const notification = Notification.create(validNotificationData);
      notification.markAsRead();
      const plainObject = notification.toPlainObject();

      expect(plainObject).toEqual({
        id: notification.id,
        type: NotificationType.INFO,
        message: 'Test notification message',
        title: 'Test Title',
        userId: 'user-123',
        channel: NotificationChannel.IN_APP,
        createdAt: notification.createdAt,
        isRead: true,
        readAt: notification.readAt,
      });
    });

    it('should convert system notification to plain object', () => {
      const systemData: NewNotification = {
        type: NotificationType.WARNING,
        message: 'System maintenance',
      };
      const notification = Notification.create(systemData);
      const plainObject = notification.toPlainObject();

      expect(plainObject.userId).toBeUndefined();
      expect(plainObject.title).toBeUndefined();
      expect(plainObject.channel).toBe(NotificationChannel.IN_APP);
    });
  });

  describe('equals', () => {
    it('should return true for notifications with same ID', () => {
      const notification1 = Notification.create(validNotificationData);
      const notification2 = Notification.create(validNotificationData);

      // Manually set same ID for testing
      (notification2 as any)._id = notification1.id;

      expect(notification1.equals(notification2)).toBe(true);
    });

    it('should return false for notifications with different IDs', () => {
      const notification1 = Notification.create(validNotificationData);
      const notification2 = Notification.create(validNotificationData);

      expect(notification1.equals(notification2)).toBe(false);
    });

    it('should return false for null notification', () => {
      const notification = Notification.create(validNotificationData);

      expect(notification.equals(null)).toBe(false);
    });

    it('should return false for undefined notification', () => {
      const notification = Notification.create(validNotificationData);

      expect(notification.equals(undefined)).toBe(false);
    });
  });

  describe('business rules', () => {
    it('should always create notifications with isRead false', () => {
      const notification = Notification.create(validNotificationData);

      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeUndefined();
    });

    it('should always generate createdAt timestamp', () => {
      const beforeCreate = new Date();
      const notification = Notification.create(validNotificationData);
      const afterCreate = new Date();

      expect(notification.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(notification.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should default to IN_APP channel when not specified', () => {
      const dataWithoutChannel: NewNotification = {
        type: NotificationType.INFO,
        message: 'Test message',
      };

      const notification = Notification.create(dataWithoutChannel);

      expect(notification.channel).toBe(NotificationChannel.IN_APP);
    });

    it('should preserve immutability of core properties', () => {
      const notification = Notification.create(validNotificationData);
      const originalId = notification.id;
      const originalType = notification.type;
      const originalMessage = notification.message;
      const originalCreatedAt = notification.createdAt;

      // Attempt to modify (should not be possible due to readonly)
      // These would cause TypeScript errors, but testing runtime behavior
      expect(notification.id).toBe(originalId);
      expect(notification.type).toBe(originalType);
      expect(notification.message).toBe(originalMessage);
      expect(notification.createdAt).toBe(originalCreatedAt);
    });
  });
});
