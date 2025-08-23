# Project Folders Structure Blueprint: MAD-AI

**Generated:** August 22, 2025

---

## Initial Auto-detection Phase

-   **Project Type:** Angular (detected via `angular.json`, `package.json`, strict TypeScript, feature-based UI structure)
-   **Monorepo:** Not detected (single Angular app)
-   **Microservices:** Not detected (single frontend project)
-   **Frontend Components:** Present (feature-based UI, shared components, styles, assets)

---

## 1. Structural Overview

MAD-AI is organized by Clean Architecture principles, with layered separation (Presentation, Application, Domain, Infrastructure, Core, Shared) and feature-based grouping. The rationale is modularity, testability, and extensibility. Cross-cutting concerns are centralized in Core, and reusable assets/components in Shared.

---

## 2. Directory Visualization (Markdown List, Depth 5)

-   MAD-AI/
    -   .angular/
    -   .github/
        -   prompts/
    -   .vscode/
    -   dist/
        -   MAD-AI/
            -   browser/
        -   test-out/
            -   e7aa00b0-fd04-4bbf-a3ce-079155bdf530/
    -   docs/
        -   styles_guide.md
        -   workflow.md
    -   public/
        -   bg-placeholder.jpg
        -   favicon.ico
    -   scripts/
        -   lint-icons.cjs
    -   src/
        -   app/
            -   application/
                -   errors/
                -   facades/
                -   services/
                -   types/
                -   use-cases/
            -   core/
                -   cross-cutting/
                -   guards/
                -   interceptors/
            -   di/
            -   domain/
                -   contracts/
                -   entities/
                -   enums/
                -   errors/
                -   events/
                -   repositories/
                -   value-objects/
            -   infrastructure/
                -   dtos/
                -   errors/
                -   http/
                -   mappers/
                -   repositories/
                -   services/
            -   presentation/
                -   features/
                    -   auth/
                    -   dashboard/
                    -   not-found/
                    -   roles/
                -   layouts/
                -   navigation/
                -   shell/
            -   shared/
                -   assets/
                -   components/
                    -   error-view/
                    -   page-header/
                    -   toast/
                -   types/
                -   ui/
        -   env/
            -   environment.prod.ts
            -   environment.ts
        -   styles/
            -   colors.css
            -   components.css
            -   globals.css
            -   skeleton.css
        -   types/
            -   svg-raw.d.ts
        -   index.html
        -   main.server.ts
        -   main.ts
        -   server.ts
        -   styles.css
        -   test.ts
    -   angular.json
    -   karma.conf.cjs
    -   package-lock.json
    -   package.json
    -   tsconfig.app.json
    -   tsconfig.json
    -   tsconfig.spec.json
    -   README.md

---

## 3. Key Directory Analysis

### src/app/

