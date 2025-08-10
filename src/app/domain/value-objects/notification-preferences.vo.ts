export interface NotificationPreferencesProps {
    email: boolean;
    system: boolean;
    task: boolean;
}

export class NotificationPreferencesVO {
    private constructor(public readonly props: NotificationPreferencesProps) {}
    /**
     * Creates a NotificationPreferences value object after validating the input.
     * @param props Notification preferences
     * @throws Error if any preference is missing or not boolean
     */
    static create(props: NotificationPreferencesProps): NotificationPreferencesVO {
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
