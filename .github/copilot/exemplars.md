# Code Exemplars Blueprint

**Generated:** August 8, 2025

---

## Introduction

This document identifies high-quality, representative code examples from our Angular codebase. These exemplars demonstrate our coding standards, architectural patterns, and best practices. Use this guide to maintain consistency and quality when implementing new features.

---

## Table of Contents
- [Presentation Layer](#presentation-layer)
- [Business Logic Layer](#business-logic-layer)
- [Data Access Layer](#data-access-layer)
- [Cross-Cutting Concerns](#cross-cutting-concerns)
- [Consistency Patterns](#consistency-patterns)
- [Architecture Observations](#architecture-observations)
- [Implementation Conventions](#implementation-conventions)
- [Anti-patterns to Avoid](#anti-patterns-to-avoid)
- [Conclusion](#conclusion)

---

## Presentation Layer

### 1. `src/app/app.ts`
**Description:** Main application component demonstrating Angular's OnPush change detection and modular routing.
**Pattern:** UI Component Structure
**Key Details:**
- Uses Angular's `@Component` decorator
- Implements OnPush change detection for performance
- Imports RouterOutlet for modular routing
```typescript
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = 'MAD-AI-NEW';
}
```

### 2. `src/app/presentation/dashboard/dashboard.ts`
**Description:** Dashboard component with clear separation of UI logic and template.
**Pattern:** UI Component Structure
**Key Details:**
- Follows Angular component conventions
- Uses dedicated CSS and HTML files for separation of concerns

### 3. `src/app/presentation/users-module/components/`
**Description:** Shared user components demonstrating reusable UI patterns.
**Pattern:** UI Component Structure
**Key Details:**
- Organized in a feature-based folder
- Promotes reusability and modularity

---

## Business Logic Layer

### 1. `src/app/core/services/auth.service.ts`
**Description:** AuthService implementing authentication logic with dependency injection and signals for state management.
**Pattern:** Service Implementation
**Key Details:**
- Uses Angular's DI system
- Coordinates authentication via use-cases
- Manages state with signals and computed properties
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // ...inject use-cases and token service...
  login(request: LoginRequest): Observable<UserInfo> {
    return this.loginUseCase.execute(request);
  }
}
```

### 2. `src/app/core/services/notification.service.ts`
**Description:** NotificationService handling cross-cutting notification logic.
**Pattern:** Service Implementation
**Key Details:**
- Encapsulates notification logic
- Promotes separation of concerns

### 3. `src/app/application/use-cases/user/`
**Description:** User use-cases implementing business workflows.
**Pattern:** Workflow Orchestration
**Key Details:**
- Organized by feature
- Implements single responsibility principle

---

## Data Access Layer

### 1. `src/app/domain/entities/user.entity.ts`
**Description:** UserEntity class encapsulating user business logic and validation.
**Pattern:** Domain Model
**Key Details:**
- Implements core business logic
- Uses strong typing and enums
```typescript
export class UserEntity {
  id: number;
  username: string;
  email: string;
  // ...other properties...
  constructor(params: { username: string; email: string; /* ... */ }) {
    // ...validation and assignment...
  }
}
```

### 2. `src/app/domain/repositories/user.repository.ts`
**Description:** Abstract repository interface defining contracts for user data access.
**Pattern:** Repository Interface
**Key Details:**
- Follows Clean Architecture principles
- Promotes dependency inversion
```typescript
export abstract class UserRepository {
  abstract getUsers(): Observable<UserEntity[]>;
  abstract getUserById(id: number): Observable<UserEntity>;
  // ...other methods...
}
```

### 3. `src/app/infrastructure/repositories/user.repository.impl.ts`
**Description:** Concrete repository implementation using API client and mapping DTOs to domain entities.
**Pattern:** Repository Implementation
**Key Details:**
- Implements domain repository interface
- Uses Angular DI and RxJS for async data handling
```typescript
@Injectable({ providedIn: 'root' })
export class UserRepositoryImpl extends UserRepository {
  private readonly userApi = inject(UserApiClient);
  getUsers(): Observable<UserEntity[]> {
    return this.userApi.getUsers().pipe(
      map(users => users.map(user => new UserEntity({ ...user })));
    );
  }
}
```

---

## Cross-Cutting Concerns

### 1. `src/app/core/guards/auth.guard.ts`
**Description:** AuthGuard implementing route protection based on authentication state.
**Pattern:** Authentication/Authorization
**Key Details:**
- Uses Angular's guard interface
- Integrates with AuthService for state checks

### 2. `src/app/core/interceptors/auth.interceptor.ts`
**Description:** AuthInterceptor handling authentication tokens in HTTP requests.
**Pattern:** Error Handling & Authentication
**Key Details:**
- Implements Angular HTTP interceptor
- Adds authentication headers to requests

### 3. `src/app/core/services/notification.service.ts`
**Description:** NotificationService for cross-cutting notification logic.
**Pattern:** Logging & Notification
**Key Details:**
- Centralizes notification logic
- Promotes maintainability

---

## Consistency Patterns
- Feature-based folder organization (domain, application, infrastructure, presentation, shared)
- Use of abstract interfaces for repositories
- Dependency injection for services and repositories
- Separation of concerns between layers
- Strong typing and use of enums for domain models

---

## Architecture Observations
- Clean Architecture principles: domain-driven design, dependency inversion, separation of concerns
- Modular organization by feature and layer
- Use of RxJS for reactive programming and state management
- Angular's DI and OnPush change detection for performance

---

## Implementation Conventions
- PascalCase for classes, camelCase for methods/variables
- Kebab-case for file names
- Dedicated folders for components, services, models, repositories
- Use of Angular decorators and DI tokens
- Comprehensive use of TypeScript types and interfaces

---

## Anti-patterns to Avoid
- Tight coupling between layers
- Lack of error handling in service and repository implementations
- Missing unit tests for core business logic
- Overly complex components without separation of concerns

---

## Conclusion

These exemplars represent our standard approaches to component structure, business logic, data access, and cross-cutting concerns. Follow these patterns to maintain code quality and consistency. Regularly review and update this document as the codebase evolves.

