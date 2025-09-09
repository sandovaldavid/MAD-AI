import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NOTIFICATION_CONFIG, NOTIFICATION_PORT, NotificationConfig } from './tokens';
import { NotificationGatewayService } from '@/app/infrastructure/services/notification/notification-gateway.service';

import { NotificationsFacade } from '@application/facades/notifications.facade';
import { UINotificationPosition } from '@presentation/shared/components/toast/enums/ui-notification-position.enum';

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
        desktop: UINotificationPosition.TOP_RIGHT, //* 👈 por defecto top-right
        mobile: UINotificationPosition.TOP_RIGHT, //* 👈 si prefieres bottom: BOTTOM_CENTER
      },
    },
  };

  return makeEnvironmentProviders([
    { provide: NOTIFICATION_CONFIG, useValue: config },
    { provide: NOTIFICATION_PORT, useClass: NotificationGatewayService },
    NotificationsFacade, // Add the facade to DI
  ]);
}
