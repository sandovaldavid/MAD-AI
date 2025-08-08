# Project Architecture Blueprint

**Generated:** August 8, 2025

---

## 1. Architecture Detection and Analysis

**Technology Stack:**
- Angular 20 (TypeScript)
- RxJS
- Express (SSR)
- TailwindCSS
- Jasmine/Karma (testing)

**Architectural Pattern:**
- Clean Architecture (layered separation: domain, application, infrastructure, presentation) and a layer core

---

## 2. Architectural Overview
- Clear separation of concerns: domain logic, use cases, infrastructure, and UI
- Dependency inversion: domain defines interfaces, infrastructure implements them
- Modularity: features organized by domain and use-case
- Extensible boundaries: new features can be added with minimal impact

---

## 3. Architecture Visualization
- **High-level diagram:**
  - Presentation (Angular components/routes)
  - Application (use-cases)
  - Domain (entities, repositories)
  - Infrastructure (API clients, repository implementations)
- **Component interaction:**
  - Presentation → Application → Domain → Infrastructure
- **Data flow:**
  - UI triggers use-case → domain logic → infrastructure API → domain entity → UI update

---

## 4. Core Architectural Components
### Example: User
- **Purpose:** Encapsulates user business logic and validation
- **Internal Structure:** `UserEntity` class, enums, DTOs
- **Interaction:** Repository interface, implemented by API client
- **Evolution:** Extend entity, add new repository methods, update DTOs

---

## 5. Architectural Layers and Dependencies
- **Layers:** Presentation, Application, Domain, Infrastructure
- **Dependency Rules:** Outer layers depend on abstractions, not implementations
- **Abstraction Mechanisms:** Repository interfaces, DI tokens
- **Violations:** None detected
- **DI Patterns:** Angular's `@Injectable`, constructor injection

---

## 6. Data Architecture
- **Domain Model:** Entities (User, Role, Notification)
- **Relationships:** Entities reference enums, DTOs, and other entities
- **Data Access:** Repositories, API clients
- **Transformation:** Mapping API DTOs to domain entities
- **Caching:** Not detected
- **Validation:** Entity constructors, service methods

---

## 7. Cross-Cutting Concerns Implementation
- **Authentication:** `AuthService`, guards, interceptors
- **Error Handling:** RxJS operators, Angular error boundaries
- **Logging/Monitoring:** Not detected (recommend integration)
- **Validation:** DTOs, entity constructors
- **Configuration:** Environment files, DI tokens

---

## 8. Service Communication Patterns
- **Boundaries:** API clients per domain
- **Protocols:** HTTP (REST)
- **Sync/Async:** Observable streams (RxJS)
- **Versioning:** Not detected
- **Discovery:** Static endpoints
- **Resilience:** Error handling via RxJS

---

## 9. Technology-Specific Architectural Patterns
### Angular
- **Modules:** Feature-based organization
- **Components:** Reusable, OnPush change detection
- **Services:** DI, singleton pattern
- **Routing:** Route modules, guards
- **State Management:** Signals, computed properties
- **Guards:** Auth guard for route protection

---

## 10. Implementation Patterns
- **Interface Design:** Abstract repositories
- **Service Implementation:** Injectable services, use-case orchestration
- **Repository Implementation:** API mapping, DTO transformation
- **Controller/API:** Route modules, Angular components
- **Domain Model:** Entity classes, enums

---

## 11. Testing Architecture
- **Strategies:** Unit (Jasmine), integration (Karma)
- **Boundaries:** Test doubles for repositories/services
- **Test Data:** DTOs, mock entities
- **Tools:** Jasmine, Karma

---

## 12. Deployment Architecture
- **Topology:** SSR with Express, Angular build
- **Environment:** `environment.ts`, `environment.prod.ts`
- **Runtime Dependencies:** DI tokens, environment configs
- **Containerization:** Not detected
- **Cloud Integration:** Not detected

---

## 13. Extension and Evolution Patterns
- **Feature Addition:** Add new use-case, entity, repository, and API client
- **Modification:** Update interfaces, extend entities, maintain backward compatibility
- **Integration:** Add new API client, implement repository interface, use DI tokens

---

## 14. Architectural Pattern Examples
### Layer Separation
```typescript
// Domain repository interface
export abstract class UserRepository {
  abstract getUsers(): Observable<UserEntity[]>;
}
// Infrastructure implementation
@Injectable({ providedIn: 'root' })
export class UserRepositoryImpl extends UserRepository {
  // ...implementation...
}
```
### Component Communication
```typescript
// Service invocation in component
this.authService.login(credentials).subscribe(...);
```
### Extension Point
```typescript
// DI token for repository
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
```

---

## 15. Architectural Decision Records
- **Style:** Clean Architecture chosen for maintainability and testability
- **Technology:** Angular 20 for modern features, RxJS for reactive programming
- **Implementation:** DI and abstract interfaces for extensibility
- **Context:** Need for modular, scalable, testable codebase
- **Consequences:** Easy to extend, test, and maintain; requires discipline in layer separation

---

## 16. Architecture Governance
- **Consistency:** Enforced by folder structure, interfaces, DI
- **Automated Checks:** TypeScript, Angular CLI, linting
- **Review:** Code reviews, documentation in `docs/`
- **Documentation:** Blueprint, module READMEs

---

## 17. Blueprint for New Development
- **Workflow:**
  1. Define domain entity and repository interface
  2. Implement use-case in application layer
  3. Create infrastructure implementation (API client)
  4. Add presentation component/page
  5. Write tests
- **Templates:** Abstract classes, DI tokens, Angular components
- **Pitfalls:** Layer violations, tight coupling, missing tests
- **Performance:** Use OnPush change detection, optimize API calls
- **Testing:** Unit and integration tests for all layers

---

**Keep this blueprint updated as the architecture evolves.**

