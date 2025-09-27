/**
 * Edit User Page - Smart Component
 *
 * @description
 * Smart component responsible for user editing functionality. Handles form
 * coordination, validation, user data loading, and update operations through
 * facades while managing all user editing states and navigation flows.
 *
 * @responsibilities
 * - Load existing user data through UserLookupFacade
 * - Coordinate user updates through UserCrudFacade
 * - Manage form state and validation
 * - Handle update success and error states
 * - Provide navigation and breadcrumb context
 * - Set dynamic page metadata based on user data
 * - Coordinate between form and business logic
 * - Handle role selection and account settings
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
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

// Application Layer Imports
import { UserLookupFacade, UserCrudFacade } from '@application/facades/users';
import { RolesFacade } from '@application/facades/role/role.facade';

// Domain Imports (for typing only)
import type { User } from '@domain/entities/user.entity';

// Application Layer Types
import type { RoleSummary } from '@application/mappers/role.mapper';

// Presentation Layer Imports
import { TitleService } from '@presentation/services/title.service';
import { BreadcrumbService } from '@presentation/services/breadcrumb.service';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Input } from '@presentation/shared/ui/input/input';
import {
  PageHeader,
  PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';

// Local Imports
import type { UserFormData, UserFormErrors } from '../../types';

// Role Access Level Imports
import {
  getRoleAccessLevelInfo,
  getRoleAccessLevelIcon,
} from '@presentation/pages/roles/types/role-colors.type';

/**
 * Edit User Page Component
 *
 * Provides a complete user editing interface with form validation,
 * error handling, and navigation. Coordinates with UserLookupFacade
 * for data loading and UserCrudFacade for update operations.
 */
