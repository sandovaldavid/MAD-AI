# Project Folders Structure Blueprint

**Generated:** August 8, 2025

---

## 1. Structural Overview

This Angular project follows Clean Architecture principles, organizing code by layer and feature. The main
organizational strategy is:

- **Layered separation:** domain, application, infrastructure, presentation, core, shared
- **Feature-based grouping:** Each feature (auth, user, resource-management, etc.) has its own subfolders in relevant
  layers
- **Cross-cutting concerns:** Centralized in `core` (services, guards, interceptors)
- **Reusable components:** Located in `shared`

---

## 2. Directory Visualization (Markdown List, Depth 5)

- src/
    - index.html
    - main.ts
    - main.server.ts
    - server.ts
    - styles.css
    - app/
        - app.config.server.ts
        - app.config.ts
        - app.css
        - app.html
        - app.routes.server.ts
        - app.routes.ts
        - app.spec.ts
        - app.ts
        - fontawesome-icons.ts
        - application/
            - use-cases/
                - auth/
                - notification/
                - resource-management/
                - role/
                - user/
        - core/
            - guards/
                - auth.guard.ts
            - interceptors/
                - auth.interceptor.ts
            - services/
                - auth.service.ts
                - breadcrumb.service.ts
                - notification.service.ts
                - sidebar.service.ts
                - theme.service.ts
                - title.service.ts
                - token.service.ts
        - domain/
            - entities/
                - notification.entity.ts
                - role.entity.ts
                - user.entity.ts
                - resource-management/
            - enums/
                - notification.enum.ts
                - role-access-level.enum.ts
                - user_status.enum.ts
            - models/
                - paginated-response.model.ts
                - auth/
                - notification/
                - resource-management/
                - role/
                - user/
            - repositories/
                - auth.repository.ts
                - notification.repository.ts
                - role.repository.ts
                - user.repository.ts
                - resource-management/
            - ui/
                - button.ts
                - input.ts
                - select.ts
        - infrastructure/
            - api/
                - auth.api.ts
                - role.api.ts
                - user.api.ts
                - resource-management/
            - dto/
                - paginated-response.dto.ts
                - resource-management/
                - role/
                - user/
            - repositories/
            - tokens/
        - presentation/
            - auth/
            - dashboard/
            - layouts/
            - profile/
            - resource_management/
            - secured/
            - users/
        - shared/
            - components/
    - env/
        - environment.prod.ts
        - environment.ts
    - styles/
        - colors.css
        - components.css
        - globals.css

---

## 3. Key Directory Analysis

- **application/use-cases/**: Business logic orchestration, grouped by feature
- **core/**: Cross-cutting concerns (services, guards, interceptors)
- **domain/**: Domain entities, enums, models, repositories, UI abstractions
- **infrastructure/**: API clients, DTOs, repository implementations, tokens
- **presentation/**: UI components, views, routing, organized by feature
- **shared/components/**: Reusable UI components
- **env/**: Environment-specific configuration files
- **styles/**: Global and component-level styles

---

## 4. File Placement Patterns

- **Configuration Files**: Root of `src/` (`main.ts`, `main.server.ts`, `server.ts`, `index.html`), `env/` for
  environment configs
- **Model/Entity Definitions**: `domain/entities/`, `domain/models/`, `infrastructure/dto/`
- **Business Logic**: `application/use-cases/`, `core/services/`
- **Interface Definitions**: `domain/repositories/`
- **Test Files**: Suffix `.spec.ts`, placed alongside implementation or in feature folders
- **Documentation Files**: `docs/` for architecture, API, and feature documentation

---

## 5. Naming and Organization Conventions

- **File Naming**: PascalCase for classes/types, camelCase for variables/methods, kebab-case for components, `.spec.ts`
  for tests
- **Folder Naming**: Singular for layers (`domain`, `core`), plural for features (`users`, `roles`), lowercase with
  underscores for multi-word folders
- **Namespace/Module Patterns**: Path aliases in `tsconfig.json` map to folder structure (e.g., `@domain/*` →
  `src/app/domain/*`)
- **Organizational Patterns**: Feature encapsulation, code co-location, cross-cutting concerns centralized in `core`

---

## 6. Navigation and Development Workflow

- **Entry Points**: `main.ts` (browser), `main.server.ts` (SSR), `server.ts` (Express)
- **Adding Features**: Create new subfolders in `application/use-cases/`, `domain/entities/`, `infrastructure/api/`,
  `presentation/`, and `shared/components/`
- **Adding Tests**: Place `.spec.ts` files alongside implementation or in feature folders
- **Configuration Changes**: Modify files in `env/` and root of `src/`
- **Dependency Patterns**: DI registration in Angular modules, repository implementations in
  `infrastructure/repositories/`

- **Content Statistics** (approximate):
    - `application/use-cases/`: 5 feature folders
    - `core/services/`: 7 service files
    - `domain/entities/`: 3 entity files + resource-management folder
    - `infrastructure/api/`: 4 API files + resource-management folder
    - `presentation/`: 7 feature folders
    - `shared/components/`: (count depends on implementation)

---

## 7. Build and Output Organization

- **Build Configuration**: Angular CLI scripts in `package.json`, build options in `angular.json`
- **Output Structure**: Built files output to `dist/` (not shown), SSR output handled by Express
- **Environment-Specific Builds**: Configured via `env/environment.ts` and `env/environment.prod.ts`

---

## 8. Technology-Specific Organization

- **Angular**: Modules, components, services, guards, interceptors, feature-based routing, path aliases for
  maintainability

---

## 9. Extension and Evolution

- **Extension Points**: Add new features by creating subfolders in each layer; add new services in `core/services/`; add
  new components in `shared/components/`
- **Scalability Patterns**: Feature-based grouping supports scaling; code splitting via lazy-loaded modules
- **Refactoring Patterns**: Move logic between layers as needed; update path aliases in `tsconfig.json` for new
  structure

---

## 10. Structure Templates

### New Feature Template

- application/use-cases/[feature]/
- domain/entities/[feature].entity.ts
- domain/models/[feature]/
- domain/repositories/[feature].repository.ts
- infrastructure/api/[feature].api.ts
- infrastructure/dto/[feature]/
- infrastructure/repositories/[feature].repository.impl.ts
- presentation/[feature]/
- shared/components/[feature]-component.ts

### New Component Template

- shared/components/[component-name]/
    - [component-name].component.ts
    - [component-name].component.html
    - [component-name].component.css
    - [component-name].component.spec.ts

### New Service Template

- core/services/[service-name].service.ts
- core/services/[service-name].service.spec.ts

### New Test Structure

- [feature]/[file].spec.ts (alongside implementation)
- shared/components/[component-name]/[component-name].component.spec.ts

---

## 11. Structure Enforcement

- **Validation Tools**: Linting via ESLint/TSLint, Angular CLI build checks
- **Documentation Practices**: Architecture and structure documented in `docs/`; changes tracked in decision records and
  blueprint files
- **Evolution History**: Update this blueprint when major structural changes are made

---

**Maintain this blueprint as the project evolves. Last updated: August 8, 2025.**

