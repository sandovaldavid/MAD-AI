import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ButtonVariant, ButtonSize, ButtonType } from '@domain/ui/button';

@Component({
    selector: 'app-button',
    templateUrl: './button.html',
    styleUrl: './button.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
    // Inputs using the new signal-based API
    variant = input<ButtonVariant>('primary');
    size = input<ButtonSize>('md');
    type = input<ButtonType>('button');
    disabled = input<boolean>(false);
    loading = input<boolean>(false);
    fullWidth = input<boolean>(false);
    iconOnly = input<boolean>(false);

    // Outputs using the new signal-based API
    clicked = output<void>();

    // Computed properties
    protected readonly buttonClasses = computed(() => {
        const baseClasses = 'btn-base';
        const variantClasses = {
            primary: 'btn-primary',
            secondary: 'btn-secondary',
            outline: 'btn-outline',
            ghost: 'btn-ghost',
            destructive: 'btn-destructive',
        };
        const sizeClasses = {
            sm: 'btn-sm',
            md: 'btn-md',
            lg: 'btn-lg',
        };

        return [
            baseClasses,
            variantClasses[this.variant()],
            sizeClasses[this.size()],
            this.disabled() || this.loading() ? 'btn-disabled' : '',
            this.loading() ? 'btn-loading' : '',
            this.fullWidth() ? 'btn-full-width' : '',
            this.iconOnly() ? 'btn-icon-only' : '',
        ]
            .filter(Boolean)
            .join(' ');
    });

    protected readonly isDisabled = computed(() => {
        return this.disabled() || this.loading();
    });

    // Event handlers
    protected onClick(): void {
        if (!this.isDisabled()) {
            this.clicked.emit();
        }
    }
}
