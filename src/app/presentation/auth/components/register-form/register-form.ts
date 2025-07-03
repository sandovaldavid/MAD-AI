import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
    computed,
    signal,
    effect,
} from '@angular/core';
import {
    ReactiveFormsModule,
    FormGroup,
    FormControl,
    Validators,
    AbstractControl,
} from '@angular/forms';
import { RegisterRequest } from '@domain/models/auth/auth.model';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { Button } from '@shared/components/ui/button/button';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    firstName: string;
    lastName: string;
}

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('passwordConfirmation');

    if (!password || !confirmPassword) {
        return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
    selector: 'app-register-form',
    templateUrl: './register-form.html',
    styleUrl: './register-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, InputComponent, Button],
})
export class RegisterForm {
    // Inputs
    isLoading = input<boolean>(false);

    // Outputs
    formSubmit = output<RegisterRequest>();

    // Form
    protected readonly registerForm = new FormGroup(
        {
            username: new FormControl('', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(30),
                Validators.pattern(/^[a-zA-Z0-9_]+$/),
            ]),
            email: new FormControl('', [Validators.required, Validators.email]),
            firstName: new FormControl('', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50),
            ]),
            lastName: new FormControl('', [
                Validators.required,
                Validators.minLength(2),
                Validators.maxLength(50),
            ]),
            password: new FormControl('', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
                ),
            ]),
            passwordConfirmation: new FormControl('', [Validators.required]),
        },
        { validators: passwordMatchValidator }
    );

    // Form state signal to trigger reactivity
    private readonly formStateSignal = signal(0);

    constructor() {
        // Subscribe to form status changes to update reactivity
        this.registerForm.statusChanges.subscribe(() => {
            this.formStateSignal.update((val) => val + 1);
        });

        // Handle form disabling based on isLoading state
        effect(() => {
            if (this.isLoading()) {
                this.registerForm.disable();
            } else {
                this.registerForm.enable();
            }
        });
    }

    // Reactive form validity signal
    protected readonly isFormValid = computed(() => {
        // Trigger reactivity by accessing the form state signal
        this.formStateSignal();
        return this.registerForm.valid;
    });

    // Reactive error messages
    protected readonly usernameError = computed(() => {
        this.formStateSignal(); // Trigger reactivity
        const control = this.registerForm.get('username');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Username is required';
            }
            if (control.errors['minlength']) {
                return 'Username must be at least 3 characters';
            }
            if (control.errors['maxlength']) {
                return 'Username must not exceed 30 characters';
            }
            if (control.errors['pattern']) {
                return 'Username can only contain letters, numbers, and underscores';
            }
        }
        return '';
    });

    protected readonly emailError = computed(() => {
        this.formStateSignal();
        const control = this.registerForm.get('email');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Email is required';
            }
            if (control.errors['email']) {
                return 'Please enter a valid email address';
            }
        }
        return '';
    });

    protected readonly firstNameError = computed(() => {
        this.formStateSignal();
        const control = this.registerForm.get('firstName');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'First name is required';
            }
            if (control.errors['minlength']) {
                return 'First name must be at least 2 characters';
            }
            if (control.errors['maxlength']) {
                return 'First name must not exceed 50 characters';
            }
        }
        return '';
    });

    protected readonly lastNameError = computed(() => {
        this.formStateSignal();
        const control = this.registerForm.get('lastName');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Last name is required';
            }
            if (control.errors['minlength']) {
                return 'Last name must be at least 2 characters';
            }
            if (control.errors['maxlength']) {
                return 'Last name must not exceed 50 characters';
            }
        }
        return '';
    });

    protected readonly passwordError = computed(() => {
        this.formStateSignal();
        const control = this.registerForm.get('password');
        if (control?.errors && control.touched) {
            if (control.errors['required']) {
                return 'Password is required';
            }
            if (control.errors['minlength']) {
                return 'Password must be at least 8 characters';
            }
            if (control.errors['pattern']) {
                return 'Password must contain uppercase, lowercase, number, and special character';
            }
        }
        return '';
    });

    protected readonly passwordConfirmationError = computed(() => {
        this.formStateSignal();
        const control = this.registerForm.get('passwordConfirmation');
        const formErrors = this.registerForm.errors;
        if (control?.touched) {
            if (control.errors?.['required']) {
                return 'Password confirmation is required';
            }
            if (formErrors?.['passwordMismatch']) {
                return 'Passwords do not match';
            }
        }
        return '';
    });

    protected onSubmit(): void {
        if (this.registerForm.valid) {
            const formValue = this.registerForm.value as RegisterFormData;

            const registerRequest: RegisterRequest = {
                username: formValue.username,
                email: formValue.email,
                password: formValue.password,
                password_confirm: formValue.passwordConfirmation,
                first_name: formValue.firstName,
                last_name: formValue.lastName,
            };

            this.formSubmit.emit(registerRequest);
        } else {
            // Mark all fields as touched to show validation errors
            this.registerForm.markAllAsTouched();
            this.formStateSignal.update((val) => val + 1);
        }
    }
}
