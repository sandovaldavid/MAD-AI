import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-profile-info-form',
  templateUrl: './profile-info-form.html',
  styleUrls: ['./profile-info-form.css'],
})
export class ProfileInfoForm {
  // ==========================================================================
  // Input Properties
  // ==========================================================================

  /**
   * Current user data to populate form fields
   * When this changes, the form will be updated with new values
   */
  @Input() set userData(
    value: { firstName: string; lastName: string; username: string; email: string } | null
  ) {
    if (value) {
      this._originalFormData.set({ ...value });
      this.updateFormWithUserData(value);
    }
  }

  /**
   * Loading state indicator from parent component
   * Used to show loading states and disable form during submission
   */
  @Input() set loading(value: boolean) {
    this._isSubmitting.set(value);
  }

  // ==========================================================================
  // Output Events
  // ==========================================================================

  /**
   * Emitted when user submits valid form data
   * Contains only the fields that have changed
   */
  @Output() profileUpdate = new EventEmitter<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
  }>();

  /**
   * Emitted when user cancels form changes
   * Parent can use this to reset form or navigate away
   */
  @Output() cancel = new EventEmitter<void>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  private readonly fb = new FormBuilder();
  private readonly _isSubmitting = signal(false);
  private readonly _originalFormData = signal<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  } | null>(null);

  /**
   * Reactive form for profile information
   * Contains validation rules and form state management
   */
  readonly profileForm: FormGroup = this.fb.group({
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
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/),
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
  readonly isSubmitting = computed(() => this._isSubmitting());

  /**
   * Checks if form has unsaved changes
   */
  readonly hasChanges = computed(() => {
    const originalData = this._originalFormData();
    if (!originalData) return false;

    const currentData = this.profileForm.value;
    return JSON.stringify(originalData) !== JSON.stringify(currentData);
  });

  // ==========================================================================
  // Form Management Methods
  // ==========================================================================

  /**
   * Updates form fields with user data
   * @param userData - Object with current data
   */
  private updateFormWithUserData(userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  }): void {
    this.profileForm.patchValue(
      {
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email,
      },
      { emitEvent: false }
    );
  }

  /**
   * Checks if a specific form field is invalid and has been touched
   * @param fieldName - Name of the form field to check
   * @returns True if field is invalid and should show error
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Creates update data with only changed fields
   * @returns Object containing only the fields that have changed
   */
  private createUpdateData(): {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
  } {
    const originalData = this._originalFormData();
    const currentData = this.profileForm.value;
    const updateData: { firstName?: string; lastName?: string; username?: string; email?: string } =
      {};

    // Only include fields that have actually changed
    if (originalData && originalData.firstName !== currentData.firstName) {
      updateData.firstName = currentData.firstName;
    }
    if (originalData && originalData.lastName !== currentData.lastName) {
      updateData.lastName = currentData.lastName;
    }
    if (originalData && originalData.username !== currentData.username) {
      updateData.username = currentData.username;
    }
    if (originalData && originalData.email !== currentData.email) {
      updateData.email = currentData.email;
    }

    return updateData;
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handles form submission
   * Validates form and emits update event with changed data
   */
  onSubmit(): void {
    if (this.profileForm.valid && this.hasChanges() && !this.isSubmitting()) {
      const updateData = this.createUpdateData();
      // Only emit if there are actual changes
      if (Object.keys(updateData).length > 0) {
        this.profileUpdate.emit(updateData);
      }
    }
  }

  /**
   * Handles form cancellation
   * Resets form to original values and emits cancel event
   */
  onCancel(): void {
    const originalData = this._originalFormData();
    if (originalData) {
      this.updateFormWithUserData(originalData);
      this.profileForm.markAsUntouched();
    }
    this.cancel.emit();
  }
}
