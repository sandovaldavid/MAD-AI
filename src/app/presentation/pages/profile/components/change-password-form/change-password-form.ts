import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { FormField } from '@presentation/shared/ui/form-field/form-field';
import { Input as UiInput } from '@presentation/shared/ui/input/input';
import {
  PageHeader,
  PageHeaderConfig,
} from '@presentation/shared/components/page-header/page-header';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Icon, FormField, UiInput, PageHeader],
  selector: 'app-change-password-form',
  templateUrl: './change-password-form.html',
  styleUrls: ['./change-password-form.css'],
})
export class ChangePasswordForm {
  // ============================================================================
  // Input Properties
  // ============================================================================

  /**
   * Loading state indicator from parent component
   * Used to show loading states and disable form during submission
   */
  @Input() set loading(value: boolean) {
    this._isSubmitting.set(value);
  }

  // ============================================================================
  // Output Events
  // ============================================================================

  /**
   * Emitted when user submits valid password change data
   */
  /**
   * Emitted when user submits valid password change data (simple object, not domain contract)
   */
  @Output() passwordChange = new EventEmitter<{
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
  }>();

  /**
   * Emitted when user cancels password change
   */
  @Output() passwordCancel = new EventEmitter<void>();

  // ============================================================================
  // Component State
  // ============================================================================

  private readonly fb = new FormBuilder();
  private readonly _isSubmitting = signal(false);
  private readonly _showCurrentPassword = signal(false);
  private readonly _showNewPassword = signal(false);
  private readonly _showConfirmPassword = signal(false);

  /**
   * Reactive form for password change
   */
  readonly passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
  });

  // ============================================================================
  // Computed Properties
  // ============================================================================

  readonly isSubmitting = computed(() => this._isSubmitting());
  readonly showCurrentPassword = computed(() => this._showCurrentPassword());
  readonly showNewPassword = computed(() => this._showNewPassword());
  readonly showConfirmPassword = computed(() => this._showConfirmPassword());

  /**
   * Checks if a specific form field is invalid and has been touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ============================================================================
  // Password Visibility Methods
  // ============================================================================

  toggleCurrentPasswordVisibility(): void {
    this._showCurrentPassword.update((show) => !show);
  }

  toggleNewPasswordVisibility(): void {
    this._showNewPassword.update((show) => !show);
  }

  toggleConfirmPasswordVisibility(): void {
    this._showConfirmPassword.update((show) => !show);
  }

  // ============================================================================
  // Password Requirements Validation
  // ============================================================================

  /**
   * Gets the CSS class for password requirements based on validation status
   */
  getRequirementStatus(requirement: string): string {
    const newPassword = this.passwordForm.get('newPassword')?.value || '';
    const isMet = this.checkPasswordRequirement(newPassword, requirement);
    return isMet ? 'requirement-met' : 'requirement-unmet';
  }

  /**
   * Gets the appropriate icon for password requirements
   */
  getRequirementIcon(requirement: string): string {
    const newPassword = this.passwordForm.get('newPassword')?.value || '';
    const isMet = this.checkPasswordRequirement(newPassword, requirement);
    return isMet ? 'check-circle' : 'x-circle';
  }

  /**
   * Checks if a specific password requirement is met
   */
  private checkPasswordRequirement(password: string, requirement: string): boolean {
    switch (requirement) {
      case 'minLength':
        return password.length >= 8;
      case 'uppercase':
        return /[A-Z]/.test(password);
      case 'lowercase':
        return /[a-z]/.test(password);
      case 'numbers':
        return /\d/.test(password);
      case 'special':
        return /[!@#$%^&*(),.?":{}|<>]/.test(password);
      default:
        return false;
    }
  }

  // ============================================================================
  // Password Strength Methods
  // ============================================================================

  /**
   * Calculates password strength score (0-4)
   */
  private calculatePasswordStrength(): number {
    const newPassword = this.passwordForm.get('newPassword')?.value || '';
    let score = 0;

    if (this.checkPasswordRequirement(newPassword, 'minLength')) score++;
    if (this.checkPasswordRequirement(newPassword, 'uppercase')) score++;
    if (this.checkPasswordRequirement(newPassword, 'lowercase')) score++;
    if (this.checkPasswordRequirement(newPassword, 'numbers')) score++;
    if (this.checkPasswordRequirement(newPassword, 'special')) score++;

    return score;
  }

  /**
   * Gets CSS class for password strength indicator
   */
  getPasswordStrengthClass(): string {
    const strength = this.calculatePasswordStrength();
    switch (strength) {
      case 0:
      case 1:
        return 'weak';
      case 2:
        return 'fair';
      case 3:
      case 4:
        return 'good';
      case 5:
        return 'strong';
      default:
        return 'weak';
    }
  }

  /**
   * Gets descriptive text for password strength
   */
  getPasswordStrengthText(): string {
    const strength = this.calculatePasswordStrength();
    switch (strength) {
      case 0:
      case 1:
        return 'Débil';
      case 2:
        return 'Regular';
      case 3:
      case 4:
        return 'Buena';
      case 5:
        return 'Fuerte';
      default:
        return 'Débil';
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles form submission
   */
  onSubmit(): void {
    if (this.passwordForm.valid && !this.isSubmitting()) {
      const passwordData = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword,
        newPasswordConfirm: this.passwordForm.value.confirmPassword,
      };
      this.passwordChange.emit(passwordData);
    }
  }

  /**
   * Handles form cancellation
   */
  onCancel(): void {
    this.passwordForm.reset();
    this.passwordCancel.emit();
  }

  // Computed properties for UI components
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Cambiar Contraseña',
      icon: 'lock',
      description: 'Actualiza tu contraseña para mantener tu cuenta segura.',
      showBreadcrumbs: false,
    })
  );
}
