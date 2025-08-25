import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@application/facades/auth.facade';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Input } from '@shared/ui/input/input';
import { FormField } from '@shared/ui/form-field/form-field';
import { Button } from '@shared/ui/button/button';
import { Icon } from '@shared/ui/icon/icon';
import type { PasswordResetConfirmRequest } from '@application/types/auth.types';

// Custom validator for password confirmation
function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('newPassword');
  const confirmPassword = control.get('newPasswordConfirm');

  if (!password || !confirmPassword) {
    return null;
  }

  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-form',
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Input, FormField, Button, Icon],
})
export class ResetPasswordForm {
  form;
  auth = input<AuthFacade>();
  token = input<string>('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        newPasswordConfirm: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  get newPasswordError(): string | undefined {
    const c = this.form.get('newPassword');
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) return 'Campo obligatorio';
      if (c.errors?.['minlength']) return 'Mínimo 8 caracteres';
    }
    return undefined;
  }

  get newPasswordConfirmError(): string | undefined {
    const c = this.form.get('newPasswordConfirm');
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) return 'Campo obligatorio';
    }
    // Check for password mismatch at form level
    if (this.form.touched && this.form.errors?.['passwordMismatch']) {
      return 'Las contraseñas no coinciden';
    }
    return undefined;
  }

  get newPasswordStatus(): 'idle' | 'error' {
    const c = this.form.get('newPassword');
    return c?.touched && c?.invalid ? 'error' : 'idle';
  }

  get newPasswordConfirmStatus(): 'idle' | 'error' {
    const c = this.form.get('newPasswordConfirm');
    const formMismatch = this.form.touched && this.form.errors?.['passwordMismatch'];
    return (c?.touched && c?.invalid) || formMismatch ? 'error' : 'idle';
  }

  togglePassword() {
    this.showPassword.update((show) => !show);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update((show) => !show);
  }

  clearField(fieldName: string) {
    this.form.get(fieldName)?.setValue('');
  }

  async submit() {
    if (this.form.valid && this.token()) {
      if (!this.auth()) return;

      const { newPassword, newPasswordConfirm } = this.form.value;
      const resetData: PasswordResetConfirmRequest = {
        token: this.token(),
        newPassword: newPassword ?? '',
        newPasswordConfirm: newPasswordConfirm ?? '',
      };

      try {
        await this.auth()!.confirmPasswordReset(resetData);
        await this.router.navigateByUrl('/auth/login');
      } catch (e) {
        // El error ya se maneja en el facade
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
