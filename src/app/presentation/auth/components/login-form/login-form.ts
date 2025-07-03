import { ChangeDetectionStrategy, Component, input, output, computed, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { LoginRequest } from '@domain/models/auth/auth.model';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { Button } from '@shared/components/ui/button/button';

interface LoginFormData {
    identifier: string;
    password: string;
    rememberMe: boolean;
}

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.html',
    styleUrl: './login-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, InputComponent, Button],
})
export class LoginForm {
    // Inputs
    isLoading = input<boolean>(false);
    errorMessage = input<string>('');

    // Outputs
    formSubmit = output<LoginRequest>();

    // Form
    protected readonly loginForm = new FormGroup({
        identifier: new FormControl('', [Validators.required]),
        password: new FormControl('', [Validators.required, Validators.minLength(5)]),
        rememberMe: new FormControl(false),
    });

    // Form state signal to trigger reactivity
    private readonly formStateSignal = signal(0);

    // Reactive form validity signal
    protected readonly isFormValid = computed(() => {
        // Trigger reactivity by accessing the form state signal
        this.formStateSignal();
        return this.loginForm.valid;
    });

    // Reactive error messages
    protected readonly identifierError = computed(() => {
        this.formStateSignal(); // Trigger reactivity
        const control = this.loginForm.get('identifier');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Email o nombre de usuario es requerido';
            }
        }
        return '';
    });

    protected readonly passwordError = computed(() => {
        this.formStateSignal(); // Trigger reactivity
        const control = this.loginForm.get('password');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'La contraseña es requerida';
            }
            if (control.errors['minlength']) {
                return 'La contraseña debe tener al menos 6 caracteres';
            }
        }
        return '';
    });

    constructor() {
        // Subscribe to form status changes to update reactivity
        this.loginForm.statusChanges.subscribe(() => {
            this.formStateSignal.update((val) => val + 1);
        });

        // Handle form disabling based on isLoading state
        effect(() => {
            if (this.isLoading()) {
                this.loginForm.disable();
            } else {
                this.loginForm.enable();
            }
        });
    }

    protected onSubmit(): void {
        if (this.loginForm.valid) {
            const formValue = this.loginForm.value as LoginFormData;
            const loginRequest: LoginRequest = {
                identifier: formValue.identifier,
                password: formValue.password,
                remember_me: formValue.rememberMe,
            };
            this.formSubmit.emit(loginRequest);
        }
    }
}
