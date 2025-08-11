import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { provideAuth } from '../app/di/provide-auth';
import { provideNotifications } from './di/provide-notifications';
import { authInterceptor, errorInterceptor } from './infrastructure/http';
import { provideIcons } from './di/provide-icons';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideAuth(),
        provideNotifications(),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        ...provideIcons({
            missingStrategy: 'warn',
            defaultVariant: 'outline',
        }),
    ],
};
