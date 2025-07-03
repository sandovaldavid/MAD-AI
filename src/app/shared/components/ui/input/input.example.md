# Input Component - Ejemplo de Uso

## Importación

```typescript
import { InputComponent } from '@/shared/components/ui';
```

## Uso Básico

```html
<app-input 
    [label]="'Nombre de usuario'"
    [placeholder]="'Ingresa tu nombre'"
    [value]="username()"
    (valueChange)="username.set($event)"
/>
```

## Características

- **CSS Puro**: No utiliza divs adicionales para indicadores visuales
- **Estados de Foco**: Manejados completamente con CSS usando pseudo-clases `:focus`
- **Animaciones Suaves**: Transiciones nativas con CSS
- **Accesibilidad Completa**: ARIA labels, focus management y soporte para lectores de pantalla
- **Modo Oscuro**: Soporte automático con Tailwind CSS

## Ejemplos Avanzados

### Input con validación de error
```html
<app-input 
    [label]="'Email'"
    [type]="'email'"
    [placeholder]="'usuario@ejemplo.com'"
    [value]="email()"
    [variant]="'error'"
    [errorMessage]="'El email no es válido'"
    [required]="true"
    (valueChange)="email.set($event)"
/>
```

### Input con texto de ayuda
```html
<app-input 
    [label]="'Contraseña'"
    [type]="'password'"
    [helperText]="'Mínimo 8 caracteres, incluye números y símbolos'"
    [minLength]="8"
    [required]="true"
    [value]="password()"
    (valueChange)="password.set($event)"
/>
```

### Input de éxito
```html
<app-input 
    [label]="'Nombre de usuario'"
    [value]="'usuario_disponible'"
    [variant]="'success'"
    [helperText]="'Nombre de usuario disponible'"
    [readonly]="true"
/>
```

### Diferentes tamaños
```html
<!-- Pequeño -->
<app-input 
    [size]="'sm'"
    [placeholder]="'Input pequeño'"
/>

<!-- Mediano (por defecto) -->
<app-input 
    [size]="'md'"
    [placeholder]="'Input mediano'"
/>

<!-- Grande -->
<app-input 
    [size]="'lg'"
    [placeholder]="'Input grande'"
/>
```

### Input deshabilitado
```html
<app-input 
    [label]="'Campo deshabilitado'"
    [value]="'No se puede editar'"
    [disabled]="true"
/>
```

## Propiedades Disponibles

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `value` | `string` | `''` | Valor del input |
| `type` | `InputType` | `'text'` | Tipo de input (text, email, password, etc.) |
| `placeholder` | `string` | `''` | Texto de placeholder |
| `label` | `string` | `''` | Etiqueta del input |
| `helperText` | `string` | `''` | Texto de ayuda |
| `errorMessage` | `string` | `''` | Mensaje de error |
| `disabled` | `boolean` | `false` | Si el input está deshabilitado |
| `required` | `boolean` | `false` | Si el input es requerido |
| `readonly` | `boolean` | `false` | Si el input es solo lectura |
| `size` | `InputSize` | `'md'` | Tamaño del input (sm, md, lg) |
| `variant` | `InputVariant` | `'default'` | Variante visual (default, error, success) |
| `id` | `string` | `''` | ID del input (se genera automáticamente si no se proporciona) |
| `name` | `string` | `''` | Nombre del input para formularios |
| `autocomplete` | `string` | `''` | Atributo autocomplete |
| `maxLength` | `number` | `undefined` | Longitud máxima |
| `minLength` | `number` | `undefined` | Longitud mínima |
| `pattern` | `string` | `''` | Patrón de validación regex |

## Eventos

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `valueChange` | `string` | Se emite cuando cambia el valor |
| `blur` | `void` | Se emite cuando pierde el foco |
| `focus` | `void` | Se emite cuando gana el foco |
| `enter` | `void` | Se emite cuando se presiona Enter |

## Uso con Reactive Forms

```typescript
import { FormControl, FormGroup, Validators } from '@angular/forms';

export class MyComponent {
    form = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });

    getErrorMessage(controlName: string): string {
        const control = this.form.get(controlName);
        if (control?.hasError('required')) {
            return 'Este campo es requerido';
        }
        if (control?.hasError('email')) {
            return 'El email no es válido';
        }
        if (control?.hasError('minlength')) {
            return 'Mínimo 8 caracteres';
        }
        return '';
    }
}
```

```html
<form [formGroup]="form">
    <app-input 
        [label]="'Email'"
        [type]="'email'"
        [value]="form.get('email')?.value || ''"
        [variant]="form.get('email')?.invalid && form.get('email')?.touched ? 'error' : 'default'"
        [errorMessage]="getErrorMessage('email')"
        [required]="true"
        (valueChange)="form.get('email')?.setValue($event)"
    />
    
    <app-input 
        [label]="'Contraseña'"
        [type]="'password'"
        [value]="form.get('password')?.value || ''"
        [variant]="form.get('password')?.invalid && form.get('password')?.touched ? 'error' : 'default'"
        [errorMessage]="getErrorMessage('password')"
        [required]="true"
        (valueChange)="form.get('password')?.setValue($event)"
    />
</form>
```

## Accesibilidad

El componente incluye características de accesibilidad:

- Labels asociados correctamente con inputs
- Atributos ARIA apropiados
- Soporte para lectores de pantalla
- Indicadores visuales de foco
- Soporte para modo de alto contraste
- Navegación por teclado

## Modo Oscuro

El componente soporta automáticamente el modo oscuro usando las clases `dark:` de Tailwind CSS.
