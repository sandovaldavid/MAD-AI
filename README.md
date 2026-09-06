# MAD-AI — Frontend Client

[![Angular](https://img.shields.io/badge/Angular-20.1.6-red?logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Testing](https://img.shields.io/badge/Testing-Karma_%26_Jasmine-purple)](https://karma-runner.github.io/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean_Architecture-brightgreen)](docs/info/diagramas-layers.md)

Cliente web SPA con renderizado del lado del servidor (SSR) construido en **Angular 20**, diseñado para la gestión de usuarios, roles y flujos completos de autenticación con control de acceso basado en roles (RBAC). El proyecto implementa una arquitectura desacoplada en 5 capas con principios de Clean Architecture y Domain-Driven Design (DDD), gestionando el estado de interfaz mediante **Angular Signals**.

---

## 🎯 Propósito del Frontend

El frontend de MAD-AI proporciona un panel administrativo y de usuario para:

1. **Gestión integral del ciclo de autenticación:** Login, registro de cuentas, confirmación de correo electrónico, solicitud de restablecimiento de contraseña, confirmación de token de restablecimiento y cambio de contraseña activa.
2. **Administración de usuarios:** Exploración tabular reactiva de usuarios con filtros combinados (texto, estado, rol, rangos temporales), ordenamiento por columnas, paginación, selección múltiple, barra de acciones en lote y exportación de datos a formatos CSV y PDF.
3. **Gestión de roles y permisos:** Creación, edición, detalle y asignación/desasignación de roles a usuarios con validación de privilegios administrativos (`role.canAccessAdmin()`).
4. **Dashboard y perfil:** Panel inicial tras inicio de sesión con resumen de sesión activa, saludo contextual y navegación rápida.

---

## 🔒 Alcance y Límites del Repositorio

- **Código en este repositorio:** Corresponde **únicamente al cliente frontend** en Angular.
- **Backend:** Los servicios de persistencia, autenticación y API REST (`Backend-MAD-AI API`) pertenecen a un backend externo independiente (desarrollado en Django REST Framework).
- **Contrato de integración:** El frontend consume la API REST bajo el prefijo `/api/v1`. La especificación OpenAPI/Swagger de referencia provista por el backend se encuentra documentada en [docs/api/swagger.json](docs/api/swagger.json) y [docs/api/users.api.md](docs/api/users.api.md).
- **Capturas de pantalla:** Este repositorio no almacena capturas de interfaz estáticas para evitar desincronización con el código activo.

---

## 📊 Estado Real de las Capacidades

| Módulo / Característica             | Estado en Código         | Evidencia en Fuente                                                                                                                                   |
| ----------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticación y Sesión**          | Implementado y funcional | Casos de uso en `src/app/application/use-cases/auth/`, fachada `AuthFacade`, guardias `authGuard`, `noAuthGuard` e interceptor `authInterceptor`.     |
| **Confirmación de Email**           | Implementado y funcional | Vista `VerifyEmail`, caso de uso `ConfirmEmailUseCase` y guardia de ruta `emailConfirmedOnly`.                                                        |
| **Listado de Usuarios**             | Implementado y funcional | Componente `UsersListPage` con filtros avanzados, búsqueda reactiva, ordenamiento, selección múltiple y paginación.                                   |
| **Acciones en Lote (Users)**        | Implementado y funcional | Componente `BulkActionsToolbar` con activación, desactivación, eliminación y exportación de seleccionados.                                            |
| **Exportación CSV / PDF**           | Implementado y funcional | Servicios `ClientExportService` y `ClientExportOptimizedService` con carga dinámica lazy de `papaparse` y `jspdf`.                                    |
| **Gestión de Roles (RBAC)**         | Implementado y funcional | Vistas `RolesList`, `CreateRole`, `RoleDetail`, `UpdateRole`, fachada modular `RolesFacade` y guardia `roleGuard`.                                    |
| **Dashboard**                       | Funcional (Base)         | Vista `Dashboard` con presentación de usuario y rol; acciones secundarias de navegación (perfil, ajustes, ayuda) definidas como placeholders locales. |
| **Visualización Gráfica (ECharts)** | No implementada en UI    | Las dependencias `echarts` y `ngx-echarts` figuran en `package.json`, pero no cuentan con integraciones activas en `src/`.                            |

---

## 🏗️ Arquitectura en Código

El proyecto estructura su código en 5 capas con reglas de dependencia estrictas hacia el interior:

```text
Presentation Layer    ──►  Angular Components, Dumb UI Kit, Guards, Layouts
      │ (depende de)
Application Layer     ──►  Use Cases, Fachadas Reactivas (Signals), Mappers
      │ (depende de)
Domain Layer          ──►  Entidades, Value Objects, Errores de Negocio, Contratos
      ▲ (implementado por)
Infrastructure Layer  ──►  HTTP Clients, Repositorios, Stores (Local Storage), DTOs
      │ (usa)
Core Layer            ──►  Utilidades agnósticas (DateTimeService, LoggerService)
```

### 1. Dominio (`src/app/domain/`)

- **Entidades:** Modelos ricos con identidad y métodos que protegen invariantes de negocio: [`User`](src/app/domain/entities/user.entity.ts), [`Role`](src/app/domain/entities/role.entity.ts), [`Session`](src/app/domain/entities/session.entity.ts), [`Notification`](src/app/domain/entities/notification.entity.ts).
- **Value Objects:** Tipos inmutables con auto-validación estricta: `Email`, `Username`, `Firstname`, `Lastname`, `IsoDatetime`, `LocalTokens`, `UserStatus`, `UserNotificationPreferences`, `ExportFormat`, `ActivityPeriod`.
- **Contratos:** Interfaces que definen los puertos de persistencia y servicios (`auth.contract.ts`, `user.contract.ts`, `role.contract.ts`, `token-store.contract.ts`, etc.).
- **Regla:** Cero dependencias de Angular o librerías externas de infraestructura.

### 2. Aplicación (`src/app/application/`)

- **Casos de Uso:** Cada operación de negocio está encapsulada en una clase con método ejecutor (ej: `LoginUseCase`, `ListUsersUseCase`, `CreateUserUseCase`, `ActivateRoleUseCase`, `AssignRoleToUserUseCase`).
- **Fachadas Reactivas:** Orquestan casos de uso y exponen estado reactivo a la UI mediante **Angular Signals**:
  - [`AuthFacade`](src/app/application/facades/auth.facade.ts): Estado de sesión, usuario autenticado, roles computados y control de carga.
  - [`UsersFacade`](src/app/application/facades/users/): Fachada compuesta (`UserCrudFacade`, `UserListFacade`, `UserStateFacade`, `UserLookupFacade`).
  - [`RolesFacade`](src/app/application/facades/role/): Gestión reactiva de roles y asignaciones.
  - [`NotificationsFacade`](src/app/application/facades/notifications.facade.ts): Notificaciones y mensajes toast.
- **Mapeadores:** Transformación entre entidades de dominio y tipos de aplicación.

### 3. Infraestructura (`src/app/infrastructure/`)

- **HTTP:** Clientes tipados basados en `HttpClient` (`AuthApiClient`, `UserApiClient`, `RoleApiClient`).
- **Interceptor:** [`authInterceptor`](src/app/infrastructure/http/interceptors/auth.interceptor.ts) que inyecta automáticamente el token `Bearer` cuando no ha expirado, maneja respuestas `401` limpiando la sesión local y transforma errores vía `HttpErrorTransformer`.
- **Repositorios:** Implementaciones concretas de los contratos de dominio (`HttpAuthRepository`, `HttpUserRepository`, `HttpRoleRepository`).
- **Almacenamiento Local:** Adaptadores para persistencia en navegador (`LocalStorageTokenStoreService`, `LocalStorageSessionStoreService`).
- **Exportación:** Servicios desacoplados para generación de reportes con importación dinámica diferida de `jspdf` y `papaparse`.

### 4. Presentación (`src/app/presentation/`)

- **Componentes Standalone:** Arquitectura sin NgModules en Angular 20, con detección de cambios `OnPush`.
- **Smart Components (Páginas):** Gestionan navegación e interactúan exclusivamente con las Fachadas de la capa de aplicación.
- **Dumb Components (UI Kit Reutilizable):** Componentes visuales desacoplados en `src/app/presentation/shared/ui/` (`Button`, `Input`, `FormField`, `Icon`, `Toggle`, `Pagination`, `BulkActionsToolbar`, `ConfirmationModal`, `ToastContainer`).
- **Guardias Funcionales:**
  - [`authGuard`](src/app/presentation/services/guards/auth.guard.ts): Protege rutas autenticadas.
  - [`noAuthGuard`](src/app/presentation/services/guards/auth.guard.ts): Evita acceso a login/registro si ya hay sesión activa.
  - [`emailConfirmedOnly`](src/app/presentation/services/guards/email-confirmed.guard.ts): Restringe acceso si el correo no ha sido verificado.
  - [`roleGuard`](src/app/presentation/services/guards/role.guard.ts): Control de acceso por rol requerido o privilegios de administración.

### 5. Inyección de Dependencias (`src/app/di/`)

- Módulos de proveedores (`provideAuth()`, `provideUsers()`, `provideRoles()`, `provideExportServices()`, `provideLogger()`) configurados en `app.config.ts` mediante tokens tipados (`tokens.ts`), garantizando inversión de control.

---

## 🛠️ Stack Tecnológico

| Componente                | Tecnología                                         | Versión                                    |
| ------------------------- | -------------------------------------------------- | ------------------------------------------ |
| **Framework**             | Angular                                            | `20.1.6`                                   |
| **Server-Side Rendering** | Angular SSR + Express                              | `@angular/ssr` `20.0.2`, `express` `5.1.0` |
| **Compilador / Build**    | Angular CLI / Application Builder (Vite + esbuild) | `@angular/build` `20.0.2`                  |
| **Lenguaje**              | TypeScript                                         | `5.8.2`                                    |
| **Estilos**               | Tailwind CSS (v4 PostCSS)                          | `4.1.11`                                   |
| **Gestión de Estado**     | Angular Signals + RxJS                             | Signals nativos, `rxjs` `7.8.0`            |
| **Testing**               | Karma + Jasmine                                    | `karma` `6.4.0`, `jasmine-core` `5.7.0`    |
| **Exportación**           | jsPDF + PapaParse                                  | `jspdf` `3.0.1`, `papaparse` `5.5.3`       |

---

## 📁 Estructura del Proyecto

```text
src/
├── app/
│   ├── application/              # Casos de uso, fachadas reactivas, mappers, tipos
│   │   ├── facades/             # AuthFacade, UsersFacade, RolesFacade, NotificationsFacade
│   │   ├── use-cases/           # Casos de uso por contexto (auth, users, roles, notifications)
│   │   ├── mappers/             # Transformaciones Dominio ↔ Aplicación
│   │   └── errors/              # Transformación unificada de errores
│   ├── domain/                  # Lógica pura e independiente de frameworks
│   │   ├── entities/            # User, Role, Session, Notification
│   │   ├── value-objects/       # Email, Username, IsoDatetime, LocalTokens, etc.
│   │   ├── repositories/        # Contratos de persistencia (business, session, system)
│   │   └── errors/              # Errores de reglas de negocio y validación
│   ├── infrastructure/          # Adaptadores y tecnologías externas
│   │   ├── http/                # Clientes API tipados e interceptor de autenticación
│   │   ├── repositories/        # Implementaciones concretas HTTP de contratos
│   │   ├── services/            # Storage local, exportación (PDF/CSV), notificaciones
│   │   ├── dtos/                # DTOs de entrada/salida de la API
│   │   └── mappers/             # Mappers DTO ↔ Dominio
│   ├── presentation/            # Interfaz de usuario Angular
│   │   ├── pages/               # Páginas/Rutas (auth, dashboard, users, roles, profile)
│   │   ├── shared/ui/           # UI Kit base (button, input, toggle, pagination, modal)
│   │   ├── shell/               # Layouts principales, sidebar, header
│   │   └── services/guards/     # authGuard, noAuthGuard, roleGuard, emailConfirmedOnly
│   ├── core/                    # Servicios transversales técnicos (DateTime, Logger)
│   └── di/                      # Tokens y proveedores de inyección de dependencias
├── env/                         # Configuración de entornos (environment.ts / environment.prod.ts)
└── styles/                      # Sistema de diseño, paleta semántica (colors.css)
```

---

## 🚀 Puesta en Marcha

### Requisitos previos

- **Node.js:** Versión 20 o superior (compatible con Node 20 LTS y 24).
- **Gestor de paquetes:** `pnpm` (el repositorio incluye `pnpm-lock.yaml`) o `npm`.

### Configuración del Entorno

El cliente apunta por defecto al backend local en `http://localhost:8004/api/v1`. Para ajustar la dirección de la API, edite `src/env/environment.ts`:

```typescript
export const environment = {
  production: false,
  API_URL: 'http://localhost:8004/api/v1',
};
```

### Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/sandovaldavid/MAD-AI.git
cd MAD-AI

# 2. Instalar dependencias (con pnpm o npm)
pnpm install

# 3. Iniciar servidor de desarrollo (puerto 4200 por defecto)
pnpm start
```

Navegue en su navegador a `http://localhost:4200`.

---

## 📜 Comandos Disponibles

| Comando                        | Descripción                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `pnpm start`                   | Inicia el servidor de desarrollo local con recarga en caliente (`ng serve`).            |
| `pnpm run build`               | Compila la aplicación para producción con soporte SSR (`ng build`).                     |
| `pnpm run watch`               | Compila en modo desarrollo con observación de cambios.                                  |
| `pnpm run serve:ssr`           | Ejecuta el servidor Node Express con los bundles SSR generados.                         |
| `pnpm test`                    | Ejecuta las pruebas unitarias e integración en modo interactivo con Karma.              |
| `pnpm run test:ci`             | Ejecuta la suite de pruebas unitarias una sola vez en modo headless (`ChromeHeadless`). |
| `pnpm run test:domain`         | Ejecuta únicamente las pruebas unitarias de la capa de dominio.                         |
| `pnpm run test:application`    | Ejecuta únicamente las pruebas de casos de uso y fachadas.                              |
| `pnpm run test:infrastructure` | Ejecuta las pruebas de clientes HTTP y repositorios.                                    |
| `pnpm run test:core`           | Ejecuta las pruebas de los servicios transversales de core.                             |
| `pnpm run format:check`        | Verifica el formateo de código con Prettier sin aplicar cambios.                        |
| `pnpm run format`              | Aplica correcciones de formato con Prettier en `src/`.                                  |
| `pnpm run icons:lint`          | Valida el uso correcto de iconos SVG en el proyecto.                                    |
| `pnpm run quality`             | Ejecuta la batería de calidad (formato, iconos y pruebas en CI).                        |

---

## 🧪 Estrategia de Pruebas

El repositorio implementa pruebas automatizadas organizadas por capa arquitectónica, utilizando **Karma y Jasmine** como framework oficial de ejecución:

- **Pruebas de Dominio:** Pruebas unitarias puras sin dependencias de frameworks ni mocks sobre entidades (`User`, `Role`, `Session`, `Notification`) y Value Objects.
- **Pruebas de Aplicación:** Pruebas de orquestación sobre casos de uso y fachadas utilizando espías y mocks de puertos/contratos.
- **Pruebas de Infraestructura:** Pruebas de clientes API y repositorios simulando llamadas HTTP mediante `HttpClientTestingModule` y validación de mappers DTO.
- **Pruebas de Presentación:** Pruebas de componentes y guardias funcionales con `TestBed` de Angular.
- **Pruebas E2E (Contenedor):** La configuración E2E está desacoplada en `Dockerfile.cypress` para ejecutarse en contenedores aislados mediante `npm run docker:test:e2e`.

---

## 📚 Documentación Interna de Referencia

Para profundizar en las decisiones de diseño y convenciones del proyecto, consulte los documentos en `docs/`:

- **[Diagramas y Flujo por Capas](docs/info/diagramas-layers.md)**
- **[Guía de Capa de Dominio](docs/info/guide-domain.md)**
- **[Guía de Capa de Aplicación](docs/info/guide-application.md)**
- **[Guía de Capa de Infraestructura](docs/info/guide-infrastructure.md)**
- **[Guía de Capa de Presentación](docs/info/guide-presentation.md)**
- **[Guía de Estilos y Diseño](docs/info/guide-styles.md)**
- **[Guía de Implementación de Pruebas](docs/info/guide-test-implementation.md)**
- **[Especificación Swagger de API Backend](docs/api/swagger.json)**
- **[Contrato de Endpoints de Usuarios](docs/api/users.api.md)**

---

## 📄 Licencia y Autoría

Desarrollado por [David Sandoval](https://github.com/sandovaldavid). Proyecto de código abierto disponible como referencia arquitectónica y portafolio técnico.
