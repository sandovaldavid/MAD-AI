import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusMessageType = 'success' | 'error' | 'info' | 'warning';

@Component({
    selector: 'app-status-message',
    templateUrl: './status-message.component.html',
    styleUrls: ['./status-message.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
})
export class StatusMessageComponent {
    message = input<string>('');
    type = input<StatusMessageType>('info');

    protected readonly messageClasses = computed(() => {
        const typeClasses = {
            success: 'status-message-base status-message-success',
            error: 'status-message-base status-message-error',
            info: 'status-message-base status-message-info',
            warning: 'status-message-base status-message-warning',
        };

        return typeClasses[this.type()];
    });
}
