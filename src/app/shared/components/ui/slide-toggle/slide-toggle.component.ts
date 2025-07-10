import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-slide-toggle',
    templateUrl: './slide-toggle.component.html',
    styleUrl: './slide-toggle.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: SlideToggleComponent,
            multi: true,
        },
    ],
})
export class SlideToggleComponent implements ControlValueAccessor {
    // Inputs
    readonly label = input<string>('');
    readonly description = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly size = input<'sm' | 'md' | 'lg'>('md');
    readonly variant = input<'default' | 'success' | 'warning' | 'error'>('default');
    readonly labelPosition = input<'left' | 'right'>('right');
    readonly showDescription = input<boolean>(true);
    readonly showLabels = input<boolean>(false); // Para mostrar ON/OFF

    // Outputs
    readonly toggleChange = output<boolean>();

    // Internal state
    private _value = signal(false);
    private _onChange = (value: boolean) => {};
    private _onTouched = () => {};

    get value(): boolean {
        return this._value();
    }

    set value(val: boolean) {
        this._value.set(val);
        this._onChange(val);
        this._onTouched();
    }

    // ControlValueAccessor implementation
    writeValue(value: boolean): void {
        this._value.set(value ?? false);
    }

    registerOnChange(fn: (value: boolean) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        // Handled by the disabled input
    }

    onToggle(): void {
        if (!this.disabled()) {
            this.value = !this.value;
            this.toggleChange.emit(this.value);
        }
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            this.onToggle();
        }
    }

    get containerClasses(): string {
        const baseClasses = 'slide-toggle-container';
        const positionClasses = {
            left: 'slide-toggle-container-left',
            right: 'slide-toggle-container-right',
        };

        return [
            baseClasses,
            positionClasses[this.labelPosition()],
            this.disabled() ? 'slide-toggle-container-disabled' : '',
        ]
            .filter(Boolean)
            .join(' ');
    }

    get toggleClasses(): string {
        const baseClasses = 'slide-toggle';
        const sizeClasses = {
            sm: 'slide-toggle-sm',
            md: 'slide-toggle-md',
            lg: 'slide-toggle-lg',
        };
        const variantClasses = {
            default: 'slide-toggle-default',
            success: 'slide-toggle-success',
            warning: 'slide-toggle-warning',
            error: 'slide-toggle-error',
        };

        return [
            baseClasses,
            sizeClasses[this.size()],
            variantClasses[this.variant()],
            this.value ? 'slide-toggle-active' : 'slide-toggle-inactive',
            this.disabled() ? 'slide-toggle-disabled' : '',
        ]
            .filter(Boolean)
            .join(' ');
    }

    get labelClasses(): string {
        const baseClasses = 'slide-toggle-label';
        const sizeClasses = {
            sm: 'slide-toggle-label-sm',
            md: 'slide-toggle-label-md',
            lg: 'slide-toggle-label-lg',
        };

        return [
            baseClasses,
            sizeClasses[this.size()],
            this.disabled() ? 'slide-toggle-label-disabled' : '',
        ]
            .filter(Boolean)
            .join(' ');
    }

    get descriptionClasses(): string {
        const baseClasses = 'slide-toggle-description';
        const sizeClasses = {
            sm: 'slide-toggle-description-sm',
            md: 'slide-toggle-description-md',
            lg: 'slide-toggle-description-lg',
        };

        return [
            baseClasses,
            sizeClasses[this.size()],
            this.disabled() ? 'slide-toggle-description-disabled' : '',
        ]
            .filter(Boolean)
            .join(' ');
    }
}
