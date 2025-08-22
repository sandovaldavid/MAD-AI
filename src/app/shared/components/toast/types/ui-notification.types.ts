/**
 * UI Notification Types - Shared Components Layer
 * 
 * Defines actions that can be performed from UI notifications.
 * These are presentation-specific interaction patterns for the user interface.
 * 
 * @fileoverview UI notification action types and configurations
 * @module Shared/Components/Toast/Types
 * @since 1.0.0
 */

import type { UINotificationPosition } from '../enums/ui-notification-position.enum';

/**
 * Represents an action that can be performed from a UI notification
 * Supports both synchronous and asynchronous operations with UI feedback
 */
export interface UINotificationAction {
    /** Display text for the action button */
    label: string;
    /** Function to execute when action is triggered */
    run: () => void | Promise<void>;
    /** Accessibility label for screen readers */
    ariaLabel?: string;
    /** Whether to close notification after action execution (default: true) */
    closeOnClick?: boolean;
    /** Visual style variant for the action button */
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    /** Icon to display alongside the action label */
    icon?: string;
    /** Whether the action is disabled */
    disabled?: boolean;
    /** Tooltip text for additional context */
    tooltip?: string;
    /** Loading state for async operations */
    loading?: boolean;
}

/**
 * Configuration for UI notification behavior and appearance
 * Contains all presentation-specific settings for notifications
 */
export interface UINotificationConfig {
    /** Maximum number of notifications visible on desktop */
    maxVisibleDesktop: number;
    /** Maximum number of notifications visible on mobile */
    maxVisibleMobile: number;
    /** Time window for deduplication in milliseconds */
    dedupeWindowMs: number;
    /** Deduplication strategy */
    dedupeMode: 'omit' | 'replace' | 'stack';
    /** Default settings for each notification type */
    defaults: {
        success: UINotificationDefaults;
        info: UINotificationDefaults;
        warning: UINotificationDefaults;
        error: UINotificationDefaults;
        position: {
            desktop: UINotificationPosition;
            mobile: UINotificationPosition;
        };
    };
}

/**
 * Default settings for a specific notification type
 */
export interface UINotificationDefaults {
    /** Default duration in milliseconds (0 = no auto-dismiss) */
    duration: number;
    /** Whether notifications of this type can be manually dismissed */
    dismissible: boolean;
    /** Default icon for this notification type */
    icon?: string;
    /** Default actions for this notification type */
    actions?: UINotificationAction[];
}

/**
 * Animation configuration for UI notifications
 */
export interface UINotificationAnimation {
    /** Animation type for showing notifications */
    enter: 'slide' | 'fade' | 'bounce' | 'scale';
    /** Animation type for hiding notifications */
    exit: 'slide' | 'fade' | 'bounce' | 'scale';
    /** Animation duration in milliseconds */
    duration: number;
    /** Animation easing function */
    easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;
}

/**
 * Theme configuration for UI notifications
 */
export interface UINotificationTheme {
    /** Color scheme */
    mode: 'light' | 'dark' | 'auto';
    /** Border radius for notification containers */
    borderRadius: string;
    /** Shadow configuration */
    shadow: string;
    /** Font family */
    fontFamily: string;
    /** Font size for notification text */
    fontSize: string;
    /** Custom color overrides */
    colors?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
        background?: string;
        text?: string;
        border?: string;
    };
}

/**
 * Responsive configuration for UI notifications
 */
export interface UINotificationResponsive {
    /** Breakpoint for mobile layout */
    mobileBreakpoint: string;
    /** Mobile-specific overrides */
    mobile: {
        maxWidth: string;
        padding: string;
        fontSize: string;
        position?: UINotificationPosition;
    };
    /** Desktop-specific overrides */
    desktop: {
        maxWidth: string;
        padding: string;
        fontSize: string;
        position?: UINotificationPosition;
    };
}

/**
 * Accessibility configuration for UI notifications
 */
export interface UINotificationAccessibility {
    /** Whether to announce notifications to screen readers */
    announce: boolean;
    /** ARIA live region politeness level */
    politeness: 'polite' | 'assertive' | 'off';
    /** Whether to focus notification actions when shown */
    focusActions: boolean;
    /** Whether to provide keyboard navigation */
    keyboardNavigation: boolean;
    /** High contrast mode support */
    highContrast: boolean;
    /** Reduced motion support */
    reducedMotion: boolean;
}

/**
 * Complete UI notification configuration
 * Combines all aspects of notification presentation and behavior
 */
export interface UINotificationSystemConfig extends UINotificationConfig {
    /** Animation settings */
    animation?: UINotificationAnimation;
    /** Theme settings */
    theme?: UINotificationTheme;
    /** Responsive settings */
    responsive?: UINotificationResponsive;
    /** Accessibility settings */
    accessibility?: UINotificationAccessibility;
}

/**
 * Utility functions for UI notification actions
 */
export const UINotificationActionUtils = {
    /**
     * Create a basic action with default settings
     * @param label - Action label
     * @param handler - Action handler function
     * @param options - Additional options
     * @returns Complete UINotificationAction
     */
    createAction(
        label: string,
        handler: () => void | Promise<void>,
        options?: Partial<UINotificationAction>
    ): UINotificationAction {
        return {
            label,
            run: handler,
            closeOnClick: true,
            variant: 'primary',
            disabled: false,
            loading: false,
            ...options,
        };
    },

    /**
     * Create a dismiss action
     * @param label - Optional custom label (defaults to "Cerrar")
     * @returns Dismiss action
     */
    createDismissAction(label: string = 'Cerrar'): UINotificationAction {
        return this.createAction(label, () => {}, {
            variant: 'secondary',
            closeOnClick: true,
            ariaLabel: 'Cerrar notificación',
        });
    },

    /**
     * Create a confirmation action
     * @param label - Action label
     * @param handler - Confirmation handler
     * @param options - Additional options
     * @returns Confirmation action
     */
    createConfirmAction(
        label: string,
        handler: () => void | Promise<void>,
        options?: Partial<UINotificationAction>
    ): UINotificationAction {
        return this.createAction(label, handler, {
            variant: 'primary',
            icon: 'check',
            ...options,
        });
    },

    /**
     * Create a danger/destructive action
     * @param label - Action label
     * @param handler - Danger action handler
     * @param options - Additional options
     * @returns Danger action
     */
    createDangerAction(
        label: string,
        handler: () => void | Promise<void>,
        options?: Partial<UINotificationAction>
    ): UINotificationAction {
        return this.createAction(label, handler, {
            variant: 'danger',
            icon: 'alert-triangle',
            ...options,
        });
    },

    /**
     * Validate a UI notification action
     * @param action - Action to validate
     * @returns True if action is valid
     */
    isValid(action: unknown): action is UINotificationAction {
        return (
            typeof action === 'object' &&
            action !== null &&
            'label' in action &&
            'run' in action &&
            typeof (action as any).label === 'string' &&
            typeof (action as any).run === 'function'
        );
    },
} as const;
