import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { RegisterRequest } from '@domain/models/auth/auth.model';
import { RegisterForm } from '../../components/register-form/register-form';

@Component({
    selector: 'app-register',
    templateUrl: './register.html',
    styleUrl: './register.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, RegisterForm],
})
export class Register {
    private readonly authService = inject(AuthService);
    private readonly notificationService = inject(NotificationService);

    // State signals
    protected readonly errorMessage = signal<string>('');

    // Computed from AuthService
    protected readonly isLoading = this.authService.isLoading;

    protected onRegisterSubmit(registerData: RegisterRequest): void {
        this.errorMessage.set('');

        this.authService.register(registerData).subscribe({
            next: () => {
                // Show success notification
                this.notificationService
                    .success(
                        'Registro Exitoso',
                        'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.'
                    )
                    .subscribe();
                // Success - AuthService handles navigation to login
            },
            error: (error) => {
                let message = 'Error de registro. Por favor, inténtalo de nuevo.';

                if (error?.error?.detail) {
                    message = error.error.detail;
                } else if (error?.error?.message) {
                    message = error.error.message;
                } else if (error?.error?.username) {
                    message = `Nombre de usuario: ${error.error.username[0]}`;
                } else if (error?.error?.email) {
                    message = `Email: ${error.error.email[0]}`;
                } else if (typeof error?.error === 'string') {
                    message = error.error;
                }

                // Set error message for the UI
                this.errorMessage.set(message);

                // Also show as notification
                this.notificationService.error('Error de Registro', message).subscribe();
            },
        });
    }
}
