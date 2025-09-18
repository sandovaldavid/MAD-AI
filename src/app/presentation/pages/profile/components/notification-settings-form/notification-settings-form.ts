import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button, Toggle } from '@presentation/shared/ui';
import {
  PageHeader,
  PageHeaderConfig,
} from '@/app/presentation/shared/components/page-header/page-header';

@Component({
  standalone: true,
  imports: [CommonModule, Button, Toggle, PageHeader],
  selector: 'app-notification-settings-form',
  templateUrl: './notification-settings-form.html',
  styleUrls: ['./notification-settings-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsForm {
  // ==========================================================================
  // Modern Angular Inputs & Outputs (Dumb Component Pattern)
  // ==========================================================================

  /**
   * User notification preferences input - pre-processed by Smart Component
   * Only contains the data needed for form display
   */
  userPreferences = input<{ email: boolean; system: boolean; task: boolean } | null>(null);

  /**
   * Loading state input - controlled by Smart Component
   */
  loading = input<boolean>(false);

  /**
   * Events output - emits preference changes to Smart Component
   */
  preferencesUpdate = output<{
    email: boolean;
    system: boolean;
    task: boolean;
  }>();

  /**
   * Cancel event output - emits cancellation to Smart Component
   */
  preferencesCancel = output<void>();

  // ==========================================================================
  // Component State with Signals (Dumb Component - UI state only)
  // ==========================================================================

  private readonly _originalPreferences = signal<{
    email: boolean;
    system: boolean;
    task: boolean;
  } | null>(null);

  private readonly _emailPref = signal(true);
  private readonly _systemPref = signal(true);
  private readonly _taskPref = signal(true);

  // ==========================================================================
  // Computed Properties (Dumb Component - UI state only)
  // ==========================================================================

  /**
   * Current email preference value
   */
  readonly emailPref = computed(() => this._emailPref());

  /**
   * Current system preference value
   */
  readonly systemPref = computed(() => this._systemPref());

  /**
   * Current task preference value
   */
  readonly taskPref = computed(() => this._taskPref());

  /**
   * Submission loading state
   */
  readonly isSubmitting = computed(() => this.loading());

  /**
   * Checks if form has unsaved changes
   */
  readonly hasChanges = computed(() => {
    const originalPrefs = this._originalPreferences();
    if (!originalPrefs) return false;

    return (
      originalPrefs.email !== this._emailPref() ||
      originalPrefs.system !== this._systemPref() ||
      originalPrefs.task !== this._taskPref()
    );
  });

  // ==========================================================================
  // Lifecycle & Initialization (Dumb Component - Effect-based)
  // ==========================================================================

  constructor() {
    // Effect to watch for userPreferences input changes
    effect(() => {
      const preferences = this.userPreferences();
      if (preferences) {
        // Store original preferences for change detection
        this._originalPreferences.set({ ...preferences });

        // Update individual preference signals
        this._emailPref.set(preferences.email ?? true);
        this._systemPref.set(preferences.system ?? true);
        this._taskPref.set(preferences.task ?? true);
      }
    });
  }

  // ==========================================================================
  // Event Handlers (Dumb Component - Direct signal updates)
  // ==========================================================================

  /**
   * Handles email notification toggle change
   * @param value - New boolean value from toggle
   */
  onEmailToggle(value: boolean): void {
    this._emailPref.set(value);
  }

  /**
   * Handles system notification toggle change
   * @param value - New boolean value from toggle
   */
  onSystemToggle(value: boolean): void {
    this._systemPref.set(value);
  }

  /**
   * Handles task notification toggle change
   * @param value - New boolean value from toggle
   */
  onTaskToggle(value: boolean): void {
    this._taskPref.set(value);
  }

  /**
   * Handles form submission (Dumb Component - just emit data)
   */
  onSubmit(): void {
    console.log('[NotificationSettingsForm] onSubmit called', {
      hasChanges: this.hasChanges(),
      isSubmitting: this.isSubmitting(),
      currentPreferences: {
        email: this._emailPref(),
        system: this._systemPref(),
        task: this._taskPref(),
      },
    });

    if (!this.hasChanges() || this.isSubmitting()) {
      console.log('[NotificationSettingsForm] Submission blocked', {
        hasChanges: this.hasChanges(),
        isSubmitting: this.isSubmitting(),
      });
      return;
    }

    const preferences = {
      email: this._emailPref(),
      system: this._systemPref(),
      task: this._taskPref(),
    };

    console.log('[NotificationSettingsForm] Emitting preferencesUpdate', preferences);

    // Emit data to Smart Component - let it handle submission logic
    this.preferencesUpdate.emit(preferences);
  }

  /**
   * Handles form cancellation
   */
  onCancel(): void {
    // Reset preferences to original state
    const originalPrefs = this._originalPreferences();
    if (originalPrefs) {
      this._emailPref.set(originalPrefs.email);
      this._systemPref.set(originalPrefs.system);
      this._taskPref.set(originalPrefs.task);
    } else {
      // Fallback to default values
      this._emailPref.set(true);
      this._systemPref.set(true);
      this._taskPref.set(true);
    }

    this.preferencesCancel.emit();
  }

  /**
   * Resets preferences to original state
   */
  resetPreferences(): void {
    const originalPrefs = this._originalPreferences();
    if (originalPrefs) {
      this._emailPref.set(originalPrefs.email);
      this._systemPref.set(originalPrefs.system);
      this._taskPref.set(originalPrefs.task);
    }
  }

  // Computed properties for UI components
  readonly headerConfig = computed(
    (): PageHeaderConfig => ({
      title: 'Configuración de Notificaciones',
      icon: 'mail',
      description: 'Administra tus preferencias de notificación',
      showBreadcrumbs: false,
    })
  );
}
