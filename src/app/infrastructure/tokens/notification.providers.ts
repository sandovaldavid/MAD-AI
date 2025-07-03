import { InjectionToken } from '@angular/core';
import { NotificationRepository } from '@domain/repositories/notification.repository';

export const NOTIFICATION_REPOSITORY_TOKEN = new InjectionToken<NotificationRepository>('NotificationRepository');
