import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
    signal,
    forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { InputType, InputSize, InputVariant } from '@domain/ui/input';

@Component({
    selector: 'app-input',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true,
        },
    ],
})
export class InputComponent implements ControlValueAccessor {
    type = input<InputType>('text');
    placeholder = input<string>('');
    label = input<string>('');
    helperText = input<string>('');
    errorMessage = input<string>('');
    // Input parameters
    disabledInput = input<boolean>(false);
    required = input<boolean>(false);
    readonly = input<boolean>(false);

    // Internal writeable signal for disabled state
    private _disabledState = signal<boolean>(false);

    // Computed disabled state combining both sources
    disabled = computed(() => this.disabledInput() || this._disabledState());
    size = input<InputSize>('md');
    variant = input<InputVariant>('default');
    id = input<string>('');
    name = input<string>('');
    autocomplete = input<string>('');
    maxLength = input<number | undefined>(undefined);
    minLength = input<number | undefined>(undefined);
    pattern = input<string>('');

    // Outputs using the new signal-based API
    blur = output<void>();
    focus = output<void>();
    enter = output<void>();

    // Internal state for ControlValueAccessor
    protected readonly internalValue = signal<string>('');
    private onChangeFn = (value: string) => {};
    private onTouchedFn = () => {};

    // Computed properties
    protected readonly inputId = computed(() => {
        return this.id() || `input-${Math.random().toString(36).substr(2, 9)}`;
    });

    protected readonly hasError = computed(() => {
        return this.variant() === 'error' || !!this.errorMessage();
    });

    protected readonly showHelperText = computed(() => {
        return !!this.helperText() && !this.hasError();
    });

    protected readonly inputClasses = computed(() => {
        const baseClasses = 'input-base';
        const sizeClasses = {
            sm: 'input-sm',
            md: 'input-md',
            lg: 'input-lg',
        };

        // Determine variant class based on state
        let variantClass = '';
        if (this.hasError()) {
            variantClass = 'input-error';
        } else if (this.variant() === 'success') {
            variantClass = 'input-success';
        }

        return [
            baseClasses,
            sizeClasses[this.size()],
            variantClass,
            this.disabled() ? 'input-disabled' : '',
            this.readonly() ? 'input-readonly' : '',
        ]
            .filter(Boolean)
            .join(' ');
    });

    // ControlValueAccessor implementation
    writeValue(value: string): void {
        this.internalValue.set(value || '');
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledState.set(isDisabled);
    }

    // Event handlers
    protected onInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        const newValue = target.value;
        this.internalValue.set(newValue);
        this.onChangeFn(newValue);
    }

    protected onFocus(): void {
        this.focus.emit();
    }

    protected onBlur(): void {
        this.onTouchedFn();
        this.blur.emit();
    }

    protected onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.enter.emit();
        }
    }
}
