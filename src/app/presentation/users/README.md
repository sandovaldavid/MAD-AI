# 📋 Rutas del Módulo de Usuarios

Este archivo documenta la estructura de rutas del módulo de gestión de usuarios.

## 🗂️ Estructura de Rutas

### Ruta Base: `/users`

| Ruta                 | Componente     | Descripción                                      | Estado          |
| -------------------- | -------------- | ------------------------------------------------ | --------------- |
| `/users`             | Dashboard      | Dashboard principal con estadísticas de usuarios | ✅ Implementado |
| `/users/dashboard`   | Dashboard      | Alias para el dashboard principal                | ✅ Implementado |
| `/users/list`        | UserList       | Lista completa de usuarios del sistema           | 🚧 Pendiente    |
| `/users/create`      | UserCreate     | Formulario para crear nuevos usuarios            | 🚧 Pendiente    |
| `/users/edit/:id`    | UserEdit       | Editar información de usuario existente          | 🚧 Pendiente    |
| `/users/profile/:id` | UserProfile    | Ver perfil detallado de usuario                  | 🚧 Pendiente    |
| `/users/roles`       | RoleManagement | Gestión de roles y permisos                      | 🚧 Pendiente    |

## 🚀 Rutas Implementadas

### Dashboard Principal (`/users`)

-   **Componente**: `Dashboard`
-   **Alias**: También disponible en `/users/dashboard`
-   **Características**:
    -   Estadísticas de usuarios (total, activos, inactivos)
    -   Gráficos y métricas generales
    -   Acciones rápidas
-   **Título**: "Dashboard de Usuarios"

## 🛠️ Configuración

### Lazy Loading

Todas las rutas del módulo de usuarios utilizan lazy loading para optimizar el rendimiento:

```typescript
{
    path: 'users',
    loadChildren: () =>
        import('@presentation/users/users.routes').then((m) => m.USER_MODULE_ROUTES),
    title: 'Gestión de Usuarios',
}
```

### Títulos Dinámicos

Cada ruta tiene configurado un título específico que se muestra en:

-   Pestaña del navegador
-   Breadcrumbs del sistema
-   Headers de página

## 📱 Navegación

### Acceso desde el Layout Principal

Las rutas de usuarios están disponibles bajo el layout principal protegido por autenticación:

```
/auth/login → /users/dashboard
```

### Redirecciones

-   **Rutas no encontradas** → `/users` (dashboard principal)
-   **Acceso directo**: `/users` carga inmediatamente el dashboard

## 🔐 Seguridad

-   Todas las rutas están protegidas por `AuthGuard`
-   Se requiere autenticación válida para acceder
-   Los permisos específicos se validarán a nivel de componente

## 🎯 Próximos Pasos

Para activar las rutas comentadas, implementar los siguientes componentes:

1. **UserList**: Lista con filtros, búsqueda y paginación
2. **UserCreate**: Formulario reactivo con validaciones
3. **UserEdit**: Edición de usuarios existentes
4. **UserProfile**: Vista detallada de perfil
5. **RoleManagement**: Gestión completa de roles

## 📚 Ejemplos de Uso

```typescript
// Navegación programática
router.navigate(['/users']); // Directo al dashboard
router.navigate(['/users/dashboard']); // Alias del dashboard
router.navigate(['/users/edit', userId]);
router.navigate(['/users/profile', userId]);

// RouterLink en templates
<a routerLink="/users">Dashboard</a>
<a routerLink="/users/dashboard">Dashboard (alias)</a>
<a [routerLink]="['/users/edit', user.id]">Editar</a>
```
