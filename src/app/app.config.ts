import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@infrastructure/repositories/auth.repository.impl';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationRepositoryImpl } from '@infrastructure/repositories/notification.repository.impl';
import { NOTIFICATION_REPOSITORY_TOKEN } from '@infrastructure/tokens/notification.providers';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideHttpClient(withFetch()),
        {
            provide: AuthRepository,
            useClass: AuthRepositoryImpl,
        },
        {
            provide: NotificationRepository,
            useClass: NotificationRepositoryImpl,
        },
        {
            provide: NOTIFICATION_REPOSITORY_TOKEN,
            useExisting: NotificationRepository,
        },
    ],
};
