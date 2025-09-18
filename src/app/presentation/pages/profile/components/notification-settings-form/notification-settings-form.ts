import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Button, Toggle } from '@presentation/shared/ui';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Button, Toggle],
  selector: 'app-notification-settings-form',
  templateUrl: './notification-settings-form.html',
  styleUrls: ['./notification-settings-form.css'],
})
export class NotificationSettingsForm {
  // ==========================================================================
  // Input Properties
  // ==========================================================================

  /**
   * Current user data to populate notification preferences
   * When this changes, the form will be updated with new values
   */
  @Input() set userPreferences(value: { email: boolean; system: boolean; task: boolean } | null) {
    if (value) {
      this._originalPreferences.set({ ...value });
      this.updateFormWithPreferences(value);
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
   * Emitted when user submits updated notification preferences
   * Contains the new notification preferences configuration
   */
  @Output() preferencesUpdate = new EventEmitter<{
    email: boolean;
    system: boolean;
    task: boolean;
  }>();

  /**
   * Emitted when user cancels preference changes
   * Parent can use this to reset form or navigate away
   */
  @Output() cancel = new EventEmitter<void>();

  // ==========================================================================
  // Component State
  // ==========================================================================

  private readonly fb = new FormBuilder();
  private readonly _isSubmitting = signal(false);
  private readonly _originalPreferences = signal<{
    email: boolean;
    system: boolean;
    task: boolean;
  } | null>(null);

  /**
   * Reactive form for notification preferences
   * Contains boolean controls for each notification type
   */
  readonly notificationForm: FormGroup = this.fb.group({
    email: [true],
    system: [true],
    task: [true],
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
    const originalPrefs = this._originalPreferences();
    if (!originalPrefs) return false;

    const currentPrefs = this.notificationForm.value;
    return (
      originalPrefs.email !== currentPrefs.email ||
      originalPrefs.system !== currentPrefs.system ||
      originalPrefs.task !== currentPrefs.task
    );
  });

  // ==========================================================================
  // Form Management Methods
  // ==========================================================================

  /**
   * Updates form fields with user notification preferences
   * @param preferences - Current notification preferences
   */
  private updateFormWithPreferences(preferences: {
    email: boolean;
    system: boolean;
    task: boolean;
  }): void {
    this.notificationForm.patchValue(
      {
        email: preferences.email ?? true,
        system: preferences.system ?? true,
        task: preferences.task ?? true,
      },
      { emitEvent: false }
    );
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  /**
   * Handles toggle change events for notification preferences
   * @param controlName - Name of the form control to update
   * @param value - New boolean value from toggle
   */
  onToggleChange(controlName: string, value: boolean): void {
    this.notificationForm.get(controlName)?.setValue(value);
  }

  /**
   * Handles form submission
   * Emits update event with new preference configuration
   */
  onSubmit(): void {
    if (this.hasChanges() && !this.isSubmitting()) {
      const preferences = {
        email: this.notificationForm.value.email,
        system: this.notificationForm.value.system,
        task: this.notificationForm.value.task,
      };
      this.preferencesUpdate.emit(preferences);
    }
  }

  /**
   * Handles form cancellation
   * Resets form to original values and emits cancel event
   */
  onCancel(): void {
    const originalPrefs = this._originalPreferences();
    if (originalPrefs) {
      this.notificationForm.patchValue({
        email: originalPrefs.email,
        system: originalPrefs.system,
        task: originalPrefs.task,
      });
    }
    this.cancel.emit();
  }
}
