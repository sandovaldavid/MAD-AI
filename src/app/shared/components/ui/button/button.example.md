# Button Component - Documentación

## Importación

```typescript
import { Button } from '@/shared/components/ui/button';
```

## Uso Básico

```html
<app-button (clicked)="handleClick()">
    Click me
</app-button>
```

## Características

- **Modern Angular**: Uso de signals, standalone components y control flow nativo
- **5 Variantes**: Primary, Secondary, Outline, Ghost, Destructive
- **3 Tamaños**: Small, Medium, Large
- **Estados Avanzados**: Normal, Disabled, Loading
- **Accesibilidad**: Focus rings, ARIA support, keyboard navigation
- **Modo Oscuro**: Soporte automático con clases Tailwind CSS

## Variantes Disponibles

### Primary (Por defecto)
```html
<app-button variant="primary">Primary Button</app-button>
```

### Secondary
```html
<app-button variant="secondary">Secondary Button</app-button>
```

### Outline
```html
<app-button variant="outline">Outline Button</app-button>
```

### Ghost
```html
<app-button variant="ghost">Ghost Button</app-button>
```

### Destructive
```html
<app-button variant="destructive">Delete</app-button>
```

## Uso con Iconos SVG

### Icono a la izquierda
```html
<app-button variant="primary">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5v15m7.5-7.5h-15"/>
  </svg>
  Agregar Usuario
</app-button>
```

### Icono a la derecha
```html
<app-button variant="outline">
  Siguiente
  <svg icon-right viewBox="0 0 24 24" fill="currentColor">
    <path d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
  </svg>
</app-button>
```

### Solo icono
```html
<app-button variant="ghost" [iconOnly]="true" size="sm">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m0 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m-9.75 0h9.75"/>
  </svg>
</app-button>
```

### Usando SVG desde sprite
```html
<app-button variant="primary">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <use href="/assets/icons/icons.svg#user-plus"></use>
  </svg>
  Agregar Usuario
</app-button>
```

### Iconos con diferentes tamaños
Los tamaños se ajustan automáticamente según el tamaño del botón:

```html
<!-- Pequeño: iconos de 16px (w-4 h-4) -->
<app-button size="sm">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
  </svg>
  Editar
</app-button>

<!-- Mediano: iconos de 20px (w-5 h-5) -->
<app-button size="md">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m-6 3.75h6m-3 2.25h.007v.008H12v-.008z"/>
  </svg>
  Guardar
</app-button>

<!-- Grande: iconos de 24px (w-6 h-6) -->
<app-button size="lg" variant="destructive">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
  </svg>
  Eliminar
</app-button>
```

### Ejemplos Prácticos

#### Botones de acción
```html
<app-button variant="primary">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"/>
  </svg>
  Nuevo Usuario
</app-button>

<app-button variant="outline">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
  </svg>
  Buscar
</app-button>

<app-button variant="destructive">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
  </svg>
  Eliminar
</app-button>
```

#### Botones de navegación
```html
<app-button variant="ghost">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.75 19.5L8.25 12l7.5-7.5"/>
  </svg>
  Anterior
</app-button>

<app-button variant="primary">
  Continuar
  <svg icon-right viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
  </svg>
</app-button>
```

#### Botones con estado
```html
<app-button variant="outline" [disabled]="!isValid()">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.5 12.75l6 6 9-13.5"/>
  </svg>
  Confirmar
</app-button>

<app-button variant="secondary">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18L18 6M6 6l12 12"/>
  </svg>
  Cancelar
</app-button>
```

#### Botones solo con icono
```html
<!-- Configuración -->
<app-button variant="ghost" [iconOnly]="true" size="sm">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
</app-button>

<!-- Eliminar -->
<app-button variant="destructive" [iconOnly]="true" size="sm">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
  </svg>
</app-button>
```

## Tamaños

