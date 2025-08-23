import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/cross-cutting/utilities/global-error.handler';
import { provideAuth } from '../app/di/provide-auth';
import { provideNotifications } from './di/provide-notifications';
import { provideRoles } from './di/provide-roles';
import { provideUsers } from './di/provide-users';
import { provideDomainEventsForDevelopment } from './di/provide-domain-events';
import { authInterceptor } from './infrastructure/http';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { enhancedErrorInterceptor } from './core/interceptors/error.interceptor';
import { provideIcons } from './di/provide-icons';
import { provideExportServices } from './di/provide-export';

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        {
            provide: IMAGE_LOADER,
            useValue: (config: ImageLoaderConfig) => {
                return config.src;
            },
        },
        provideAnimations(),
        provideHttpClient(
            withInterceptors([authInterceptor, httpErrorInterceptor, enhancedErrorInterceptor])
        ),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideAuth(),
        provideNotifications(),
        provideUsers(),
        provideDomainEventsForDevelopment(),
        ...provideRoles(),
        provideExportServices(),
        ...provideIcons({
            missingStrategy: 'warn',
            defaultVariant: 'outline',
        }),
    ],
};
