export interface NotificationAction {
    label: string;
    run: () => void | Promise<void>;
    ariaLabel?: string;
    closeOnClick?: boolean;
}
