import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { routes } from './app.routes';
import { provideAuth } from '../app/di/provide-auth';
import { provideNotifications } from './di/provide-notifications';
import { provideRoles } from './di/provide-roles';
import { provideUsers } from './di/provide-users';
import { authInterceptor } from './infrastructure/http/interceptors/auth.interceptor';
import { provideIcons } from './di/provide-icons';
import { provideExportServices } from './di/provide-export';
import { provideLogger } from './di/provide-logger';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        return config.src;
      },
    },
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAuth(),
    provideNotifications(),
    provideUsers(),
    ...provideRoles(),
    provideExportServices(),
    provideLogger,
    ...provideIcons({
      missingStrategy: 'warn',
      defaultVariant: 'outline',
    }),
  ],
};
