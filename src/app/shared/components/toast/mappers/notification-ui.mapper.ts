/**
 * Notification UI Mapper - Shared Components Layer
 *
 * Maps domain notification actions to UI notification actions.
 * This maintains Clean Architecture by keeping domain concepts separate
 * from UI implementation details while providing the bridge between them.
 *
 * @fileoverview Maps domain notification actions to UI actions
 * @module Shared/Components/Toast/Mappers
 * @since 1.0.0
 */

import type { NotificationAction } from '@domain/entities/notification.entity';
import type { UINotificationAction } from '../types/ui-notification.types';

/**
 * Action handler registry for domain action types
 * This maps business action types to their concrete implementations
 */
export interface ActionHandlerRegistry {
  [actionType: string]: (data?: Record<string, unknown>) => void | Promise<void>;
}

/**
 * Notification UI Mapper
 * Converts domain notification actions to UI-ready actions with handlers
 */
export class NotificationUIMapper {
  private static actionHandlers: ActionHandlerRegistry = {};

  /**
   * Register an action handler for a specific action type
   * This allows the UI layer to define how domain actions are executed
   *
   * @param actionType - The domain action type identifier
   * @param handler - The function to execute when this action is triggered
   */
  static registerActionHandler(
    actionType: string,
    handler: (data?: Record<string, unknown>) => void | Promise<void>
  ): void {
    this.actionHandlers[actionType] = handler;
  }

  /**
   * Unregister an action handler
   *
   * @param actionType - The domain action type to unregister
   */
  static unregisterActionHandler(actionType: string): void {
    delete this.actionHandlers[actionType];
  }

  /**
   * Convert a domain notification action to a UI notification action
   *
   * @param domainAction - The domain action to convert
   * @returns UI notification action with concrete implementation
   */
  static toUIAction(domainAction: NotificationAction): UINotificationAction {
    const handler = this.actionHandlers[domainAction.id];

    if (!handler) {
      console.warn(`No handler registered for action id: ${domainAction.id}`);
    }

    return {
      label: domainAction.label,
      run: () => {
        if (handler) {
          return handler(domainAction.data);
        } else {
          console.warn(`Action handler not found for: ${domainAction.id}`);
        }
      },
      closeOnClick: domainAction.type !== 'primary', // Primary actions stay open
      // Map action types to UI variants
      variant: this.mapActionTypeToVariant(domainAction.type),
    };
  }

  /**
   * Convert multiple domain actions to UI actions
   *
   * @param domainActions - Array of domain actions to convert
   * @returns Array of UI notification actions
   */
  static toUIActions(domainActions: NotificationAction[]): UINotificationAction[] {
    return domainActions.map((action) => this.toUIAction(action));
  }

  /**
   * Map domain action types to UI variants
   * This provides visual feedback based on the business intent
   *
   * @param actionType - The domain action type
   * @returns UI variant for styling
   */
  private static mapActionTypeToVariant(actionType: string): UINotificationAction['variant'] {
    // Map domain action types to UI variants
    if (actionType === 'primary') {
      return 'primary';
    }
    if (actionType === 'dismiss') {
      return 'secondary';
    }

    // Default to secondary for unknown action types
    return 'secondary';
  }

  /**
   * Get all registered action handlers
   * Useful for debugging and testing
   *
   * @returns Copy of the action handler registry
   */
  static getRegisteredHandlers(): Record<string, string> {
    return Object.keys(this.actionHandlers).reduce(
      (acc, key) => {
        acc[key] = 'function';
        return acc;
      },
      {} as Record<string, string>
    );
  }

  /**
   * Clear all registered action handlers
   * Useful for testing or module cleanup
   */
  static clearAllHandlers(): void {
    this.actionHandlers = {};
  }
}

/**
 * Common notification action types
 * These represent standard business actions that notifications might trigger
 */
export const CommonNotificationActions = {
  DISMISS: 'dismiss',
  VIEW_DETAILS: 'view_details',
  MARK_AS_READ: 'mark_as_read',
  RETRY: 'retry',
  UNDO: 'undo',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
  NAVIGATE_TO: 'navigate_to',
  DOWNLOAD: 'download',
  REFRESH: 'refresh',
} as const;

/**
 * Helper functions for creating common notification actions
 */
export const NotificationActionFactory = {
  /**
   * Create a dismiss action
   */
  createDismissAction(label: string = 'Cerrar'): NotificationAction {
    return {
      id: CommonNotificationActions.DISMISS,
      label,
      type: 'dismiss',
    };
  },

  /**
   * Create a view details action
   */
  createViewDetailsAction(label: string = 'Ver detalles', targetUrl?: string): NotificationAction {
    return {
      id: CommonNotificationActions.VIEW_DETAILS,
      label,
      type: 'secondary',
      url: targetUrl,
    };
  },

  /**
   * Create a retry action
   */
  createRetryAction(
    label: string = 'Reintentar',
    retryData?: Record<string, unknown>
  ): NotificationAction {
    return {
      id: CommonNotificationActions.RETRY,
      label,
      type: 'primary',
      data: retryData,
    };
  },

  /**
   * Create an undo action
   */
  createUndoAction(
    label: string = 'Deshacer',
    undoData?: Record<string, unknown>
  ): NotificationAction {
    return {
      id: CommonNotificationActions.UNDO,
      label,
      type: 'secondary',
      data: undoData,
    };
  },
};
