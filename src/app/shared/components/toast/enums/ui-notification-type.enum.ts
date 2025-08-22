/**
 * UI Notification Types - Shared Components Layer
 * 
 * Defines the visual types of notifications that can be displayed in the user interface.
 * These are presentation concerns and contain UI-specific configurations.
 * 
 * @fileoverview UI notification types with presentation configurations
 * @module Shared/Components/Toast/Enums
 * @since 1.0.0
 */

/**
 * Enumeration of UI notification types for visual presentation
 * Each type has associated visual characteristics (icons, colors, duration)
 */
export enum UINotificationType {
    /** Success notifications - positive feedback */
    SUCCESS = 'success',
    /** Error notifications - critical issues requiring attention */
    ERROR = 'error',
    /** Warning notifications - potential issues or important information */
    WARNING = 'warning',
    /** Informational notifications - general information */
    INFO = 'info',
}

/**
 * Human-readable labels for UI notification types
 * Used for accessibility and internationalization
 */
export const UI_NOTIFICATION_TYPE_LABELS = {
    [UINotificationType.SUCCESS]: 'Éxito',
    [UINotificationType.ERROR]: 'Error',
    [UINotificationType.WARNING]: 'Advertencia',
    [UINotificationType.INFO]: 'Información',
} as const;

/**
 * Visual configuration for each UI notification type
 * Contains presentation-specific settings (icons, colors, durations)
 */
export const UI_NOTIFICATION_TYPE_CONFIGS = {
    [UINotificationType.SUCCESS]: {
        icon: 'check-circle',
        color: 'green',
        duration: 3000,
        priority: 1,
    },
    [UINotificationType.ERROR]: {
        icon: 'x-circle',
        color: 'red',
        duration: 5000,
        priority: 4,
    },
    [UINotificationType.WARNING]: {
        icon: 'alert-triangle',
        color: 'yellow',
        duration: 4000,
        priority: 3,
    },
    [UINotificationType.INFO]: {
        icon: 'info-circle',
        color: 'blue',
        duration: 3000,
        priority: 2,
    },
} as const;

/**
 * Utility functions for UI notification type operations
 * Provides common operations and validations for UI notification types
 */
export const UINotificationTypeUtils = {
    /**
     * Get the default UI notification type
     * @returns The default notification type (INFO)
     */
    getDefault(): UINotificationType {
        return UINotificationType.INFO;
    },
    
    /**
     * Get all available UI notification types
     * @returns Array of all notification types
     */
    getAll(): UINotificationType[] {
        return Object.values(UINotificationType);
    },
    
    /**
     * Get the visual configuration for a notification type
     * @param type - The notification type
     * @returns Configuration object with icon, color, duration, and priority
     */
    getConfig(type: UINotificationType) {
        return UI_NOTIFICATION_TYPE_CONFIGS[type];
    },
    
    /**
     * Get the human-readable label for a notification type
     * @param type - The notification type
     * @returns Localized label string
     */
    getLabel(type: UINotificationType): string {
        return UI_NOTIFICATION_TYPE_LABELS[type];
    },
    
    /**
     * Check if the notification type represents an error
     * @param type - The notification type to check
     * @returns True if the type is ERROR
     */
    isError(type: UINotificationType): boolean {
        return type === UINotificationType.ERROR;
    },
    
    /**
     * Check if the notification type represents success
     * @param type - The notification type to check
     * @returns True if the type is SUCCESS
     */
    isSuccess(type: UINotificationType): boolean {
        return type === UINotificationType.SUCCESS;
    },

    /**
     * Check if the notification type represents a warning
     * @param type - The notification type to check
     * @returns True if the type is WARNING
     */
    isWarning(type: UINotificationType): boolean {
        return type === UINotificationType.WARNING;
    },

    /**
     * Check if the notification type represents information
     * @param type - The notification type to check
     * @returns True if the type is INFO
     */
    isInfo(type: UINotificationType): boolean {
        return type === UINotificationType.INFO;
    },

    /**
     * Get the priority level for a notification type
     * Lower numbers indicate higher priority
     * @param type - The notification type
     * @returns Priority level (1-4, where 1 is highest priority)
     */
    getPriority(type: UINotificationType): number {
        return UI_NOTIFICATION_TYPE_CONFIGS[type].priority;
    },

    /**
     * Sort notification types by priority
     * @param types - Array of notification types to sort
     * @returns Sorted array with highest priority first
     */
    sortByPriority(types: UINotificationType[]): UINotificationType[] {
        return types.sort((a, b) => this.getPriority(a) - this.getPriority(b));
    },

    /**
     * Validate if a value is a valid UI notification type
     * @param value - Value to validate
     * @returns True if value is a valid UINotificationType
     */
    isValid(value: unknown): value is UINotificationType {
        return typeof value === 'string' && 
               Object.values(UINotificationType).includes(value as UINotificationType);
    }
} as const;
