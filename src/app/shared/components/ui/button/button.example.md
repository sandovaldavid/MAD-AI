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

### Icono a la izquierda (por defecto)
```html
<app-button 
  variant="primary" 
  iconPath="/assets/icons/icons.svg#plus">
  Agregar Usuario
</app-button>
```

### Icono a la derecha
```html
<app-button 
  variant="outline" 
  iconPath="/assets/icons/icons.svg#arrow-right"
  iconPosition="right">
  Siguiente
</app-button>
```

### Solo icono
```html
<app-button 
  variant="ghost" 
  [iconOnly]="true"
  iconPath="/assets/icons/icons.svg#settings"
  size="sm">
</app-button>
```

### Iconos con diferentes tamaños
```html
<!-- Pequeño -->
<app-button 
  size="sm" 
  iconPath="/assets/icons/icons.svg#edit">
  Editar
</app-button>

<!-- Mediano -->
<app-button 
  size="md" 
  iconPath="/assets/icons/icons.svg#save">
  Guardar
</app-button>

<!-- Grande -->
<app-button 
  size="lg" 
  iconPath="/assets/icons/icons.svg#trash"
  variant="destructive">
  Eliminar
</app-button>
```

### Ejemplos Prácticos

#### Botones de acción
```html
<app-button 
  variant="primary" 
  iconPath="/assets/icons/icons.svg#user-plus">
  Nuevo Usuario
</app-button>

<app-button 
  variant="outline" 
  iconPath="/assets/icons/icons.svg#search">
  Buscar
</app-button>

<app-button 
  variant="destructive" 
  iconPath="/assets/icons/icons.svg#trash">
  Eliminar
</app-button>
```

#### Botones de navegación
```html
<app-button 
  variant="ghost" 
  iconPath="/assets/icons/icons.svg#arrow-left"
  size="sm">
  Atrás
</app-button>

<app-button 
  variant="primary" 
  iconPath="/assets/icons/icons.svg#arrow-right"
  iconPosition="right">
  Continuar
</app-button>
```

#### Botones con estado
```html
<app-button 
  variant="outline" 
  iconPath="/assets/icons/icons.svg#check"
  [disabled]="!isValid()">
  Confirmar
</app-button>

<app-button 
  variant="secondary" 
  iconPath="/assets/icons/icons.svg#close">
  Cancelar
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