@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Icon, FormField, Input, PageHeader],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserPage implements OnInit, OnDestroy {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly userLookupFacade = inject(UserLookupFacade);
  private readonly userCrudFacade = inject(UserCrudFacade);
  private readonly rolesFacade = inject(RolesFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(TitleService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly fb = inject(FormBuilder);

  // ============================================================================
  // Component State
  // ============================================================================

  /**
   * Current user ID from route parameters
   */
  private readonly _userId = signal<number | null>(null);

  /**
   * Current user entity from facade
   */
  private readonly _user = signal<User | null>(null);

  /**
   * Form submission state
   */
  private readonly _isSubmitting = signal<boolean>(false);

  /**
   * Data loading state
   */
  private readonly _loading = signal<boolean>(false);

  /**
   * Form validation errors
   */
  private readonly _formErrors = signal<UserFormErrors>({});

  /**
   * General error message
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Success state after update
   */
  private readonly _success = signal<boolean>(false);

  /**
   * Available roles for selection from RolesFacade
   */
  private readonly _availableRoles = signal<RoleSummary[]>([]);

  /**
   * Role loading state
   */
  private readonly _roleLoading = signal<boolean>(false);

  /**
   * Role loading error
   */
  private readonly _roleError = signal<string | null>(null);

  /**
   * Form dirty state signal for reactive change detection
   */
  private readonly _formDirty = signal<boolean>(false);

  /**
   * Subscription for form changes
   */
  private formSubscription?: Subscription;

  // ============================================================================
  // Form Definition
  // ============================================================================

  /**
   * User editing form with validation
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
    roleId: [null, [Validators.required]],
    isActive: [true],
  });

  // ============================================================================
  // Computed Properties (Reactive State for Template)
  // ============================================================================

  /**
   * Current user ID
   */
  readonly userId = computed(() => this._userId());

  /**
   * Current user entity
   */
  readonly user = computed(() => this._user());

  /**
   * Data loading state
   */
  readonly loading = computed(() => this._loading());

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
   * Role loading state
   */
  readonly roleLoading = computed(() => this._roleLoading());

  /**
   * Role loading error
   */
  readonly roleError = computed(() => this._roleError());

  /**
   * Form validity state
   */
  readonly isFormValid = computed(() => this.userForm.valid);

  /**
   * Form dirty state - reactive using signal for better change detection
   */
  readonly isFormDirty = computed(() => this._formDirty());

  /**
   * Can submit form
   */
  readonly canSubmit = computed(
    () => this.isFormValid() && this.isFormDirty() && !this.isSubmitting() && !this.loading()
  );

  /**
   * Selected role details with access level info
   */
  readonly selectedRoleInfo = computed(() => {
    const roleId = this.userForm.get('roleId')?.value;
    if (!roleId) return null;

    const role = this.availableRoles().find((r) => r.id === Number(roleId));
    if (!role) return null;

    const accessLevelInfo = getRoleAccessLevelInfo(role.accessLevel);
    const accessLevelIcon = getRoleAccessLevelIcon(role.accessLevel);

    return {
      ...role,
      accessLevelInfo,
      accessLevelIcon,
    };
  });

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
      role: value.roleId ? String(value.roleId) : '',
      isActive: value.isActive ?? true,
      sendWelcomeEmail: false, // Not applicable for edit
    };
  });

  /**
   * Dynamic page title based on user data
   */
  readonly pageTitle = computed(() => {
    const user = this.user();
    if (!user) return 'Edit User';
    return `Edit ${user.firstName} ${user.lastName}`;
  });

  /**
   * Dynamic breadcrumbs based on user data
   */
  readonly breadcrumbs = computed(() => {
    const user = this.user();
    const baseCrumbs = [
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
    ];

    if (user) {
      baseCrumbs.push(
        {
          label: `${user.firstName} ${user.lastName}`,
          icon: 'user',
          route: `/users/detail/${user.id}`,
        },
        {
          label: 'Edit',
          icon: 'pencil',
          route: `/users/edit/${user.id}`,
        }
      );
    } else {
      baseCrumbs.push({
        label: 'Edit User',
        icon: 'pencil',
        route: '/users/edit',
      });
    }

    return baseCrumbs;
  });

  /**
   * Page header configuration for the PageHeader component
   */
  readonly headerConfig = computed((): PageHeaderConfig => {
    const user = this.user();
    const selectedRole = this.selectedRoleInfo();
    const isLoading = this.loading();

    if (isLoading) {
      return {
        title: 'Loading User...',
        description: 'Please wait while we load the user data',
        icon: 'user',
        showBreadcrumbs: true,
        actions: [],
      };
    }

    if (!user) {
      return {
        title: 'User Not Found',
        description: 'The requested user could not be found',
        icon: 'alert-circle',
        iconColor: 'text-error-500',
        showBreadcrumbs: true,
        actions: [
          {
            label: 'Go Back',
            icon: 'arrow-left',
            action: () => this.goBackToList(),
            variant: 'secondary',
          },
        ],
      };
    }

    return {
      title: `Edit ${user.firstName} ${user.lastName}`,
      description: selectedRole
        ? `${user.email.toString()} • ${selectedRole.name} (${selectedRole.accessLevelInfo?.label})`
        : user.email.toString(),
      icon: 'pencil',
      iconColor: selectedRole?.accessLevelInfo?.iconColor || 'text-primary-500',
      showBreadcrumbs: true,
      actions: [
        {
          label: 'Cancel',
          icon: 'x',
          action: () => this.onCancel(),
          variant: 'ghost' as const,
          disabled: this.isSubmitting(),
        },
        {
          label: this.isSubmitting() ? 'Saving...' : 'Save Changes',
          icon: this.isSubmitting() ? 'arrow-clockwise' : 'save',
          action: () => this.onSubmit(),
          variant: 'primary' as const,
          disabled: !this.canSubmit(),
          loading: this.isSubmitting(),
        },
      ],
    };
  });

  /**
   * User not found state
   */
  readonly userNotFound = computed(() => {
    return !this.loading() && !this.user() && this.userId() !== null;
  });

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  async ngOnInit(): Promise<void> {
    // Extract user ID from route
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId || isNaN(Number(userId))) {
      this.handleInvalidUserId();
      return;
    }

    this._userId.set(Number(userId));

    // Set initial page metadata
    this.titleService.setTitle('Edit User');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
      { label: 'Loading...', icon: 'user' },
      { label: 'Edit', icon: 'pencil' },
    ]);

    // Load roles first, then user data and populate form
    await this.loadAvailableRoles();
    await this.loadUserAndPopulateForm();

    // Setup form validation
    this.setupFormValidation();

    // Setup form change listeners for reactive dirty state detection
    this.setupFormChangeListeners();
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  // ============================================================================
  // Data Loading Methods
  // ============================================================================

  /**
   * Load available roles from RolesFacade
   */
  async loadAvailableRoles(): Promise<void> {
    this._roleLoading.set(true);
    this._roleError.set(null);

    try {
      const result = await this.rolesFacade.getActiveRoles();
      // If result is a Message, extract roles
      let roles: RoleSummary[] = [];
      if (Array.isArray(result)) {
        roles = result;
      } else if (result && Array.isArray(result['roles'])) {
        roles = result['roles'];
      }
      this._availableRoles.set(roles);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load roles';
      this._roleError.set(errorMessage);
      console.error('Failed to load roles:', error);
    } finally {
      this._roleLoading.set(false);
    }
  }

  /**
   * Load user data and populate form
   */
  async loadUserAndPopulateForm(): Promise<void> {
    const userId = this.userId();
    if (!userId) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const result = await this.userLookupFacade.getUserById(userId);
      // If result is a Message, extract user
      let user: User | null = null;
      if (result && typeof result === 'object' && 'success' in result) {
        user = result['user'] ?? null;
      } else {
        user = result as User;
      }
      this._user.set(user);
      if (user) {
        // Populate form with user data
        this.populateForm(user);
      }
      // Update page metadata with user info
      this.updatePageMetadata();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user';
      this._error.set(errorMessage);
      console.error('Failed to load user:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Populate form with user data
   */
  private populateForm(user: User): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email.toString(),
      username: user.username,
      roleId: user.role.id, // Use role ID instead of role string
      isActive: user.active,
    });

    // Mark form as pristine after populating
    this.userForm.markAsPristine();

    // Update dirty state signal
    this._formDirty.set(false);
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
   * Setup form change listeners for reactive dirty state detection
   */
  private setupFormChangeListeners(): void {
    // Subscribe to form value changes to track dirty state
    this.formSubscription = this.userForm.valueChanges.subscribe(() => {
      this._formDirty.set(this.userForm.dirty);
    });

    // Subscribe to form status changes to track dirty state
    this.userForm.statusChanges.subscribe(() => {
      this._formDirty.set(this.userForm.dirty);
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
      roleId: 'Role',
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

    const userId = this.userId();
    if (!userId) return;

    this._isSubmitting.set(true);
    this._error.set(null);
    this._formErrors.set({});

    try {
      const formData = this.formData();

      // Build update request
      const updateRequest = {
        userId: userId,
        updateData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          roleId: this.userForm.get('roleId')?.value || undefined,
          isActive: formData.isActive,
        },
        requesterId: 1, // This would come from AuthService
      };

      // Update user through facade and handle Message result
      const result = await this.userCrudFacade.updateUser(updateRequest);
      if (result.success) {
        // Extract user from Message if present
        const updatedUser = result['user'];
        this._user.set(updatedUser);
        this._success.set(true);
        this.userForm.markAsPristine();
        // Show Spanish success message
        const nombreCompleto = `${formData.firstName} ${formData.lastName}`;
        setTimeout(() => {
          this.router.navigate(['/users/detail', userId], {
            state: {
              message: result.message || `Usuario ${nombreCompleto} actualizado exitosamente.`,
            },
          });
        }, 2000);
      } else {
        // Show Spanish error message
        this._error.set(result.error || result.message || 'No se pudo actualizar el usuario.');
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

    this.goBackToDetail();
  }

  /**
   * Reset form to original user data
   */
  resetForm(): void {
    const user = this.user();
    if (!user) return;

    this.populateForm(user);
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

  /**
   * Navigate back to user detail
   */
  goBackToDetail(): void {
    const userId = this.userId();
    if (userId) {
      this.router.navigate(['/users/detail', userId]);
    } else {
      this.goBackToList();
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Handle invalid user ID from route
   */
  private handleInvalidUserId(): void {
    this._error.set('Invalid user ID provided');
    this.titleService.setTitle('Invalid User');
    this.breadcrumbService.setBreadcrumbs([
      { label: 'Dashboard', icon: 'home', route: '/dashboard' },
      { label: 'Users', icon: 'users', route: '/users' },
      { label: 'Invalid User', icon: 'alert-circle' },
    ]);
  }

  /**
   * Update page metadata based on loaded user
   */
  private updatePageMetadata(): void {
    const user = this.user();
    if (!user) return;

    // Update page title
    this.titleService.setTitle(this.pageTitle());

    // Update breadcrumbs
    this.breadcrumbService.setBreadcrumbs(this.breadcrumbs());
  }

  /**
   * Handle submission errors
   */
  private handleSubmissionError(error: unknown): void {
    console.error('Failed to update user:', error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Handle specific validation errors
      if (errorMessage.includes('email') && errorMessage.includes('exists')) {
        this._formErrors.set({
          email: 'This email address is already registered by another user',
        });
        return;
      }

      if (errorMessage.includes('username') && errorMessage.includes('exists')) {
        this._formErrors.set({
          username: 'This username is already taken by another user',
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
      this._error.set('An unexpected error occurred while updating the user');
    }
  }
}
