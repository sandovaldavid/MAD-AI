import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToggleSize = 'sm' | 'md' | 'lg';
export type ToggleColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'successful'
  | 'error'
  | 'warning'
  | 'info';

let toggleIdCounter = 0;

@Component({
  selector: 'ui-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './toggle.html',
  styleUrl: './toggle.css',
})
export class Toggle {
  // Unique ID for accessibility
  readonly toggleId = `toggle-${++toggleIdCounter}`;

  // Input properties using new Angular API
  readonly checked = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly size = input<ToggleSize>('md');
  readonly color = input<ToggleColor>('primary');
  readonly label = input<string>('');
  readonly labelPosition = input<'left' | 'right'>('right');

  // Output events
  readonly toggle = output<boolean>();

  // Internal state for accessibility
  private readonly _focused = signal(false);

  // Computed properties for styling
  readonly toggleClasses = computed(() => {
    const baseClasses = 'toggle';
    const sizeClass = `toggle--${this.size()}`;
    const colorClass = `toggle--${this.color()}`;
    const stateClasses = [
      this.checked() ? 'toggle--checked' : '',
      this.disabled() ? 'toggle--disabled' : '',
      this._focused() ? 'toggle--focused' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `${baseClasses} ${sizeClass} ${colorClass} ${stateClasses}`.trim();
  });

  readonly switchClasses = computed(() => {
    const baseClasses = 'toggle__switch';
    const sizeClass = `toggle__switch--${this.size()}`;
    const stateClasses = [
      this.checked() ? 'toggle__switch--checked' : '',
      this.disabled() ? 'toggle__switch--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `${baseClasses} ${sizeClass} ${stateClasses}`.trim();
  });

  readonly thumbClasses = computed(() => {
    const baseClasses = 'toggle__thumb';
    const sizeClass = `toggle__thumb--${this.size()}`;
    const stateClasses = [
      this.checked() ? 'toggle__thumb--checked' : '',
      this.disabled() ? 'toggle__thumb--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return `${baseClasses} ${sizeClass} ${stateClasses}`.trim();
  });

  // Event handlers
  onToggle(): void {
    if (this.disabled()) return;

    const newValue = !this.checked();
    this.toggle.emit(newValue);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onToggle();
    }
  }

  onFocus(): void {
    this._focused.set(true);
  }

  onBlur(): void {
    this._focused.set(false);
  }
}
