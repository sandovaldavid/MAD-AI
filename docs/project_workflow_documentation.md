# Project Workflow Documentation

**Generated:** August 8, 2025

---

## Overview

This document describes three representative end-to-end workflows in the Angular project, serving as implementation
templates for similar features. Each workflow covers entry points, service layers, data access, error handling, testing,
and sequence diagrams, following Clean Architecture principles.

---

## Workflow 1: User Login

### 1. Workflow Overview

- **Purpose:** Authenticates a user and establishes a session.
- **Trigger:** User submits login form in the UI.
- **Files Involved:**
    - `src/app/presentation/auth/pages/login/`
    - `src/app/core/services/auth.service.ts`
    - `src/app/application/use-cases/auth/login.use-case.ts`
    - `src/app/domain/repositories/auth.repository.ts`
    - `src/app/infrastructure/api/auth.api.ts`
    - `src/app/domain/models/auth/login-request.model.ts`

### 2. Entry Point Implementation

- Login page component handles form submission and calls `AuthService.login()`.
- Event handler triggers the login request.

### 3. Service Layer Implementation

- `AuthService` injects `LoginUseCase` and manages authentication state.
- `LoginUseCase` orchestrates login logic, interacts with repository.

### 4. Data Mapping Patterns

- Maps form data to `LoginRequest` model.
- Validates input before passing to use case.

### 5. Data Access Implementation

- `AuthRepository.login(username, password)` interface.
- Implementation in infrastructure layer calls `AuthApi.login()`.
- API client sends HTTP POST to `/api/auth/login` with DTO.

### 6. Response Construction

- Maps API response to `UserInfo` domain model.
- Handles error responses and status codes.

### 7. Error Handling Patterns

- Try/catch in service and use case.
- Global error handler for HTTP errors.
- Error messages displayed in UI.

### 8. Asynchronous Processing Patterns

- RxJS observables for async API calls.
- Loading state managed via signals.

### 9. Testing Approach

- Unit tests for AuthService, LoginUseCase, and AuthRepository.
- Mock API responses and test error scenarios.

### 10. Sequence Diagram

```
User → LoginPage → AuthService → LoginUseCase → AuthRepository → AuthApi → Backend
```

---

## Workflow 2: Resource CRUD

### 1. Workflow Overview

- **Purpose:** Manages resources (create, read, update, delete).
- **Trigger:** User interacts with resource management UI.
- **Files Involved:**
    - `src/app/presentation/resource_management/pages/`
    - `src/app/core/services/resource-management.service.ts`
    - `src/app/application/use-cases/resource-management/`
    - `src/app/domain/repositories/resource-management/`
    - `src/app/infrastructure/api/resource-management/`
    - `src/app/domain/models/resource-management/`

### 2. Entry Point Implementation

- Resource page/component triggers CRUD actions via service.

### 3. Service Layer Implementation

- `ResourceManagementService` calls use cases for CRUD operations.
- Separate use case for each CRUD action.

### 4. Data Mapping Patterns

- Maps UI data to resource DTOs.

### 5. Data Access Implementation

- Repository interface for CRUD methods.
- Implementation calls API client.
- API client sends HTTP requests for CRUD actions.

### 6. Response Construction

- Maps API responses to domain models.
- Handles errors and status codes.

### 7. Error Handling Patterns

- Try/catch in service and use cases.
- Global error handler for HTTP errors.

### 8. Asynchronous Processing Patterns

- RxJS observables for async API calls.

### 9. Testing Approach

- Unit tests for service, use cases, and repository.
- Integration tests for API client.

### 10. Sequence Diagram

```
User → ResourcePage → ResourceManagementService → UseCase → Repository → Api → Backend
```

---

## Workflow 3: Notification Delivery

### 1. Workflow Overview

- **Purpose:** Sends notifications to users.
- **Trigger:** Business event (e.g., resource updated).
- **Files Involved:**
    - `src/app/core/services/notification.service.ts`
    - `src/app/application/use-cases/notification/`
    - `src/app/domain/entities/notification.entity.ts`
    - `src/app/domain/repositories/notification.repository.ts`
    - `src/app/infrastructure/api/notification.api.ts`
    - `src/app/domain/models/notification/`

### 2. Entry Point Implementation

- `NotificationService.publish()` called by business logic.

### 3. Service Layer Implementation

- `NotificationService` publishes notification via use case.
- Use case handles notification logic.

### 4. Data Mapping Patterns

- Maps event data to notification DTO.

### 5. Data Access Implementation

- Repository interface for notification methods.
- Implementation calls API client.
- API client sends HTTP request to notification endpoint.

### 6. Response Construction

- Handles API response and errors.

### 7. Error Handling Patterns

- Try/catch in service and use case.
- Global error handler for HTTP errors.

### 8. Asynchronous Processing Patterns

- RxJS observables for async API calls.

### 9. Testing Approach

- Unit tests for service, use case, and repository.
- Mock API responses.

### 10. Sequence Diagram

```
BusinessEvent → NotificationService → UseCase → Repository → Api → Backend
```

---

## Naming Conventions

- **Controllers:** `[Feature]Controller`
- **Services:** `[Feature]Service`
- **Repositories:** `[Feature]Repository`
- **DTOs:** `[Feature]Request`, `[Feature]Response`
- **Use Cases:** `[Action][Feature]UseCase`
- **Entities/Models:** PascalCase
- **Files:** kebab-case for components, PascalCase for models/entities

---

## Implementation Templates

- **New API Endpoint:** Add route in `[feature].routes.ts`, create service method in `[feature].service.ts`, implement
  use case and repository
- **New Service Method:** Add method to service and use case, update repository and API client
- **New Repository Method:** Define interface in `[feature].repository.ts`, implement in infrastructure layer
- **New Domain Model:** Add class in `[feature].entity.ts` or `[feature].model.ts`
- **Error Handling:** Use try/catch, global error handler, and RxJS error operators

---

## Implementation Guidelines

- Start with domain model and repository interface
- Implement use case and service logic
- Connect UI components to service methods
- Add tests for each layer
- Avoid mixing UI and business logic
- Use RxJS for async operations
- Handle errors at each layer

---

## Common Pitfalls to Avoid

- Skipping validation and error handling
- Mixing concerns between layers
- Hardcoding values in services or components
- Not testing error scenarios

---

## Extension Mechanisms

- Add new features by creating use case, service, repository, and API client files
- Use path aliases for maintainability
- Extend via new modules/components without modifying core logic

---

## Conclusion

Follow these workflow patterns and templates to maintain consistency and quality when implementing new features in your
Angular project.

