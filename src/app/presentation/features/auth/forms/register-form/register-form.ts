import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthFacade } from '@application/facades/auth.facade';
import { RolesFacade } from '@application/facades/roles.facade';
import type { RegisterRequest } from '@application/types/auth.types';

import { Button } from '@shared/ui/button/button';
import { FormField } from '@shared/ui/form-field/form-field';
import { Input } from '@shared/ui/input/input';
import { Icon } from '@shared/ui/icon/icon';

@Component({
  selector: 'app-register-form',
  standalone: true,
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, Button, FormField, Input, Icon],
})
export class RegisterForm {
  private authFacade = inject(AuthFacade);
  private rolesFacade = inject(RolesFacade);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Input to control whether to show role selection
  showRoleSelection = input<boolean>(false);

  // Output for successful registration
  registered = output<void>();

  // Form state
  private _submitting = signal(false);

  // Computed states
  loading = computed(() => this.authFacade.loading() || this._submitting());
  error = computed(() => this.authFacade.error());
  roles = computed(() => this.rolesFacade.roles());

  // Reactive form
  registerForm: FormGroup = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', [Validators.required]],
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      role_id: [null],
    },
    {
      validators: this.passwordMatchValidator,
    }
  );

  constructor() {
    // Load roles if role selection is enabled
    if (this.showRoleSelection()) {
      this.rolesFacade.refresh();
    }

    // Handle form disabled state based on loading
    effect(() => {
      this.updateFormDisabledState();
    });
  }

  private updateFormDisabledState() {
    if (this.loading()) {
      this.registerForm.disable();
    } else {
      this.registerForm.enable();
    }
  }

  // Custom validator for password confirmation
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirm');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  // Get field error message
  getFieldError(fieldName: string): string | undefined {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return undefined;

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
    if (errors['email']) return 'Formato de email inválido';
    if (errors['minlength'])
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${
        errors['minlength'].requiredLength
      } caracteres`;
    if (errors['maxlength'])
      return `${this.getFieldLabel(fieldName)} no puede exceder ${
        errors['maxlength'].requiredLength
      } caracteres`;
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';

    return 'Campo inválido';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      username: 'Nombre de usuario',
      email: 'Correo electrónico',
      password: 'Contraseña',
      password_confirm: 'Confirmación de contraseña',
      first_name: 'Nombre',
      last_name: 'Apellido',
      role_id: 'Rol',
    };
    return labels[fieldName] || fieldName;
  }

  // Check if field has error
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  // Submit handler
  async onSubmit() {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this._submitting.set(true);

    try {
      const formValue = this.registerForm.value;
      const registerData: RegisterRequest = {
        username: formValue.username,
        email: formValue.email,
        password: formValue.password,
        passwordConfirm: formValue.password_confirm,
        firstName: formValue.first_name,
        lastName: formValue.last_name,
        acceptTerms: formValue.acceptTerms || false,
        roleId: this.showRoleSelection() ? formValue.role_id : undefined,
      };

      await this.authFacade.register(registerData);

      // Emit success event
      this.registered.emit();

      // Navigate to dashboard or appropriate page
      this.router.navigate(['/dashboard']);
    } catch (error) {
      // Error is handled by the facade
      console.error('Registration failed:', error);
    } finally {
      this._submitting.set(false);
    }
  }

  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach((key) => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  // Navigate to login
  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
