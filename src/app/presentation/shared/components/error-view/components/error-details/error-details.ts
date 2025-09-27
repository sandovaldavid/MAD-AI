import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@presentation/shared/ui/icon/icon';
import type { ErrorDetailsConfig } from '../../../../types/error-display.types';

@Component({
  selector: 'app-error-details',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './error-details.html',
  styleUrls: ['./error-details.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDetails {
  config = input.required<ErrorDetailsConfig>();

  private _isExpanded = signal(false);

  readonly isExpanded = this._isExpanded.asReadonly();

  constructor() {
    // Initialize expanded state when config changes
    effect(() => {
      this._isExpanded.set(this.config().expanded);
    });
  }

  toggleExpanded(): void {
    this._isExpanded.update((expanded) => !expanded);
  }
}
