/**
 * Create User Page - Smart Component
 *
 * @description
 * Smart component responsible for user creation functionality. Handles form
 * coordination, validation, and user creation through facades while managing
 * all user creation states and navigation flows.
 *
 * @responsibilities
 * - Coordinate user creation through UserCrudFacade
 * - Manage form state and validation
 * - Handle creation success and error states
 * - Provide navigation and breadcrumb context
 * - Set page metadata (title, breadcrumbs)
 * - Coordinate between form and business logic
 * - Handle role selection and default settings
 *
 * @architecture
 * Smart Component following MAD-AI patterns:
 * - Uses facades for business logic orchestration
 * - Manages reactive state with Angular signals
 * - Delegates UI rendering to dumb components
 * - Handles page-level services (title, breadcrumbs)
 * - No direct business logic or validation
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Presentation
 */

import {
  Component,
  computed,
  signal,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Application Layer Imports
import { UserCrudFacade } from '@application/facades/users';

// Presentation Layer Imports
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Input } from '@presentation/shared/ui/input/input';

// Local Imports
import type { UserFormData, UserFormErrors } from '../../types';

/**
 * Create User Page Component
 *
 * Provides a complete user creation interface with form validation,
 * error handling, and navigation. Coordinates with UserCrudFacade
 * for business operations.
 */
