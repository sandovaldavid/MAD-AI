import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostListener,
    Input,
    Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationType } from '@domain/entities/notification.entity';
import type { Notification } from '@domain/entities/notification.entity';
import { Icon } from '@shared/ui/icon/icon';

@Component({
    selector: 'app-toast-item',
    standalone: true,
    imports: [CommonModule, Icon],
    templateUrl: './toast-item.html',
    styleUrls: ['./toast-item.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastItem {
    @Input({ required: true }) t!: Notification;

    @Output() close = new EventEmitter<void>();
    @Output() act = new EventEmitter<'primary' | 'secondary'>();
    @Output() hover = new EventEmitter<void>();
    @Output() leave = new EventEmitter<void>();

    // Expose notification types for template usage
    readonly types = {
        SUCCESS: 'success' as const,
        ERROR: 'error' as const,
        WARNING: 'warning' as const,
        INFO: 'info' as const,
    };

    get ariaLive(): 'assertive' | 'polite' {
        return this.t?.type === 'error' ? 'assertive' : 'polite';
    }

    accentClass(type?: NotificationType) {
        switch (type) {
            case 'success':
                return 'accent-success';
            case 'error':
                return 'accent-error';
            case 'warning':
                return 'accent-warning';
            default:
                return 'accent-info';
        }
    }

    onClose() {
        this.close.emit();
    }
    onAction(which: 'primary' | 'secondary') {
        this.act.emit(which);
    }

    @HostListener('mouseenter') onMouseEnter() {
        this.hover.emit();
    }
    @HostListener('mouseleave') onMouseLeave() {
        this.leave.emit();
    }
}
