# Project Workflow Analysis Blueprint: MAD-AI

**Generated:** August 22, 2025

---

## Initial Detection Phase

-   **Project Type:** Angular (detected via `angular.json`, feature-based UI, strict TypeScript)
-   **Architecture Pattern:** Clean Architecture (layered, dependency inversion)
-   **Entry Points:** UI components (login/register/dashboard), facades, use cases
-   **Persistence Type:** HTTP API, repository pattern

---

## Documented Workflows

### Workflow 1: User Login

#### 1. Workflow Overview

-   **Name:** User Login
-   **Purpose:** Authenticate user and establish session
-   **Trigger:** User submits login form
-   **Files/Classes:**
    -   `src/app/presentation/features/auth/pages/login/login.ts`
    -   `src/app/application/facades/auth.facade.ts`
    -   `src/app/application/use-cases/auth/login.usecase.ts`
    -   `src/app/domain/entities/session.entity.ts`
    -   `src/app/infrastructure/repositories/http-auth.repository.ts`

#### 2. Entry Point Implementation

-   **Component:** `login.ts` handles form submission and calls `authFacade.login()`
-   **Event Handler:**
    ```typescript
    async onLogin() {
      await this.authFacade.login(this.form.value);
    }
    ```
-   **API Client:** `authFacade.login()` orchestrates login use case
-   **State Management:** Signals for loading, error, session state

#### 3. Service Layer Implementation

-   **Facade:** `auth.facade.ts` delegates to `login.usecase.ts`
-   **Use Case:** Validates credentials, calls repository, handles errors
-   **Dependency Injection:** Use case injected into facade

#### 4. Data Mapping Patterns

-   **DTO:** LoginRequest mapped to domain model
-   **Validation:** Input validated in use case
-   **Domain Events:** Session created on success

#### 5. Data Access Implementation

-   **Repository:** `http-auth.repository.ts` sends HTTP request to backend
-   **Method:**
    ```typescript
    async login(credentials: LoginRequest): Promise<Session> {
      // HTTP POST, error handling, DTO mapping
    }
    ```

#### 6. Response Construction

-   **Session Entity:** Created and returned to facade
-   **Error Handling:** Error transformed and propagated

#### 7. Error Handling Patterns

-   **Try/Catch:** In use case and repository
-   **Global Handler:** ApplicationErrorTransformer
-   **Logging:** Errors logged via notifications facade

#### 8. Asynchronous Processing Patterns

-   **Async/Await:** Used throughout
-   **Signals:** UI updates on state changes

#### 9. Testing Approach

-   **Unit Tests:** login.ts, auth.facade.ts, login.usecase.ts
-   **Mocks:** HTTP requests mocked in tests
-   **Integration Tests:** End-to-end login flow

#### 10. Sequence Diagram

```
User → LoginComponent → AuthFacade → LoginUseCase → HttpAuthRepository → Backend
  ← SessionEntity ←
```

---

### Workflow 2: User Creation

#### 1. Workflow Overview

-   **Name:** User Creation
-   **Purpose:** Register new user and assign role
-   **Trigger:** User submits registration form
-   **Files/Classes:**
    -   `src/app/presentation/features/auth/pages/register/register.ts`
    -   `src/app/application/facades/auth.facade.ts`
    -   `src/app/application/use-cases/users/create-user.usecase.ts`
    -   `src/app/domain/entities/user.entity.ts`
    -   `src/app/infrastructure/repositories/http-user.repository.ts`

#### 2. Entry Point Implementation

-   **Component:** `register.ts` handles form submission and calls `authFacade.register()`
-   **Event Handler:**
    ```typescript
    async onRegister() {
      await this.authFacade.register(this.form.value);
    }
    ```
-   **API Client:** `authFacade.register()` orchestrates register use case
-   **State Management:** Signals for loading, error, user state

#### 3. Service Layer Implementation

-   **Facade:** `auth.facade.ts` delegates to `create-user.usecase.ts`
-   **Use Case:** Validates input, checks for duplicates, assigns role, calls repository
-   **Dependency Injection:** Use case injected into facade

#### 4. Data Mapping Patterns

-   **DTO:** RegisterRequest mapped to CreateUserContract
-   **Validation:** Input validated in use case and entity factory
-   **Domain Events:** UserCreated event published

#### 5. Data Access Implementation

-   **Repository:** `http-user.repository.ts` sends HTTP request to backend
-   **Method:**
    ```typescript
    async create(userData: CreateUserContract): Promise<User> {
      // HTTP POST, error handling, DTO mapping
    }
    ```
-   **Entity:** `user.entity.ts` factory validates invariants

#### 6. Response Construction

-   **User Entity:** Created and returned to facade
-   **Error Handling:** Error transformed and propagated

#### 7. Error Handling Patterns

-   **Try/Catch:** In use case and repository
-   **Global Handler:** ApplicationErrorTransformer
-   **Logging:** Errors logged via notifications facade

#### 8. Asynchronous Processing Patterns

-   **Async/Await:** Used throughout
-   **Signals:** UI updates on state changes

#### 9. Testing Approach

-   **Unit Tests:** register.ts, auth.facade.ts, create-user.usecase.ts
-   **Mocks:** HTTP requests mocked in tests
-   **Integration Tests:** End-to-end registration flow

#### 10. Sequence Diagram

```
User → RegisterComponent → AuthFacade → CreateUserUseCase → HttpUserRepository → Backend
  ← UserEntity ←
```

---

### Workflow 3: Dashboard Data Fetch

#### 1. Workflow Overview

