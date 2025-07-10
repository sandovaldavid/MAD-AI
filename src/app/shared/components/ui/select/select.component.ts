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
import type { SelectSize, SelectVariant, SelectOption } from '@domain/ui/select';

@Component({
    selector: 'app-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
    ],
})
export class SelectComponent implements ControlValueAccessor {
    // Input parameters
    size = input<SelectSize>('md');
    variant = input<SelectVariant>('default');
    placeholder = input<string>('Selecciona una opción');
    label = input<string>('');
    helperText = input<string>('');
    errorMessage = input<string>('');
    options = input<SelectOption[]>([]);
    disabledInput = input<boolean>(false);
    required = input<boolean>(false);
    multiple = input<boolean>(false);

    // Internal disabled state
    private _disabledState = signal<boolean>(false);

    // Computed disabled state combining both sources
    protected readonly disabled = computed(() => this._disabledState() || this.disabledInput());

    // Output events
    valueChange = output<string | number | (string | number)[]>();

    // Internal state
    protected readonly value = signal<string | number | (string | number)[]>('');
    protected readonly isOpen = signal(false);

    // Computed properties
    protected readonly selectClasses = computed(() => {
        const classes = ['select-input'];
        classes.push(`select-${this.size()}`);
        classes.push(`select-${this.variant()}`);

        if (this.disabled()) {
            classes.push('select-disabled');
        }

        return classes.join(' ');
    });

    protected readonly selectedLabel = computed(() => {
        const currentValue = this.value();
        if (this.multiple()) {
            const values = Array.isArray(currentValue) ? currentValue : [];
            if (values.length === 0) return this.placeholder();
            if (values.length === 1) {
                const option = this.options().find((opt) => opt.value === values[0]);
                return option?.label || '';
            }
            return `${values.length} seleccionados`;
        } else {
            const option = this.options().find((opt) => opt.value === currentValue);
            return option?.label || this.placeholder();
        }
    });

    protected readonly isPlaceholder = computed(() => {
        const currentValue = this.value();
        if (this.multiple()) {
            const values = Array.isArray(currentValue) ? currentValue : [];
            return values.length === 0;
        } else {
            return !currentValue || currentValue === '';
        }
    });

    // ControlValueAccessor implementation
    private onChange = (value: string | number | (string | number)[]) => {};
    private onTouched = () => {};

    writeValue(value: string | number | (string | number)[]): void {
        this.value.set(value || (this.multiple() ? [] : ''));
    }

    registerOnChange(fn: (value: string | number | (string | number)[]) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledState.set(isDisabled);
    }

    // Event handlers
    protected onToggle(): void {
        if (this.disabled()) return;
        this.isOpen.update((open) => !open);
    }

    protected onSelectOption(option: SelectOption): void {
        if (option.disabled || this.disabled()) return;

        const currentValue = this.value();

        if (this.multiple()) {
            const values = Array.isArray(currentValue) ? [...currentValue] : [];
            const index = values.findIndex((v) => v === option.value);

            if (index === -1) {
                values.push(option.value);
            } else {
                values.splice(index, 1);
            }

            this.value.set(values);
            this.onChange(values);
            this.valueChange.emit(values);
        } else {
            this.value.set(option.value);
            this.onChange(option.value);
            this.valueChange.emit(option.value);
            this.isOpen.set(false);
        }

        this.onTouched();
    }

    protected isOptionSelected(option: SelectOption): boolean {
        const currentValue = this.value();
        if (this.multiple()) {
            const values = Array.isArray(currentValue) ? currentValue : [];
            return values.includes(option.value);
        }
        return currentValue === option.value;
    }

    protected onBlur(): void {
        this.onTouched();
        // Close dropdown when clicking outside
        setTimeout(() => this.isOpen.set(false), 150);
    }

    protected onKeyDown(event: KeyboardEvent): void {
        if (this.disabled()) return;

        switch (event.key) {
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.onToggle();
                break;
            case 'Escape':
                this.isOpen.set(false);
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!this.isOpen()) {
                    this.isOpen.set(true);
                }
                // TODO: Add keyboard navigation between options
                break;
            case 'ArrowUp':
                event.preventDefault();
                // TODO: Add keyboard navigation between options
                break;
        }
    }
}
