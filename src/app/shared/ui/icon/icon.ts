import { ChangeDetectionStrategy, Component, computed, Inject, inject, input } from '@angular/core';
import { IconRegistry } from '@core/cross-cutting/utilities/icon-registry.service';
import { ICON_REGISTRY_OPTIONS, IconRegistryOptions } from '@app/di/tokens';
import type { Size, Variant } from '@shared/types/icon';

@Component({
  selector: 'ui-icon',
  imports: [],
  templateUrl: './icon.html',
  styleUrl: './icon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  private registry = inject(IconRegistry);
  constructor(@Inject(ICON_REGISTRY_OPTIONS) private opts: IconRegistryOptions) {}

  name = input.required<string>();
  size = input<Size>('md');
  variant = input<Variant | null>(null);
  ariaLabel = input<string | null>(null);

  svg = computed(() =>
    this.registry.getWithVariant(
      this.name(),
      (this.variant() ?? this.opts.defaultVariant) as Variant
    )
  );

  sizeClass = computed(() => {
    const map: Record<Size, string> = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };
    return map[this.size()];
  });
}
