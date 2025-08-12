import type { NotificationPreferences } from '../models/notification/notification-preferences.model';

export class NotificationPreferencesVO {
    private constructor(public readonly props: NotificationPreferences) {}
    /**
     * Creates a NotificationPreferences value object after validating the input.
     * @param props Notification preferences
     * @throws Error if any preference is missing or not boolean
     */
    static create(props: NotificationPreferences): NotificationPreferencesVO {
        if (
            typeof props.email !== 'boolean' ||
            typeof props.system !== 'boolean' ||
            typeof props.task !== 'boolean'
        ) {
            throw new Error('All notification preferences must be boolean');
        }
        return new NotificationPreferencesVO(props);
    }
}