```html
<!-- Pequeño -->
<app-button size="sm">Small</app-button>

<!-- Mediano (por defecto) -->
<app-button size="md">Medium</app-button>

<!-- Grande -->
<app-button size="lg">Large</app-button>
```

## Estados

### Deshabilitado
```html
<app-button [disabled]="true">Disabled</app-button>
```

### Loading
```html
<app-button [loading]="isLoading()">
    @if (isLoading()) {
        Guardando...
    } @else {
        Guardar
    }
</app-button>
```

### Full Width
```html
<app-button [fullWidth]="true">Full Width Button</app-button>
```

### Icon Only
```html
<app-button [iconOnly]="true" size="sm">
    <svg>...</svg>
</app-button>
```

## Tipos de Botón

```html
<!-- Button (por defecto) -->
<app-button type="button">Button</app-button>

<!-- Submit -->
<app-button type="submit" variant="primary">Submit</app-button>

<!-- Reset -->
<app-button type="reset" variant="outline">Reset</app-button>
```

## Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `variant` | `ButtonVariant` | `'primary'` | Variante visual del botón |
| `size` | `ButtonSize` | `'md'` | Tamaño del botón |
| `type` | `ButtonType` | `'button'` | Tipo HTML del botón |
| `disabled` | `boolean` | `false` | Si el botón está deshabilitado |
| `loading` | `boolean` | `false` | Si el botón muestra estado de carga |
| `fullWidth` | `boolean` | `false` | Si el botón ocupa todo el ancho disponible |
| `iconOnly` | `boolean` | `false` | Si el botón contiene solo un icono |
| `iconPath` | `string` | `undefined` | Ruta al sprite SVG con formato `/path/to/icons.svg#icon-id` |
| `iconPosition` | `IconPosition` | `'left'` | Posición del icono relativa al texto |
| `iconSize` | `string` | `'16'` | Tamaño del icono en píxeles (se ajusta automáticamente por tamaño del botón) |

## Eventos

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `clicked` | `void` | Se emite cuando se hace clic en el botón (si no está deshabilitado) |

## Tipos TypeScript

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset';
type IconPosition = 'left' | 'right';
```

## Iconos Disponibles

El archivo `/assets/icons/icons.svg` incluye los siguientes iconos:

### Iconos de Usuario
- `user` - Icono de usuario
- `user-plus` - Agregar usuario

### Iconos de Acción
- `plus` - Agregar/Crear
- `edit` - Editar
- `trash` - Eliminar
- `save` - Guardar

### Iconos de Navegación
- `arrow-left` - Flecha izquierda
- `arrow-right` - Flecha derecha
- `chevron-down` - Flecha hacia abajo

### Iconos de Estado
- `check` - Confirmación
- `close` - Cerrar
- `warning` - Advertencia
- `info` - Información

### Iconos de Configuración
- `settings` - Configuración
- `search` - Buscar

## Ejemplos Avanzados

### Formulario con Botones de Acción
```html
<div class="flex gap-2">
  <app-button 
    variant="outline" 
    iconPath="/assets/icons/icons.svg#close"
    (clicked)="cancel()">
    Cancelar
  </app-button>
  
  <app-button 
    variant="primary" 
    iconPath="/assets/icons/icons.svg#save"
    [loading]="isSaving()"
    type="submit">
    Guardar
  </app-button>
</div>
```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';
```

## Ejemplos Avanzados

### Botón con Icono
```html
<app-button variant="primary" (clicked)="save()">
    <svg class="w-4 h-4 mr-2">...</svg>
    Guardar
</app-button>
```

### Botón de Confirmación
```html
<app-button 
    variant="destructive" 
    [loading]="isDeleting()" 
    (clicked)="confirmDelete()">
    @if (isDeleting()) {
        Eliminando...
    } @else {
        Eliminar
    }
</app-button>
```

### Grupo de Botones
```html
<div class="flex gap-2">
    <app-button variant="outline" (clicked)="cancel()">Cancelar</app-button>
    <app-button variant="primary" (clicked)="save()">Guardar</app-button>
</div>
```

