# Project Architecture Blueprint: MAD-AI

**Generated:** August 22, 2025

---

## 1. Architecture Detection and Analysis

### Technology Stack

-   **Frontend:** Angular 20.1.6 (core, forms, router, SSR, CLI, build, compiler)
-   **Language:** TypeScript (ES2022, strict mode)
-   **Reactive:** RxJS 7.8.0
-   **SSR:** Express 5.1.0
-   **Styling:** Tailwind CSS 4.1.11
-   **Visualization:** Chart.js 4.5.0, ng2-charts 8.0.0
-   **Testing:** Jasmine ~5.7.0, Karma ~6.4.0
-   **Other:** Zone.js, FontAwesome, PostCSS

### Architectural Pattern

-   **Primary:** Clean Architecture (layered, dependency inversion, separation of concerns)
-   **Layers:** Presentation → Application → Domain → Infrastructure
-   **Feature-based grouping:** Each feature (auth, user, resource-management, etc.) is modularized
-   **Cross-cutting concerns:** Centralized in `core` (services, guards, interceptors)
-   **Reusable components:** Located in `shared`

---

## 2. Architectural Overview

MAD-AI applies Clean Architecture principles to maximize modularity, testability, and extensibility. The codebase is organized into distinct layers, each with clear boundaries and responsibilities:

-   **Presentation Layer:** UI, navigation, layouts, and shell components. Interacts with Application layer via facades and use cases.
-   **Application Layer:** Orchestrates business logic, coordinates use cases, manages errors, and exposes facades to Presentation.
-   **Domain Layer:** Core business entities, value objects, contracts, domain events, and repositories. Contains business rules and invariants.
-   **Infrastructure Layer:** Implements data access, external integrations, DTOs, mappers, and services. Bridges Domain to external systems.
-   **Core:** Centralizes cross-cutting concerns (guards, interceptors, utilities).
-   **Shared:** Provides reusable UI components, assets, and types.
-   **Dependency Injection:** Providers and tokens for inversion of control.

**Guiding Principles:**

-   Separation of concerns
-   Dependency inversion
-   Testability
-   Extensibility
-   Feature-based modularity

**Boundaries:**

-   Each layer only depends on layers below it
-   Domain is isolated from infrastructure and presentation
-   Application mediates between domain and presentation
-   Infrastructure implements interfaces defined in domain

**Hybrid Patterns:**

-   SSR via Express integrates with Angular
-   Feature-based grouping within layers

---

## 3. Architecture Visualization

```
+---------------------+
| Presentation Layer  |  (src/app/presentation)
+---------------------+
           ↓
+---------------------+
| Application Layer   |  (src/app/application)
+---------------------+
           ↓
+---------------------+
| Domain Layer        |  (src/app/domain)
+---------------------+
           ↓
+---------------------+
| Infrastructure      |  (src/app/infrastructure)
+---------------------+

[Core] (src/app/core): Cross-cutting concerns
[Shared] (src/app/shared): Reusable components
[DI] (src/app/di): Dependency injection
```

-   **Component relationships:**
    -   Presentation interacts with Application via facades/use cases
    -   Application invokes Domain logic and coordinates with Infrastructure
    -   Infrastructure implements data access and integrations for Domain
    -   Core and Shared are accessible across layers as needed

---

## 4. Core Architectural Components

### Presentation Layer

-   **Purpose:** UI, navigation, layouts, shell
-   **Structure:** Features, layouts, navigation, shell
-   **Interaction:** Uses facades from Application, dispatches actions, subscribes to observables
-   **Evolution:** Add new features in `features/`, layouts in `layouts/`, navigation in `navigation/`

### Application Layer

-   **Purpose:** Orchestrates business logic, coordinates use cases, manages errors
-   **Structure:** Use cases, facades, services, error handling, types
-   **Interaction:** Exposes facades to Presentation, invokes Domain contracts
-   **Evolution:** Add new use cases in `use-cases/`, facades in `facades/`, services in `services/`

### Domain Layer

