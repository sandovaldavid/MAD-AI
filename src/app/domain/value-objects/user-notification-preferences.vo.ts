/**
 * Represents comprehensive user notification preferences in the MAD-AI system.
 *
 * @description
 * The UserNotificationPreferences value object encapsulates all business rules and logic
 * related to how users want to receive different types of notifications across various
 * channels. It provides comprehensive functionality for notification preference management,
 * privacy controls, delivery timing, and accessibility options.
 *
 * @businessRules
 * - At least one notification channel must be enabled at all times
 * - Critical system notifications cannot be completely disabled
 * - Users can configure different preferences for different notification types
 * - Privacy mode overrides individual channel settings for sensitive notifications
 * - Delivery timing must respect user's timezone and quiet hours
 * - Accessibility preferences override default notification behaviors
 *
 * @notificationTypes
 * - **System**: Critical system alerts, security notifications, maintenance
 * - **Email**: Marketing, newsletters, periodic reports, confirmations
 * - **Task**: Project updates, assignments, deadlines, status changes
 * - **Security**: Login alerts, password changes, suspicious activity
 * - **Marketing**: Promotional content, feature announcements, tips
 *
 * @channels
 * - **Email**: SMTP-based notifications to user's email address
 * - **In-App**: Real-time notifications within the application interface
 * - **Push**: Browser push notifications for immediate alerts
 * - **SMS**: Text message notifications for critical events (if configured)
 *
 * @example
 * ```typescript
 * // Create default preferences
 * const preferences = UserNotificationPreferences.createDefault();
 *
 * // Create custom preferences
 * const custom = UserNotificationPreferences.create({
 *   email: { system: true, task: true, marketing: false },
 *   inApp: { system: true, task: true, security: true },
 *   push: { system: true, task: false, security: true },
 *   quietHours: { start: '22:00', end: '07:00', timezone: 'America/New_York' },
 *   frequency: { digest: 'daily', immediate: ['system', 'security'] }
 * });
 *
 * // Check notification permissions
 * const canSendEmail = preferences.canReceiveNotification('email', 'task');
 * const channels = preferences.getEnabledChannelsFor('security');
 *
 * // Update preferences
 * const updated = preferences.updateChannelPreferences('email', {
 *   marketing: false,
 *   system: true
 * });
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 */

import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import type { FieldError } from '@domain/errors/field-error.type';

/**
 * Notification channel configuration interface.
 */
export interface NotificationChannelConfig {
    /** System and critical application notifications */
    system: boolean;
    /** Task and project-related notifications */
    task: boolean;
    /** Security and authentication notifications */
    security: boolean;
    /** Marketing and promotional notifications */
    marketing: boolean;
    /** Social interactions and mentions */
    social: boolean;
}

/**
 * Quiet hours configuration for notification delivery.
 */
export interface QuietHoursConfig {
    /** Start time in HH:MM format (24-hour) */
    start: string;
    /** End time in HH:MM format (24-hour) */
    end: string;
    /** User's timezone (IANA timezone identifier) */
    timezone: string;
    /** Whether to respect quiet hours for critical notifications */
    respectForCritical: boolean;
}

/**
 * Notification frequency and batching preferences.
 */
export interface NotificationFrequencyConfig {
    /** Digest frequency: immediate, hourly, daily, weekly */
    digest: 'immediate' | 'hourly' | 'daily' | 'weekly';
    /** Notification types that should always be immediate */
    immediate: string[];
    /** Maximum notifications per hour (0 = no limit) */
    maxPerHour: number;
    /** Batch similar notifications together */
    batchSimilar: boolean;
}

/**
 * Accessibility preferences for notifications.
 */
export interface AccessibilityConfig {
    /** Use high contrast colors */
    highContrast: boolean;
    /** Provide audio alerts */
    audioAlerts: boolean;
    /** Use screen reader compatible formats */
    screenReaderOptimized: boolean;
    /** Longer display duration for notifications */
    extendedDisplay: boolean;
    /** Reduce motion and animations */
    reduceMotion: boolean;
}

