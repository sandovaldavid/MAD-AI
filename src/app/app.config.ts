import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { provideAuth } from '../app/di/provide-auth';
import { provideNotifications } from './di/provide-notifications';
import { provideRoles } from './di/provide-roles';
import { authInterceptor } from './infrastructure/http';
import { enhancedErrorInterceptor } from './core/interceptors/enhanced-error.interceptor';
import { provideIcons } from './di/provide-icons';

export const appConfig: ApplicationConfig = {
    providers: [
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        provideHttpClient(withInterceptors([authInterceptor, enhancedErrorInterceptor])),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideAuth(),
        provideNotifications(),
        ...provideRoles(),
        ...provideIcons({
            missingStrategy: 'warn',
            defaultVariant: 'outline',
        }),
    ],
};
