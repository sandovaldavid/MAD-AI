# Project Architecture Blueprint: MAD-AI (Angular, Clean Architecture)

**Generated:** August 8, 2025

---

## 1. Architecture Detection and Analysis

**Technology Stack:**

- Angular (TypeScript, Angular CLI, SSR)
- RESTful APIs, CSS, FontAwesome

**Architectural Pattern:**

- Clean Architecture (layered, dependency inversion, separation of concerns)

---

## 2. Architectural Overview

- **Guiding Principles:** Separation of concerns, testability, extensibility
- **Boundaries:** Enforced via folder structure and interfaces
- **Hybrid Patterns:** Clean Architecture + Angular conventions

---

## 3. Architecture Visualization

**High-Level Layer Diagram:**

```
Presentation Layer (src/app/presentation)
  ↓
Application Layer (src/app/application)
  ↓
Domain Layer (src/app/domain)
  ↓
Infrastructure Layer (src/app/infrastructure)
```

**Component Interaction:**

- Services in `core` mediate between layers
- Dependency injection for repository implementations

**Data Flow:**

- UI → Presentation → Application (use-case) → Domain (repo interface) → Infrastructure (repo impl/API) → Data source

---

## 4. Core Architectural Components

### Domain Layer

- **Purpose:** Business logic, contracts, entities
- **Structure:** `entities/`, `enums/`, `models/`, `repositories/`, `ui/`
- **Patterns:** Repository interfaces, value objects, domain events

### Application Layer

- **Purpose:** Orchestrates use cases
- **Structure:** `use-cases/` by feature
- **Patterns:** Use-case handlers, service orchestration

### Infrastructure Layer

- **Purpose:** Data access, API integration
- **Structure:** `api/`, `dto/`, `repositories/`, `tokens/`
- **Patterns:** Repository implementations, DTO mapping, API services

### Presentation Layer

- **Purpose:** UI, routing, user interaction
- **Structure:** Feature folders (auth, dashboard, etc.)
- **Patterns:** Angular components, routing modules

### Core Layer

- **Purpose:** Cross-cutting concerns
- **Structure:** `guards/`, `interceptors/`, `services/`
- **Patterns:** Auth guards, interceptors, shared services

### Shared Layer

- **Purpose:** Reusable UI components
- **Structure:** `components/`
- **Patterns:** Component library, design system

---

## 5. Architectural Layers and Dependencies

- **Layer Map:** Presentation → Application → Domain → Infrastructure
- **Dependency Rules:** No direct dependency from presentation to infrastructure; domain is independent of
  infrastructure
- **Abstraction Mechanisms:** Repository interfaces, service tokens
- **Dependency Injection:** Angular DI for service/repository implementations

---

## 6. Data Architecture

- **Domain Model:** Entities, enums, models organized by feature
- **Entity Relationships:** Aggregates in `entities/`, relationships via models
- **Data Access:** Repositories, DTOs, API services
- **Transformation:** DTOs map to domain models
- **Caching/Validation:** Service/interceptor level

---

## 7. Cross-Cutting Concerns Implementation

- **Authentication & Authorization:** `auth.guard.ts`, `auth.service.ts`, token management
- **Error Handling & Resilience:** Interceptors, service-level error handling
- **Logging & Monitoring:** Extendable via interceptors/services
- **Validation:** Domain models, service-level validation
- **Configuration Management:** Environment files, config services

---

## 8. Service Communication Patterns

- **Service Boundaries:** API services in `infrastructure/api`
- **Protocols:** HTTP/REST (Angular HttpClient)
- **Sync/Async:** Observable-based async communication
- **API Versioning:** Managed via API service structure

---

## 9. Technology-Specific Architectural Patterns

### Angular Patterns

- Module organization, component hierarchy, DI, route guards, reactive programming, state management via services

---

## 10. Implementation Patterns

- **Interface Design:** Segregated interfaces, abstraction via repositories
- **Service Implementation:** Singleton services, DI, error handling
- **Repository Implementation:** API-backed, transaction management via service logic
- **Controller/API:** Angular components as controllers, API services for backend
- **Domain Model:** Entities, value objects, domain events

---

## 11. Testing Architecture

- **Testing Strategies:** Unit tests (spec files), integration tests for services
- **Test Doubles:** Mock services/repositories
- **Test Data:** Factories, mock data in test files
- **Tools:** Jasmine, Karma (default Angular)

---

## 12. Deployment Architecture

- **Topology:** SSR, environment configs, assets
- **Environment Adaptation:** `environment.ts`, `environment.prod.ts`
- **Containerization:** Extendable (Docker)
- **Cloud Integration:** Extendable

---

## 13. Extension and Evolution Patterns

- **Feature Addition:** Add use-case, domain entity, API service, UI component
- **Modification:** Update use-case, extend domain model, maintain backward compatibility
- **Integration:** Add API service, implement adapter, use anti-corruption layer

---

## 14. Architectural Pattern Examples

**Layer Separation Example:**

```typescript
// domain/repositories/auth.repository.ts
export interface AuthRepository {
  login(username: string, password: string): Observable<User>;
}

// infrastructure/repositories/auth.repository.impl.ts
@Injectable()
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private api: AuthApi) {}
  login(username: string, password: string): Observable<User> {
    return this.api.login(username, password);
  }
}
```

**Component Communication Example:**

```typescript
// core/services/notification.service.ts
@Injectable()
export class NotificationService {
  private subject = new Subject<Notification>();
  publish(notification: Notification) { this.subject.next(notification); }
  get notifications$() { return this.subject.asObservable(); }
}
```

**Extension Point Example:**

```typescript
// shared/components/button.ts
@Component({ selector: 'app-button', ... })
export class ButtonComponent { /* ... */ }
```

---

## 15. Architectural Decision Records

- **Style Decision:** Chose Clean Architecture for maintainability and testability
- **Technology Selection:** Angular for UI, REST APIs for backend
- **Implementation Approach:** DI, repository pattern, SSR for performance

**Decision Record Template:**

- Context: Need for scalable, maintainable architecture
- Factors: Testability, separation of concerns, Angular best practices
- Consequences: Improved maintainability, easier onboarding, clear extension points
- Future: Update blueprint as architecture evolves

---

## 16. Architecture Governance

- **Consistency:** Enforced via folder structure, interfaces, Angular CLI
- **Automated Checks:** Linting, unit tests
- **Review Processes:** Code reviews, documentation in `/docs`
- **Documentation:** Markdown docs in `/docs`

---

## 17. Blueprint for New Development

- **Workflow:**
    - Start with domain model, add use-case, implement API, create UI component
- **Templates:**
    - Use existing interfaces, service patterns, component structure
- **Pitfalls:**
    - Avoid direct dependencies between layers, maintain test coverage, document changes

---

**Generated:** August 8, 2025
**Recommendation:** Update this blueprint as architecture evolves, especially when adding new features or refactoring
core components.

