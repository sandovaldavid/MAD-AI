import { ChangeDetectionStrategy, Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorIcon } from '../components/error-icon/error-icon';
import { ErrorActions } from '../components/error-actions/error-actions';
import { ErrorDetails } from '../components/error-details/error-details';
import type { ErrorDisplayConfig } from '../../../types/error-display.types';

@Component({
    selector: 'app-error-display',
    standalone: true,
    imports: [CommonModule, ErrorIcon, ErrorActions, ErrorDetails],
    templateUrl: './error-display.html',
    styleUrls: ['./error-display.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDisplay {
    config = input.required<ErrorDisplayConfig>();

    // Computed properties for internal logic
    private readonly _isCompact = computed(() => this.config().compact ?? false);

    readonly showIcon = computed(() => this.config().showIcon !== false);

    readonly hasActions = computed(
        () => Array.isArray(this.config().actions) && this.config().actions.length > 0
    );

    readonly hasDetails = computed(
        () => !!this.config().details && this.config().showDetails !== false
    );

    readonly containerClasses = computed(() => {
        const baseClass = 'error-display-container';
        const severityClass = `${baseClass}--${this.config().severity}`;
        const compactClass = this._isCompact() ? `${baseClass}--compact` : '';

        return [baseClass, severityClass, compactClass].filter(Boolean).join(' ');
    });

    readonly iconConfig = computed(() => ({
        type: this.config().type,
        severity: this.config().severity,
        customIcon: this.config().icon,
        size: this._isCompact() ? ('md' as const) : ('lg' as const),
    }));

    readonly detailsConfig = computed(() => ({
        details: this.config().details || '',
        expanded: false,
        collapsible: true,
    }));
}
