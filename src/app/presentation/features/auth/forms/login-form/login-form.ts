import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@application/facades/auth.facade';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Input } from '@shared/ui/input/input';
import { FormField } from '@shared/ui/form-field/form-field';
import { Button } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import type { Identifier } from '@domain/contracts/auth.contract';

@Component({
    selector: 'app-login-form',
    templateUrl: './login-form.html',
    styleUrl: './login-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, RouterLink, Input, FormField, Button, Icon],
})
export class LoginForm {
    form;
    auth = input<AuthFacade>();
    showPassword = signal(false);

    constructor(private fb: FormBuilder, private router: Router) {
        this.form = this.fb.group({
            identity: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            remember: [false],
        });
    }

    get identityError(): string | undefined {
        const c = this.form.get('identity');
        if (c?.touched && c?.invalid) {
            if (c.errors?.['required']) return 'Campo obligatorio';
        }
        return undefined;
    }
    get passwordError(): string | undefined {
        const c = this.form.get('password');
        if (c?.touched && c?.invalid) {
            if (c.errors?.['required']) return 'Campo obligatorio';
            if (c.errors?.['minlength']) return 'Mínimo 8 caracteres';
        }
        return undefined;
    }
    get identityStatus(): 'idle' | 'error' {
        const c = this.form.get('identity');
        return c?.touched && c?.invalid ? 'error' : 'idle';
    }
    get passwordStatus(): 'idle' | 'error' {
        const c = this.form.get('password');
        return c?.touched && c?.invalid ? 'error' : 'idle';
    }

    togglePassword() {
        this.showPassword.update((show) => !show);
    }

    clearField(fieldName: string) {
        this.form.get(fieldName)?.setValue('');
    }

    async submit() {
        if (this.form.valid) {
            if (!this.auth()) return;

            // Clear any previous error state completely before attempting login
            this.auth()!.clearAuthStateCompletely();

            const { identity, password, remember } = this.form.value;
            const identifierValue = identity?.trim() ?? '';
            const identifier: Identifier = identifierValue.includes('@')
                ? { type: 'email', value: identifierValue }
                : { type: 'username', value: identifierValue };

            // Attempt login - facade will handle errors internally via signals
            await this.auth()!.login({
                identifier,
                password: password ?? '',
                rememberMe: remember ?? false,
            });

            // Check if login was successful by checking if user is authenticated
            // If there's an error, it will be shown through the auth facade's error signal
            if (this.auth()!.isAuthenticated()) {
                await this.router.navigateByUrl('/dashboard');
            }
            // If login failed, the error will be displayed automatically through the auth facade
        } else {
            this.form.markAllAsTouched();
        }
    }
}
