# Sistema de Notificaciones Universal

## Descripción

El sistema de notificaciones universal permite mostrar notificaciones interactivas en cualquier parte de la aplicación, siguiendo los principios de Clean Architecture. Las notificaciones soportan múltiples tipos (success, error, warning, info) y pueden mostrarse en diferentes posiciones de la pantalla.

## Características

- **4 tipos de notificaciones**: Success, Error, Warning, Info
- **6 posiciones configurables**: Top-Left, Top-Center, Top-Right, Bottom-Left, Bottom-Center, Bottom-Right
- **Auto-cierre configurable**: Con duración personalizable
- **Persistentes**: Notificaciones que no se cierran automáticamente
- **Responsive**: Adaptadas para dispositivos móviles
- **Animaciones suaves**: Transiciones de entrada y salida
- **Límite de notificaciones**: Evita saturar la pantalla
- **Clean Architecture**: Implementado siguiendo las mejores prácticas

## Arquitectura

### Domain Layer
- **Entities**: `Notification.entity.ts`
- **Enums**: `NotificationType`, `NotificationPosition`
- **Models**: Interfaces y tipos para notificaciones
- **Repository**: Contrato abstracto `NotificationRepository`

### Application Layer
- **Use Cases**: 
  - `ShowNotificationUseCase`
  - `DismissNotificationUseCase`
  - `GetNotificationsUseCase`

### Infrastructure Layer
- **Repository Implementation**: `NotificationApiRepository`
- **Tokens**: Inyección de dependencias

### Core Layer
- **Service**: `NotificationService` - Interfaz principal para el consumidor

### Presentation Layer
- **Components**: 
  - `NotificationItemComponent` - Notificación individual
  - `NotificationContainerComponent` - Contenedor global
  - `NotificationDemoComponent` - Ejemplo de uso

## Uso Básico

### 1. Inyectar el servicio

```typescript
import { NotificationService } from '@core/services/notification.service';

@Component({...})
export class MyComponent {
    constructor(private notificationService: NotificationService) {}
}
```

### 2. Mostrar notificaciones básicas

```typescript
// Notificación de éxito
this.notificationService.success('¡Éxito!', 'Operación completada correctamente');

// Notificación de error
this.notificationService.error('Error', 'Algo salió mal');

// Notificación de advertencia
this.notificationService.warning('Atención', 'Revisa los datos ingresados');

// Notificación informativa
this.notificationService.info('Información', 'Nueva actualización disponible');
```

### 3. Notificaciones con configuración personalizada

```typescript
import { NotificationType, NotificationPosition } from '@domain/enums/...';

this.notificationService.show({
    type: NotificationType.SUCCESS,
    title: 'Título personalizado',
    message: 'Mensaje personalizado',
    position: NotificationPosition.TOP_LEFT,
    duration: 10000,           // 10 segundos
    autoClose: true,           // Se cierra automáticamente
    showCloseButton: true      // Muestra botón de cerrar
});
```

### 4. Notificaciones en posiciones específicas

```typescript
// Métodos de conveniencia para posiciones
this.notificationService.successTopLeft('Título', 'Mensaje');
this.notificationService.errorTopCenter('Título', 'Mensaje');
this.notificationService.successBottomRight('Título', 'Mensaje');
```

### 5. Notificaciones persistentes

```typescript
this.notificationService.show({
    type: NotificationType.WARNING,
    title: 'Importante',
    message: 'Esta notificación no se cierra automáticamente',
    autoClose: false,
    duration: 0
});
```

## Configuración de Posiciones

### Posiciones Disponibles

| Posición | Enum | Descripción |
|----------|------|-------------|
| Superior Izquierda | `NotificationPosition.TOP_LEFT` | Esquina superior izquierda |
| Superior Centro | `NotificationPosition.TOP_CENTER` | Centro superior |
| Superior Derecha | `NotificationPosition.TOP_RIGHT` | Esquina superior derecha (defecto) |
| Inferior Izquierda | `NotificationPosition.BOTTOM_LEFT` | Esquina inferior izquierda |
| Inferior Centro | `NotificationPosition.BOTTOM_CENTER` | Centro inferior |
| Inferior Derecha | `NotificationPosition.BOTTOM_RIGHT` | Esquina inferior derecha |

## Tipos de Notificación

### Success (Éxito)
- **Color**: Verde (usando variables CSS `--color-successful-*`)
- **Icono**: Checkmark
- **Uso**: Confirmaciones, operaciones exitosas

### Error
- **Color**: Rojo (usando variables CSS `--color-error-*`)
- **Icono**: X circular
- **Uso**: Errores, fallos en operaciones
- **Duración por defecto**: 8 segundos (más tiempo que otras)

### Warning (Advertencia)
- **Color**: Amarillo/Naranja (usando variables CSS `--color-warning-*`)
- **Icono**: Triángulo de advertencia
- **Uso**: Advertencias, confirmaciones requeridas

