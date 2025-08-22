/**
 * UI Notification Position - Shared Components Layer
 * 
 * Defines the screen positions where notifications can be displayed.
 * These are purely presentation concerns for UI layout and positioning.
 * 
 * @fileoverview UI notification positioning for screen layout
 * @module Shared/Components/Toast/Enums
 * @since 1.0.0
 */

/**
 * Enumeration of screen positions for UI notifications
 * Defines where on the screen notifications should appear
 */
export enum UINotificationPosition {
    /** Top-left corner of the screen */
    TOP_LEFT = 'top-left',
    /** Top-center of the screen */
    TOP_CENTER = 'top-center',
    /** Top-right corner of the screen */
    TOP_RIGHT = 'top-right',
    /** Bottom-left corner of the screen */
    BOTTOM_LEFT = 'bottom-left',
    /** Bottom-center of the screen */
    BOTTOM_CENTER = 'bottom-center',
    /** Bottom-right corner of the screen */
    BOTTOM_RIGHT = 'bottom-right',
}

/**
 * Human-readable labels for UI notification positions
 * Used for configuration interfaces and accessibility
 */
export const UI_NOTIFICATION_POSITION_LABELS = {
    [UINotificationPosition.TOP_LEFT]: 'Superior Izquierda',
    [UINotificationPosition.TOP_CENTER]: 'Superior Centro',
    [UINotificationPosition.TOP_RIGHT]: 'Superior Derecha',
    [UINotificationPosition.BOTTOM_LEFT]: 'Inferior Izquierda',
    [UINotificationPosition.BOTTOM_CENTER]: 'Inferior Centro',
    [UINotificationPosition.BOTTOM_RIGHT]: 'Inferior Derecha',
} as const;

/**
 * CSS configuration for each notification position
 * Contains styling properties for proper positioning
 */
export const UI_NOTIFICATION_POSITION_CONFIGS = {
    [UINotificationPosition.TOP_LEFT]: {
        top: '20px',
        left: '20px',
        transform: 'none',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    [UINotificationPosition.TOP_CENTER]: {
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        flexDirection: 'column',
        alignItems: 'center',
    },
    [UINotificationPosition.TOP_RIGHT]: {
        top: '20px',
        right: '20px',
        transform: 'none',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    [UINotificationPosition.BOTTOM_LEFT]: {
        bottom: '20px',
        left: '20px',
        transform: 'none',
        flexDirection: 'column-reverse',
        alignItems: 'flex-start',
    },
    [UINotificationPosition.BOTTOM_CENTER]: {
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        flexDirection: 'column-reverse',
        alignItems: 'center',
    },
    [UINotificationPosition.BOTTOM_RIGHT]: {
        bottom: '20px',
        right: '20px',
        transform: 'none',
        flexDirection: 'column-reverse',
        alignItems: 'flex-end',
    },
} as const;

/**
 * Utility functions for UI notification position operations
 * Provides common operations and validations for UI notification positions
 */
export const UINotificationPositionUtils = {
    /**
     * Get the default UI notification position
     * @returns The default position (TOP_RIGHT)
     */
    getDefault(): UINotificationPosition {
        return UINotificationPosition.TOP_RIGHT;
    },
    
    /**
     * Get all available UI notification positions
     * @returns Array of all notification positions
     */
    getAll(): UINotificationPosition[] {
        return Object.values(UINotificationPosition);
    },
    
    /**
     * Get the CSS configuration for a notification position
     * @param position - The notification position
     * @returns CSS configuration object
     */
    getConfig(position: UINotificationPosition) {
        return UI_NOTIFICATION_POSITION_CONFIGS[position];
    },
    
    /**
     * Get the human-readable label for a notification position
     * @param position - The notification position
     * @returns Localized label string
     */
    getLabel(position: UINotificationPosition): string {
        return UI_NOTIFICATION_POSITION_LABELS[position];
    },
    
    /**
     * Check if the position is at the top of the screen
     * @param position - The notification position to check
     * @returns True if position is top-aligned
     */
    isTop(position: UINotificationPosition): boolean {
        return position.startsWith('top-');
    },
    
    /**
     * Check if the position is at the bottom of the screen
     * @param position - The notification position to check
     * @returns True if position is bottom-aligned
     */
    isBottom(position: UINotificationPosition): boolean {
        return position.startsWith('bottom-');
    },

    /**
     * Check if the position is on the left side of the screen
     * @param position - The notification position to check
     * @returns True if position is left-aligned
     */
    isLeft(position: UINotificationPosition): boolean {
        return position.endsWith('-left');
    },

    /**
     * Check if the position is on the right side of the screen
     * @param position - The notification position to check
     * @returns True if position is right-aligned
     */
    isRight(position: UINotificationPosition): boolean {
        return position.endsWith('-right');
    },

    /**
     * Check if the position is centered horizontally
     * @param position - The notification position to check
     * @returns True if position is center-aligned
     */
    isCenter(position: UINotificationPosition): boolean {
        return position.endsWith('-center');
    },
    
    /**
     * Get the vertical alignment of a position
     * @param position - The notification position
     * @returns Vertical alignment ('top' or 'bottom')
     */
    getVertical(position: UINotificationPosition): 'top' | 'bottom' {
        return this.isTop(position) ? 'top' : 'bottom';
    },
    
    /**
     * Get the horizontal alignment of a position
     * @param position - The notification position
     * @returns Horizontal alignment ('left', 'center', or 'right')
     */
    getHorizontal(position: UINotificationPosition): 'left' | 'center' | 'right' {
        if (position.endsWith('-left')) return 'left';
        if (position.endsWith('-center')) return 'center';
        return 'right';
    },

    /**
     * Get positions filtered by vertical alignment
     * @param vertical - Vertical alignment to filter by
     * @returns Array of positions matching the vertical alignment
     */
    getByVertical(vertical: 'top' | 'bottom'): UINotificationPosition[] {
        return this.getAll().filter(pos => this.getVertical(pos) === vertical);
    },

    /**
     * Get positions filtered by horizontal alignment
     * @param horizontal - Horizontal alignment to filter by
     * @returns Array of positions matching the horizontal alignment
     */
    getByHorizontal(horizontal: 'left' | 'center' | 'right'): UINotificationPosition[] {
        return this.getAll().filter(pos => this.getHorizontal(pos) === horizontal);
    },

    /**
     * Get the opposite position (horizontally mirrored)
     * @param position - The notification position
     * @returns The horizontally mirrored position
     */
    getOpposite(position: UINotificationPosition): UINotificationPosition {
        const vertical = this.getVertical(position);
        const horizontal = this.getHorizontal(position);
        
        const oppositeHorizontal = horizontal === 'left' ? 'right' : 
                                 horizontal === 'right' ? 'left' : 'center';
        
        return `${vertical}-${oppositeHorizontal}` as UINotificationPosition;
    },

    /**
     * Validate if a value is a valid UI notification position
     * @param value - Value to validate
     * @returns True if value is a valid UINotificationPosition
     */
    isValid(value: unknown): value is UINotificationPosition {
        return typeof value === 'string' && 
               Object.values(UINotificationPosition).includes(value as UINotificationPosition);
    }
} as const;