-   **Name:** Dashboard Data Fetch
-   **Purpose:** Load user profile and dashboard data
-   **Trigger:** Dashboard component initialization
-   **Files/Classes:**
    -   `src/app/presentation/features/dashboard/dashboard.ts`
    -   `src/app/application/facades/auth.facade.ts`
    -   `src/app/application/use-cases/auth/get-profile.usecase.ts`
    -   `src/app/domain/entities/user.entity.ts`
    -   `src/app/infrastructure/repositories/http-user.repository.ts`

#### 2. Entry Point Implementation

-   **Component:** `dashboard.ts` calls `authFacade.refreshProfile()` in `ngOnInit`
-   **Event Handler:**
    ```typescript
    async ngOnInit() {
      await this.authFacade.refreshProfile();
    }
    ```
-   **API Client:** `authFacade.refreshProfile()` orchestrates get-profile use case
-   **State Management:** Signals for loading, error, user state

#### 3. Service Layer Implementation

-   **Facade:** `auth.facade.ts` delegates to `get-profile.usecase.ts`
-   **Use Case:** Fetches user profile, handles errors
-   **Dependency Injection:** Use case injected into facade

#### 4. Data Mapping Patterns

-   **DTO:** ProfileResponse mapped to User entity
-   **Validation:** Input validated in use case and entity factory
-   **Domain Events:** ProfileLoaded event published

#### 5. Data Access Implementation

-   **Repository:** `http-user.repository.ts` sends HTTP request to backend
-   **Method:**
    ```typescript
    async getProfile(): Promise<User> {
      // HTTP GET, error handling, DTO mapping
    }
    ```
-   **Entity:** `user.entity.ts` factory validates invariants

#### 6. Response Construction

-   **User Entity:** Created and returned to facade
-   **Error Handling:** Error transformed and propagated

#### 7. Error Handling Patterns

-   **Try/Catch:** In use case and repository
-   **Global Handler:** ApplicationErrorTransformer
-   **Logging:** Errors logged via notifications facade

#### 8. Asynchronous Processing Patterns

-   **Async/Await:** Used throughout
-   **Signals:** UI updates on state changes

#### 9. Testing Approach

-   **Unit Tests:** dashboard.ts, auth.facade.ts, get-profile.usecase.ts
-   **Mocks:** HTTP requests mocked in tests
-   **Integration Tests:** End-to-end dashboard data fetch

#### 10. Sequence Diagram

```
User → DashboardComponent → AuthFacade → GetProfileUseCase → HttpUserRepository → Backend
  ← UserEntity ←
```

---

## Naming Conventions

-   **Component:** PascalCase, e.g., `LoginComponent`, `RegisterComponent`, `DashboardComponent`
-   **Facade:** Suffix `Facade`, e.g., `AuthFacade`, `UsersFacade`
-   **Use Case:** Verb-based, e.g., `LoginWithCredentials`, `CreateUser`, `GetProfile`
-   **Repository:** Suffix `Repository`, e.g., `HttpUserRepository`, `HttpAuthRepository`
-   **DTO:** Suffix `Request`, `Response`, e.g., `LoginRequest`, `ProfileResponse`
-   **Entity:** Suffix `Entity`, e.g., `UserEntity`, `SessionEntity`
-   **Method:** CRUD verbs, e.g., `create`, `get`, `update`, `delete`
-   **Variable:** camelCase
-   **File Organization:** Co-located by feature and layer

---

## Implementation Templates

### New API Endpoint

```typescript
// Facade
@Injectable({ providedIn: 'root' })
export class FeatureFacade {
    private readonly useCase = inject(FeatureUseCase);
    async doAction(data: FeatureRequest): Promise<FeatureResponse> {
        return await this.useCase.execute(data);
    }
}
// Use Case
@Injectable({ providedIn: 'root' })
export class FeatureUseCase {
    async execute(data: FeatureRequest): Promise<FeatureResponse> {
        // Validate, call repository, handle errors
    }
}
// Repository
@Injectable()
export class FeatureRepository {
    async doAction(data: FeatureRequest): Promise<FeatureResponse> {
        // HTTP call, error handling
    }
}
```

### New Service Method

```typescript
@Injectable({ providedIn: 'root' })
export class Service {
    async newMethod(params: ParamsType): Promise<ReturnType> {
        // Business logic, error handling
    }
}
```

### New Repository Method

```typescript
@Injectable()
export class Repository {
    async newMethod(params: ParamsType): Promise<ReturnType> {
        // Data access, error handling
    }
}
```

### New Domain Model Class

```typescript
export class Entity {
    constructor(public readonly id: number /* ... */) {}
    static create(props: EntityProps): Entity {
        // Invariant validation
    }
}
```

### Error Handling

```typescript
try {
    // ...
} catch (error) {
    // Transform and propagate error
}
```

---

## Implementation Guidelines

### Step-by-Step Process

1. Start with UI component and event handler
2. Implement facade method and inject use case
3. Implement use case with validation and repository call
4. Implement repository method for data access
5. Define domain/entity model with invariants
6. Add error handling and logging
7. Write unit and integration tests

### Common Pitfalls to Avoid

-   Mixing business logic in UI or repository layers
-   Skipping validation in use cases and entities
-   Inconsistent error handling or missing error propagation
-   Overly complex components without separation of concerns
-   Not writing tests for new workflows

### Extension Mechanisms

-   Add new features by creating new use cases, facades, and repositories
-   Use dependency injection for extensibility
-   Publish domain events for cross-feature integration
-   Use configuration-driven patterns for feature toggles

---

**Conclusion:**
Follow these workflow patterns to maintain consistency, testability, and extensibility in MAD-AI. Update this blueprint as workflows evolve or new features are added.