@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Icon, FormField, Input],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateUserPage implements OnInit {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly userCrudFacade = inject(UserCrudFacade);
  private readonly router = inject(Router);
  private readonly titleService = inject(TitleService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly fb = inject(FormBuilder);

  // ============================================================================
  // Component State
  // ============================================================================

  /**
   * Form submission state
   */
  private readonly _isSubmitting = signal<boolean>(false);

  /**
   * Form validation errors
   */
  private readonly _formErrors = signal<UserFormErrors>({});

  /**
   * General error message
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Success state after creation
   */
  private readonly _success = signal<boolean>(false);

  /**
   * Available roles for selection
   */
  private readonly _availableRoles = signal<string[]>(['user', 'admin', 'manager', 'viewer']);

  // ============================================================================
  // Form Definition
  // ============================================================================

  /**
   * User creation form with validation
   */
  readonly userForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_-]+$/),
      ],
    ],
    role: ['user', [Validators.required]],
    isActive: [true],
    sendWelcomeEmail: [true],
  });

  // ============================================================================
  // Computed Properties (Reactive State for Template)
  // ============================================================================

  /**
   * Form submission state
   */
  readonly isSubmitting = computed(() => this._isSubmitting());

  /**
   * Form validation errors
   */
  readonly formErrors = computed(() => this._formErrors());

  /**
   * General error state
   */
  readonly error = computed(() => this._error());

  /**
   * Success state
   */
  readonly success = computed(() => this._success());

  /**
   * Available roles for selection
   */
  readonly availableRoles = computed(() => this._availableRoles());

  /**
   * Form validity state
   */
  readonly isFormValid = computed(() => this.userForm.valid);

  /**
   * Form dirty state
   */
  readonly isFormDirty = computed(() => this.userForm.dirty);

  /**
   * Can submit form
   */
  readonly canSubmit = computed(
    () => this.isFormValid() && this.isFormDirty() && !this.isSubmitting()
  );

  /**
   * Form data as UserFormData
   */
  readonly formData = computed((): UserFormData => {
    const value = this.userForm.value;
    return {
      firstName: value.firstName || '',
      lastName: value.lastName || '',
      email: value.email || '',
      username: value.username || '',
      role: value.role || 'user',
      isActive: value.isActive ?? true,
      sendWelcomeEmail: value.sendWelcomeEmail ?? true,
    };
  });

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  ngOnInit(): void {
    // Set page metadata
    this.titleService.setTitle('Create New User');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
      { label: 'Create User', icon: 'user-plus' },
    ]);

    // Setup form validation
    this.setupFormValidation();
  }

  // ============================================================================
  // Form Management Methods
  // ============================================================================

  /**
   * Setup form validation and error handling
   */
  private setupFormValidation(): void {
    // Watch form changes and clear errors
    this.userForm.valueChanges.subscribe(() => {
      if (this._error()) {
        this._error.set(null);
      }
      if (Object.keys(this._formErrors()).length > 0) {
        this._formErrors.set({});
      }
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: keyof UserFormErrors): string | undefined {
    const errors = this.formErrors();
    return errors[fieldName];
  }

  /**
   * Get field validation error from Angular validators
   */
  getValidationError(fieldName: string): string | undefined {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return undefined;

    const errors = field.errors;

    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength'])
      return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength'])
      return `${this.getFieldLabel(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return `${this.getFieldLabel(fieldName)} contains invalid characters`;

    return 'Invalid value';
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      username: 'Username',
      role: 'Role',
    };
    return labels[fieldName] || fieldName;
  }

  // ============================================================================
  // Form Submission Methods
  // ============================================================================

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this._isSubmitting.set(true);
    this._error.set(null);
    this._formErrors.set({});

    try {
      const formData = this.formData();

      // Build creation request
      const createRequest = {
        userData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          roleId: formData.role ? parseInt(formData.role) : 1,
          isActive: formData.isActive,
        },
        sendWelcomeNotification: formData.sendWelcomeEmail,
        createdBy: 1, // This would come from AuthService
      };

      // Create user through facade and handle Message result
      const result = await this.userCrudFacade.createUser(createRequest);
      if (result.success) {
        this._success.set(true);
        // Extract user from Message if present
        const createdUser = result['user'];
        // Show Spanish success message
        const nombreCompleto = `${formData.firstName} ${formData.lastName}`;
        setTimeout(() => {
          this.router.navigate(['/users/detail', createdUser?.id ?? ''], {
            state: {
              message: result.message || `Usuario ${nombreCompleto} creado exitosamente.`,
            },
          });
        }, 2000);
      } else {
        // Show Spanish error message
        this._error.set(result.error || result.message || 'No se pudo crear el usuario.');
      }
    } catch (error: unknown) {
      this.handleSubmissionError(error);
    } finally {
      this._isSubmitting.set(false);
    }
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    if (this.isFormDirty()) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }

    this.router.navigate(['/users']);
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.userForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      role: 'user',
      isActive: true,
      sendWelcomeEmail: true,
    });
    this._formErrors.set({});
    this._error.set(null);
    this._success.set(false);
  }

  // ============================================================================
  // Navigation Methods
  // ============================================================================

  /**
   * Navigate back to users list
   */
  goBackToList(): void {
    this.router.navigate(['/users']);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Handle submission errors
   */
  private handleSubmissionError(error: unknown): void {
    console.error('Failed to create user:', error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Handle specific validation errors
      if (errorMessage.includes('email') && errorMessage.includes('exists')) {
        this._formErrors.set({
          email: 'This email address is already registered',
        });
        return;
      }

      if (errorMessage.includes('username') && errorMessage.includes('exists')) {
        this._formErrors.set({
          username: 'This username is already taken',
        });
        return;
      }

      // Handle validation errors from backend
      if (errorMessage.includes('validation')) {
        this._error.set('Please check your input and try again');
        return;
      }

      // Generic error
      this._error.set(error.message);
    } else {
      this._error.set('An unexpected error occurred while creating the user');
    }
  }

  /**
   * Generate username suggestion based on name
   */
  generateUsernameSuggestion(): void {
    const firstName = this.userForm.get('firstName')?.value || '';
    const lastName = this.userForm.get('lastName')?.value || '';

    if (firstName && lastName) {
      const suggestion = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(
        /[^a-z0-9.-]/g,
        ''
      );

      if (suggestion && !this.userForm.get('username')?.value) {
        this.userForm.patchValue({ username: suggestion });
      }
    }
  }

  /**
   * Handle first name change to auto-generate username
   */
  onFirstNameChange(): void {
    this.generateUsernameSuggestion();
  }

  /**
   * Handle last name change to auto-generate username
   */
  onLastNameChange(): void {
    this.generateUsernameSuggestion();
  }
}
