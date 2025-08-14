import { ChangeDetectionStrategy, Component, input, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
type InputSize = 'sm' | 'md' | 'lg';

@Component({
    selector: 'ui-input',
    standalone: true,
    templateUrl: './input.html',
    styleUrl: './input.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: Input }],
})
export class Input implements ControlValueAccessor {
    // API mínima
    id = input<string | undefined>();
    name = input<string | undefined>();
    type = input<InputType>('text');
    placeholder = input<string>('');
    required = input<boolean>(false);
    disabled = input<boolean>(false);
    size = input<InputSize>('md');

    // Estado interno (CVA)
    private _value = signal<string>('');
    private _isDisabled = signal<boolean>(false);
    get value() {
        return this._value();
    }
    isDisabled = computed(() => this.disabled() || this._isDisabled());

    // Clases del <input/>
    classes = computed(() => {
        const sizeCls = this.size() === 'sm' ? 'in-sm' : this.size() === 'lg' ? 'in-lg' : 'in-md';
        return ['in', sizeCls, this.isDisabled() ? 'in--disabled' : ''].filter(Boolean).join(' ');
    });

    // CVA
    private onChange = (v: string) => {};
    private onTouched = () => {};
    writeValue(v: string | null) {
        this._value.set(v ?? '');
    }
    registerOnChange(fn: any) {
        this.onChange = fn;
    }
    registerOnTouched(fn: any) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled: boolean) {
        this._isDisabled.set(isDisabled);
    }

    // Handlers
    handleInput(ev: Event) {
        const v = (ev.target as HTMLInputElement).value;
        this._value.set(v);
        this.onChange(v);
    }
    handleBlur() {
        this.onTouched();
    }
}