/**
 * Complete notification preferences structure.
 */
export interface NotificationPreferencesData {
    /** Email notification preferences */
    email: NotificationChannelConfig;
    /** In-application notification preferences */
    inApp: NotificationChannelConfig;
    /** Browser push notification preferences */
    push: NotificationChannelConfig;
    /** SMS notification preferences (optional) */
    sms?: Partial<NotificationChannelConfig>;
    /** Quiet hours configuration */
    quietHours: QuietHoursConfig;
    /** Frequency and batching preferences */
    frequency: NotificationFrequencyConfig;
    /** Accessibility preferences */
    accessibility: AccessibilityConfig;
    /** Global privacy mode (overrides individual settings) */
    privacyMode: boolean;
    /** Language preference for notifications */
    language: string;
}

/**
 * Represents validated and comprehensive user notification preferences.
 *
 * @class UserNotificationPreferences
 */
export class UserNotificationPreferences {
    private constructor(
        public readonly email: NotificationChannelConfig,
        public readonly inApp: NotificationChannelConfig,
        public readonly push: NotificationChannelConfig,
        public readonly sms: Partial<NotificationChannelConfig> | null,
        public readonly quietHours: QuietHoursConfig,
        public readonly frequency: NotificationFrequencyConfig,
        public readonly accessibility: AccessibilityConfig,
        public readonly privacyMode: boolean,
        public readonly language: string
    ) {}

