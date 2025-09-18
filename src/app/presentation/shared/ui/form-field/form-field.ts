import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { Size, Variant } from '@presentation/shared/types/icon';

/**
 * FormField component with optional icon support
 *
 * @example
 * <!-- Basic usage -->
 * <ui-form-field label="Email" [controlId]="'email'">
 *   <input type="email" id="email" />
 * </ui-form-field>
 *
 * @example
 * <!-- With icon -->
 * <ui-form-field
 *   label="Email"
 *   [controlId]="'email'"
 *   [iconName]="'email'"
 *   [iconSize]="'sm'"
 *   [iconVariant]="'outline'"
 *   [iconAriaLabel]="'Email icon'">
 *   <input type="email" id="email" />
 * </ui-form-field>
 */
@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [Icon],
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

  // Icon properties (opcional)
  iconName = input<string | undefined>();
  iconSize = input<Size>('sm');
  iconVariant = input<Variant | null>(null);
  iconAriaLabel = input<string | undefined>();

  describedBy = computed(() => {
    const id = this.controlId();
    const ids: string[] = [];
    if (this.hint() && id) ids.push(`${id}-hint`);
    if (this.error() && id) ids.push(`${id}-err`);
    return ids.join(' ') || null;
  });
}