### Formulario
```html
<form (ngSubmit)="onSubmit()">
    <!-- campos del formulario -->
    
    <div class="flex justify-end gap-3 mt-6">
        <app-button type="reset" variant="ghost">Limpiar</app-button>
        <app-button type="submit" variant="primary" [disabled]="!form.valid">
            Enviar
        </app-button>
    </div>
</form>
```

## Accesibilidad

El componente incluye:

- **Focus Management**: Anillos de foco claramente visibles
- **Keyboard Support**: Navegación completa por teclado
- **Screen Reader**: Soporte completo para lectores de pantalla
- **Disabled State**: Estados deshabilitados semánticamente correctos
- **ARIA Attributes**: Atributos ARIA apropiados cuando es necesario

## Modo Oscuro

El componente soporta automáticamente el modo oscuro:

- Los colores se ajustan automáticamente con las clases `dark:`
- Los focus rings se adaptan al background oscuro
- Todos los estados mantienen el contraste apropiado

## Personalización

Para personalizar los estilos, modifica las clases CSS en `button.css`:

```css
.btn-primary {
    @apply bg-primary-500 text-white 
           hover:bg-primary-600 
           focus:ring-primary-500;
}
```

## Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
    let component: Button;
    let fixture: ComponentFixture<Button>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [Button]
        });
        fixture = TestBed.createComponent(Button);
        component = fixture.componentInstance;
    });

    it('should emit clicked event when clicked', () => {
        spyOn(component.clicked, 'emit');
        const button = fixture.nativeElement.querySelector('button');
        
        button.click();
        
        expect(component.clicked.emit).toHaveBeenCalled();
    });
});
```

## Migración del Sistema Antiguo

### Antes (sistema de iconPath y iconPosition)
```html
<!-- Sistema anterior -->
<app-button 
  variant="primary" 
  iconPath="/assets/icons/icons.svg#plus"
  iconPosition="left">
  Agregar Usuario
</app-button>

<app-button 
  variant="outline" 
  iconPath="/assets/icons/icons.svg#refresh">
  Actualizar
</app-button>
```

### Después (sistema de slots con ng-content)
```html
<!-- Nuevo sistema con slots -->
<app-button variant="primary">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4.5v15m7.5-7.5h-15"/>
  </svg>
  Agregar Usuario
</app-button>

<app-button variant="outline">
  <svg icon-left viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
  </svg>
  Actualizar
</app-button>
```

## Ventajas del Nuevo Sistema

### ✅ Flexibilidad Total
- Puedes usar cualquier SVG directamente
- No dependes de un sprite específico
- Control total sobre el contenido del icono

### ✅ Mejor Performance
- No se renderizan iconos cuando no se usan
- CSS más limpio y específico
- Menor complejidad en el componente

### ✅ Mejor Developer Experience
- Autocompletado en el IDE
- Tipado más estricto
- Debugging más fácil

### ✅ Design System Friendly
- Iconos se pueden reutilizar como componentes
- Fácil mantenimiento de la biblioteca de iconos
- Consistencia automática

## Consideraciones de Rendimiento

### currentColor
Los iconos usan `fill="currentColor"` para heredar automáticamente el color del texto del botón, lo que garantiza consistencia sin CSS adicional.

### Tamaños Automáticos
Los tamaños de iconos se ajustan automáticamente según el tamaño del botón usando clases de Tailwind CSS:
- `btn-sm`: iconos w-4 h-4 (16px)
- `btn-md`: iconos w-5 h-5 (20px)  
- `btn-lg`: iconos w-6 h-6 (24px)

### Flexibilidad CSS
Puedes sobrescribir estilos específicos directamente en el SVG:
```html
<app-button variant="primary">
  <svg icon-left viewBox="0 0 24 24" fill="red" class="w-8 h-8">
    <!-- Tu SVG aquí -->
  </svg>
  Botón Especial
</app-button>
```
