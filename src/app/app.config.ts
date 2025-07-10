import {
    APP_INITIALIZER,
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
    inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
    provideHttpClient,
    withFetch,
    withInterceptors,
    HttpHandlerFn,
    HttpRequest,
    HttpInterceptorFn,
    HttpEvent,
} from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { Observable } from 'rxjs';

import { routes } from './app.routes';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '@infrastructure/repositories/auth.repository.impl';
import { NotificationRepository } from '@domain/repositories/notification.repository';
import { NotificationRepositoryImpl } from '@infrastructure/repositories/notification.repository.impl';
import { NOTIFICATION_REPOSITORY_TOKEN } from '@infrastructure/tokens/notification.providers';
import { TitleService } from '@core/services/title.service';
import { AuthService } from '@core/services/auth.service';

// Factory para inicializar el TitleService
function initializeTitleService(titleService: TitleService) {
    return () => {
        titleService.initialize();
    };
}

// Factory para inicializar el AuthService
function initializeAuthService(authService: AuthService) {
    return () => {
        authService.initialize();
    };
}

// Interceptor de autenticación para Angular v20+
const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    // Obtenemos la instancia de AuthService
    const authService = inject(AuthService);
    const token = authService.getAccessToken();

    // Si hay token, añadimos el header de Authorization
    if (token) {
        // Clonar la petición con el header de autorización añadido
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
        return next(authReq);
    }

    // Si no hay token, continuamos con la solicitud original
    return next(req);
};

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(withEventReplay()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
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
        {
            provide: APP_INITIALIZER,
            useFactory: initializeTitleService,
            deps: [TitleService],
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAuthService,
            deps: [AuthService],
            multi: true,
        },
    ],
};
