# Guía de Estructura del Proyecto MAD-AI

## Introducción

Esta guía explica cómo navegar y entender la estructura del proyecto MAD-AI, que implementa Clean Architecture para un frontend Angular que gestiona proyectos informáticos con integración de IA.

## Estructura General

```
MAD-AI/
├── docs/              ← Documentación del proyecto
├── src/
│   ├── app/           ← Código fuente de la aplicación
│   ├── assets/        ← Recursos estáticos
│   └── environments/ ← Configuraciones de entorno
├── angular.json       ← Configuración de Angular
├── package.json       ← Dependencias del proyecto
└── README.md          ← Información básica del proyecto
```

## Navegación por Capas

### 🏗️ Empezar por Domain (Corazón del Negocio)

**Ubicación**: `src/app/domain/`

**¿Qué encontrarás?**

- Modelos de datos (Project, Task, User)
- Enums de estado (ProjectStatus, TaskPriority)
- Entidades con lógica de negocio
- Contratos/interfaces para repositorios

**¿Cuándo usarlo?**

- Al crear nuevos modelos de datos
- Al definir reglas de negocio
- Al establecer enums y constantes del dominio

**Ejemplo de navegación:**

```
domain/
├── models/project.model.ts     ← Estructura del modelo Project
├── enums/project-status.enum.ts ← Estados posibles de un proyecto
├── entities/project.entity.ts   ← Lógica de negocio del proyecto
└── contracts/project.repository.contract.ts ← Interface del repositorio
```

### 🚀 Application (Casos de Uso)

**Ubicación**: `src/app/application/`

**¿Qué encontrarás?**

- Casos de uso específicos (CreateProject, EstimateTaskTime)
- Servicios de aplicación que coordinan múltiples casos de uso
- DTOs para transferir datos entre capas
- Ports (interfaces) para la infraestructura

**¿Cuándo usarlo?**

- Al implementar nueva funcionalidad de negocio
- Al crear APIs internas de la aplicación
- Al definir contratos con servicios externos

**Ejemplo de flujo:**

```typescript
// 1. El usuario quiere crear un proyecto con estimación IA
// 2. Va a: application/use-cases/project/create-project-with-ai.use-case.ts
// 3. Este caso de uso orquesta:
//    - Crear el proyecto (domain)
//    - Llamar al servicio de IA (infrastructure)
//    - Actualizar estimaciones (domain)
```

### 🌐 Infrastructure (Comunicación Externa)

**Ubicación**: `src/app/infrastructure/`

**¿Qué encontrarás?**

- Clientes HTTP para APIs (FastAPI backend)
- Implementaciones de repositorios
- Adaptadores para servicios de IA
- DTOs específicos de APIs externas
- Interceptores HTTP

**¿Cuándo usarlo?**

- Al integrar nuevas APIs
- Al implementar nuevos repositorios
- Al configurar comunicación con servicios externos

**Ejemplo de estructura:**

```
infrastructure/
├── api/
│   ├── project.api.ts          ← Llamadas HTTP para proyectos
│   └── ai-service.api.ts       ← Llamadas al servicio de IA
├── repositories/
│   └── project.repository.ts   ← Implementación del repositorio
└── dto/
    └── project-response.dto.ts ← Formato de respuesta de la API
```

### 🎨 Presentation (Interfaz de Usuario)

**Ubicación**: `src/app/presentation/`

**¿Qué encontrarás?**

- Layouts de la aplicación
- Páginas organizadas por features
- Componentes específicos de cada funcionalidad
- Lógica de presentación y estado de UI

**¿Cuándo usarlo?**

- Al crear nuevas páginas o componentes
- Al modificar la interfaz de usuario
- Al agregar nuevas funcionalidades visuales

**Navegación por features:**

```
presentation/
├── layouts/
│   ├── main-layout/           ← Layout principal con sidebar
│   └── auth-layout/           ← Layout para autenticación
├── pages/
│   ├── project/              ← Todo lo relacionado con proyectos
│   │   ├── project-list/     ← Lista de proyectos
│   │   ├── project-detail/   ← Detalle de proyecto
│   │   └── project-create/   ← Crear proyecto
│   ├── dashboard/            ← Dashboard principal
│   └── ai-insights/          ← Páginas de insights de IA
└── components/               ← Componentes específicos de features
```

### 🔧 Shared (Componentes Reutilizables)

**Ubicación**: `src/app/shared/`

**¿Qué encontrarás?**

- Componentes UI reutilizables (Button, Modal, Input)
- Pipes personalizados (truncate, timeAgo)
- Directivas útiles (clickOutside, autoFocus)
- Utilidades y helpers
- Validadores personalizados

**¿Cuándo usarlo?**

- Al crear componentes que se usan en múltiples lugares
- Al necesitar pipes o directivas personalizadas
- Al agregar utilidades que no son específicas del negocio

### ⚙️ Core (Servicios Globales)

**Ubicación**: `src/app/core/`

**¿Qué encontrarás?**

- Servicio de autenticación
- Servicio de notificaciones
- Guards para protección de rutas
- Interceptores HTTP globales
- Configuraciones de la aplicación

**¿Cuándo usarlo?**

- Al configurar aspectos globales de la aplicación
- Al implementar autenticación y autorización
- Al agregar interceptores o guards

