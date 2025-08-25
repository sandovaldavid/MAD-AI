/**
 * Notification Action Registry Service - Shared Components Layer
 *
 * Service that registers common notification action handlers.
 * This bridges domain notification actions with concrete UI implementations.
 *
 * @fileoverview Service for registering notification action handlers
 * @module Shared/Components/Toast/Services
 * @since 1.0.0
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationUIMapper, CommonNotificationActions } from '../mappers/notification-ui.mapper';

/**
 * Service that registers handlers for common notification actions
 * This should be initialized early in the application lifecycle
 */
@Injectable({ providedIn: 'root' })
export class NotificationActionRegistryService {
  private router = inject(Router);

  /**
   * Initialize and register all common action handlers
   * Call this in app initialization (app.config.ts or main.ts)
   */
  initializeActionHandlers(): void {
    this.registerDismissAction();
    this.registerViewDetailsAction();
    this.registerMarkAsReadAction();
    this.registerRetryAction();
    this.registerUndoAction();
    this.registerNavigateToAction();
    this.registerRefreshAction();
  }

  /**
   * Register dismiss action handler
   */
  private registerDismissAction(): void {
    NotificationUIMapper.registerActionHandler(CommonNotificationActions.DISMISS, async () => {
      // Dismiss action is handled by the notification system itself
      // No additional logic needed here
      console.debug('Notification dismissed');
    });
  }

  /**
   * Register view details action handler
   */
  private registerViewDetailsAction(): void {
    NotificationUIMapper.registerActionHandler(
      CommonNotificationActions.VIEW_DETAILS,
      async (data) => {
        if (data?.['url']) {
          await this.router.navigateByUrl(data['url'] as string);
        } else {
          console.warn('View details action triggered without URL');
        }
      }
    );
  }

  /**
   * Register mark as read action handler
   */
  private registerMarkAsReadAction(): void {
    NotificationUIMapper.registerActionHandler(
      CommonNotificationActions.MARK_AS_READ,
      async (data) => {
        // This would typically call a service to mark notification as read
        console.debug('Mark as read action triggered', data);

        // Example: Call notification service to mark as read
        // const notificationId = data?.['notificationId'];
        // if (notificationId) {
        //     await this.notificationService.markAsRead(notificationId);
        // }
      }
    );
  }

  /**
   * Register retry action handler
   */
  private registerRetryAction(): void {
    NotificationUIMapper.registerActionHandler(CommonNotificationActions.RETRY, async (data) => {
      console.debug('Retry action triggered', data);

      // Example: Retry a failed operation
      // const operation = data?.['operation'];
      // const params = data?.['params'];
      // if (operation && typeof operation === 'function') {
      //     await operation(params);
      // }
    });
  }

  /**
   * Register undo action handler
   */
  private registerUndoAction(): void {
    NotificationUIMapper.registerActionHandler(CommonNotificationActions.UNDO, async (data) => {
      console.debug('Undo action triggered', data);

      // Example: Undo a previous action
      // const undoOperation = data?.['undoOperation'];
      // if (undoOperation && typeof undoOperation === 'function') {
      //     await undoOperation();
      // }
    });
  }

  /**
   * Register navigate to action handler
   */
  private registerNavigateToAction(): void {
    NotificationUIMapper.registerActionHandler(
      CommonNotificationActions.NAVIGATE_TO,
      async (data) => {
        const route = data?.['route'] as string;
        if (route) {
          await this.router.navigate([route]);
        } else {
          console.warn('Navigate to action triggered without route');
        }
      }
    );
  }

  /**
   * Register refresh action handler
   */
  private registerRefreshAction(): void {
    NotificationUIMapper.registerActionHandler(CommonNotificationActions.REFRESH, async () => {
      // Refresh the current page or reload specific data
      window.location.reload();
    });
  }

  /**
   * Register a custom action handler
   * Use this method to register application-specific action handlers
   *
   * @param actionType - The action type identifier
   * @param handler - The handler function
   */
  registerCustomAction(
    actionType: string,
    handler: (data?: Record<string, unknown>) => void | Promise<void>
  ): void {
    NotificationUIMapper.registerActionHandler(actionType, handler);
  }

  /**
   * Unregister an action handler
   *
   * @param actionType - The action type to unregister
   */
  unregisterAction(actionType: string): void {
    NotificationUIMapper.unregisterActionHandler(actionType);
  }
}
