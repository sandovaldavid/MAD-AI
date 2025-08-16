import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from './error-handler.service';
import { NotificationsFacade } from '@application/facades/notifications.facade';

describe('ErrorHandlerService', () => {
    let service: ErrorHandlerService;
    let notificationsFacade: jasmine.SpyObj<NotificationsFacade>;

    beforeEach(() => {
        const notificationsSpy = jasmine.createSpyObj('NotificationsFacade', [
            'error',
            'warning',
            'info',
            'success',
        ]);

        TestBed.configureTestingModule({
            providers: [
                ErrorHandlerService,
                { provide: NotificationsFacade, useValue: notificationsSpy },
            ],
        });

        service = TestBed.inject(ErrorHandlerService);
        notificationsFacade = TestBed.inject(
            NotificationsFacade
        ) as jasmine.SpyObj<NotificationsFacade>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Auth Feature Error Handling', () => {
        it('should handle 401 login errors with proper message', () => {
            const httpError = new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                url: '/api/auth/login',
            });

            const processedError = service.handleError(httpError, 'auth', 'login');

            expect(processedError.context.feature).toBe('auth');
            expect(processedError.context.operation).toBe('login');
            expect(processedError.context.userMessage).toBe(
                'Credenciales inválidas. Verifica tu email y contraseña'
            );
            expect(processedError.context.severity).toBe('high');
            expect(processedError.context.category).toBe('authentication');
            expect(processedError.isHandled).toBe(true);
        });

        it('should handle 422 validation errors in registration', () => {
            const httpError = new HttpErrorResponse({
                status: 422,
                statusText: 'Unprocessable Entity',
                url: '/api/auth/register',
                error: {
                    errors: {
                        email: ['email already exists'],
                    },
                },
            });

            const processedError = service.handleError(httpError, 'auth', 'register');

            expect(processedError.context.userMessage).toBe('Este email ya está registrado');
            expect(processedError.context.category).toBe('validation');
        });

        it('should provide recovery actions for 401 errors', () => {
            const httpError = new HttpErrorResponse({
                status: 401,
                url: '/api/auth/profile',
            });

            const recoveryActions = service.getRecoveryActions(httpError, 'auth');

            expect(recoveryActions.length).toBeGreaterThan(0);
            expect(recoveryActions[0].label).toBe('Ir a Login');
            expect(recoveryActions[0].isPrimary).toBe(true);
        });
    });

    describe('Roles Feature Error Handling', () => {
        it('should handle 403 permission errors with proper message', () => {
            const httpError = new HttpErrorResponse({
                status: 403,
                statusText: 'Forbidden',
                url: '/api/roles',
            });

            const processedError = service.handleError(httpError, 'roles', 'create-role');

            expect(processedError.context.userMessage).toBe('No tienes permisos para crear roles');
            expect(processedError.context.category).toBe('authorization');
        });

        it('should handle 409 conflict errors in role creation', () => {
            const httpError = new HttpErrorResponse({
                status: 409,
                statusText: 'Conflict',
                url: '/api/roles',
            });

            const processedError = service.handleError(httpError, 'roles', 'create-role');

            expect(processedError.context.userMessage).toBe('Ya existe un rol con ese nombre');
        });

        it('should handle 404 role not found errors', () => {
            const httpError = new HttpErrorResponse({
                status: 404,
                statusText: 'Not Found',
                url: '/api/roles/999',
            });

            const processedError = service.handleError(httpError, 'roles', 'get-role');

            expect(processedError.context.userMessage).toBe('El rol solicitado no existe');
        });
    });

    describe('Default Error Handling', () => {
        it('should handle network errors (status 0)', () => {
            const httpError = new HttpErrorResponse({
                status: 0,
                statusText: '',
                url: '/api/some-endpoint',
            });

            const processedError = service.handleError(httpError, 'global', 'fetch-data');

            expect(processedError.context.userMessage).toBe(
                'Sin conexión a internet. Verifica tu conectividad'
            );
            expect(processedError.context.category).toBe('network');
            expect(processedError.context.severity).toBe('low');
        });

        it('should handle 500 server errors', () => {
            const httpError = new HttpErrorResponse({
                status: 500,
                statusText: 'Internal Server Error',
                url: '/api/some-endpoint',
            });

            const processedError = service.handleError(httpError, 'global', 'fetch-data');

            expect(processedError.context.userMessage).toBe(
                'Error interno del servidor. Intenta más tarde'
            );
            expect(processedError.context.category).toBe('server');
            expect(processedError.context.severity).toBe('critical');
        });

        it('should provide retry config for retriable errors', () => {
            const httpError = new HttpErrorResponse({
                status: 500,
                url: '/api/some-endpoint',
            });

            const retryOperator = service.createRetryOperator('global');

            expect(retryOperator).toBeDefined();
        });
    });

    describe('User Message Transformation', () => {
        it('should transform HTTP errors to user-friendly messages', () => {
            const httpError = new HttpErrorResponse({
                status: 400,
                statusText: 'Bad Request',
                url: '/api/test',
            });

            const message = service.getUserMessage(httpError, 'global', 'test-operation');

            expect(message).toBe('Solicitud inválida. Verifica los datos enviados');
        });

        it('should transform general errors to user-friendly messages', () => {
            const error = new Error('Network timeout');

            const message = service.transformErrorForFacade(error, 'global', 'test-operation');

            expect(message).toBe('Network timeout');
        });

        it('should provide fallback message for unknown errors', () => {
            const error = null;

            const message = service.transformErrorForFacade(error, 'global', 'test-operation');

            expect(message).toBe('Error inesperado. Intenta de nuevo');
        });
    });

    describe('Notification Behavior', () => {
        it('should show error notifications for critical errors', () => {
            const httpError = new HttpErrorResponse({
                status: 500,
                url: '/api/test',
            });

            service.handleError(httpError, 'global', 'test-operation');

            expect(notificationsFacade.error).toHaveBeenCalled();
        });

        it('should show warning notifications for medium severity errors', () => {
            const httpError = new HttpErrorResponse({
                status: 400,
                url: '/api/test',
            });

            service.handleError(httpError, 'global', 'test-operation');

            expect(notificationsFacade.warning).toHaveBeenCalled();
        });

        it('should not show notifications for auth errors (handled by interceptor)', () => {
            const httpError = new HttpErrorResponse({
                status: 401,
                url: '/api/auth/login',
            });

            service.handleError(httpError, 'auth', 'login');

            expect(notificationsFacade.error).not.toHaveBeenCalled();
        });
    });
});
