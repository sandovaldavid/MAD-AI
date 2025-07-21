import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@infrastructure/repositories/auth.repository.impl';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationRepositoryImpl } from '@infrastructure/repositories/notification.repository.impl';
import { NOTIFICATION_REPOSITORY_TOKEN } from '@infrastructure/tokens/notification.providers';
import { USER_PROVIDERS } from '@infrastructure/tokens/user.providers';
import { ROLE_PROVIDERS } from '@infrastructure/tokens/role.providers';
import { advancedAuthInterceptor } from '@/app/core/interceptors/auth.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
    HUMAN_RESOURCE_PROVIDERS,
    MATERIAL_RESOURCE_PROVIDERS,
    ABSENCE_PROVIDERS,
    RESOURCE_TYPE_PROVIDERS,
    RESOURCE_PROVIDERS,
} from '@infrastructure/tokens/resource-management';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideHttpClient(withFetch(), withInterceptors([advancedAuthInterceptor])),
        ...USER_PROVIDERS,
        ...ROLE_PROVIDERS,
        // Resource Management Providers
        ...HUMAN_RESOURCE_PROVIDERS,
        ...MATERIAL_RESOURCE_PROVIDERS,
        ...ABSENCE_PROVIDERS,
        ...RESOURCE_TYPE_PROVIDERS,
        ...RESOURCE_PROVIDERS,
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
        provideCharts(withDefaultRegisterables()),
    ],
};
