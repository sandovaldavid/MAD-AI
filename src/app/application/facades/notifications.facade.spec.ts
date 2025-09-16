/**
 * @fileoverview NotificationsFacade Test Suite
 *
 * Comprehensive test suite for NotificationsFacade covering all orchestration operations,
 * reactive state management, event system, and subscription coordination. Tests follow
 * MAD-AI testing guidelines with 95% coverage requirement for Application Layer.
 *
 * @description
 * Tests focus on facade orchestration responsibilities:
 * - Use case coordination and delegation
 * - Reactive state management with Angular signals
 * - Event emission and subscription system
 * - Real-time coordination and synchronization
 * - Error handling and transformation
 * - Loading state coordination
 * - Cross-facade integration capabilities
 *
 * @architecture
 * Application Layer Testing Strategy:
 * - TOTAL MOCK: All dependencies mocked using jasmine.createSpyObj
 * - Orchestration Focus: Verify correct use case calls and state updates
 * - No Business Logic: Tests coordination, not domain rules
 * - State Verification: Ensure signals update correctly
 * - Event System: Test real-time emission and subscription
 * - Error Scenarios: Test transformation and cleanup
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */

import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

// Application Layer Imports
import {
  NotificationsFacade,
  NotificationEventType,
  NotificationEvent,
} from './notifications.facade';
import type {
  NotifyRequest,
  DismissNotificationRequest,
  UpdateNotificationRequest,
  ClearNotificationsRequest,
  SubscribeToNotificationsRequest,
  GetNotificationsRequest,
} from '@application/types/notifications.types';
import type { FacadeOpts } from '@application/types/facade-opts';

// Use Cases Imports
import { Notify } from '../use-cases/notifications/notify.usecase';
import { DismissNotification } from '../use-cases/notifications/dismiss-notification.usecase';
import { ClearNotifications } from '../use-cases/notifications/clear-notifications.usecase';
import { UpdateNotification } from '../use-cases/notifications/update-notification.usecase';
import { GetNotifications } from '../use-cases/notifications/get-notifications.usecase';
import { SubscribeToNotifications } from '../use-cases/notifications/subscribe-to-notifications.usecase';

// Domain Entities and Enums
import { Notification } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification-type.enum';

/**
 * NotificationsFacade Test Suite
 *
 * Tests the facade's orchestration responsibilities using extensive mocking
 * to isolate the coordination logic from business rules and infrastructure.
 */
