# Toggle Component

Un componente de interruptor (toggle/switch) reutilizable construido con Angular 20.1.6 y Tailwind CSS, siguiendo las mejores prácticas de la arquitectura MAD-AI.

## Características

- ✅ **Estado**: Activado/Desactivado con estado reactivo usando signals
- ✅ **Tamaños**: `sm`, `md`, `lg` para diferentes contextos
- ✅ **Colores**: Soporte completo para la paleta de colores del proyecto
- ✅ **Accesibilidad**: Cumple con WCAG 2.1 (ARIA, navegación por teclado, contrastes)
- ✅ **Responsive**: Diseño adaptable con soporte para modo oscuro
- ✅ **TypeScript**: Tipado estricto y API moderna de Angular
- ✅ **Testing**: Suite completa de tests unitarios

## API del Componente

### Inputs (Señales)

| Propiedad       | Tipo                   | Valor por defecto | Descripción                              |
| --------------- | ---------------------- | ----------------- | ---------------------------------------- |
| `checked`       | `boolean`              | `false`           | Estado del toggle (activado/desactivado) |
| `disabled`      | `boolean`              | `false`           | Deshabilita la interacción con el toggle |
| `size`          | `'sm' \| 'md' \| 'lg'` | `'md'`            | Tamaño del componente                    |
| `color`         | `ToggleColor`          | `'primary'`       | Color del toggle cuando está activado    |
| `label`         | `string`               | `''`              | Texto de etiqueta (opcional)             |
| `labelPosition` | `'left' \| 'right'`    | `'right'`         | Posición de la etiqueta                  |

### Outputs (Eventos)

| Evento   | Tipo      | Descripción                                 |
| -------- | --------- | ------------------------------------------- |
| `toggle` | `boolean` | Se emite cuando cambia el estado del toggle |

### Tipos de Color

```typescript
type ToggleColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'successful'
  | 'error'
  | 'warning'
  | 'info';
```

## Ejemplos de Uso

### Básico

```typescript
import { Component, signal } from '@angular/core';
import { Toggle } from '@/shared/ui/toggle/toggle';

@Component({
  selector: 'app-example',
  imports: [Toggle],
  template: ` <ui-toggle [checked]="isEnabled()" (toggle)="onToggle($event)"> </ui-toggle> `,
})
export class ExampleComponent {
  readonly isEnabled = signal(false);

  onToggle(value: boolean): void {
    this.isEnabled.set(value);
    console.log('Toggle changed:', value);
  }
}
```

### Con Etiqueta

```typescript
@Component({
  template: `
    <ui-toggle
      [checked]="darkMode()"
      label="Modo oscuro"
      labelPosition="left"
      (toggle)="toggleDarkMode($event)">
    </ui-toggle>
  `,
})
export class SettingsComponent {
  readonly darkMode = signal(false);

  toggleDarkMode(enabled: boolean): void {
    this.darkMode.set(enabled);
    // Lógica para cambiar el tema
  }
}
```

### Diferentes Tamaños y Colores

```typescript
@Component({
  template: `
    <!-- Tamaño pequeño -->
    <ui-toggle size="sm" color="successful" label="Notificaciones" [checked]="notifications()">
    </ui-toggle>

    <!-- Tamaño mediano (por defecto) -->
    <ui-toggle color="primary" label="Sincronización automática" [checked]="autoSync()">
    </ui-toggle>

    <!-- Tamaño grande -->
    <ui-toggle size="lg" color="warning" label="Modo de desarrollo" [checked]="devMode()">
    </ui-toggle>
  `,
})
export class PreferencesComponent {
  readonly notifications = signal(true);
  readonly autoSync = signal(false);
  readonly devMode = signal(false);
}
```

### Estados Especiales

```typescript
@Component({
  template: `
    <!-- Toggle deshabilitado -->
    <ui-toggle
      [checked]="true"
      [disabled]="true"
      label="Función premium (requiere suscripción)"
      color="tertiary">
    </ui-toggle>

    <!-- Toggle de error -->
    <ui-toggle
      [checked]="hasError()"
      color="error"
      label="Alertas de error"
      (toggle)="toggleErrorAlerts($event)">
    </ui-toggle>

    <!-- Toggle de información -->
    <ui-toggle color="info" label="Mostrar ayuda contextual" [checked]="showHelp()"> </ui-toggle>
  `,
})
export class StatusComponent {
  readonly hasError = signal(false);
  readonly showHelp = signal(true);

  toggleErrorAlerts(enabled: boolean): void {
    this.hasError.set(enabled);
  }
}
```

### Integración con Formularios Reactivos

