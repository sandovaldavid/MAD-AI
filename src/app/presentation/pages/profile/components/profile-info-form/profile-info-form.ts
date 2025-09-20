import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Button } from '@presentation/shared/ui/button/button';
import { Input } from '@presentation/shared/ui/input/input';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Icon } from '@presentation/shared/ui/icon/icon';
import {
  PageHeaderConfig,
  PageHeader,
} from '@presentation/shared/components/page-header/page-header';

// ==========================================================================
// Types & Interfaces for Dumb Component
// ==========================================================================

/**
 * Interface for user profile data input (simplified for Dumb Component)
 */
interface UserProfileData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  status?: string;
  createdAt?: string;
}

/**
 * Interface for form submission data
 */
interface UserFormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Component({
  selector: 'app-profile-info-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Input, FormField, Icon, PageHeader],
  templateUrl: './profile-info-form.html',
  styleUrl: './profile-info-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileInfoForm {
  // ==========================================================================
  // Modern Angular Inputs & Outputs (Dumb Component Pattern)
  // ==========================================================================

  /**
   * User profile data input - pre-processed by Smart Component
   * Only contains the data needed for form display
   */
  userData = input<UserProfileData | null>(null);

  /**
   * Loading state input - controlled by Smart Component
   */
  loading = input<boolean>(false);

  /**
   * Events output - emits form changes to Smart Component
   */
  profileUpdate = output<{
    username?: string;
    firstName: string;
    lastName: string;
    email: string;
  }>();

  /**
   * Cancel event output - emits cancellation to Smart Component
   */
  profileCancel = output<void>();

  // ==========================================================================
  // Dependency Injection (Dumb Component - Only UI dependencies)
  // ==========================================================================

  private readonly fb = inject(FormBuilder);

  // ==========================================================================
  // Component State with Signals (Dumb Component - UI state only)
  // ==========================================================================

  private readonly _originalFormData = signal<UserFormData | null>(null);

  /**
   * Reactive form for profile information
   * Contains validation rules and form state management
   */
  readonly form = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_.-]+$/),
      ],
    ],
    firstName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/),
      ],
    ],
    lastName: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
  });

  // ==========================================================================
  // Computed Properties (Dumb Component - UI state only)
  // ==========================================================================

  /**
   * Submission loading state
   */
  readonly isSubmitting = computed(() => this.loading());

  /**
   * Checks if form has unsaved changes
   */
  readonly hasChanges = computed(() => {
    const originalData = this._originalFormData();
    if (!originalData) return false;

    const currentData = this.form.value as UserFormData;
    return JSON.stringify(originalData) !== JSON.stringify(currentData);
  });

  /**
   * Form validity state
   */
  readonly isFormValid = computed(() => this.form.valid);

  /**
   * Can submit form
   */
  readonly canSubmit = computed(
    () => this.isFormValid() && this.hasChanges() && !this.isSubmitting()
  );

  /**
   * User role display name
   */
  readonly roleName = computed(() => this.userData()?.role || 'User');

  /**
   * Account status display text
   */
  readonly statusText = computed(() => this.userData()?.status || 'Active');

  /**
   * CSS class for status badge
   */
  readonly statusClass = computed(
    () => `status-${this.userData()?.status?.toLowerCase() || 'active'}`
  );

  /**
   * Icon name for status display
   */
  readonly statusIcon = computed(() =>
    this.userData()?.status === 'Active' ? 'check-circle' : 'alert-circle'
  );

  /**
   * Formatted creation date text
   */
  readonly createdAtText = computed(() => {
    const createdAt = this.userData()?.createdAt;
    return createdAt ? new Date(createdAt).toLocaleDateString() : null;
  });

  /**
   * Formatted last activity text
   */
  readonly lastActivityText = computed(() => null);

  // ==========================================================================
  // Lifecycle & Initialization (Dumb Component - Effect-based)
  // ==========================================================================

  constructor() {
    // Effect to watch for userData input changes
    effect(() => {
      const userData = this.userData();
      if (userData) {
        this._originalFormData.set({
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        });

        this.updateFormWithUserData(userData);
      }
    });
  }

  // ==========================================================================
  // Form Management Methods
  // ==========================================================================

  /**
   * Updates form fields with user data
   * @param userData - UserProfileData from parent Smart Component
   */
  private updateFormWithUserData(userData: UserProfileData): void {
    this.form.patchValue(
      {
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
      },
      { emitEvent: false }
    );
  }

  /**
   * Handles form submission (Dumb Component - just emit data)
   */
  onSubmit(): void {
    if (!this.canSubmit()) return;

    const formValue = this.form.value as Partial<UserFormData>;

    // Ensure required fields are present
    if (!formValue.firstName || !formValue.lastName || !formValue.email) {
      return;
    }

    const updateData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      ...(formValue.username && { username: formValue.username }),
    };

    // Emit data to Smart Component - let it handle submission logic
    this.profileUpdate.emit(updateData);
  }

  /**
   * Handles form cancellation
   */
  onCancel(): void {
    // Reset form to original state
    const originalData = this._originalFormData();
    if (originalData) {
      this.updateFormWithUserData(originalData);
    } else {
      this.form.reset();
    }

    this.profileCancel.emit();
  }

  /**
   * Resets form to original state
   */
  resetForm(): void {
    const originalData = this._originalFormData();
    if (originalData) {
      this.updateFormWithUserData(originalData);
    } else {
      this.form.reset();
    }
  }

  // ==========================================================================
  // Form Validation Helpers (Dumb Component - UI helpers only)
  // ==========================================================================

  /**
   * Get field error message for FormField component
   */
  getFieldErrorMessage(fieldName: string): string | undefined {
    const error = this.getFieldError(fieldName);
    return error ?? undefined;
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (field.errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldLabel(fieldName)} no debe exceder ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    if (field.errors['email']) {
      return 'Por favor ingresa una dirección de correo electrónico válida';
    }
    if (field.errors['pattern']) {
      return `${this.getFieldLabel(fieldName)} contiene caracteres inválidos`;
    }

    return 'Entrada inválida';
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      username: 'Nombre de usuario',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Correo electrónico',
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if field has error
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  // Computed properties for UI components
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Información Personal',
      icon: 'user',
      description: 'Actualiza tu información personal',
      showBreadcrumbs: false,
    })
  );
}
