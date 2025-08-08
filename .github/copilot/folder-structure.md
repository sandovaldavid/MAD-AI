# Project Folders Structure Blueprint

**Generated:** August 8, 2025

---

## 1. Structural Overview

This Angular project is organized by architectural layers and features, following Clean Architecture principles. The main organization is:
- **By Layer:** `application`, `core`, `domain`, `infrastructure`, `presentation`, `shared`
- **By Feature:** Feature folders within layers (e.g., `auth`, `dashboard`, `users-module`)
- **Separation of Concerns:** Domain logic, infrastructure, UI, and shared components are clearly separated
- **Modularity:** Supports scalable development and easy extension

---

## 2. Directory Visualization (Markdown List, Depth 5)

- src/
  - app/
    - application/
      - use-cases/
        - auth/
        - notification/
        - role/
        - user/
    - core/
      - guards/
      - interceptors/
      - services/
    - domain/
      - entities/
      - enums/
      - models/
      - repositories/
      - ui/
    - infrastructure/
      - api/
      - dto/
      - repositories/
      - tokens/
    - presentation/
      - auth/
        - components/
        - pages/
      - dashboard/
        - dashboard.css
        - dashboard.html
        - dashboard.spec.ts
        - dashboard.ts
      - layouts/
        - auth-layout/
        - main-layout/
      - secured/
      - users-module/
        - components/
        - icons/
        - pages/
    - shared/
      - components/
        - auth-loading/
        - header/
        - notification/
        - sidebar/
        - ui/
  - env/
    - environment.prod.ts
    - environment.ts
  - styles/
    - colors.css
    - components.css
    - globals.css
  - index.html
  - main.server.ts
  - main.ts
  - server.ts
  - styles.css

---

## 3. Key Directory Analysis

- **application/use-cases/**: Business workflows, organized by feature
- **core/services/**: Cross-cutting services (auth, notification, theme, etc.)
- **domain/entities/**: Domain models (User, Role, Notification)
- **domain/repositories/**: Abstract repository interfaces
- **infrastructure/repositories/**: Concrete repository implementations
- **presentation/**: Feature-based UI modules and components
- **shared/components/**: Reusable UI elements
- **env/**: Environment-specific configuration files
- **styles/**: Global and component-level CSS

---

## 4. File Placement Patterns

- **Configuration Files**: `env/` for environment configs, root for global configs
- **Model/Entity Definitions**: `domain/entities/`, DTOs in `infrastructure/dto/`
- **Business Logic**: Services in `core/services/`, use-cases in `application/use-cases/`
- **Interface Definitions**: `domain/repositories/` for abstractions
- **Test Files**: Spec files alongside components/services, e.g., `dashboard.spec.ts`
- **Documentation Files**: Feature/module READMEs, API docs in `docs/api/`

---

## 5. Naming and Organization Conventions

- **File Naming**: PascalCase for classes, camelCase for variables/methods, kebab-case for files
- **Folder Naming**: Singular for entities/models, plural for features/modules
- **Namespace/Module Patterns**: Folders map to import paths, feature encapsulation
- **Organizational Patterns**: Code co-location by feature and layer, shared components in `shared/`

---

## 6. Navigation and Development Workflow

- **Entry Points**: `main.ts` (app bootstrap), `app.ts` (root component)
- **Adding Features**: Create new folder in `application/use-cases/` and `presentation/`
- **Extending Functionality**: Add services to `core/services/`, repositories to `domain/infrastructure`
- **Adding Tests**: Place spec files next to implementation
- **Modifying Configs**: Edit files in `env/` or root
- **Dependency Patterns**: DI registration in `infrastructure/tokens/`, imports follow folder structure

---

## 7. Build and Output Organization

- **Build Configs**: `angular.json`, `tsconfig.json` at root
- **Output Structure**: Compiled files in `dist/` (not shown)
- **Environment Builds**: `env/` for dev/prod configs

---

## 8. Technology-Specific Organization

- **Angular**: Feature-based modules, DI via providers, OnPush change detection, RxJS for state
- **TypeScript**: Strong typing, interfaces, generics
- **CSS**: Global and component styles in `styles/`

---

## 9. Extension and Evolution

- **Extension Points**: Add new features by creating folders in `application/use-cases/` and `presentation/`
- **Scalability**: Structure supports adding new modules, breaking down large features
- **Refactoring**: Move files between layers/features as needed, update imports

---

## 10. Structure Templates

### New Feature Template
- application/use-cases/[feature]/
- domain/entities/[Feature]Entity.ts
- domain/repositories/[feature].repository.ts
- infrastructure/repositories/[feature].repository.impl.ts
- presentation/[feature]/components/
- presentation/[feature]/pages/
- shared/components/[feature]/

### New Component Template
- presentation/[feature]/components/[Component]/
  - [component].ts
  - [component].html
  - [component].css
  - [component].spec.ts

### New Service Template
- core/services/[service].service.ts
- infrastructure/tokens/[service].providers.ts

### New Test Structure
- [feature]/[component].spec.ts
- core/services/[service].service.spec.ts

---

## 11. Structure Enforcement

- **Validation**: Angular CLI, TypeScript, and linting enforce structure
- **Documentation**: Structure changes documented in module/feature READMEs and docs/
- **Evolution History**: Major changes tracked in docs/ and version control

---

**Maintain this blueprint as the project evolves. Last updated: August 8, 2025.**