describe('NotificationsFacade', () => {
  let facade: NotificationsFacade;

  // Mock Use Cases
  let mockNotifyUC: jasmine.SpyObj<Notify>;
  let mockDismissUC: jasmine.SpyObj<DismissNotification>;
  let mockClearUC: jasmine.SpyObj<ClearNotifications>;
  let mockUpdateUC: jasmine.SpyObj<UpdateNotification>;
  let mockGetUC: jasmine.SpyObj<GetNotifications>;
  let mockSubscribeUC: jasmine.SpyObj<SubscribeToNotifications>;

  // Mock Domain Entities
  let mockNotification: Notification;
  let mockNotifications: Notification[];

  beforeEach(() => {
    // Create spy objects for all use cases
    mockNotifyUC = jasmine.createSpyObj('Notify', ['execute']);
    mockDismissUC = jasmine.createSpyObj('DismissNotification', ['execute']);
    mockClearUC = jasmine.createSpyObj('ClearNotifications', ['execute']);
    mockUpdateUC = jasmine.createSpyObj('UpdateNotification', ['execute']);
    mockGetUC = jasmine.createSpyObj('GetNotifications', ['execute']);
    mockSubscribeUC = jasmine.createSpyObj('SubscribeToNotifications', ['execute']);

    // Create mock domain entities
    mockNotification = {
      id: 'notification-123',
      type: NotificationType.SUCCESS,
      message: 'Test notification',
      title: 'Test Title',
      userId: 123,
      channel: 'in_app' as const,
      createdAt: new Date(),
      isRead: false,
      readAt: undefined,
    } as any;

    mockNotifications = [
      mockNotification,
      {
        ...mockNotification,
        id: 'notification-456',
        type: NotificationType.INFO,
        message: 'Info notification',
        isRead: true,
        readAt: new Date(),
      } as any,
      {
        ...mockNotification,
        id: 'notification-789',
        type: NotificationType.ERROR,
        message: 'Error notification',
        isRead: true,
      } as any,
    ];

    // Configure TestBed with all mock providers
    TestBed.configureTestingModule({
      providers: [
        NotificationsFacade,
        // Use Case Providers
        { provide: Notify, useValue: mockNotifyUC },
        { provide: DismissNotification, useValue: mockDismissUC },
        { provide: ClearNotifications, useValue: mockClearUC },
        { provide: UpdateNotification, useValue: mockUpdateUC },
        { provide: GetNotifications, useValue: mockGetUC },
        { provide: SubscribeToNotifications, useValue: mockSubscribeUC },
      ],
    });

    // Set up default mock behaviors
    mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
    mockDismissUC.execute.and.returnValue(Promise.resolve());
    mockClearUC.execute.and.returnValue(Promise.resolve());
    mockUpdateUC.execute.and.returnValue(Promise.resolve());
    mockGetUC.execute.and.returnValue(
      Promise.resolve({
        notifications: mockNotifications,
        totalCount: mockNotifications.length,
      })
    );
    mockSubscribeUC.execute.and.callFake((request: any) => {
      // Store the callback for testing purposes
      if (request && request.callback) {
        (mockSubscribeUC as any).lastCallback = request.callback;
      }
      return Promise.resolve(() => {});
    });

    facade = TestBed.inject(NotificationsFacade);
  });

  afterEach(() => {
    // Clean up event system after each test
    facade.complete();
  });

  // ============================================================================
  // Constructor and Initialization Tests
  // ============================================================================

  describe('Constructor and Initialization', () => {
    it('should create facade instance successfully', () => {
      expect(facade).toBeTruthy();
      expect(facade).toBeInstanceOf(NotificationsFacade);
    });

    it('should initialize with correct default signal values', () => {
      expect(facade.notifications()).toEqual([]);
      expect(facade.loading()).toBe(false);
      expect(facade.error()).toBeNull();
      expect(facade.unreadCount()).toBe(0);
      expect(facade.totalCount()).toBe(0);
      expect(facade.hasNotifications()).toBe(false);
      expect(facade.hasUnread()).toBe(false);
    });

    it('should inject all required dependencies', () => {
      expect(mockNotifyUC).toBeTruthy();
      expect(mockDismissUC).toBeTruthy();
      expect(mockClearUC).toBeTruthy();
      expect(mockUpdateUC).toBeTruthy();
      expect(mockGetUC).toBeTruthy();
      expect(mockSubscribeUC).toBeTruthy();
    });

    it('should set up auto-initialization with service synchronization', () => {
      expect(mockSubscribeUC.execute).toHaveBeenCalledWith({
        callback: jasmine.any(Function),
      });
    });

    it('should handle initialization errors gracefully', () => {
      // Reset facade to test error handling during construction
      mockSubscribeUC.execute.and.throwError(new Error('Subscription failed'));

      // Should not throw during construction
      expect(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            NotificationsFacade,
            { provide: Notify, useValue: mockNotifyUC },
            { provide: DismissNotification, useValue: mockDismissUC },
            { provide: ClearNotifications, useValue: mockClearUC },
            { provide: UpdateNotification, useValue: mockUpdateUC },
            { provide: GetNotifications, useValue: mockGetUC },
            { provide: SubscribeToNotifications, useValue: mockSubscribeUC },
          ],
        });
        const newFacade = TestBed.inject(NotificationsFacade);
        newFacade.complete();
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Reactive State Management Tests
  // ============================================================================

  describe('Reactive State Management', () => {
    describe('Private Signal Updates', () => {
      it('should update notifications signal correctly', async () => {
        // Act
        await facade.refresh();

        // Assert
        expect(facade.notifications()).toEqual(mockNotifications);
      });

      it('should update loading signal during operations', async () => {
        // Arrange
        const mockNotification = Notification.create({
          type: NotificationType.SUCCESS,
          message: 'Test',
          userId: 'user-123',
        });

        // Set up initial notifications state
        facade['_notifications'].set([mockNotification]);

        let resolveNotify: (value: string) => void;
        const notifyPromise = new Promise<string>((resolve) => {
          resolveNotify = resolve;
        });
        mockNotifyUC.execute.and.returnValue(notifyPromise);

        // Act
        const notifyOperation = facade.notify({
          type: NotificationType.SUCCESS,
          message: 'Test',
        });

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveNotify!(mockNotification.id);
        await notifyOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should update error signal on operation failures', async () => {
        // Arrange
        const error = new Error('Notification failed');
        mockNotifyUC.execute.and.returnValue(Promise.reject(error));

        // Act
        try {
          await facade.notify({
            type: NotificationType.SUCCESS,
            message: 'Test',
          });
        } catch {
          // Expected error
        }

        // Assert
        expect(facade.error()).toBe('Notification failed');
      });

      it('should update unread count correctly', async () => {
        // Act
        await facade.refresh();

        // Assert
        const expectedUnreadCount = mockNotifications.filter((n) => !n.isRead).length;
        expect(facade.unreadCount()).toBe(expectedUnreadCount);
      });

      it('should update total count correctly', async () => {
        // Act
        await facade.refresh();

        // Assert
        expect(facade.totalCount()).toBe(mockNotifications.length);
      });
    });

    describe('Computed Properties', () => {
      beforeEach(async () => {
        await facade.refresh();
      });

      it('should compute hasNotifications correctly', () => {
        expect(facade.hasNotifications()).toBe(true);

        // Test with empty state
        facade.reset();
        expect(facade.hasNotifications()).toBe(false);
      });

      it('should compute hasUnread correctly', () => {
        const hasUnread = mockNotifications.some((n) => !n.isRead);
        expect(facade.hasUnread()).toBe(hasUnread);
      });

      it('should provide combined state object', () => {
        const state = facade.state();
        expect(state).toEqual({
          notifications: mockNotifications,
          loading: false,
          error: null,
          unreadCount: mockNotifications.filter((n) => !n.isRead).length,
          totalCount: mockNotifications.length,
        });
      });
    });

    describe('State Reset and Cleanup', () => {
      it('should reset all state when reset() is called', async () => {
        // Arrange - Set some state
        await facade.refresh();
        expect(facade.notifications().length).toBeGreaterThan(0);

        // Act
        facade.reset();

        // Assert
        expect(facade.notifications()).toEqual([]);
        expect(facade.loading()).toBe(false);
        expect(facade.error()).toBeNull();
        expect(facade.unreadCount()).toBe(0);
        expect(facade.totalCount()).toBe(0);
        expect(facade.hasNotifications()).toBe(false);
        expect(facade.hasUnread()).toBe(false);
      });

      it('should clear error state when clearError() is called', async () => {
        // Arrange - Set an error
        const error = new Error('Test error');
        mockNotifyUC.execute.and.returnValue(Promise.reject(error));
        try {
          await facade.notify({ type: NotificationType.SUCCESS, message: 'Test' });
        } catch {
          // Expected error
        }
        expect(facade.error()).not.toBeNull();

        // Act
        facade.clearError();

        // Assert
        expect(facade.error()).toBeNull();
      });
    });
  });

  // ============================================================================
  // Core Operation Tests
  // ============================================================================

  describe('Core Operations', () => {
    describe('notify', () => {
      const notifyRequest: NotifyRequest = {
        type: NotificationType.SUCCESS,
        message: 'Test notification',
        description: 'Test description',
        userId: 123,
      };

      it('should call NotifyUC and update state on successful notification', async () => {
        // Arrange
        mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
        // Mock that the notification appears in state after creation
        (facade as any)._notifications.set([mockNotification]);

        // Act
        const result = await facade.notify(notifyRequest);

        // Assert
        expect(mockNotifyUC.execute).toHaveBeenCalledWith({
          type: notifyRequest.type,
          message: notifyRequest.message,
          description: notifyRequest.description,
          userId: notifyRequest.userId,
        });
        // The facade returns a newly created notification, not the mock
        expect(result).toEqual(
          jasmine.objectContaining({
            id: 'notification-123',
            type: NotificationType.SUCCESS,
            message: 'Test notification',
            userId: '123', // userId is converted to string
            channel: 'in_app',
          })
        );
        expect(facade.loading()).toBe(false);
      });

      it('should handle notification errors and update error state', async () => {
        // Arrange
        const error = new Error('Notification creation failed');
        mockNotifyUC.execute.and.returnValue(Promise.reject(error));

        // Act & Assert
        await expectAsync(facade.notify(notifyRequest)).toBeRejectedWith(error);
        expect(facade.error()).toBe('Notification creation failed');
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during notification operation', async () => {
        // Arrange
        let resolveNotify: (value: string) => void;
        const notifyPromise = new Promise<string>((resolve) => {
          resolveNotify = resolve;
        });
        mockNotifyUC.execute.and.returnValue(notifyPromise);

        // Act
        const notifyOperation = facade.notify(notifyRequest);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        (facade as any)._notifications.set([mockNotification]);
        resolveNotify!('notification-123');
        await notifyOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
        (facade as any)._notifications.set([mockNotification]);

        // Act
        await facade.notify(notifyRequest, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false);
      });

      it('should clear error state before notification', async () => {
        // Arrange - Set an existing error
        (facade as any)._notificationError.set('Previous error');
        mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
        (facade as any)._notifications.set([mockNotification]);

        // Act
        await facade.notify(notifyRequest);

        // Assert
        expect(facade.error()).toBeNull();
      });
    });

    describe('dismiss', () => {
      const dismissRequest: DismissNotificationRequest = {
        notificationId: 'notification-123',
        requesterId: 123,
      };

      it('should call DismissUC and return success result', async () => {
        // Arrange
        (facade as any)._notifications.set([mockNotification]);
        mockDismissUC.execute.and.returnValue(Promise.resolve());

        // Act
        const result = await facade.dismiss(dismissRequest);

        // Assert
        expect(mockDismissUC.execute).toHaveBeenCalledWith({
          notificationId: dismissRequest.notificationId,
          requesterId: dismissRequest.requesterId,
        });
        expect(result).toEqual({
          notificationId: dismissRequest.notificationId,
          success: true,
        });
        expect(facade.loading()).toBe(false);
      });

      it('should handle dismiss errors properly', async () => {
        // Arrange
        const error = new Error('Dismiss failed');
        mockDismissUC.execute.and.returnValue(Promise.reject(error));

        // Act & Assert
        await expectAsync(facade.dismiss(dismissRequest)).toBeRejectedWith(error);
        expect(facade.error()).toBe('Dismiss failed');
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during dismiss operation', async () => {
        // Arrange
        let resolveDismiss: () => void;
        const dismissPromise = new Promise<void>((resolve) => {
          resolveDismiss = resolve;
        });
        mockDismissUC.execute.and.returnValue(dismissPromise);

        // Act
        const dismissOperation = facade.dismiss(dismissRequest);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveDismiss!();
        await dismissOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockDismissUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.dismiss(dismissRequest, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false);
      });

      it('should clear error state before dismiss', async () => {
        // Arrange - Set an existing error
        (facade as any)._notificationError.set('Previous error');
        mockDismissUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.dismiss(dismissRequest);

        // Assert
        expect(facade.error()).toBeNull();
      });
    });

    describe('update', () => {
      const updateRequest: UpdateNotificationRequest = {
        notificationId: 'notification-123',
        updateData: { isRead: true },
        requesterId: 123,
      };

      it('should call UpdateUC and refresh state on success', async () => {
        // Arrange
        mockUpdateUC.execute.and.returnValue(Promise.resolve());
        const updatedNotification = { ...mockNotification, isRead: true };
        (facade as any)._notifications.set([updatedNotification]);

        // Act
        const result = await facade.update(updateRequest);

        // Assert
        expect(mockUpdateUC.execute).toHaveBeenCalledWith(updateRequest);
        expect(mockGetUC.execute).toHaveBeenCalled(); // refresh called
        expect(result).toEqual({
          success: true,
          notificationId: updateRequest.notificationId,
          updatedFields: ['isRead'],
        });
      });

      it('should handle update errors properly', async () => {
        // Arrange
        const error = new Error('Update failed');
        mockUpdateUC.execute.and.returnValue(Promise.reject(error));

        // Act & Assert
        await expectAsync(facade.update(updateRequest)).toBeRejectedWith(error);
        expect(facade.error()).toBe('Update failed');
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during update operation', async () => {
        // Arrange
        let resolveUpdate: () => void;
        const updatePromise = new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        });
        mockUpdateUC.execute.and.returnValue(updatePromise);

        // Act
        const updateOperation = facade.update(updateRequest);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveUpdate!();
        await updateOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockUpdateUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.update(updateRequest, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false);
      });

      it('should clear error state before update', async () => {
        // Arrange - Set an existing error
        (facade as any)._notificationError.set('Previous error');
        mockUpdateUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.update(updateRequest);

        // Assert
        expect(facade.error()).toBeNull();
      });
    });

    describe('clear', () => {
      const clearRequest: ClearNotificationsRequest = {
        requesterId: 123,
      };

      it('should call ClearUC and return cleared count', async () => {
        // Arrange
        (facade as any)._notifications.set(mockNotifications); // 3 notifications
        (facade as any)._totalCount.set(mockNotifications.length);
        mockClearUC.execute.and.returnValue(Promise.resolve());
        // After clear, only 1 notification remains
        mockGetUC.execute.and.returnValue(
          Promise.resolve({
            notifications: [mockNotification],
            totalCount: 1,
            unreadCount: 1,
          })
        );

        // Act
        const result = await facade.clear(clearRequest);

        // Assert
        expect(mockClearUC.execute).toHaveBeenCalledWith(clearRequest);
        expect(mockGetUC.execute).toHaveBeenCalled(); // refresh called
        expect(result).toEqual({
          success: true,
          clearedCount: 2, // 3 - 1 = 2 cleared
        });
      });

      it('should handle clear errors properly', async () => {
        // Arrange
        const error = new Error('Clear failed');
        mockClearUC.execute.and.returnValue(Promise.reject(error));

        // Act & Assert
        await expectAsync(facade.clear(clearRequest)).toBeRejectedWith(error);
        expect(facade.error()).toBe('Clear failed');
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during clear operation', async () => {
        // Arrange
        let resolveClear: () => void;
        const clearPromise = new Promise<void>((resolve) => {
          resolveClear = resolve;
        });
        mockClearUC.execute.and.returnValue(clearPromise);

        // Act
        const clearOperation = facade.clear(clearRequest);

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveClear!();
        await clearOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Arrange
        mockClearUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.clear(clearRequest, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false);
      });

      it('should handle default empty request', async () => {
        // Arrange
        mockClearUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.clear();

        // Assert
        expect(mockClearUC.execute).toHaveBeenCalledWith({});
      });
    });

    describe('refresh', () => {
      it('should call GetUC and update state with results', async () => {
        // Act
        const result = await facade.refresh(123);

        // Assert
        expect(mockGetUC.execute).toHaveBeenCalledWith({
          requesterId: 123,
        });
        expect(facade.notifications()).toEqual(mockNotifications);
        expect(facade.totalCount()).toBe(mockNotifications.length);
        expect(facade.unreadCount()).toBe(mockNotifications.filter((n) => !n.isRead).length);
        expect(result).toEqual({
          notifications: mockNotifications,
          totalCount: mockNotifications.length,
        });
      });

      it('should handle refresh errors properly', async () => {
        // Arrange
        const error = new Error('Refresh failed');
        mockGetUC.execute.and.returnValue(Promise.reject(error));

        // Act & Assert
        await expectAsync(facade.refresh()).toBeRejectedWith(error);
        expect(facade.error()).toBe('Refresh failed');
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during refresh operation', async () => {
        // Arrange
        let resolveRefresh: (value: any) => void;
        const refreshPromise = new Promise<any>((resolve) => {
          resolveRefresh = resolve;
        });
        mockGetUC.execute.and.returnValue(refreshPromise);

        // Act
        const refreshOperation = facade.refresh();

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveRefresh!({
          notifications: mockNotifications,
          totalCount: mockNotifications.length,
        });
        await refreshOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Act
        await facade.refresh(123, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false);
      });

      it('should handle undefined userId parameter', async () => {
        // Act
        await facade.refresh();

        // Assert
        expect(mockGetUC.execute).toHaveBeenCalledWith({
          requesterId: undefined,
        });
      });
    });
  });

  // ============================================================================
  // Convenience Method Tests
  // ============================================================================

  describe('Convenience Methods', () => {
    beforeEach(() => {
      // Mock successful notification creation
      mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
      (facade as any)._notifications.set([mockNotification]);
    });

    it('should delegate success() to notify() with SUCCESS type', async () => {
      // Act
      await facade.success('Success message', 'Success description');

      // Assert
      expect(mockNotifyUC.execute).toHaveBeenCalledWith({
        type: NotificationType.SUCCESS,
        message: 'Success message',
        description: 'Success description',
        userId: undefined,
      });
    });

    it('should delegate notificationError() to notify() with ERROR type', async () => {
      // Act
      await facade.notificationError('Error message', 'Error description');

      // Assert
      expect(mockNotifyUC.execute).toHaveBeenCalledWith({
        type: NotificationType.ERROR,
        message: 'Error message',
        description: 'Error description',
        userId: undefined,
      });
    });

    it('should delegate warning() to notify() with WARNING type', async () => {
      // Act
      await facade.warning('Warning message', 'Warning description');

      // Assert
      expect(mockNotifyUC.execute).toHaveBeenCalledWith({
        type: NotificationType.WARNING,
        message: 'Warning message',
        description: 'Warning description',
        userId: undefined,
      });
    });

    it('should delegate info() to notify() with INFO type', async () => {
      // Act
      await facade.info('Info message', 'Info description');

      // Assert
      expect(mockNotifyUC.execute).toHaveBeenCalledWith({
        type: NotificationType.INFO,
        message: 'Info message',
        description: 'Info description',
        userId: undefined,
      });
    });

    it('should pass options correctly to all convenience methods', async () => {
      // Arrange
      const opts: FacadeOpts = { skipLoading: true };

      // Act
      await facade.success('Test', undefined, opts);

      // Assert - Loading should not have been set
      expect(facade.loading()).toBe(false);
    });

    it('should handle convenience method errors consistently', async () => {
      // Arrange
      const error = new Error('Convenience method failed');
      mockNotifyUC.execute.and.returnValue(Promise.reject(error));

      // Act & Assert
      await expectAsync(facade.success('Test')).toBeRejectedWith(error);
      await expectAsync(facade.notificationError('Test')).toBeRejectedWith(error);
      await expectAsync(facade.warning('Test')).toBeRejectedWith(error);
      await expectAsync(facade.info('Test')).toBeRejectedWith(error);
    });

    it('should handle undefined description parameter', async () => {
      // Act
      await facade.success('Test message');

      // Assert
      expect(mockNotifyUC.execute).toHaveBeenCalledWith({
        type: NotificationType.SUCCESS,
        message: 'Test message',
        description: undefined,
        userId: undefined,
      });
    });
  });

  // ============================================================================
  // Subscription and Event System Tests
  // ============================================================================

  describe('Subscription and Event System', () => {
    describe('subscribeToUpdates', () => {
      it('should create observable and execute SubscribeUC', async () => {
        // Arrange
        const mockUnsubscribe = jasmine.createSpy('unsubscribe');
        mockSubscribeUC.execute.and.returnValue(Promise.resolve(mockUnsubscribe));

        // Reset spy calls to ignore initialization call
        mockSubscribeUC.execute.calls.reset();

        // Act
        const subscription = facade.subscribeToUpdates({
          requesterId: 123,
          callback: jasmine.createSpy('callback'),
        });

        // Wait for the observable to emit (which happens after use case execution)
        const result = await new Promise<Notification[]>((resolve) => {
          subscription.subscribe({
            next: (notifications) => resolve(notifications),
            error: () => resolve([]), // Handle errors gracefully
          });
        });

        // Assert
        expect(result).toEqual([]);
        expect(mockSubscribeUC.execute).toHaveBeenCalledWith(
          jasmine.objectContaining({
            callback: jasmine.any(Function),
            requesterId: 123,
          })
        );
        expect(mockSubscribeUC.execute).toHaveBeenCalledTimes(1);
      });

      it('should emit current notifications immediately', (done) => {
        // Arrange
        (facade as any)._notifications.set(mockNotifications);
        mockSubscribeUC.execute.and.returnValue(Promise.resolve(() => {}));

        // Reset spy calls to ignore initialization call
        mockSubscribeUC.execute.calls.reset();

        let callCount = 0;

        // Act
        const subscription = facade.subscribeToUpdates({
          requesterId: 123,
          callback: jasmine.createSpy('callback'),
        });

        // Assert
        subscription.subscribe({
          next: (notifications) => {
            callCount++;
            if (callCount === 1) {
              expect(notifications).toEqual(mockNotifications);
              done();
            }
          },
        });
      });

      it('should handle subscription errors gracefully', (done) => {
        // Arrange
        const error = new Error('Subscription failed');
        mockSubscribeUC.execute.and.returnValue(Promise.reject(error));

        // Act
        const subscription = facade.subscribeToUpdates({
          requesterId: 123,
          callback: jasmine.createSpy('callback'),
        });

        // Assert
        subscription.subscribe({
          next: (notifications) => {
            // Should emit current notifications due to startWith
            expect(notifications).toEqual([]);
            // Wait for error to be set
            setTimeout(() => {
              expect(facade.error()).toBe('Subscription failed');
              done();
            }, 10);
          },
          error: () => {
            // Should not reach here due to catchError
            fail('Should not emit error');
          },
        });
      });

      it('should clean up subscription on unsubscribe', (done) => {
        // Arrange
        const mockUnsubscribe = jasmine.createSpy('unsubscribe');
        mockSubscribeUC.execute.and.returnValue(Promise.resolve(mockUnsubscribe));

        // Reset spy calls to ignore initialization call
        mockSubscribeUC.execute.calls.reset();

        // Act
        const observable = facade.subscribeToUpdates({
          requesterId: 123,
          callback: jasmine.createSpy('callback'),
        });

        // Subscribe and get the subscription object
        let subscriptionRef: any = null;
        const subscription = observable.subscribe({
          next: () => {
            // Unsubscribe immediately after first emission using the reference
            if (subscriptionRef) {
              subscriptionRef.unsubscribe();
              // Wait for cleanup
              setTimeout(() => {
                expect(mockUnsubscribe).toHaveBeenCalled();
                done();
              }, 10);
            }
          },
        });
        subscriptionRef = subscription;
      });

      it('should handle callback execution from use case', fakeAsync(() => {
        // Arrange
        let capturedCallbacks: any[] = [];
        let internalCallback: any = null;
        const mockCallback = jasmine.createSpy('callback');

        // Capture all callback requests (both internal and user)
        mockSubscribeUC.execute.and.callFake((request: SubscribeToNotificationsRequest) => {
          if (!internalCallback) {
            // This is the internal callback from initializeNotificationSync
            internalCallback = request.callback;
            console.log('[TEST] Captured internal callback from initialization');
          } else {
            // This is the user callback from subscribeToUpdates
            capturedCallbacks.push(request.callback);
            console.log('[TEST] Captured user callback from subscribeToUpdates');
          }
          return Promise.resolve(() => {});
        });

        // Don't reset spy calls - we want to capture the internal callback too
        // mockSubscribeUC.execute.calls.reset();

        // Act
        const subscription = facade.subscribeToUpdates({
          requesterId: 123,
          callback: mockCallback,
        });

        let receivedNotifications: Notification[] = [];
        let emitCount = 0;

        // Subscribe and collect all emissions
        const emissions: Notification[][] = [];
        subscription.subscribe({
          next: (notifications) => {
            console.log('[TEST] Emission received:', notifications.length, 'notifications');
            receivedNotifications = notifications;
            emissions.push([...notifications]);
            emitCount++;
            console.log('[TEST] emitCount now:', emitCount);
          },
          error: (err) => console.log('[TEST] Subscription error:', err),
          complete: () => console.log('[TEST] Subscription completed'),
        });

        // Wait for subscription setup
        tick(100);

        console.log('[TEST] About to call captured callbacks');
        // Simulate callback from use case - call both internal and user callbacks
        const newNotifications = [mockNotification];
        if (internalCallback) {
          console.log('[TEST] Calling internal callback');
          internalCallback(newNotifications);
        }
        capturedCallbacks.forEach((callback, index) => {
          if (callback) {
            console.log(`[TEST] Calling user callback ${index}`);
            callback(newNotifications);
          }
        });

        // Wait for signal updates to propagate
        setTimeout(() => {
          console.log('[TEST] Checking facade state after timeout');
          expect(facade.notifications()).toEqual(newNotifications);
        }, 0);
        tick(0);
        flush();

        console.log(
          '[TEST] Final state - emitCount:',
          emitCount,
          'receivedNotifications length:',
          receivedNotifications.length
        );
        // Assert - the facade's internal callback should cause the observable to emit
        expect(emitCount).toBeGreaterThanOrEqual(3); // Should have emitted at least 3 times (startWith + use case + callback)
        expect(emissions.length).toBeGreaterThanOrEqual(3);
        expect(receivedNotifications).toEqual(newNotifications);

        // Check facade state - signals should be updated
        expect(facade.notifications()).toEqual(newNotifications);
      }));
    });

    describe('onEvent', () => {
      it('should return observable of notification events', (done) => {
        // Act
        const eventObservable = facade.onEvent();

        // Assert
        expect(eventObservable).toBeDefined();

        // Subscribe to events
        eventObservable.subscribe({
          next: (event) => {
            expect(event.type).toBe(NotificationEventType.NOTIFICATION_CREATED);
            expect(event.timestamp).toBeInstanceOf(Date);
            done();
          },
        });

        // Trigger an event
        (facade as any).emitEvent(NotificationEventType.NOTIFICATION_CREATED, mockNotification);
      });

      it('should emit events with correct structure', (done) => {
        // Arrange
        const eventObservable = facade.onEvent();
        const testMetadata = { field: 'value' };

        // Act & Assert
        eventObservable.subscribe({
          next: (event: NotificationEvent) => {
            expect(event).toEqual({
              type: NotificationEventType.NOTIFICATION_UPDATED,
              notification: mockNotification,
              timestamp: jasmine.any(Date),
              metadata: testMetadata,
            });
            done();
          },
        });

        // Trigger event with metadata
        (facade as any).emitEvent(
          NotificationEventType.NOTIFICATION_UPDATED,
          mockNotification,
          testMetadata
        );
      });

      it('should handle multiple subscribers', () => {
        // Arrange
        const eventObservable = facade.onEvent();
        const subscriber1 = jasmine.createSpy('subscriber1');
        const subscriber2 = jasmine.createSpy('subscriber2');

        // Act
        eventObservable.subscribe(subscriber1);
        eventObservable.subscribe(subscriber2);

        // Trigger event
        (facade as any).emitEvent(NotificationEventType.NOTIFICATION_DISMISSED);

        // Assert
        expect(subscriber1).toHaveBeenCalled();
        expect(subscriber2).toHaveBeenCalled();
      });

      it('should not emit to closed subscribers', () => {
        // Arrange
        const eventObservable = facade.onEvent();
        const subscriber = jasmine.createSpy('subscriber');

        // Act
        const subscription = eventObservable.subscribe(subscriber);
        subscription.unsubscribe();

        // Trigger event after unsubscribe
        (facade as any).emitEvent(NotificationEventType.NOTIFICATION_CREATED);

        // Assert
        expect(subscriber).not.toHaveBeenCalled();
      });

      it('should handle event emission errors gracefully', () => {
        // Arrange
        const eventObservable = facade.onEvent();
        const subscriber = jasmine.createSpy('subscriber');

        // Act & Assert - Should not throw
        expect(() => {
          eventObservable.subscribe(subscriber);

          // Trigger event with problematic notification
          (facade as any).emitEvent(NotificationEventType.NOTIFICATION_CREATED, null);
        }).not.toThrow();
      });
    });

    describe('Event Emission Integration', () => {
      let eventSpy: jasmine.Spy;

      beforeEach(() => {
        eventSpy = jasmine.createSpy('eventSpy');
        facade.onEvent().subscribe(eventSpy);
      });

      it('should emit NOTIFICATION_CREATED event during notify()', async () => {
        // Arrange
        mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
        (facade as any)._notifications.set([mockNotification]);

        // Act
        await facade.notify({
          type: NotificationType.SUCCESS,
          message: 'Test',
        });

        // Assert - the facade emits the newly created notification, not the mock
        expect(eventSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            type: NotificationEventType.NOTIFICATION_CREATED,
            notification: jasmine.objectContaining({
              id: 'notification-123',
              type: NotificationType.SUCCESS,
              message: 'Test',
              userId: undefined, // No userId provided in the request
              channel: 'in_app',
            }),
            timestamp: jasmine.any(Date),
          })
        );
      });

      it('should emit NOTIFICATION_DISMISSED event during dismiss()', async () => {
        // Arrange
        (facade as any)._notifications.set([mockNotification]);
        mockDismissUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.dismiss({
          notificationId: 'notification-123',
          requesterId: 123,
        });

        // Assert
        expect(eventSpy).toHaveBeenCalledWith({
          type: NotificationEventType.NOTIFICATION_DISMISSED,
          notification: mockNotification,
          timestamp: jasmine.any(Date),
          metadata: undefined,
        });
      });

      it('should emit NOTIFICATION_UPDATED event during update()', async () => {
        // Arrange
        const updatedNotification = { ...mockNotification, isRead: true } as any;
        mockUpdateUC.execute.and.returnValue(Promise.resolve());
        mockGetUC.execute.and.returnValue(
          Promise.resolve({
            notifications: [updatedNotification],
            totalCount: 1,
          })
        );

        // Act
        await facade.update({
          notificationId: 'notification-123',
          updateData: { isRead: true },
          requesterId: 123,
        });

        // Assert
        expect(eventSpy).toHaveBeenCalledWith({
          type: NotificationEventType.NOTIFICATION_UPDATED,
          notification: updatedNotification,
          timestamp: jasmine.any(Date),
          metadata: { updatedFields: ['isRead'] },
        });
      });

      it('should emit NOTIFICATIONS_CLEARED event during clear()', async () => {
        // Arrange
        mockClearUC.execute.and.returnValue(Promise.resolve());

        // Act
        await facade.clear();

        // Assert
        expect(eventSpy).toHaveBeenCalledWith({
          type: NotificationEventType.NOTIFICATIONS_CLEARED,
          notification: undefined,
          timestamp: jasmine.any(Date),
          metadata: undefined,
        });
      });
    });

    describe('Event System Lifecycle', () => {
      it('should complete event subject when complete() is called', () => {
        // Arrange
        const eventObservable = facade.onEvent();
        const completeSpy = jasmine.createSpy('complete');

        eventObservable.subscribe({
          complete: completeSpy,
        });

        // Act
        facade.complete();

        // Assert
        expect(completeSpy).toHaveBeenCalled();
      });

      it('should not emit events after completion', () => {
        // Arrange
        const eventSpy = jasmine.createSpy('eventSpy');
        facade.onEvent().subscribe(eventSpy);

        // Act
        facade.complete();
        (facade as any).emitEvent(NotificationEventType.NOTIFICATION_CREATED);

        // Assert
        expect(eventSpy).not.toHaveBeenCalled();
      });

      it('should handle multiple complete() calls gracefully', () => {
        // Act & Assert - Should not throw
        expect(() => {
          facade.complete();
          facade.complete();
          facade.complete();
        }).not.toThrow();
      });
    });
  });

  // ============================================================================
  // Utility Method Tests
  // ============================================================================

  describe('Utility Methods', () => {
    describe('markAllAsRead', () => {
      beforeEach(async () => {
        // Set up notifications with some unread
        (facade as any)._notifications.set(mockNotifications);
        mockUpdateUC.execute.and.returnValue(Promise.resolve());
      });

      it('should update all unread notifications to read status', async () => {
        // Act
        await facade.markAllAsRead(123);

        // Assert
        const unreadNotifications = mockNotifications.filter((n) => !n.isRead);
        expect(mockUpdateUC.execute).toHaveBeenCalledTimes(unreadNotifications.length);

        unreadNotifications.forEach((notification) => {
          expect(mockUpdateUC.execute).toHaveBeenCalledWith({
            notificationId: notification.id,
            updateData: { isRead: true },
            requesterId: 123,
          });
        });
      });

      it('should handle markAllAsRead errors properly', async () => {
        // Arrange
        const error = new Error('Update failed');
        mockUpdateUC.execute.and.returnValue(Promise.reject(error));

        // Act & Assert
        await expectAsync(facade.markAllAsRead(123)).toBeRejectedWith(error);
        expect(facade.error()).toBe('Update failed');
        expect(facade.loading()).toBe(false);
      });

      it('should show loading state during markAllAsRead operation', async () => {
        // Arrange
        let resolveUpdate: () => void;
        const updatePromise = new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        });
        mockUpdateUC.execute.and.returnValue(updatePromise);

        // Act
        const markAllOperation = facade.markAllAsRead();

        // Assert - During operation
        expect(facade.loading()).toBe(true);

        // Complete the operation
        resolveUpdate!();
        await markAllOperation;

        // Assert - After operation
        expect(facade.loading()).toBe(false);
      });

      it('should skip loading state when opts.skipLoading is true', async () => {
        // Act
        await facade.markAllAsRead(123, { skipLoading: true });

        // Assert
        expect(facade.loading()).toBe(false);
      });

      it('should handle undefined userId parameter', async () => {
        // Act
        await facade.markAllAsRead();

        // Assert
        const unreadNotifications = mockNotifications.filter((n) => !n.isRead);
        unreadNotifications.forEach((notification) => {
          expect(mockUpdateUC.execute).toHaveBeenCalledWith({
            notificationId: notification.id,
            updateData: { isRead: true },
            requesterId: undefined,
          });
        });
      });

      it('should clear error state before markAllAsRead', async () => {
        // Arrange - Set an existing error
        (facade as any)._notificationError.set('Previous error');

        // Act
        await facade.markAllAsRead();

        // Assert
        expect(facade.error()).toBeNull();
      });

      it('should handle empty unread notifications list', async () => {
        // Arrange - All notifications are read
        const readNotifications = mockNotifications.map((n) => ({ ...n, isRead: true }));
        (facade as any)._notifications.set(readNotifications);

        // Act
        await facade.markAllAsRead();

        // Assert
        expect(mockUpdateUC.execute).not.toHaveBeenCalled();
        expect(facade.loading()).toBe(false);
      });

      it('should use skipLoading for individual update calls', async () => {
        // Arrange
        spyOn(facade, 'update').and.returnValue(
          Promise.resolve({
            success: true,
            notificationId: 'test',
            updatedFields: ['isRead'],
          })
        );

        // Act
        await facade.markAllAsRead();

        // Assert
        expect(facade.update).toHaveBeenCalledWith(jasmine.any(Object), { skipLoading: true });
      });
    });

    describe('Helper Methods', () => {
      beforeEach(async () => {
        await facade.refresh(); // Load mock notifications
      });

      describe('getByType', () => {
        it('should filter notifications by type correctly', () => {
          // Act
          const successNotifications = facade.getByType(NotificationType.SUCCESS);
          const infoNotifications = facade.getByType(NotificationType.INFO);
          const errorNotifications = facade.getByType(NotificationType.ERROR);

          // Assert
          expect(successNotifications).toEqual([mockNotifications[0]]);
          expect(infoNotifications).toEqual([mockNotifications[1]]);
          expect(errorNotifications).toEqual([mockNotifications[2]]);
        });

        it('should return empty array for non-existent type', () => {
          // Act
          const warningNotifications = facade.getByType(NotificationType.WARNING);

          // Assert
          expect(warningNotifications).toEqual([]);
        });

        it('should handle empty notifications state', () => {
          // Arrange
          facade.reset();

          // Act
          const notifications = facade.getByType(NotificationType.SUCCESS);

          // Assert
          expect(notifications).toEqual([]);
        });
      });

      describe('getUnread', () => {
        it('should filter unread notifications correctly', () => {
          // Act
          const unreadNotifications = facade.getUnread();

          // Assert
          const expectedUnread = mockNotifications.filter((n) => !n.isRead);
          expect(unreadNotifications).toEqual(expectedUnread);
        });

        it('should return empty array when all notifications are read', () => {
          // Arrange
          const readNotifications = mockNotifications.map((n) => ({ ...n, isRead: true }));
          (facade as any)._notifications.set(readNotifications);

          // Act
          const unreadNotifications = facade.getUnread();

          // Assert
          expect(unreadNotifications).toEqual([]);
        });

        it('should handle empty notifications state', () => {
          // Arrange
          facade.reset();

          // Act
          const unreadNotifications = facade.getUnread();

          // Assert
          expect(unreadNotifications).toEqual([]);
        });
      });

      describe('State Management Helpers', () => {
        it('should clear error state correctly', () => {
          // Arrange - Set an error
          (facade as any)._notificationError.set('Test error');
          expect(facade.error()).toBe('Test error');

          // Act
          facade.clearError();

          // Assert
          expect(facade.error()).toBeNull();
        });

        it('should reset all state correctly', () => {
          // Arrange - Set some state
          (facade as any)._notifications.set(mockNotifications);
          (facade as any)._loading.set(true);
          (facade as any)._notificationError.set('Test error');
          (facade as any)._unreadCount.set(5);
          (facade as any)._totalCount.set(10);

          // Act
          facade.reset();

          // Assert
          expect(facade.notifications()).toEqual([]);
          expect(facade.loading()).toBe(false);
          expect(facade.error()).toBeNull();
          expect(facade.unreadCount()).toBe(0);
          expect(facade.totalCount()).toBe(0);
          expect(facade.hasNotifications()).toBe(false);
          expect(facade.hasUnread()).toBe(false);
        });

        it('should handle multiple consecutive resets', () => {
          // Act & Assert - Should not throw
          expect(() => {
            facade.reset();
            facade.reset();
            facade.reset();
          }).not.toThrow();

          // State should remain reset
          expect(facade.notifications()).toEqual([]);
          expect(facade.loading()).toBe(false);
          expect(facade.error()).toBeNull();
        });
      });
    });
  });

  // ============================================================================
  // Error Handling and Transformation Tests
  // ============================================================================

  describe('Error Handling and Transformation', () => {
    it('should handle various error types consistently', async () => {
      // Arrange
      const errorScenarios = [
        { method: 'notify', error: new Error('Notify failed') },
        { method: 'dismiss', error: new Error('Dismiss failed') },
        { method: 'update', error: new Error('Update failed') },
        { method: 'clear', error: new Error('Clear failed') },
        { method: 'refresh', error: new Error('Refresh failed') },
      ];

      for (const scenario of errorScenarios) {
        // Set up the error
        switch (scenario.method) {
          case 'notify':
            mockNotifyUC.execute.and.returnValue(Promise.reject(scenario.error));
            break;
          case 'dismiss':
            mockDismissUC.execute.and.returnValue(Promise.reject(scenario.error));
            break;
          case 'update':
            mockUpdateUC.execute.and.returnValue(Promise.reject(scenario.error));
            break;
          case 'clear':
            mockClearUC.execute.and.returnValue(Promise.reject(scenario.error));
            break;
          case 'refresh':
            mockGetUC.execute.and.returnValue(Promise.reject(scenario.error));
            break;
        }

        // Act & Assert
        try {
          switch (scenario.method) {
            case 'notify':
              await facade.notify({ type: NotificationType.SUCCESS, message: 'test' });
              break;
            case 'dismiss':
              await facade.dismiss({ notificationId: 'test', requesterId: 123 });
              break;
            case 'update':
              await facade.update({ notificationId: 'test', updateData: {}, requesterId: 123 });
              break;
            case 'clear':
              await facade.clear();
              break;
            case 'refresh':
              await facade.refresh();
              break;
          }
          fail(`Expected ${scenario.method} to throw error`);
        } catch (error) {
          expect(error).toBe(scenario.error);
          expect(facade.error()).toBe(scenario.error.message);
          expect(facade.loading()).toBe(false);
        }

        // Reset error state for next iteration
        facade.clearError();
      }
    });

    it('should properly clean up loading state on errors', async () => {
      // Arrange
      const error = new Error('Operation failed');
      mockNotifyUC.execute.and.returnValue(Promise.reject(error));

      // Act
      try {
        await facade.notify({ type: NotificationType.SUCCESS, message: 'test' });
      } catch {
        // Expected error
      }

      // Assert
      expect(facade.loading()).toBe(false);
    });

    it('should handle non-Error objects gracefully', async () => {
      // Arrange
      const errorMessage = 'String error';
      mockNotifyUC.execute.and.returnValue(Promise.reject(errorMessage));

      // Act
      try {
        await facade.notify({ type: NotificationType.SUCCESS, message: 'test' });
      } catch {
        // Expected error
      }

      // Assert
      expect(facade.error()).toBe('Failed to create notification');
      expect(facade.loading()).toBe(false);
    });

    it('should isolate errors between operations', async () => {
      // Arrange
      mockNotifyUC.execute.and.returnValue(Promise.reject(new Error('Notify failed')));
      mockDismissUC.execute.and.returnValue(Promise.resolve());

      // Act
      try {
        await facade.notify({ type: NotificationType.SUCCESS, message: 'test' });
      } catch {
        // Expected error
      }

      // Clear error and try another operation
      facade.clearError();
      await facade.dismiss({ notificationId: 'test', requesterId: 123 });

      // Assert
      expect(facade.error()).toBeNull(); // Should not have error from successful dismiss
    });

    it('should clear error state at the beginning of each operation', async () => {
      // Arrange - Set an existing error
      (facade as any)._notificationError.set('Previous error');
      mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
      (facade as any)._notifications.set([mockNotification]);

      // Act
      await facade.notify({ type: NotificationType.SUCCESS, message: 'test' });

      // Assert
      expect(facade.error()).toBeNull();
    });

    it('should maintain error state integrity during concurrent operations', async () => {
      // Arrange
      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve, reject) => {
        resolveFirst = () => reject(error1);
      });

      let resolveSecond: () => void;
      const secondPromise = new Promise<void>((resolve, reject) => {
        resolveSecond = () => reject(error2);
      });

      mockDismissUC.execute.and.returnValue(firstPromise);
      mockClearUC.execute.and.returnValue(secondPromise);

      // Act
      const firstOperation = facade
        .dismiss({ notificationId: 'test1', requesterId: 123 })
        .catch(() => {});
      const secondOperation = facade.clear().catch(() => {});

      // Resolve in reverse order but wait for second to complete first
      resolveSecond!();
      await new Promise((resolve) => setTimeout(resolve, 1));
      resolveFirst!();

      await Promise.all([firstOperation, secondOperation]);

      // Assert - The last error to resolve should be set
      expect(facade.error()).toBe('First error');
    });
  });

  // ============================================================================
  // Integration and Coordination Tests
  // ============================================================================

  describe('Integration and Coordination', () => {
    it('should maintain state consistency across all operations', async () => {
      // This test simulates a sequence of operations to ensure state remains consistent.
      // The approach is to mock the results of use case calls and then verify the facade's state.

      // 1. Initial State: Start with a known state by refreshing.
      await facade.refresh();
      const initialTotalCount = facade.totalCount();
      const initialUnreadCount = facade.unreadCount();
      expect(initialTotalCount).toBe(3);
      expect(initialUnreadCount).toBe(1);

      // 2. Create Notification: A new unread notification is created.
      mockNotifyUC.execute.and.returnValue(Promise.resolve('new-notification'));
      const newNotification = { ...mockNotification, id: 'new-notification', isRead: false };

      // We simulate the state update from a subscription by mocking the next refresh.
      mockGetUC.execute.and.returnValue(
        Promise.resolve({
          notifications: [...facade.notifications(), newNotification as Notification],
          totalCount: initialTotalCount + 1,
          unreadCount: initialUnreadCount + 1,
        })
      );

      await facade.notify({ type: NotificationType.SUCCESS, message: 'New notification' });
      await facade.refresh(); // Simulate subscription update

      expect(facade.totalCount()).toBe(initialTotalCount + 1);
      expect(facade.unreadCount()).toBe(initialUnreadCount + 1);

      // 3. Update Notification: Mark the original unread notification as read.
      mockUpdateUC.execute.and.returnValue(Promise.resolve());
      const notificationsBeforeUpdate = facade.notifications();
      const notificationsAfterUpdate = notificationsBeforeUpdate.map((n) =>
        n.id === mockNotification.id ? ({ ...n, isRead: true } as Notification) : n
      );
      mockGetUC.execute.and.returnValue(
        Promise.resolve({
          notifications: notificationsAfterUpdate,
          totalCount: notificationsAfterUpdate.length,
          unreadCount: notificationsAfterUpdate.filter((n) => !n.isRead).length,
        })
      );

      await facade.update({
        notificationId: mockNotification.id,
        updateData: { isRead: true },
        requesterId: 123,
      });
      expect(facade.unreadCount()).toBe(initialUnreadCount); // Unread count goes back down

      // 4. Dismiss Notification: Dismiss the newly created notification.
      mockDismissUC.execute.and.returnValue(Promise.resolve());
      const notificationsBeforeDismiss = facade.notifications();
      const notificationsAfterDismiss = notificationsBeforeDismiss.filter(
        (n) => n.id !== newNotification.id
      );
      mockGetUC.execute.and.returnValue(
        Promise.resolve({
          notifications: notificationsAfterDismiss,
          totalCount: notificationsAfterDismiss.length,
          unreadCount: notificationsAfterDismiss.filter((n) => !n.isRead).length,
        })
      );

      await facade.dismiss({ notificationId: newNotification.id, requesterId: 123 });
      await facade.refresh(); // Simulate subscription update after dismiss

      expect(facade.totalCount()).toBe(initialTotalCount);
      expect(facade.unreadCount()).toBe(0); // All notifications should be read after dismissing the last unread one

      // 5. Clear All Notifications
      mockClearUC.execute.and.returnValue(Promise.resolve());
      mockGetUC.execute.and.returnValue(
        Promise.resolve({
          notifications: [],
          totalCount: 0,
          unreadCount: 0,
        })
      );

      await facade.clear();
      expect(facade.totalCount()).toBe(0);
      expect(facade.hasNotifications()).toBe(false);
    });

    it('should coordinate use case calls with proper parameters', async () => {
      // Test parameter passing accuracy

      const notifyRequest = {
        type: NotificationType.WARNING,
        message: 'Warning message',
        description: 'Warning description',
        userId: 456,
      };

      const dismissRequest = {
        notificationId: 'notification-789',
        requesterId: 456,
      };

      const updateRequest = {
        notificationId: 'notification-789',
        updateData: { isRead: true, priority: 'high' },
        requesterId: 456,
      };

      const clearRequest = {
        requesterId: 456,
        filter: { type: NotificationType.ERROR },
      };

      // Setup mocks
      mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-789'));
      (facade as any)._notifications.set([mockNotification]);
      mockDismissUC.execute.and.returnValue(Promise.resolve());
      mockUpdateUC.execute.and.returnValue(Promise.resolve());
      mockClearUC.execute.and.returnValue(Promise.resolve());

      // Execute operations
      await facade.notify(notifyRequest);
      await facade.dismiss(dismissRequest);
      await facade.update(updateRequest);
      await facade.clear(clearRequest);

      // Verify exact parameter passing
      expect(mockNotifyUC.execute).toHaveBeenCalledWith({
        type: notifyRequest.type,
        message: notifyRequest.message,
        description: notifyRequest.description,
        userId: notifyRequest.userId,
      });

      expect(mockDismissUC.execute).toHaveBeenCalledWith({
        notificationId: dismissRequest.notificationId,
        requesterId: dismissRequest.requesterId,
      });

      expect(mockUpdateUC.execute).toHaveBeenCalledWith(updateRequest);
      expect(mockClearUC.execute).toHaveBeenCalledWith(clearRequest);
    });

    it('should coordinate event emission with state changes', async () => {
      // Arrange
      const events: NotificationEvent[] = [];
      facade.onEvent().subscribe((event) => events.push(event));

      // Setup notifications in state
      (facade as any)._notifications.set([mockNotification]);

      // Act
      await facade.dismiss({
        notificationId: mockNotification.id,
        requesterId: 123,
      });

      // Assert
      expect(events.length).toBe(1);
      expect(events[0]).toEqual({
        type: NotificationEventType.NOTIFICATION_DISMISSED,
        notification: mockNotification,
        timestamp: jasmine.any(Date),
        metadata: undefined,
      });
    });

    it('should handle cross-facade coordination scenarios', async () => {
      // Test scenario: Notification creation should work regardless of facade state

      // 1. Reset facade to clean state
      facade.reset();
      expect(facade.hasNotifications()).toBe(false);

      // 2. Create notification
      mockNotifyUC.execute.and.returnValue(Promise.resolve('notification-123'));
      const testNotification = { ...mockNotification, message: 'Cross-facade test' };
      (facade as any)._notifications.set([testNotification]);
      (facade as any)._totalCount.set(1);
      (facade as any)._unreadCount.set(1);

      await facade.notify({
        type: NotificationType.SUCCESS,
        message: 'Cross-facade test',
      });

      // 3. Verify state is properly managed
      expect(facade.hasNotifications()).toBe(true);
      expect(facade.totalCount()).toBe(1);

      // 4. Verify the notification can be accessed by other systems
      const successNotifications = facade.getByType(NotificationType.SUCCESS);
      expect(successNotifications.length).toBe(1);
      expect(successNotifications[0].message).toBe('Cross-facade test');
    });

    it('should maintain subscription lifecycle correctly', async () => {
      // Arrange
      const mockUnsubscribe = jasmine.createSpy('unsubscribe');
      mockSubscribeUC.execute.and.returnValue(Promise.resolve(mockUnsubscribe));

      // Act
      const subscription = facade.subscribeToUpdates({
        requesterId: 123,
        callback: jasmine.createSpy('callback'),
      });

      // Subscribe and wait for setup to complete
      const rxSubscription = subscription.subscribe();
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for async setup

      // Now unsubscribe
      rxSubscription.unsubscribe();

      // Assert
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle real-time synchronization correctly', fakeAsync(() => {
      // Arrange
      let capturedCallback: any = null;
      const mockCallback = jasmine.createSpy('callback');

      mockSubscribeUC.execute.and.callFake((request: SubscribeToNotificationsRequest) => {
        capturedCallback = request.callback;
        return Promise.resolve(() => {});
      });

      // Reset spy calls to ignore initialization call
      mockSubscribeUC.execute.calls.reset();

      // Act - Subscribe to updates
      const subscription = facade.subscribeToUpdates({
        requesterId: 123,
        callback: mockCallback,
      });

      let receivedNotifications: Notification[] = [];
      let emitCount = 0;

      // Subscribe and wait for emissions
      const emissions: Notification[][] = [];
      subscription.subscribe({
        next: (notifications) => {
          receivedNotifications = notifications;
          emissions.push([...notifications]);
          emitCount++;
        },
      });

      // Wait for subscription setup to complete
      tick(50);

      // Simulate real-time update from service
      const realtimeNotifications = [
        { ...mockNotification, id: 'realtime-1' },
        { ...mockNotification, id: 'realtime-2' },
      ] as any;

      if (capturedCallback) {
        capturedCallback(realtimeNotifications);
      }

      // Wait for callback to be processed
      setTimeout(() => {
        console.log('[TEST] Checking facade state after timeout');
        expect(facade.notifications()).toEqual(realtimeNotifications);
        expect(facade.totalCount()).toBe(2);
        expect(facade.unreadCount()).toBe(2);
      }, 0);
      tick(0);
      flush();

      // Assert - the facade's internal callback should cause the observable to emit
      expect(emitCount).toBeGreaterThanOrEqual(3); // Should have emitted at least 3 times (startWith + use case + callback)
      expect(emissions.length).toBeGreaterThanOrEqual(3);
      expect(receivedNotifications).toEqual(realtimeNotifications);

      // Check facade state - signals should be updated
      expect(facade.notifications()).toEqual(realtimeNotifications);
      expect(facade.totalCount()).toBe(2);
      expect(facade.unreadCount()).toBe(2);
    }));

    it('should coordinate loading states across concurrent operations', async () => {
      // Arrange
      let resolveNotify: () => void;
      let resolveDismiss: () => void;

      const notifyPromise = new Promise<string>((resolve) => {
        resolveNotify = () => resolve('notification-123');
      });

      const dismissPromise = new Promise<void>((resolve) => {
        resolveDismiss = resolve;
      });

      mockNotifyUC.execute.and.returnValue(notifyPromise);
      mockDismissUC.execute.and.returnValue(dismissPromise);

      // Act
      const notifyOperation = facade.notify({ type: NotificationType.SUCCESS, message: 'test' });
      const dismissOperation = facade.dismiss({ notificationId: 'test', requesterId: 123 });

      // Assert - Loading should be true during operations
      expect(facade.loading()).toBe(true);

      // Complete first operation
      (facade as any)._notifications.set([mockNotification]);
      resolveNotify!();
      await notifyOperation;

      // Loading should still be true (dismiss still pending)
      expect(facade.loading()).toBe(true);

      // Complete second operation
      resolveDismiss!();
      await dismissOperation;

      // Loading should now be false
      expect(facade.loading()).toBe(false);
    });
  });
});
