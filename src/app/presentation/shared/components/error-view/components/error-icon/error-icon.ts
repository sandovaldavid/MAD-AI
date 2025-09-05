import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@presentation/shared/ui/icon/icon';
import type {
  ErrorIconConfig,
  ErrorType,
  ErrorSeverity,
} from '../../../../types/error-display.types';

@Component({
  selector: 'app-error-icon',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './error-icon.html',
  styleUrls: ['./error-icon.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorIcon {
  config = input.required<ErrorIconConfig>();

  containerClasses = computed(() => {
    const config = this.config();
    const size = config.size || 'lg';
    const severity = config.severity;

    return [
      'error-icon-container',
      `error-icon-container--${size}`,
      `error-icon-container--${severity}`,
    ].join(' ');
  });

  iconClasses = computed(() => {
    const severity = this.config().severity;
    return `error-icon--${severity}`;
  });

  iconName = computed(() => {
    const config = this.config();

    if (config.customIcon) {
      return config.customIcon;
    }

    // Default icons based on type and severity
    const iconMap: Record<ErrorType, string> = {
      network: 'wifi-off',
      server: 'server',
      validation: 'alert-circle',
      'not-found': 'search',
      forbidden: 'lock',
      unauthorized: 'user-x',
      generic: 'alert-triangle',
    };

    return iconMap[config.type] || 'alert-triangle';
  });
}