```typescript
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { effect } from '@angular/core';

@Component({
  imports: [Toggle, ReactiveFormsModule],
  template: `
    <form [formGroup]="settingsForm">
      <ui-toggle
        formControlName="emailNotifications"
        label="Notificaciones por email"
        color="primary">
      </ui-toggle>

      <ui-toggle formControlName="pushNotifications" label="Notificaciones push" color="secondary">
      </ui-toggle>
    </form>

    <!-- Toggles controlados por signals -->
    <ui-toggle [checked]="emailEnabled()" (toggle)="emailEnabled.set($event)" label="Emails">
    </ui-toggle>
  `,
})
export class FormExampleComponent {
  readonly settingsForm = this.fb.group({
    emailNotifications: [true],
    pushNotifications: [false],
  });

  readonly emailEnabled = signal(false);

  constructor(private fb: FormBuilder) {
    // Sincronizar signal con form control
    effect(() => {
      const emailControl = this.settingsForm.get('emailNotifications');
      emailControl?.setValue(this.emailEnabled());
    });
  }
}
```

## Paleta de Colores Disponibles

El componente utiliza exclusivamente los colores definidos en `src/styles/colors.css`:

- **`primary`**: Azul principal del sistema
- **`secondary`**: Colores secundarios para elementos de apoyo
- **`tertiary`**: Colores terciarios para acentos
- **`successful`**: Verde para estados de éxito
- **`error`**: Rojo para estados de error
- **`warning`**: Amarillo/naranja para advertencias
- **`info`**: Azul claro para información

## Accesibilidad

El componente está completamente optimizado para accesibilidad:

### ARIA

- `role="switch"` para identificar el componente como interruptor
- `aria-checked` refleja el estado actual
- `aria-disabled` cuando está deshabilitado
- `aria-label` para descripción accesible

### Navegación por Teclado

- **Espacio** o **Enter**: Activa/desactiva el toggle
- **Tab**: Navega hacia el siguiente elemento
- **Shift + Tab**: Navega hacia el elemento anterior

### Indicadores Visuales

- Anillo de enfoque visible al navegar por teclado
- Contrastes de color que cumplen WCAG 2.1 AA
- Soporte para `prefers-reduced-motion`
- Estados hover y active claramente diferenciados

## Estilos y Personalización

### Clases CSS Generadas

El componente genera automáticamente las siguientes clases:

```css
/* Clases base */
.toggle                    /* Contenedor principal */
.toggle__switch            /* Fondo/pista del toggle */
.toggle__thumb             /* Círculo móvil */
.toggle__label             /* Etiqueta de texto */

/* Modificadores de tamaño */
.toggle--sm, .toggle--md, .toggle--lg
.toggle__switch--sm, .toggle__switch--md, .toggle__switch--lg
.toggle__thumb--sm, .toggle__thumb--md, .toggle__thumb--lg

/* Modificadores de color */
.toggle--primary, .toggle--secondary, .toggle--tertiary
.toggle--successful, .toggle--error, .toggle--warning, .toggle--info

/* Modificadores de estado */
.toggle--checked           /* Cuando está activado */
.toggle--disabled          /* Cuando está deshabilitado */
.toggle--focused           /* Cuando tiene el foco */
.toggle__switch--checked   /* Fondo cuando está activado */
.toggle__thumb--checked    /* Posición del thumb cuando está activado */
```

### Modo Oscuro

Todos los estados y colores tienen variantes para modo oscuro usando `dark:` variants de Tailwind CSS.

## Testing

El componente incluye una suite completa de tests que cubren:

- ✅ Renderizado correcto
- ✅ Estados y propiedades por defecto
- ✅ Generación de clases CSS
- ✅ Eventos de click y teclado
- ✅ Accesibilidad (ARIA, tabindex)
- ✅ Estados deshabilitado y enfocado
- ✅ Renderizado de etiquetas

```bash
# Ejecutar tests
npm test -- --include="**/toggle.spec.ts"
```

## Notas de Implementación

### Signals y Reactivity

- Utiliza las nuevas APIs de Angular (signals, input, output)
- Estado reactivo con `computed()` para clases dinámicas
- Optimizado para `OnPush` change detection

### Rendimiento

- Sin re-renderizados innecesarios gracias a signals
- Clases CSS calculadas dinámicamente solo cuando cambian las dependencias
- Transiciones CSS nativas para animaciones fluidas

### Mantenibilidad

- Código modular y bien tipado
- Separación clara entre lógica y presentación
- Documentación completa y ejemplos de uso

Este componente sigue todas las mejores prácticas del proyecto MAD-AI y está listo para uso en producción.