-   **Purpose:** Core business logic, entities, value objects, contracts, domain events
-   **Structure:** Entities, value objects, contracts, repositories, events, errors, enums
-   **Interaction:** Defines interfaces for Application and Infrastructure
-   **Evolution:** Add new entities in `entities/`, contracts in `contracts/`, events in `events/`

### Infrastructure Layer

-   **Purpose:** Data access, external integrations, DTOs, mappers, services
-   **Structure:** DTOs, mappers, repositories, services, HTTP, errors
-   **Interaction:** Implements Domain contracts, provides data to Application
-   **Evolution:** Add new repositories in `repositories/`, services in `services/`, mappers in `mappers/`

### Core

-   **Purpose:** Cross-cutting concerns (guards, interceptors, utilities)
-   **Structure:** Guards, interceptors, utilities
-   **Interaction:** Used across layers for security, error handling, etc.
-   **Evolution:** Add new guards in `guards/`, interceptors in `interceptors/`, utilities in `cross-cutting/`

### Shared

-   **Purpose:** Reusable UI components, assets, types
-   **Structure:** Components, assets, types, UI
-   **Interaction:** Used across Presentation and Application
-   **Evolution:** Add new components in `components/`, assets in `assets/`, types in `types/`

### Dependency Injection

-   **Purpose:** Providers and tokens for DI
-   **Structure:** Provider files, tokens
-   **Interaction:** Used to inject dependencies across layers
-   **Evolution:** Add new providers/tokens in `di/`

---

## 5. Architectural Layers and Dependencies

-   **Layer structure:** Presentation → Application → Domain → Infrastructure
-   **Dependency rules:** Each layer only depends on layers below
-   **Abstraction mechanisms:** Interfaces, contracts, dependency injection
-   **No circular dependencies detected**
-   **DI patterns:** Providers and tokens in `di/` enforce separation

---

## 6. Data Architecture

-   **Domain model:** Entities, value objects, contracts in Domain
-   **Entity relationships:** Aggregates, repositories, events
-   **Data access:** Repositories in Infrastructure implement Domain contracts
-   **Data transformation:** Mappers in Infrastructure
-   **Caching:** Not explicitly detected; recommend adding if needed
-   **Validation:** Error handling and validation in Application and Domain

---

## 7. Cross-Cutting Concerns Implementation

### Authentication & Authorization

-   Guards in Core enforce permissions
-   Identity management via Application and Domain contracts
-   Security boundaries via DI and guards

### Error Handling & Resilience

-   Error interceptors in Core
-   Application layer manages error propagation
-   Domain defines error types

### Logging & Monitoring

-   Instrumentation via interceptors and services
-   Diagnostic info flows through Application and Infrastructure

### Validation

-   Input validation in Application and Domain
-   Error reporting via error types and interceptors

### Configuration Management

-   Environment configs in `src/env/`
-   DI for configuration sources
-   Feature flags can be added via Application layer

---

## 8. Service Communication Patterns

-   **Service boundaries:** Defined by Domain contracts and Application facades
-   **Protocols:** HTTP via Infrastructure (Express SSR)
-   **Sync/Async:** Primarily synchronous; RxJS for async flows
-   **API versioning:** Not explicitly detected; recommend adding if needed
-   **Service discovery:** Not required for monolithic Angular app
-   **Resilience:** Error handling via interceptors and guards

---

## 9. Technology-Specific Architectural Patterns

### Angular

-   Module organization: Feature-based, layered
-   Component hierarchy: Presentation → Shared
-   Service and DI: Providers/tokens in DI
-   State management: RxJS observables, facades
-   Reactive programming: RxJS throughout Application and Presentation
-   Route guards: Implemented in Core

### TypeScript

-   Strict mode, path aliases, interfaces for contracts

### Express SSR

-   Server-side rendering via Infrastructure and build configs

### Tailwind CSS

-   Utility-first styling in Presentation and Shared

---

## 10. Implementation Patterns

### Interface Design

-   Contracts in Domain
-   Facades in Application
-   Providers/tokens in DI

### Service Implementation

-   Services in Application and Infrastructure
-   DI for lifetime management

### Repository Implementation

-   Repositories in Infrastructure
-   Transaction and concurrency handled via service logic

