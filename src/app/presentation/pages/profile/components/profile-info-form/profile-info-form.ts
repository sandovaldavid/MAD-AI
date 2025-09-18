import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Button } from '@presentation/shared/ui/button/button';
import { Input } from '@presentation/shared/ui/input/input';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { PageHeader, PageHeaderConfig } from '@shared/components/page-header/page-header';
import { AuthFacade } from '@application/facades/auth.facade';

// ==========================================================================
// Types & Interfaces
// ==========================================================================

import {
  getStatusDisplayText,
  getStatusCssClass,
  getStatusIcon,
} from '../../models/user-profile.viewmodel';
import { UserDetailsData } from '../../models/user-details-data';

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
  // Modern Angular Inputs & Outputs
  // ==========================================================================

  // User data input using modern input() function
  userData = input<UserDetailsData | null>(null);

  // Loading state using modern input() function
  loading = input<boolean>(false);

  // Events using modern output() function
  profileUpdate = output<{
    username?: string;
    firstName: string;
    lastName: string;
    email: string;
  }>();

  cancel = output<void>();

  // ==========================================================================
  // Dependency Injection with inject()
  // ==========================================================================

  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);

  // ==========================================================================
  // Component State with Signals
  // ==========================================================================

  private readonly _originalFormData = signal<{
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);

  private readonly _isSubmitting = signal(false);

  private readonly _userDetails = signal<UserDetailsData | null>(null);

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
  // Computed Properties
  // ==========================================================================

  /**
   * Submission loading state
   */
  readonly isSubmitting = computed(() => this._isSubmitting() || this.loading());

  /**
   * Checks if form has unsaved changes
   */
  readonly hasChanges = computed(() => {
    const originalData = this._originalFormData();
    if (!originalData) return false;

    const currentData = this.form.value;
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
   * Get user role name
   */
  readonly roleName = computed(() => {
    const userDetails = this._userDetails();
    return userDetails?.role?.name || 'User';
  });

  /**
   * Get user status text
  /**
   * Get user status text
   */
  readonly statusText = computed(() => {
    const status = this._userDetails()?.status?.toLowerCase();
    return status ? getStatusDisplayText(status) : 'Unknown';
  });

  /**
   * Get status CSS class
   */
  readonly statusClass = computed(() => {
    const status = this._userDetails()?.status?.toLowerCase();
    return status ? getStatusCssClass(status) : 'status-unknown';
  });

  /**
   * Get status icon
   */
  readonly statusIcon = computed(() => {
    const status = this._userDetails()?.status?.toLowerCase();
    return status ? getStatusIcon(status) : 'help-circle';
  });

  /**
   * Format created at date
   */
  readonly createdAtText = computed(() => {
    const createdAt = this._userDetails()?.createdAt;
    if (!createdAt) return '';

    try {
      const date = new Date(createdAt);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return '';
    }
  });

  /**
   * Format last activity date
   */
  readonly lastActivityText = computed(() => {
    const lastActivityAt = this._userDetails()?.lastActivityAt;
    if (!lastActivityAt) return '';

    try {
      const date = new Date(lastActivityAt);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  });

  // ==========================================================================
  // Lifecycle & Initialization
  // ==========================================================================

  constructor() {
    // Try to get user data from authFacade
    const user = this.authFacade.user();
    if (user) {
      // Convert domain entity to presentation data model
      const userDetails: UserDetailsData = {
        id: user.id,
        username: user.username?.toString() || '',
        firstName: user.firstName?.toString() || '',
        lastName: user.lastName?.toString() || '',
        email: user.email?.toString() || '',
        role: {
          id: user.role?.id,
          name: user.role?.name,
          accessLevel: user.role?.accessLevel,
          isActive: user.role?.isActive,
        },
        status: user.status?.toString(),
        createdAt: user.createdAt?.toString(),
        lastActivityAt: user.lastActivityAt?.toString(),
      };

      this._userDetails.set(userDetails);
      this._originalFormData.set({
        username: userDetails.username,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        email: userDetails.email,
      });

      this.updateFormWithUserData(userDetails);
    }
    // If no user in facade, try using input data
    else {
      const userData = this.userData();
      if (userData) {
        this._userDetails.set(userData);
        this._originalFormData.set({
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
        });

        this.updateFormWithUserData(userData);
      }
    }
  }

  // ==========================================================================
  // Form Management Methods
  // ==========================================================================

  /**
   * Updates form fields with user data
   * @param userData - Object with current user data
   */
  private updateFormWithUserData(userData: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }): void {
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
   * Handles form submission
   */
  onSubmit(): void {
    if (!this.canSubmit()) return;

    this._isSubmitting.set(true);

    const formValue = this.form.value as Partial<UserFormData>;

    // Ensure required fields are present
    if (!formValue.firstName || !formValue.lastName || !formValue.email) {
      this._isSubmitting.set(false);
      return;
    }

    const updateData = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      ...(formValue.username && { username: formValue.username }),
    };

    this.profileUpdate.emit(updateData);

    // Reset submitting state after a brief delay to prevent double submission
    setTimeout(() => this._isSubmitting.set(false), 100);
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

    this.cancel.emit();
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

  /**
   * Get field error message (returns undefined to match FormField error input type)
   */
  getFieldErrorMessage(fieldName: string): string | undefined {
    const error = this.getFieldError(fieldName);
    return error ?? undefined;
  }

  /**
   * Get field error message (legacy method returning string | null)
   */
  getFieldError(fieldName: string): string | null {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return null;
    }

    if (field.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `${this.getFieldLabel(fieldName)} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['pattern']) {
      return `${this.getFieldLabel(fieldName)} contains invalid characters`;
    }

    return 'Invalid input';
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      username: 'Username',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
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