### Info (Información)
- **Color**: Azul (usando variables CSS `--color-info-*`)
- **Icono**: Información circular
- **Uso**: Información general, tips, actualizaciones

## Integración en Use Cases

```typescript
@Injectable({
    providedIn: 'root',
})
export class LoginUseCase {
    constructor(
        @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository,
        private notificationService: NotificationService
    ) {}

    execute(loginData: LoginRequest): Observable<LoginResponse> {
        return this.authRepository.login(loginData).pipe(
            tap((response) => {
                // Notificación de éxito
                this.notificationService.success(
                    '¡Bienvenido!',
                    `Sesión iniciada exitosamente. Hola ${response.user?.name}!`
                ).subscribe();
            }),
            catchError((error) => {
                // Notificación de error
                this.notificationService.error(
                    'Error de autenticación',
                    'Verifica tus credenciales e intenta nuevamente'
                ).subscribe();
                
                return throwError(() => error);
            })
        );
    }
}
```

## Métodos Disponibles

### NotificationService

| Método | Descripción | Parámetros |
|--------|-------------|------------|
| `success(title, message, options?)` | Notificación de éxito | title, message, opciones |
| `error(title, message, options?)` | Notificación de error | title, message, opciones |
| `warning(title, message, options?)` | Notificación de advertencia | title, message, opciones |
| `info(title, message, options?)` | Notificación informativa | title, message, opciones |
| `show(request)` | Notificación personalizada | CreateNotificationRequest |
| `dismiss(id)` | Cerrar notificación específica | notificationId |
| `getNotifications()` | Obtener notificaciones activas | - |

### Métodos de Conveniencia para Posiciones

| Método | Descripción |
|--------|-------------|
| `successTopLeft(title, message, options?)` | Éxito en superior izquierda |
| `successTopCenter(title, message, options?)` | Éxito en superior centro |
| `successBottomRight(title, message, options?)` | Éxito en inferior derecha |
| `errorTopLeft(title, message, options?)` | Error en superior izquierda |
| `errorTopCenter(title, message, options?)` | Error en superior centro |
| `errorBottomRight(title, message, options?)` | Error en inferior derecha |

## Opciones de Configuración

```typescript
interface CreateNotificationRequest {
    type: NotificationType;           // Tipo de notificación
    title: string;                    // Título
    message: string;                  // Mensaje
    duration?: number;                // Duración en ms (defecto: 5000)
    position?: NotificationPosition;  // Posición (defecto: TOP_RIGHT)
    autoClose?: boolean;              // Auto-cierre (defecto: true)
    showCloseButton?: boolean;        // Botón cerrar (defecto: true)
}
```

## Estilos y Personalización

### Variables CSS Utilizadas

El sistema utiliza las variables CSS definidas en `src/styles.css`:

- **Success**: `--color-successful-*`
- **Error**: `--color-error-*` 
- **Warning**: `--color-warning-*`
- **Info**: `--color-info-*`

### Clases CSS Disponibles

- `.notification-item` - Contenedor principal
- `.notification-success` - Estilo para éxito
- `.notification-error` - Estilo para error
- `.notification-warning` - Estilo para advertencia
- `.notification-info` - Estilo para información

## Responsive

El sistema es completamente responsive:

- **Desktop**: Notificaciones en las posiciones exactas especificadas
- **Mobile**: Notificaciones se ajustan al ancho de la pantalla con márgenes apropiados
- **Tablet**: Comportamiento híbrido según el tamaño de pantalla

## Ejemplo Completo

```typescript
@Component({
    selector: 'app-user-management',
    template: `...`
})
export class UserManagementComponent {
    constructor(private notificationService: NotificationService) {}

    createUser(userData: any) {
        this.userService.create(userData).subscribe({
            next: (user) => {
                this.notificationService.success(
                    'Usuario creado',
                    `El usuario ${user.name} ha sido creado exitosamente`
                );
            },
            error: (error) => {
                this.notificationService.error(
                    'Error al crear usuario',
                    'No se pudo crear el usuario. Intenta nuevamente.'
                );
            }
        });
    }

    showImportantWarning() {
        this.notificationService.show({
            type: NotificationType.WARNING,
            title: 'Acción irreversible',
            message: 'Esta acción no se puede deshacer. ¿Estás seguro?',
            position: NotificationPosition.TOP_CENTER,
            autoClose: false,
            showCloseButton: true
        });
    }
}
```

## Instalación y Setup

1. El sistema ya está configurado en `app.config.ts`
2. El contenedor de notificaciones está incluido en `app.html`
3. Solo necesitas inyectar `NotificationService` donde lo requieras

## Testing

Para probar el sistema, puedes usar el componente de demostración:

```typescript
// En tu ruta o componente de prueba
import { NotificationDemoComponent } from '@presentation/shared/components/notification-demo/notification-demo';
```

Este componente incluye botones para probar todos los tipos y posiciones de notificaciones.