### Controller/API Implementation

-   SSR via Express; recommend API controllers for future expansion

### Domain Model Implementation

-   Entities, value objects, domain events in Domain
-   Business rules enforced via contracts and use cases

---

## 11. Testing Architecture

-   **Unit tests:** Jasmine/Karma for all layers
-   **Integration tests:** Recommend for Application and Infrastructure
-   **Test doubles/mocks:** Use Jasmine spies
-   **Test data:** Factories in test setup
-   **Tools:** Jasmine, Karma

---

## 12. Deployment Architecture

-   **Topology:** Monolithic Angular app with SSR via Express
-   **Environments:** Configs in `src/env/`
-   **Runtime dependencies:** Managed via DI and build configs
-   **Containerization:** Recommend Docker for deployment
-   **Cloud integration:** Not detected; recommend for scaling

---

## 13. Extension and Evolution Patterns

### Feature Addition

-   Add new features in Presentation/features and Application/use-cases
-   Define new contracts in Domain
-   Implement repositories/services in Infrastructure
-   Extend DI providers/tokens as needed

### Modification

-   Modify existing components by updating contracts and use cases
-   Maintain backward compatibility via interface segregation
-   Deprecate via documentation and migration guides

### Integration

-   Integrate external systems via Infrastructure/services
-   Use adapters and anti-corruption layers
-   Implement service facades for abstraction

---

## 14. Architectural Pattern Examples

### Layer Separation Example

```typescript
// Domain contract
export interface UserRepository {
    findById(id: string): Promise<User | null>;
}

// Infrastructure implementation
@Injectable()
export class UserRepositoryImpl implements UserRepository {
    async findById(id: string): Promise<User | null> {
        // ...data access logic...
    }
}

// Application facade
@Injectable()
export class UsersFacade {
    constructor(private userRepository: UserRepository) {}
    getUser(id: string) {
        return this.userRepository.findById(id);
    }
}
```

### Component Communication Example

```typescript
// Presentation component
@Component({ ... })
export class UserProfileComponent {
  user$ = this.usersFacade.getUser(this.userId);
  constructor(private usersFacade: UsersFacade) {}
}
```

### Extension Point Example

```typescript
// DI token for extensibility
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');

// Provider registration
providers: [{ provide: USER_REPOSITORY, useClass: UserRepositoryImpl }];
```

---

## 15. Architectural Decision Records

### Architectural Style Decision

-   **Chosen:** Clean Architecture for modularity and testability
-   **Alternatives:** MVC, Layered, Hexagonal
-   **Constraints:** Need for extensibility and SSR
-   **Consequences:** Clear boundaries, easier onboarding, scalable codebase

### Technology Selection Decision

-   **Angular 20:** Chosen for robust ecosystem and SSR support
-   **TypeScript strict mode:** For safety and maintainability
-   **Express SSR:** For server-side rendering
-   **Tailwind CSS:** For rapid UI development

### Implementation Approach Decision

-   **Feature-based grouping:** For scalability
-   **Centralized cross-cutting concerns:** For maintainability
-   **DI via tokens/providers:** For flexibility

---

## 16. Architecture Governance

-   **Consistency:** Enforced via folder structure, DI, and contracts
-   **Automated checks:** Linting, strict TypeScript, Angular CLI
-   **Review processes:** Recommend code reviews and architectural documentation updates
-   **Documentation:** README, docs/clean-architecture.md, API docs

---

## 17. Blueprint for New Development

### Development Workflow

-   Start with feature folder in Presentation and Application
-   Define contracts in Domain
-   Implement repositories/services in Infrastructure
-   Register providers/tokens in DI
-   Write unit and integration tests

### Implementation Templates

-   Use base interfaces for contracts
-   Organize files by layer and feature
-   Declare dependencies via DI tokens/providers
-   Document new components and features

### Common Pitfalls

-   Violating layer boundaries
-   Skipping DI for dependencies
-   Inconsistent error handling
-   Missing tests for new features

---

**Generated on August 22, 2025.**

_Keep this blueprint updated as the architecture evolves. Review after major refactors or new feature additions._
