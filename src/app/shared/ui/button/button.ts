import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import type { Size as IconSize, Variant as IconVariant } from '@shared/types/icon';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';

@Component({
    selector: 'ui-button',
    standalone: true,
    imports: [Icon],
    templateUrl: './button.html',
    styleUrl: './button.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
    variant = input<ButtonVariant>('primary');
    size = input<ButtonSize>('md');
    type = input<ButtonType>('button');
    fullWidth = input<boolean>(false);
    loading = input<boolean>(false);
    disabled = input<boolean>(false);
    ariaLabel = input<string | undefined>();

    // Íconos opcionales
    iconLeft = input<string | undefined>();
    iconRight = input<string | undefined>();
    iconVariant = input<IconVariant>('outline');

    // Eventos
    clicked = output<MouseEvent>();

    // Clases calculadas
    classes = computed(() => {
        const base = 'btn';
        const v = `btn--${this.variant()}`;
        const s = `btn--${this.size()}`;
        const w = this.fullWidth() ? 'btn--block' : '';
        const dis = this.disabled() || this.loading() ? 'btn--disabled' : '';
        return [base, v, s, w, dis].filter(Boolean).join(' ');
    });

    // Tamaño del ícono basado en el tamaño del botón
    iconSize = computed((): IconSize => {
        const sizeMap: Record<ButtonSize, IconSize> = {
            sm: 'sm',
            md: 'md',
            lg: 'lg',
        };
        return sizeMap[this.size()];
    });

    onClick(ev: MouseEvent) {
        if (this.disabled() || this.loading()) return;
        this.clicked.emit(ev);
    }
}
