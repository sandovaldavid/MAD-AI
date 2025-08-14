import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
    selector: 'ui-form-field',
    standalone: true,
    templateUrl: './form-field.html',
    styleUrl: './form-field.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormField {
    label = input<string | undefined>();
    hint = input<string | undefined>();
    error = input<string | undefined>();
    required = input<boolean>(false);
    controlId = input<string | undefined>(); // si se lo pasas, enlaza aria-describedby

    describedBy = computed(() => {
        const id = this.controlId();
        const ids: string[] = [];
        if (this.hint() && id) ids.push(`${id}-hint`);
        if (this.error() && id) ids.push(`${id}-err`);
        return ids.join(' ') || null;
    });
}
