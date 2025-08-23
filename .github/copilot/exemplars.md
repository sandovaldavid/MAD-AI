# Code Exemplars Blueprint: MAD-AI

**Generated:** August 22, 2025

---

## Introduction

This document identifies high-quality, representative code examples from the MAD-AI Angular codebase. These exemplars demonstrate our coding standards, architectural patterns, and best practices. Use this guide to maintain consistency and quality when implementing new features.

---

## Table of Contents

-   [Presentation Layer](#presentation-layer)
-   [Business Logic Layer](#business-logic-layer)
-   [Data Access Layer](#data-access-layer)
-   [Cross-Cutting Concerns](#cross-cutting-concerns)
-   [Consistency Patterns](#consistency-patterns)
-   [Architecture Observations](#architecture-observations)
-   [Implementation Conventions](#implementation-conventions)
-   [Anti-patterns to Avoid](#anti-patterns-to-avoid)
-   [Conclusion](#conclusion)

---

## Presentation Layer

### 1. Dashboard Component

**File:** `src/app/presentation/features/dashboard/dashboard.ts`
**Description:** Clean, well-structured Angular component with OnPush change detection, clear separation of concerns, and dependency injection.
**Pattern:** UI Component, Controller

```typescript
@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Button, Icon],
})
export class Dashboard {
    readonly User: User | null;
    readonly username: string | undefined;
    protected readonly titlePage = 'Dashboard';

    constructor(
        private titleService: TitleService,
        private breadcrumbService: BreadcrumbService,
        public authFacade: AuthFacade,
        private router: Router
    ) {
        this.User = this.authFacade.user();
        this.username = this.User?.username;
    }
    // ...existing code...
}
```

_Comments: Uses dependency injection, signals, and facade pattern for state management. Follows single responsibility and separation of concerns._

### 2. Page Header Component

**File:** `src/app/shared/components/page-header/page-header.ts`
**Description:** Reusable, standalone UI component with configurable inputs, computed properties, and clean template structure.
**Pattern:** UI Component

```typescript
@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [CommonModule, Icon],
    templateUrl: './page-header.html',
    styleUrls: ['./page-header.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
    config = input.required<PageHeaderConfig>();
    // ...existing code...
}
```

_Comments: Demonstrates Angular standalone component pattern, input validation, and computed properties for UI logic._

---

## Business Logic Layer

### 1. Users Facade

**File:** `src/app/application/facades/users.facade.ts`
**Description:** Comprehensive facade coordinating user-related use cases, state management, and error handling.
**Pattern:** Facade, Service

```typescript
@Injectable()
export class UsersFacade {
    // Use case injections
    // ...existing code...
    // State management and error handling
}
```

_Comments: Centralizes business logic, coordinates use cases, and exposes observable state. Follows facade and service patterns for maintainability._

---

## Data Access Layer

### 1. User Entity

**File:** `src/app/domain/entities/user.entity.ts`
**Description:** Domain entity with encapsulated invariants, value objects, and factory method for validation.
**Pattern:** Domain Model

```typescript
export class User {
    private _domainEvents: DomainEvent[] = [];
    private constructor(
        public readonly id: number,
        private _username: Username,
        private _email: Email
    ) // ...existing code...
    {}
    static create(props: {
        /* ... */
    }): User {
        const errors: FieldError[] = [];
        // Invariant validation
        // ...existing code...
    }
}
```

_Comments: Implements encapsulation, validation, and domain event pattern. Follows DDD principles._

### 2. HTTP User Repository

**File:** `src/app/infrastructure/repositories/http-user.repository.ts`
**Description:** HTTP-based repository implementing domain contracts, error handling, and DTO transformation.
**Pattern:** Repository, Data Mapper

```typescript
@Injectable()
export class HttpUserRepository implements UserRepository {
    constructor(private http: HttpClient) {}
    async getById(id: number): Promise<User> {
        // HTTP request, error handling, DTO mapping
        // ...existing code...
    }
}
```

_Comments: Adheres to repository pattern, separates data access from domain logic, and handles errors gracefully._

---

## Cross-Cutting Concerns

### 1. Auth Guard

**File:** `src/app/core/guards/auth.guard.ts`
**Description:** Clean Architecture-compliant guard delegating authentication state to Application layer, with clear separation of technical and business concerns.
**Pattern:** Guard, Authentication

```typescript
const checkAuth = async (): Promise<boolean | UrlTree> => {
    const router = inject(Router);
    const authFacade = inject(AuthFacade);
    const isAuthenticated = authFacade.isAuthenticated();
    if (isAuthenticated) {
        return true;
    }
    try {
        await authFacade.refreshProfile();
        return authFacade.isAuthenticated() ? true : router.parseUrl('/auth/login');
    } catch {
        authFacade.clearAuthState();
        return router.parseUrl('/auth/login');
    }
};
export const authGuard: CanActivateFn = (_route, _state) => checkAuth();
```

_Comments: Pure technical guard, delegates business logic, follows Clean Architecture boundaries._

---

## Consistency Patterns

-   Use of dependency injection throughout all layers
-   Facade pattern for business logic coordination
-   Repository pattern for data access
-   Encapsulation and validation in domain entities
-   OnPush change detection and standalone components in UI
-   Clear separation of technical and business concerns in guards

---

## Architecture Observations

-   Layered Clean Architecture: Presentation → Application → Domain → Infrastructure
-   Feature-based modularity and grouping
-   Centralized cross-cutting concerns in Core
-   Reusable components in Shared
-   Strict TypeScript and path aliasing for maintainability

---

## Implementation Conventions

-   PascalCase for classes and components
-   camelCase for variables and methods
-   Clear, descriptive naming for files and symbols
-   Comprehensive comments and JSDoc for public APIs
-   Use of factory methods for entity creation and validation
-   Observable state management in facades

---

## Anti-patterns to Avoid

-   Mixing business logic in technical layers (e.g., guards)
-   Direct repository injection in Core or Presentation
-   Skipping validation in domain entities
-   Inconsistent error handling or missing error propagation
-   Overly complex components without separation of concerns

---

## Conclusion

These exemplars represent the coding standards and architectural patterns of MAD-AI. Follow these examples to maintain consistency, readability, and maintainability. Review this document regularly and update as the codebase evolves.