-   **application/**: Business logic, use cases, facades, error handling, types
-   **core/**: Cross-cutting concerns (guards, interceptors, utilities)
-   **di/**: Dependency injection providers and tokens
-   **domain/**: Domain models, entities, contracts, events, repositories
-   **infrastructure/**: Data access, DTOs, mappers, services
-   **presentation/**: UI features, layouts, navigation, shell
-   **shared/**: Reusable assets, components, types, UI elements

### src/env/

-   Environment configuration files

### src/styles/

-   Global and modular CSS files, color palette, skeleton loaders

### src/types/

-   TypeScript type definitions

### public/

-   Static assets (images, favicon)

### docs/

-   Documentation (style guide, workflow)

### scripts/

-   Utility scripts (icon linting)

---

## 4. File Placement Patterns

-   **Configuration Files**: Root (`angular.json`, `karma.conf.cjs`, `tsconfig*.json`), environment (`src/env/`)
-   **Model/Entity Definitions**: `src/app/domain/entities/`
-   **DTOs**: `src/app/infrastructure/dtos/`
-   **Business Logic**: `src/app/application/services/`, `src/app/application/use-cases/`
-   **Interfaces/Contracts**: `src/app/domain/contracts/`
-   **Test Files**: Co-located with features/components or in output (`dist/test-out/`)
-   **Documentation**: `docs/`, README.md
-   **UI Components**: `src/app/shared/components/`, `src/app/presentation/features/`
-   **Assets**: `public/`, `src/app/shared/assets/`
-   **Styles**: `src/styles/`, `src/app/shared/ui/`

---

## 5. Naming and Organization Conventions

-   **File Naming**: PascalCase for classes/components, camelCase for variables/methods, kebab-case for assets/styles
-   **Folder Naming**: Lowercase, hyphenated for features/components, plural for collections (e.g., `entities/`, `services/`)
-   **Type Indicators**: Suffixes like `.entity.ts`, `.service.ts`, `.facade.ts`, `.guard.ts`, `.dto.ts`
-   **Co-location**: Related files grouped by feature or domain
-   **Cross-cutting Concerns**: Centralized in `core/`

---

## 6. Navigation and Development Workflow

-   **Entry Points**: `src/main.ts` (app bootstrap), `src/app/presentation/` (UI features)
-   **Add New Features**: Create folder in `src/app/presentation/features/` and corresponding logic in `application/`, `domain/`, `infrastructure/`
-   **Extend Functionality**: Add use cases/services in `application/`, entities/contracts in `domain/`, repositories/services in `infrastructure/`
-   **Add Tests**: Co-locate with feature/component or add to output test folder
-   **Modify Configurations**: Update files in root or `src/env/`
-   **Dependency Patterns**: DI via `di/`, imports via path aliases in `tsconfig.json`

-   **Content Statistics**:
    -   Presentation/features: 4 main features
    -   Shared/components: 3 main component groups
    -   Domain/entities: 4 main entities
    -   Infrastructure/repositories: 3 main repositories
    -   Application/facades: 5 facades
    -   Core/guards: 5 guards
    -   Styles: 4 main CSS files

---

## 7. Build and Output Organization

-   **Build Configs**: `angular.json`, `karma.conf.cjs`, scripts in `package.json`
-   **Output Structure**: `dist/` for builds, `dist/test-out/` for test outputs
-   **Environment Builds**: Configs in `src/env/`, production vs. development in `angular.json`

---

## 8. Technology-Specific Organization

-   **Angular**: Feature-based UI, layered architecture, standalone/shared components, strict TypeScript
-   **Node.js**: Scripts in `scripts/`, npm-based build/test

---

## 9. Extension and Evolution

-   **Extension Points**: Add features in `presentation/features/`, new entities/contracts in `domain/`, new services/repositories in `application/` and `infrastructure/`
-   **Scalability**: Structure supports adding new features, breaking down large modules, code splitting via feature folders
-   **Refactoring**: Move logic between layers, update contracts, co-locate related files

---

## 10. Structure Templates

### New Feature Template

```
features/
  new-feature/
    components/
    forms/
    mappers/
    pages/
    new-feature.routes.ts
```

-   Add corresponding use cases/services in `application/`, entities/contracts in `domain/`, repositories/services in `infrastructure/`

### New Component Template

```
components/
  NewComponent/
    new-component.ts
    new-component.html
    new-component.css
    new-component.spec.ts
```

### New Service Template

```
services/
  new-service.service.ts
  new-service.interface.ts
```

-   Register in DI via `di/`

### New Test Structure

```
feature/
  components/
    component.spec.ts
  forms/
    form.spec.ts
```

---

## 11. Structure Enforcement

-   **Validation**: Linting via Angular CLI, strict TypeScript, path aliases
-   **Documentation**: Style guide in `docs/styles_guide.md`, workflow in `docs/workflow.md`, architectural decisions in `Project_Architecture_Blueprint.md`
-   **Evolution**: Update blueprint after major refactors or new feature additions

---

**Maintain this blueprint as the project evolves. Last updated: August 22, 2025.**