    /**
     * Creates a validated UserNotificationPreferences instance.
     *
     * @param data - The notification preferences data to validate
     * @returns A new UserNotificationPreferences instance
     * @throws {ValidationError} When the preferences data is invalid
     *
     * @example
     * ```typescript
     * const preferences = UserNotificationPreferences.create({
     *   email: { system: true, task: true, security: true, marketing: false, social: false },
     *   inApp: { system: true, task: true, security: true, marketing: true, social: true },
     *   push: { system: true, task: false, security: true, marketing: false, social: false },
     *   quietHours: { start: '23:00', end: '07:00', timezone: 'UTC', respectForCritical: false },
     *   frequency: { digest: 'daily', immediate: ['system', 'security'], maxPerHour: 10, batchSimilar: true },
     *   accessibility: { highContrast: false, audioAlerts: false, screenReaderOptimized: false, extendedDisplay: false, reduceMotion: false },
     *   privacyMode: false,
     *   language: 'en'
     * });
     * ```
     */
    static create(data: NotificationPreferencesData): UserNotificationPreferences {
        const errors: FieldError[] = [];

        // Validate that at least one channel has system notifications enabled
        const hasSystemNotifications = data.email.system || data.inApp.system || data.push.system;
        if (!hasSystemNotifications) {
            errors.push({
                field: 'systemNotifications',
                value: data,
                message: 'System notifications must be enabled on at least one channel',
                code: ValidationErrorCode.VALIDATION_ERROR,
            });
        }

        // Validate quiet hours format
        if (!NotificationPreferencesSpecs.isValidTimeFormat(data.quietHours.start)) {
            errors.push({
                field: 'quietHours.start',
                value: data.quietHours.start,
                message: 'Quiet hours start time must be in HH:MM format',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        if (!NotificationPreferencesSpecs.isValidTimeFormat(data.quietHours.end)) {
            errors.push({
                field: 'quietHours.end',
                value: data.quietHours.end,
                message: 'Quiet hours end time must be in HH:MM format',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        // Validate timezone
        if (!NotificationPreferencesSpecs.isValidTimezone(data.quietHours.timezone)) {
            errors.push({
                field: 'quietHours.timezone',
                value: data.quietHours.timezone,
                message: 'Invalid timezone identifier',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        // Validate frequency settings
        if (data.frequency.maxPerHour < 0 || data.frequency.maxPerHour > 100) {
            errors.push({
                field: 'frequency.maxPerHour',
                value: data.frequency.maxPerHour,
                message: 'Max notifications per hour must be between 0 and 100',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        // Validate language code
        if (!NotificationPreferencesSpecs.isValidLanguageCode(data.language)) {
            errors.push({
                field: 'language',
                value: data.language,
                message: 'Invalid language code',
                code: ValidationErrorCode.FIELD_FORMAT_INVALID,
            });
        }

        if (errors.length > 0) {
            throw ValidationError.createFromFields(errors);
        }

        return new UserNotificationPreferences(
            data.email,
            data.inApp,
            data.push,
            data.sms || null,
            data.quietHours,
            data.frequency,
            data.accessibility,
            data.privacyMode,
            data.language
        );
    }

    /**
     * Creates default notification preferences based on business rules.
     *
     * @returns Default UserNotificationPreferences instance
     *
     * @example
     * ```typescript
     * const defaultPrefs = UserNotificationPreferences.createDefault();
     * console.log(defaultPrefs.canReceiveNotification('email', 'system')); // true
     * ```
     */
    static createDefault(): UserNotificationPreferences {
        return new UserNotificationPreferences(
            { system: true, task: true, security: true, marketing: false, social: false },
            { system: true, task: true, security: true, marketing: true, social: true },
            { system: true, task: false, security: true, marketing: false, social: false },
            null,
            { start: '23:00', end: '07:00', timezone: 'UTC', respectForCritical: false },
            {
                digest: 'daily',
                immediate: ['system', 'security'],
                maxPerHour: 10,
                batchSimilar: true,
            },
            {
                highContrast: false,
                audioAlerts: false,
                screenReaderOptimized: false,
                extendedDisplay: false,
                reduceMotion: false,
            },
            false,
            'en'
        );
    }

    /**
     * Checks if the user can receive a specific type of notification on a specific channel.
     *
     * @param channel - The notification channel to check
     * @param notificationType - The type of notification
     * @returns True if the user can receive the notification
     *
     * @example
     * ```typescript
     * const canReceive = preferences.canReceiveNotification('email', 'task');
     * if (canReceive) {
     *   await sendEmailNotification(user, taskUpdate);
     * }
     * ```
     */
    canReceiveNotification(
        channel: keyof Pick<NotificationPreferencesData, 'email' | 'inApp' | 'push' | 'sms'>,
        notificationType: keyof NotificationChannelConfig
    ): boolean {
        if (
            this.privacyMode &&
            !NotificationPreferencesSpecs.CRITICAL_NOTIFICATION_TYPES.includes(notificationType)
        ) {
            return false;
        }

        const channelConfig = this.getChannelConfig(channel);
        if (!channelConfig) return false;

        return channelConfig[notificationType] === true;
    }

    /**
     * Gets all enabled channels for a specific notification type.
     *
     * @param notificationType - The type of notification
     * @returns Array of enabled channel names
     *
     * @example
     * ```typescript
     * const channels = preferences.getEnabledChannelsFor('security');
     * console.log(channels); // ['email', 'inApp', 'push']
     * ```
     */
    getEnabledChannelsFor(notificationType: keyof NotificationChannelConfig): string[] {
        const enabledChannels: string[] = [];

        if (this.canReceiveNotification('email', notificationType)) {
            enabledChannels.push('email');
        }
        if (this.canReceiveNotification('inApp', notificationType)) {
            enabledChannels.push('inApp');
        }
        if (this.canReceiveNotification('push', notificationType)) {
            enabledChannels.push('push');
        }
        if (this.sms && this.canReceiveNotification('sms', notificationType)) {
            enabledChannels.push('sms');
        }

        return enabledChannels;
    }

    /**
     * Checks if notifications should be delivered now based on quiet hours.
     *
     * @param notificationType - The type of notification to check
     * @param currentTime - Current time (defaults to now)
     * @returns True if notifications should be delivered
     *
     * @example
     * ```typescript
     * const shouldDeliver = preferences.shouldDeliverNow('task');
     * if (!shouldDeliver) {
     *   // Queue notification for later delivery
     *   await queueNotificationForLater(notification);
     * }
     * ```
     */
    shouldDeliverNow(
        notificationType: keyof NotificationChannelConfig,
        currentTime?: Date
    ): boolean {
        if (
            NotificationPreferencesSpecs.CRITICAL_NOTIFICATION_TYPES.includes(notificationType) &&
            !this.quietHours.respectForCritical
        ) {
            return true;
        }

        return !NotificationPreferencesUtils.isInQuietHours(this.quietHours, currentTime);
    }

    /**
     * Updates channel-specific preferences.
     *
     * @param channel - The channel to update
     * @param updates - Partial updates to apply
     * @returns New UserNotificationPreferences instance with updates
     *
     * @example
     * ```typescript
     * const updated = preferences.updateChannelPreferences('email', {
     *   marketing: false,
     *   task: true
     * });
     * ```
     */
    updateChannelPreferences(
        channel: keyof Pick<NotificationPreferencesData, 'email' | 'inApp' | 'push'>,
        updates: Partial<NotificationChannelConfig>
    ): UserNotificationPreferences {
        const newData: NotificationPreferencesData = {
            email: channel === 'email' ? { ...this.email, ...updates } : this.email,
            inApp: channel === 'inApp' ? { ...this.inApp, ...updates } : this.inApp,
            push: channel === 'push' ? { ...this.push, ...updates } : this.push,
            sms: this.sms || undefined,
            quietHours: this.quietHours,
            frequency: this.frequency,
            accessibility: this.accessibility,
            privacyMode: this.privacyMode,
            language: this.language,
        };

        return UserNotificationPreferences.create(newData);
    }

    /**
     * Updates quiet hours configuration.
     *
     * @param quietHours - New quiet hours configuration
     * @returns New UserNotificationPreferences instance with updated quiet hours
     *
     * @example
     * ```typescript
     * const updated = preferences.updateQuietHours({
     *   start: '22:00',
     *   end: '08:00',
     *   timezone: 'America/New_York',
     *   respectForCritical: true
     * });
     * ```
     */
    updateQuietHours(quietHours: QuietHoursConfig): UserNotificationPreferences {
        const newData: NotificationPreferencesData = {
            email: this.email,
            inApp: this.inApp,
            push: this.push,
            sms: this.sms || undefined,
            quietHours,
            frequency: this.frequency,
            accessibility: this.accessibility,
            privacyMode: this.privacyMode,
            language: this.language,
        };

        return UserNotificationPreferences.create(newData);
    }

    /**
     * Toggles privacy mode on or off.
     *
     * @param enabled - Whether to enable privacy mode
     * @returns New UserNotificationPreferences instance with updated privacy mode
     *
     * @example
     * ```typescript
     * const privateMode = preferences.setPrivacyMode(true);
     * console.log(privateMode.canReceiveNotification('email', 'marketing')); // false
     * ```
     */
    setPrivacyMode(enabled: boolean): UserNotificationPreferences {
        const newData: NotificationPreferencesData = {
            email: this.email,
            inApp: this.inApp,
            push: this.push,
            sms: this.sms || undefined,
            quietHours: this.quietHours,
            frequency: this.frequency,
            accessibility: this.accessibility,
            privacyMode: enabled,
            language: this.language,
        };

        return UserNotificationPreferences.create(newData);
    }

    /**
     * Gets the effective delivery preferences for a notification type.
     *
     * @param notificationType - The type of notification
     * @returns Delivery preferences object
     *
     * @example
     * ```typescript
     * const delivery = preferences.getDeliveryPreferences('task');
     * console.log(delivery.channels); // ['email', 'inApp']
     * console.log(delivery.frequency); // 'daily'
     * ```
     */
    getDeliveryPreferences(notificationType: keyof NotificationChannelConfig): {
        channels: string[];
        frequency: string;
        shouldBatch: boolean;
        respectQuietHours: boolean;
    } {
        return {
            channels: this.getEnabledChannelsFor(notificationType),
            frequency: this.frequency.immediate.includes(notificationType)
                ? 'immediate'
                : this.frequency.digest,
            shouldBatch: this.frequency.batchSimilar,
            respectQuietHours:
                !NotificationPreferencesSpecs.CRITICAL_NOTIFICATION_TYPES.includes(
                    notificationType
                ) || this.quietHours.respectForCritical,
        };
    }

    /**
     * Checks if this preferences object equals another.
     *
     * @param other - The other UserNotificationPreferences to compare with
     * @returns True if the preferences are equal
     */
    equals(other: UserNotificationPreferences): boolean {
        return (
            JSON.stringify(this.email) === JSON.stringify(other.email) &&
            JSON.stringify(this.inApp) === JSON.stringify(other.inApp) &&
            JSON.stringify(this.push) === JSON.stringify(other.push) &&
            JSON.stringify(this.sms) === JSON.stringify(other.sms) &&
            JSON.stringify(this.quietHours) === JSON.stringify(other.quietHours) &&
            JSON.stringify(this.frequency) === JSON.stringify(other.frequency) &&
            JSON.stringify(this.accessibility) === JSON.stringify(other.accessibility) &&
            this.privacyMode === other.privacyMode &&
            this.language === other.language
        );
    }

    /**
     * Converts preferences to a plain object for serialization.
     *
     * @returns Plain object representation
     */
    toPlainObject(): NotificationPreferencesData {
        return {
            email: this.email,
            inApp: this.inApp,
            push: this.push,
            sms: this.sms || undefined,
            quietHours: this.quietHours,
            frequency: this.frequency,
            accessibility: this.accessibility,
            privacyMode: this.privacyMode,
            language: this.language,
        };
    }

    /**
     * Gets a summary of notification preferences for display.
     *
     * @returns Human-readable summary of preferences
     *
     * @example
     * ```typescript
     * const summary = preferences.getSummary();
     * console.log(summary);
     * // {
     * //   totalChannels: 3,
     * //   enabledChannels: ['email', 'inApp'],
     * //   privacyMode: false,
     * //   quietHoursActive: true
     * // }
     * ```
     */
    getSummary(): {
        totalChannels: number;
        enabledChannels: string[];
        privacyMode: boolean;
        quietHoursActive: boolean;
        language: string;
        accessibilityEnabled: boolean;
    } {
        const allChannels = ['email', 'inApp', 'push', ...(this.sms ? ['sms'] : [])];
        const enabledChannels = allChannels.filter((channel) => {
            const config = this.getChannelConfig(channel as any);
            return config && Object.values(config).some(Boolean);
        });

        return {
            totalChannels: allChannels.length,
            enabledChannels,
            privacyMode: this.privacyMode,
            quietHoursActive: this.quietHours.start !== this.quietHours.end,
            language: this.language,
            accessibilityEnabled: Object.values(this.accessibility).some(Boolean),
        };
    }

    /**
     * Gets the configuration for a specific channel.
     *
     * @private
     * @param channel - The channel to get configuration for
     * @returns Channel configuration or null if not available
     */
    private getChannelConfig(
        channel: string
    ): NotificationChannelConfig | Partial<NotificationChannelConfig> | null {
        switch (channel) {
            case 'email':
                return this.email;
            case 'inApp':
                return this.inApp;
            case 'push':
                return this.push;
            case 'sms':
                return this.sms;
            default:
                return null;
        }
    }
}

/**
 * Namespace containing notification preferences specifications and validation rules.
 *
 * @namespace NotificationPreferencesSpecs
 */
export namespace NotificationPreferencesSpecs {
    /**
     * Critical notification types that bypass privacy mode and quiet hours restrictions.
     */
    export const CRITICAL_NOTIFICATION_TYPES: (keyof NotificationChannelConfig)[] = [
        'system',
        'security',
    ];

    /**
     * Supported language codes for notifications.
     */
    export const SUPPORTED_LANGUAGES = [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'ja',
        'ko',
        'zh',
        'ar',
        'ru',
    ] as const;

    /**
     * Valid digest frequency options.
     */
    export const DIGEST_FREQUENCIES = ['immediate', 'hourly', 'daily', 'weekly'] as const;

    /**
     * Time format validation pattern (HH:MM in 24-hour format).
     */
    export const TIME_FORMAT_PATTERN = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    /**
     * Common timezone identifiers (subset of IANA timezone database).
     */
    export const COMMON_TIMEZONES = [
        'UTC',
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
        'America/Sao_Paulo',
    ] as const;

    /**
     * Validates time format (HH:MM).
     *
     * @param time - Time string to validate
     * @returns True if format is valid
     */
    export function isValidTimeFormat(time: string): boolean {
        return TIME_FORMAT_PATTERN.test(time);
    }

    /**
     * Validates timezone identifier.
     *
     * @param timezone - Timezone string to validate
     * @returns True if timezone is valid
     */
    export function isValidTimezone(timezone: string): boolean {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validates language code.
     *
     * @param language - Language code to validate
     * @returns True if language code is supported
     */
    export function isValidLanguageCode(language: string): boolean {
        return SUPPORTED_LANGUAGES.includes(language as any);
    }

    /**
     * Gets default channel configuration.
     *
     * @param channel - Channel type
     * @returns Default configuration for the channel
     */
    export function getDefaultChannelConfig(
        channel: 'email' | 'inApp' | 'push' | 'sms'
    ): NotificationChannelConfig {
        switch (channel) {
            case 'email':
                return {
                    system: true,
                    task: true,
                    security: true,
                    marketing: false,
                    social: false,
                };
            case 'inApp':
                return { system: true, task: true, security: true, marketing: true, social: true };
            case 'push':
                return {
                    system: true,
                    task: false,
                    security: true,
                    marketing: false,
                    social: false,
                };
            case 'sms':
                return {
                    system: false,
                    task: false,
                    security: true,
                    marketing: false,
                    social: false,
                };
            default:
                return {
                    system: false,
                    task: false,
                    security: false,
                    marketing: false,
                    social: false,
                };
        }
    }

    /**
     * Gets accessibility defaults based on user requirements.
     *
     * @param requirements - Specific accessibility requirements
     * @returns Accessibility configuration
     */
    export function getAccessibilityDefaults(requirements?: {
        visualImpairment?: boolean;
        hearingImpairment?: boolean;
        motorImpairment?: boolean;
    }): AccessibilityConfig {
        return {
            highContrast: requirements?.visualImpairment || false,
            audioAlerts: requirements?.hearingImpairment || false,
            screenReaderOptimized: requirements?.visualImpairment || false,
            extendedDisplay: requirements?.motorImpairment || false,
            reduceMotion: requirements?.motorImpairment || false,
        };
    }
}

/**
 * Namespace containing notification preferences utility functions.
 *
 * @namespace NotificationPreferencesUtils
 */
export namespace NotificationPreferencesUtils {
    /**
     * Checks if the current time falls within quiet hours.
     *
     * @param quietHours - Quiet hours configuration
     * @param currentTime - Current time (defaults to now)
     * @returns True if currently in quiet hours
     */
    export function isInQuietHours(quietHours: QuietHoursConfig, currentTime?: Date): boolean {
        const now = currentTime || new Date();

        try {
            const timeInUserTz = new Intl.DateTimeFormat('en-CA', {
                timeZone: quietHours.timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            }).format(now);

            const [startHour, startMin] = quietHours.start.split(':').map(Number);
            const [endHour, endMin] = quietHours.end.split(':').map(Number);
            const [currentHour, currentMin] = timeInUserTz.split(':').map(Number);

            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const currentMinutes = currentHour * 60 + currentMin;

            if (startMinutes <= endMinutes) {
                // Same day quiet hours (e.g., 14:00 to 18:00)
                return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
            } else {
                // Overnight quiet hours (e.g., 23:00 to 07:00)
                return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
            }
        } catch {
            // If timezone processing fails, assume not in quiet hours
            return false;
        }
    }

    /**
     * Calculates the next delivery time respecting quiet hours.
     *
     * @param quietHours - Quiet hours configuration
     * @param currentTime - Current time (defaults to now)
     * @returns Next available delivery time
     */
    export function getNextDeliveryTime(quietHours: QuietHoursConfig, currentTime?: Date): Date {
        const now = currentTime || new Date();

        if (!isInQuietHours(quietHours, now)) {
            return now;
        }

        // Calculate when quiet hours end
        const [endHour, endMin] = quietHours.end.split(':').map(Number);
        const deliveryTime = new Date(now);
        deliveryTime.setHours(endHour, endMin, 0, 0);

        // If end time is earlier than current time, it's the next day
        if (deliveryTime <= now) {
            deliveryTime.setDate(deliveryTime.getDate() + 1);
        }

        return deliveryTime;
    }

    /**
     * Merges multiple preference objects with conflict resolution.
     *
     * @param base - Base preferences
     * @param overrides - Override preferences (takes precedence)
     * @returns Merged preferences
     */
    export function mergePreferences(
        base: NotificationPreferencesData,
        overrides: Partial<NotificationPreferencesData>
    ): NotificationPreferencesData {
        return {
            email: { ...base.email, ...overrides.email },
            inApp: { ...base.inApp, ...overrides.inApp },
            push: { ...base.push, ...overrides.push },
            sms: overrides.sms !== undefined ? overrides.sms : base.sms,
            quietHours: { ...base.quietHours, ...overrides.quietHours },
            frequency: { ...base.frequency, ...overrides.frequency },
            accessibility: { ...base.accessibility, ...overrides.accessibility },
            privacyMode:
                overrides.privacyMode !== undefined ? overrides.privacyMode : base.privacyMode,
            language: overrides.language || base.language,
        };
    }

    /**
     * Validates preference migration from legacy format.
     *
     * @param legacyPrefs - Legacy preferences object
     * @returns Migrated preferences data
     */
    export function migrateLegacyPreferences(legacyPrefs: {
        email?: boolean;
        system?: boolean;
        task?: boolean;
    }): NotificationPreferencesData {
        const emailEnabled = legacyPrefs.email !== false;
        const systemEnabled = legacyPrefs.system !== false;
        const taskEnabled = legacyPrefs.task !== false;

        return {
            email: {
                system: emailEnabled && systemEnabled,
                task: emailEnabled && taskEnabled,
                security: emailEnabled && systemEnabled,
                marketing: false,
                social: false,
            },
            inApp: {
                system: systemEnabled,
                task: taskEnabled,
                security: systemEnabled,
                marketing: true,
                social: true,
            },
            push: {
                system: systemEnabled,
                task: false,
                security: systemEnabled,
                marketing: false,
                social: false,
            },
            quietHours: {
                start: '23:00',
                end: '07:00',
                timezone: 'UTC',
                respectForCritical: false,
            },
            frequency: {
                digest: 'daily',
                immediate: ['system', 'security'],
                maxPerHour: 10,
                batchSimilar: true,
            },
            accessibility: {
                highContrast: false,
                audioAlerts: false,
                screenReaderOptimized: false,
                extendedDisplay: false,
                reduceMotion: false,
            },
            privacyMode: false,
            language: 'en',
        };
    }

    /**
     * Generates a preferences summary for analytics.
     *
     * @param preferences - Preferences to analyze
     * @returns Analytics summary
     */
    export function generateAnalyticsSummary(preferences: UserNotificationPreferences): {
        channelsEnabled: number;
        notificationTypesEnabled: number;
        privacyModeActive: boolean;
        quietHoursConfigured: boolean;
        accessibilityFeaturesUsed: number;
        preferredDigestFrequency: string;
    } {
        const summary = preferences.getSummary();

        return {
            channelsEnabled: summary.enabledChannels.length,
            notificationTypesEnabled: Object.values(preferences.email).filter(Boolean).length,
            privacyModeActive: preferences.privacyMode,
            quietHoursConfigured: preferences.quietHours.start !== preferences.quietHours.end,
            accessibilityFeaturesUsed: Object.values(preferences.accessibility).filter(Boolean)
                .length,
            preferredDigestFrequency: preferences.frequency.digest,
        };
    }
}

// Legacy compatibility - keep existing simple interface for backward compatibility
export interface SimpleNotificationPreferences {
    /** Enable email notifications for business events */
    email: boolean;
    /** Enable in-system notifications */
    system: boolean;
    /** Enable task-related notifications */
    task: boolean;
}

/**
 * Legacy simple notification preferences class for backward compatibility.
 *
 * @deprecated Use UserNotificationPreferences instead
 */
export class UserNotificationPreferencesSimple {
    private constructor(
        public readonly email: boolean,
        public readonly system: boolean,
        public readonly task: boolean
    ) {}

    static create(preferences: SimpleNotificationPreferences): UserNotificationPreferencesSimple {
        const errors: FieldError[] = [];

        const hasAnyEnabled = preferences.email || preferences.system || preferences.task;
        if (!hasAnyEnabled) {
            errors.push({
                field: 'preferences',
                value: preferences,
                message: 'At least one notification type must be enabled',
                code: ValidationErrorCode.VALIDATION_ERROR,
            });
        }

        if (errors.length > 0) {
            throw ValidationError.createFromFields(errors);
        }

        return new UserNotificationPreferencesSimple(
            preferences.email,
            preferences.system,
            preferences.task
        );
    }

    static createDefault(): UserNotificationPreferencesSimple {
        return new UserNotificationPreferencesSimple(true, true, true);
    }

    allowsEmailNotifications(): boolean {
        return this.email;
    }

    allowsSystemNotifications(): boolean {
        return this.system;
    }

    allowsTaskNotifications(): boolean {
        return this.task;
    }

    getEnabledChannels(): Array<'email' | 'system' | 'task'> {
        const channels: Array<'email' | 'system' | 'task'> = [];

        if (this.email) channels.push('email');
        if (this.system) channels.push('system');
        if (this.task) channels.push('task');

        return channels;
    }

    updatePreferences(
        updates: Partial<SimpleNotificationPreferences>
    ): UserNotificationPreferencesSimple {
        const newPreferences: SimpleNotificationPreferences = {
            email: updates.email ?? this.email,
            system: updates.system ?? this.system,
            task: updates.task ?? this.task,
        };

        return UserNotificationPreferencesSimple.create(newPreferences);
    }

    hasAnyNotificationsEnabled(): boolean {
        return this.email || this.system || this.task;
    }

    equals(other: UserNotificationPreferencesSimple): boolean {
        return (
            this.email === other.email && this.system === other.system && this.task === other.task
        );
    }

    toPlainObject(): SimpleNotificationPreferences {
        return {
            email: this.email,
            system: this.system,
            task: this.task,
        };
    }

    /**
     * Converts simple preferences to comprehensive preferences.
     *
     * @returns UserNotificationPreferences instance
     */
    toComprehensive(): UserNotificationPreferences {
        return UserNotificationPreferences.create(
            NotificationPreferencesUtils.migrateLegacyPreferences({
                email: this.email,
                system: this.system,
                task: this.task,
            })
        );
    }

    toString(): string {
        return `UserNotificationPreferences(email:${this.email}, system:${this.system}, task:${this.task})`;
    }
}
