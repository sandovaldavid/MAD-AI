import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NOTIFICATION_CONFIG, NOTIFICATION_PORT, NotificationConfig } from './tokens';
import { NotificationGatewayService } from '../infrastructure/services/notification-gateway.service';
import { NotificationPosition } from '../domain/enums/notification';

export function provideNotifications(): EnvironmentProviders {
    const config: NotificationConfig = {
        maxVisibleDesktop: 3,
        maxVisibleMobile: 2,
        dedupeWindowMs: 10_000,
        dedupeMode: 'omit',
        defaults: {
            success: { duration: 3500, dismissible: true },
            info: { duration: 4000, dismissible: true },
            warning: { duration: 6000, dismissible: true },
            error: { duration: 0, dismissible: true },
            position: {
                desktop: NotificationPosition.TOP_RIGHT, //* 👈 por defecto top-right
                mobile: NotificationPosition.TOP_RIGHT, //* 👈 si prefieres bottom: BOTTOM_CENTER
            },
        },
    };

    return makeEnvironmentProviders([
        { provide: NOTIFICATION_CONFIG, useValue: config },
        { provide: NOTIFICATION_PORT, useClass: NotificationGatewayService },
    ]);
}
