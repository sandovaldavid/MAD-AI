import { ChangeDetectionStrategy, Component, signal, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginRequest } from '@domain/models/auth/auth.model';
import { UserEntity } from '@domain/entities/user.entity';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { LoginForm } from '../../components/login-form/login-form';

@Component({
    selector: 'app-login',
    templateUrl: './login.html',
    styleUrl: './login.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoginForm],
})
export class Login implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly activatedRoute = inject(ActivatedRoute);
    private readonly notificationService = inject(NotificationService);

    // Signals for reactive state
    protected readonly errorMessage = signal<string>('');
    protected readonly successMessage = signal<string>('');
    protected readonly isLoading = signal<boolean>(false);

    ngOnInit() {
        // Check for success message from registration
        const message = this.activatedRoute.snapshot.queryParams['message'];
        if (message) {
            this.successMessage.set(message);
            this.notificationService.success('Registro Exitoso', message).subscribe();
        }
    }

    protected onLoginSubmit(loginData: LoginRequest): void {
        this.errorMessage.set('');
        this.isLoading.set(true);

        this.authService.login(loginData).subscribe({
            next: () => {
                this.isLoading.set(false);
                const currentUser = this.authService.user();

                if (currentUser) {
                    // Convert UserInfo to UserEntity if needed for business logic
                    const userEntity = new UserEntity({
                        id: currentUser.id,
                        username: currentUser.username,
                        email: currentUser.email,
                        firstName: currentUser.first_name,
                        lastName: currentUser.last_name,
                        isActive: currentUser.is_active,
                        roleName: currentUser.role_name || undefined,
                        createdAt: currentUser.created_at,
                    });

                    // Show success notification with the user's name
                    const displayName = userEntity.firstName || userEntity.username || 'Usuario';
                    const message = `¡Bienvenido/a ${displayName}! Has iniciado sesión correctamente.`;

                    this.notificationService
                        .success('Inicio de Sesión Exitoso', message)
                        .subscribe();
                }

                // Navigation is handled in AuthService
            },
            error: (error) => {
                this.isLoading.set(false);
                this.handleLoginError(error);
            },
        });
    }

    protected onRegisterClick(): void {
        this.router.navigate(['/auth/register']);
    }

    protected onForgotPasswordClick(): void {
        this.router.navigate(['/auth/reset-password']);
    }

    private handleLoginError(error: any): void {
        let errorMessage = '';
        let notificationTitle = 'Error de Inicio de Sesión';

        // Handle different types of errors
        if (error.status === 401) {
            errorMessage =
                'Credenciales incorrectas. Por favor, verifica tu email/usuario y contraseña.';
        } else if (error.status === 403) {
            errorMessage = 'Tu cuenta ha sido desactivada. Contacta al administrador.';
        } else if (error.status === 429) {
            errorMessage = 'Demasiados intentos de inicio de sesión. Intenta de nuevo más tarde.';
        } else if (error.status === 0) {
            errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else {
            errorMessage = 'Ocurrió un error inesperado. Intenta de nuevo más tarde.';
        }

        // Set error message for the UI
        this.errorMessage.set(errorMessage);

        // Also show as notification
        this.notificationService.error(notificationTitle, errorMessage).subscribe();
    }
}