## Flujo de Desarrollo Típico

### 1. Agregar Nueva Funcionalidad

**Orden recomendado:**

1. **Domain**: Define modelos, enums y entidades

    ```typescript
    // domain/models/task.model.ts
    export interface Task {
        id: string;
        name: string;
        status: TaskStatus;
        estimatedHours: number;
    }
    ```

2. **Application**: Crea casos de uso

    ```typescript
    // application/use-cases/task/create-task.use-case.ts
    export class CreateTaskUseCase {
        async execute(taskData: CreateTaskDto): Promise<Task> {
            // Lógica de creación
        }
    }
    ```

3. **Infrastructure**: Implementa comunicación externa

    ```typescript
    // infrastructure/api/task.api.ts
    export class TaskApiClient {
        createTask(task: CreateTaskDto): Observable<TaskResponseDto> {
            return this.http.post<TaskResponseDto>('/api/tasks', task);
        }
    }
    ```

4. **Presentation**: Crea componentes y páginas
    ```typescript
    // presentation/pages/task/task-create/task-create.component.ts
    export class TaskCreateComponent {
        onSubmit() {
            this.createTaskUseCase.execute(this.formData);
        }
    }
    ```

### 2. Modificar Funcionalidad Existente

1. **Identifica la capa**: ¿Es lógica de negocio (Domain/Application) o UI (Presentation)?
2. **Encuentra el archivo**: Usa la estructura por features y responsabilidades
3. **Verifica dependencias**: Asegúrate de que los cambios no rompan otras capas

### 3. Debug y Troubleshooting

**Problemas comunes y dónde buscar:**

- **Error de API**: `infrastructure/api/` y `infrastructure/interceptors/`
- **Lógica de negocio incorrecta**: `domain/` y `application/`
- **Problemas de UI**: `presentation/pages/` o `presentation/components/`
- **Autenticación**: `core/services/auth/`
- **Permisos**: `core/guards/`

## Buenas Prácticas de Navegación

### 1. Buscar por Feature, no por Tipo

❌ **Incorrecto:**

```
"Necesito modificar un componente"
→ Buscar en todos los /components/
```

✅ **Correcto:**

```
"Necesito modificar la creación de proyectos"
→ ir a presentation/pages/project/project-create/
```

### 2. Seguir el Flujo de Dependencias

```
Presentation → Application → Domain
Infrastructure → Application → Domain
```

### 3. Usar la Documentación

Cada capa tiene su documentación específica en `docs/architecture/`:

- `domain-layer.md`
- `application-layer.md`
- `infrastructure-layer.md`
- `presentation-layer.md`
- `shared-layer.md`
- `core-layer.md`

### 4. Convenciones de Nombres

- **Archivos**: `kebab-case.type.ts` (ej: `project-create.component.ts`)
- **Clases**: `PascalCase` (ej: `ProjectCreateComponent`)
- **Interfaces**: `PascalCase` (ej: `Project`)
- **Enums**: `PascalCase` (ej: `ProjectStatus`)
- **Servicios**: `PascalCase + Service` (ej: `ProjectService`)

## Herramientas de Desarrollo

### 1. VS Code Extensions Recomendadas

- **Angular Language Service**: Autocompletado y navegación
- **Angular Snippets**: Snippets útiles para Angular
- **Auto Rename Tag**: Sincroniza tags HTML
- **Bracket Pair Colorizer**: Visualiza brackets anidados
- **GitLens**: Información de Git en el editor

### 2. Comandos Angular CLI Útiles

```bash
# Generar componente en la estructura correcta
ng generate component presentation/pages/project/project-edit

# Generar servicio
ng generate service application/services/project-management

# Generar guard
ng generate guard core/guards/project-access
```

### 3. Scripts de Desarrollo

```bash
# Desarrollo con hot reload
npm run start

# Build de producción
npm run build

# Tests
npm run test

# Lint
npm run lint
```

## Troubleshooting Común

### Problema: "No encuentro dónde está implementada X funcionalidad"

**Solución:**

1. Busca en `presentation/pages/[feature]/`
2. Revisa los casos de uso en `application/use-cases/[feature]/`
3. Verifica la implementación en `infrastructure/`

### Problema: "Necesito agregar una nueva API"

**Solución:**

1. Define la interfaz en `domain/contracts/`
2. Crea el caso de uso en `application/use-cases/`
3. Implementa el cliente en `infrastructure/api/`
4. Agrega DTOs en `infrastructure/dto/`

### Problema: "El componente no se ve bien en diferentes pantallas"

**Solución:**

1. Revisa `shared/components/ui/` para componentes base
2. Usa Tailwind CSS clases responsivas
3. Verifica el layout en `presentation/layouts/`

### Problema: "Los tests fallan después de mis cambios"

**Solución:**

1. Ejecuta tests por capa: Domain → Application → Infrastructure → Presentation
2. Revisa mocks en archivos `.spec.ts`
3. Verifica inyección de dependencias

## Recursos Adicionales

- **Documentación de Angular**: https://angular.dev
- **Clean Architecture**: Documento en `docs/clean-architecture.md`
- **Tailwind CSS**: Para estilos y componentes UI
- **RxJS**: Para manejo de estado reactivo
- **TypeScript**: Para tipado fuerte
