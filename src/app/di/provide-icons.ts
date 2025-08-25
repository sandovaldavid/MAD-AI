import { Provider } from '@angular/core';
import { ICON_SVG_SET, ICON_REGISTRY_OPTIONS, IconRegistryOptions } from './tokens';
import { ICONS_CORE_OUTLINE } from '@shared/assets/icons/icons.outline';
import { ICONS_CORE_FILLED } from '@shared/assets/icons/icons.filled';

export function provideIcons(opts?: Partial<IconRegistryOptions>): Provider[] {
  return [
    { provide: ICON_SVG_SET, useValue: ICONS_CORE_OUTLINE, multi: true },
    { provide: ICON_SVG_SET, useValue: ICONS_CORE_FILLED, multi: true },
    ...(opts ? [{ provide: ICON_REGISTRY_OPTIONS, useValue: opts }] : []),
  ];
}

/** Helper para features: prefija nombres con un namespace (p.ej. "resources/outline/box") */
export function provideFeatureIcons(
  namespace: string,
  set: Record<string, string>,
  variant?: 'outline' | 'filled'
): Provider[] {
  const prefixed = Object.fromEntries(
    Object.entries(set).map(([k, v]) => [`${variant ? `${variant}/` : ''}${namespace}/${k}`, v])
  );
  return [{ provide: ICON_SVG_SET, useValue: prefixed, multi: true }];
}
