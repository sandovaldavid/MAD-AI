import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NOTIFICATION_CONFIG, NOTIFICATION_PORT, NotificationConfig } from './tokens';
import {
  NOTIFY_USECASE_PORT,
  DISMISS_NOTIFICATION_USECASE_PORT,
  CLEAR_NOTIFICATIONS_USECASE_PORT,
  UPDATE_NOTIFICATION_USECASE_PORT,
  GET_NOTIFICATIONS_USECASE_PORT,
  SUBSCRIBE_TO_NOTIFICATIONS_USECASE_PORT,
} from './tokens';
import { NotificationGatewayService } from '@/app/infrastructure/services/notification/notification-gateway.service';

import { NotificationsFacade } from '@application/facades/notifications.facade';
import { UINotificationPosition } from '@presentation/shared/components/toast/enums/ui-notification-position.enum';
import { Notify } from '@/app/application/use-cases/notifications/notify.usecase';
import { DismissNotification } from '@/app/application/use-cases/notifications/dismiss-notification.usecase';
import { ClearNotifications } from '@/app/application/use-cases/notifications/clear-notifications.usecase';
import { UpdateNotification } from '@/app/application/use-cases/notifications/update-notification.usecase';
import { GetNotifications } from '@/app/application/use-cases/notifications/get-notifications.usecase';
import { SubscribeToNotifications } from '@/app/application/use-cases/notifications/subscribe-to-notifications.usecase';

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
    NotificationsFacade,
    { provide: NOTIFY_USECASE_PORT, useClass: Notify },
    { provide: DISMISS_NOTIFICATION_USECASE_PORT, useClass: DismissNotification },
    { provide: CLEAR_NOTIFICATIONS_USECASE_PORT, useClass: ClearNotifications },
    { provide: UPDATE_NOTIFICATION_USECASE_PORT, useClass: UpdateNotification },
    { provide: GET_NOTIFICATIONS_USECASE_PORT, useClass: GetNotifications },
    { provide: SUBSCRIBE_TO_NOTIFICATIONS_USECASE_PORT, useClass: SubscribeToNotifications },
  ]);
}
