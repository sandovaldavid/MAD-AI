import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@presentation/shared/ui/icon/icon';
import type { ErrorAction } from '../../../../types/error-display.types';

@Component({
  selector: 'app-error-actions',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './error-actions.html',
  styleUrls: ['./error-actions.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorActions {
  actions = input.required<ErrorAction[]>();
  alignment = input<'center' | 'start' | 'end'>('center');

  containerClasses = computed(() => {
    const alignment = this.alignment();
    return ['error-actions', `error-actions--${alignment}`].join(' ');
  });

  getActionClasses(action: ErrorAction): string {
    return ['error-action-btn', `error-action-btn--${action.style}`].join(' ');
  }

  handleAction(action: ErrorAction): void {
    if (!action.disabled && !action.loading) {
      action.action();
    }
  }
}
