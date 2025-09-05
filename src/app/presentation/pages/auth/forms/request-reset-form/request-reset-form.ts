import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@application/facades/auth.facade';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Input } from '@presentation/shared/ui/input/input';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';

@Component({
  selector: 'app-request-reset-form',
  templateUrl: './request-reset-form.html',
  styleUrl: './request-reset-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Input, FormField, Button, Icon],
})
export class RequestResetForm {
  form;
  auth = input<AuthFacade>();

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get emailError(): string | undefined {
    const c = this.form.get('email');
    if (c?.touched && c?.invalid) {
      if (c.errors?.['required']) return 'Campo obligatorio';
      if (c.errors?.['email']) return 'Formato de correo inválido';
    }
    return undefined;
  }

  get emailStatus(): 'idle' | 'error' {
    const c = this.form.get('email');
    return c?.touched && c?.invalid ? 'error' : 'idle';
  }

  clearField(fieldName: string) {
    this.form.get(fieldName)?.setValue('');
  }

  async submit() {
    if (this.form.valid) {
      if (!this.auth()) return;

      const { email } = this.form.value;

      try {
        await this.auth()!.requestPasswordReset(email ?? '');
        // No redirect here, just show success message
        // User needs to check their email for the reset link
      } catch (e) {
        // El error ya se maneja en el facade
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
