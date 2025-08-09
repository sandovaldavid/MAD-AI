---
description: 'Instructions for Copilot to enforce Clean Architecture, project structure, and code consistency in the MAD-AI Angular project.'
mode: 'agent'
tools: ['codebase', 'editFiles', 'search']
---

# MAD-AI Angular Clean Architecture & Consistency Instructions

## Principles

-   **Clean Architecture**: Enforce strict separation of concerns between layers (Domain, Application, Infrastructure, Presentation).
-   **Domain-Driven Design (DDD)**: Model business logic in the domain layer, using entities, value objects, and repositories.
-   **Layer Boundaries**: Never mix responsibilities across layers. Each layer should only depend on the layer directly below it.
-   **Dependency Rule**: Dependencies always point inward (Presentation → Application → Domain).

## Layer Responsibilities

-   **Domain Layer (`src/app/domain/`)**

    -   Contains entities, enums, value objects, models, and repository interfaces.
    -   No Angular, HTTP, or UI code.
    -   Pure business logic only.

-   **Application Layer (`src/app/application/`)**

    -   Contains use cases, application services, and orchestrates domain logic.
    -   No direct infrastructure or UI dependencies.
    -   Implements business workflows.

-   **Infrastructure Layer (`src/app/infrastructure/`)**

    -   Contains API clients, DTOs, repository implementations, and tokens.
    -   Handles data persistence, external integrations, and technical concerns.
    -   No business logic or UI code.

-   **Presentation Layer (`src/app/presentation/`)**

    -   Contains Angular components, pages, layouts, and UI logic.
    -   Uses services from the application layer.
    -   No direct domain or infrastructure logic.

-   **Shared Layer (`src/app/shared/`)**
    -   Contains reusable UI components and utilities.
    -   No business logic.

## Naming Conventions

-   **Files & Folders**

    -   Use `kebab-case` for folders and files.
    -   Use `PascalCase` for classes, interfaces, and enums.
    -   Use `camelCase` for variables and functions.

-   **Entities/Models**: `UserEntity`, `RoleEntity`, `NotificationEntity`
-   **Repositories**: `user.repository.ts`, `role.repository.ts`
-   **Use Cases**: `create-user.use-case.ts`, `update-role.use-case.ts`
-   **Services**: `auth.service.ts`, `notification.service.ts`
-   **Components**: `user-list.component.ts`, `role-form.component.ts`

## File Organization

-   Group files by feature within each layer.
-   Place related files (entity, repository, use case) in the same feature folder.
-   Avoid deep nesting; keep structure clear and navigable.

## Troubleshooting & Error Handling

-   **Common Issues**

    -   Mixing UI logic with business logic: Move business logic to domain/application layers.
    -   Direct API calls in components: Use application/infrastructure services.
    -   Ambiguous naming: Follow conventions strictly.
    -   Layer boundary violations: Refactor to respect dependencies.

-   **Validation**
    -   Check for correct layer usage before merging code.
    -   Ensure all new files follow naming and organization standards.
    -   Use code reviews to enforce architectural boundaries.

## References

-   See `docs/clean-architecture.md` for detailed architecture overview.
-   See `docs/exemplars.md` for code examples.
-   See `.github/instructions/project-structure.instructions.md` for structure standards.

---

**Always validate changes against these instructions before committing.**
