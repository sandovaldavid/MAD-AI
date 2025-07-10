import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
    ResetPasswordUseCase,
    ResetPasswordRequest,
    ResetPasswordConfirmRequest,
} from '@application/use-cases/auth/reset-password.use-case';
import { NotificationService } from '@core/services/notification.service';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { Button } from '@shared/components/ui/button/button';
import { StatusMessageComponent } from '@shared/components/ui/status-message/status-message.component';
import { catchError, of, finalize } from 'rxjs';

type ResetStep = 'request' | 'confirm' | 'success';

@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.html',
    styleUrl: './reset-password.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, ReactiveFormsModule, InputComponent, Button, StatusMessageComponent],
})
export class ResetPassword {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly resetPasswordUseCase = inject(ResetPasswordUseCase);
    private readonly notificationService = inject(NotificationService);

    // Señales de estado
    protected readonly currentStep = signal<ResetStep>('request');
    protected readonly isLoading = signal(false);
    protected readonly errorMessage = signal('');
    protected readonly successMessage = signal('');
    protected readonly resetToken = signal<string | null>(null);

    // Formularios
    protected readonly requestForm: FormGroup;
    protected readonly confirmForm: FormGroup;

    // Estados computados
    protected readonly showRequestForm = computed(() => this.currentStep() === 'request');
    protected readonly showConfirmForm = computed(() => this.currentStep() === 'confirm');
    protected readonly showSuccessMessage = computed(() => this.currentStep() === 'success');

    constructor() {
        // Inicializar formularios
        this.requestForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
        });

        this.confirmForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]],
        });

        // Verificar si hay un token en la URL
        this.checkForResetToken();
    }

    private checkForResetToken(): void {
        const token = this.route.snapshot.queryParams['token'];
        if (token) {
            this.resetToken.set(token);
            this.currentStep.set('confirm');
        }
    }

    protected onRequestReset(): void {
        if (this.requestForm.invalid) {
            this.markFormGroupTouched(this.requestForm);
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const request: ResetPasswordRequest = {
            email: this.requestForm.value.email,
        };

        this.resetPasswordUseCase
            .requestReset(request)
            .pipe(
                catchError((error) => {
                    const errorMsg =
                        error.error?.message ||
                        'Error al solicitar el restablecimiento de contraseña';

                    // Mostrar error inline
                    this.errorMessage.set(errorMsg);

                    // Mostrar notificación de error
                    this.notificationService
                        .error('Error de Restablecimiento', errorMsg)
                        .subscribe();

                    return of(null);
                }),
                finalize(() => this.isLoading.set(false))
            )
            .subscribe((response) => {
                if (response?.success) {
                    const successMsg =
                        'Se ha enviado un enlace de restablecimiento a tu correo electrónico.';

                    // Mostrar mensaje inline
                    this.successMessage.set(successMsg);

                    // Mostrar notificación de éxito
                    this.notificationService.success('Enlace Enviado', successMsg).subscribe();

                    this.currentStep.set('success');
                }
            });
    }

    protected onConfirmReset(): void {
        if (this.confirmForm.invalid) {
            this.markFormGroupTouched(this.confirmForm);
            return;
        }

        const { newPassword, confirmPassword } = this.confirmForm.value;

        if (newPassword !== confirmPassword) {
            const errorMsg = 'Las contraseñas no coinciden';

            // Mostrar error inline
            this.errorMessage.set(errorMsg);

            // Mostrar notificación de error
            this.notificationService.error('Error de Validación', errorMsg).subscribe();

            return;
        }

        const token = this.resetToken();
        if (!token) {
            const errorMsg = 'Token de restablecimiento inválido';

            // Mostrar error inline
            this.errorMessage.set(errorMsg);

            // Mostrar notificación de error
            this.notificationService.error('Token Inválido', errorMsg).subscribe();

            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const request: ResetPasswordConfirmRequest = {
            token,
            newPassword,
            confirmPassword,
        };

        this.resetPasswordUseCase
            .confirmReset(request)
            .pipe(
                catchError((error) => {
                    const errorMsg = error.error?.message || 'Error al restablecer la contraseña';

                    // Mostrar error inline
                    this.errorMessage.set(errorMsg);

                    // Mostrar notificación de error
                    this.notificationService
                        .error('Error de Restablecimiento', errorMsg)
                        .subscribe();

                    return of(null);
                }),
                finalize(() => this.isLoading.set(false))
            )
            .subscribe((response) => {
                if (response?.success) {
                    const successMsg =
                        '¡Contraseña restablecida exitosamente! Ahora puedes iniciar sesión.';

                    // Mostrar mensaje inline
                    this.successMessage.set(successMsg);

                    // Mostrar notificación de éxito
                    this.notificationService
                        .success(
                            'Contraseña Restablecida',
                            'Tu contraseña ha sido actualizada correctamente.'
                        )
                        .subscribe();

                    this.currentStep.set('success');

                    // Redirigir al login después de 3 segundos
                    setTimeout(() => {
                        this.router.navigate(['/auth/login']);
                    }, 3000);
                }
            });
    }

    protected getFieldError(form: FormGroup, fieldName: string): string {
        const field = form.get(fieldName);
        if (field?.errors && field.touched) {
            if (field.errors['required']) {
                return 'Este campo es requerido';
            }
            if (field.errors['email']) {
                return 'Ingresa un email válido';
            }
            if (field.errors['minlength']) {
                return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
            }
        }
        return '';
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }
}
