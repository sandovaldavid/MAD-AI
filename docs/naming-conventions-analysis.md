# Naming Conventions Analysis

> **Complete catalog of naming patterns used across all layers of the MAD-AI project**

## Summary

This document catalogs all naming conventions used throughout the MAD-AI codebase, providing consistent patterns for GitHub Copilot to follow when generating new code. The conventions follow Angular best practices combined with Clean Architecture and Domain-Driven Design principles.

## File Naming Conventions

### General Rules
- **Case Style**: `kebab-case` for all file names
- **Extensions**: Always include appropriate type suffixes
- **Consistency**: Same patterns across all layers

### Layer-Specific Patterns

#### Domain Layer
```typescript
// Entities: {name}.entity.ts
user.entity.ts
role.entity.ts
notification.entity.ts

// Value Objects: {name}.vo.ts or {name}.value-object.ts
email.vo.ts
firstname.vo.ts
iso-datetime.vo.ts

// Contracts: {name}.contract.ts
auth.contract.ts
user.contract.ts
role.contract.ts

// Repositories: {entity-name}.repository.ts (interfaces)
user.repository.ts
role.repository.ts
notification.repository.ts

// Errors: {domain-area}.error.ts
domain.error.ts
validation.error.ts

// Events: {event-name}.event.ts
user-created.event.ts
role-updated.event.ts

// Enums: {name}.enum.ts
access-level.enum.ts
notification-type.enum.ts
```

#### Application Layer
```typescript
// Facades: {feature}.facade.ts
auth.facade.ts
users.facade.ts
roles.facade.ts
notifications.facade.ts

// Use Cases: {action-description}.ts
login-with-credentials.ts
create-user.ts
update-role.ts
dismiss-notification.ts

// Services: {service-name}.service.ts
domain-event-processor.service.ts
role-export.service.ts

// Types: {feature}.types.ts
auth.types.ts
user.types.ts
notifications.types.ts

// Errors: application-error.ts
application-error.ts
application-error.transformer.ts
```

#### Infrastructure Layer
```typescript
// Repositories: {entity-name}-{implementation}.repository.ts
http-user.repository.ts
memory-role.repository.ts

// DTOs: {entity-name}.dto.ts
user.dto.ts
role.dto.ts
login-request.dto.ts

// Mappers: {entity-name}.mapper.ts
user.mapper.ts
role.mapper.ts

// Services: {service-name}.service.ts
client-export.service.ts
http-client.service.ts

// HTTP: {feature}-{action}.http.ts
auth-login.http.ts
users-crud.http.ts
```

#### Presentation Layer
```typescript
// Pages: {page-name}.ts (no suffix)
dashboard.ts
roles-list.ts
user-detail.ts
create-role.ts

// Components: {component-name}.ts (no suffix)
user-card.ts
role-form.ts
notification-bell.ts

// Models: {entity-name}.model.ts
user.model.ts
role.model.ts

// Mappers: {entity-name}-view.mapper.ts
user-view.mapper.ts
role-view.mapper.ts

// Routes: {feature}.routes.ts
auth.routes.ts
users.routes.ts
roles.routes.ts
```

#### Core Layer
```typescript
// Services: {service-name}.service.ts
title.service.ts
icon-registry.service.ts

// Guards: {guard-name}.guard.ts
auth.guard.ts
role.guard.ts
email-confirmed.guard.ts

// Interceptors: {interceptor-name}.interceptor.ts
error.interceptor.ts
http-error.interceptor.ts

// Utilities: {utility-name}.util.ts
validation.util.ts
date.util.ts
```

#### DI Layer
```typescript
// Providers: provide-{feature}.ts
provide-auth.ts
provide-users.ts
provide-roles.ts
provide-export.ts

// Tokens: tokens.ts
tokens.ts
```

### Component Structure
```typescript
// Standard Angular component structure
component-name/
├── component-name.ts          # Component class (no .component suffix)
├── component-name.html        # Template
├── component-name.css         # Styles
├── component-name.spec.ts     # Unit tests
└── index.ts                   # Barrel export
```

## Class and Interface Naming

### Classes
```typescript
// PascalCase without suffixes
export class User { }                    // Domain entities
export class AuthFacade { }              // Application facades
export class HttpUserRepository { }     // Infrastructure repositories
export class LoginPage { }              // Presentation pages
export class UserCard { }               // Presentation components
export class TitleService { }           // Core services
```

### Interfaces
```typescript
// PascalCase with descriptive names
export interface UserRepository { }     // Domain contracts
export interface AuthContract { }       // Domain contracts
export interface ExportPort { }         // Domain ports
export interface RoleModel { }          // Presentation models
export interface LoginRequest { }       // DTOs and types
```

### Types
```typescript
// PascalCase with descriptive context
export type LoginRequest = { };         // Request types
export type UserUpdateRequest = { };    // Request types
export type RoleExportOptions = { };    // Configuration types
export type ErrorDisplayConfig = { };   // Component configuration
```

### Abstract Classes and Base Classes
```typescript
// PascalCase with descriptive purpose
export abstract class BaseEntity { }     // Domain base classes
export abstract class ApplicationError { } // Application base classes
```

## Method and Property Naming

### Methods
```typescript
// camelCase with descriptive verbs
async login(request: LoginRequest): Promise<void> { }
updateProfile(data: ProfileData): void { }
clearAuthStateCompletely(): void { }
dismissNotification(id: number): void { }

// Boolean methods with is/has/can prefix
isAuthenticated(): boolean { }
hasPermission(permission: string): boolean { }
canAccess(resource: string): boolean { }

// Event handlers with on prefix
onSubmit(): void { }
onUserClick(user: User): void { }
onFormValueChange(value: any): void { }
```

### Properties
```typescript
// camelCase for regular properties
private readonly userRepository: UserRepository;
public readonly isAuthenticated: boolean;
private _currentUser: User | null;

// Signals and computed properties
private readonly _user = signal<User | null>(null);
public readonly isAuthenticated = computed(() => !!this._user());
public readonly loading = signal<boolean>(false);

// Constants: UPPER_SNAKE_CASE
public static readonly MAX_LOGIN_ATTEMPTS = 3;
private readonly API_ENDPOINTS = {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout'
};
```

## Folder Naming Conventions

### General Rules
- **Case Style**: `kebab-case` for all folder names
- **Descriptive Names**: Clear, business-focused naming
- **Consistency**: Same naming pattern across all layers

### Feature Folders
```
// Business capability focused
user-management/
authentication/
notifications/
role-administration/
reporting/
dashboard/
```

### Technical Folders
```
// Technical concern focused
cross-cutting/
ui-state/
error-handling/
domain-events/
http-clients/
data-mappers/
```

### Component Folders
```
// Component name without suffixes
user-card/
role-form/
notification-bell/
page-header/
error-display/
```

## Variable Naming Patterns

### Local Variables
```typescript
// camelCase descriptive names
const currentUser = this.getCurrentUser();
const filteredRoles = roles.filter(role => role.active);
const exportOptions = this.buildExportOptions();

// Boolean variables with descriptive predicates
const isUserActive = user.status === 'active';
const hasValidEmail = this.validateEmail(user.email);
const canUserAccess = this.checkPermissions(user, resource);
```

### Template Variables
```typescript
// camelCase in templates
@if (isAuthenticated) {
    <div>Welcome {{ currentUser?.firstName }}</div>
}

@for (role of availableRoles; track role.id) {
    <div>{{ role.name }}</div>
}
```

## Constant Naming

### Application Constants
```typescript
// UPPER_SNAKE_CASE
export const API_BASE_URL = 'https://api.mad-ai.com';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_PAGE_SIZE = 20;
export const SESSION_TIMEOUT_MINUTES = 30;

// Grouped constants
export const VALIDATION_RULES = {
    EMAIL_MAX_LENGTH: 254,
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50
} as const;

export const ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND'
} as const;
```

## Event and Observable Naming

### Event Emitters
```typescript
// Descriptive action names
@Output() userSelected = new EventEmitter<User>();
@Output() roleUpdated = new EventEmitter<Role>();
@Output() formSubmitted = new EventEmitter<FormData>();
@Output() notificationDismissed = new EventEmitter<number>();
```

### Observables and Signals
```typescript
// Descriptive state names
private readonly users$ = new BehaviorSubject<User[]>([]);
private readonly loading$ = new BehaviorSubject<boolean>(false);
private readonly error$ = new BehaviorSubject<string | null>(null);

// Signals for reactive state
private readonly _users = signal<User[]>([]);
private readonly _selectedUser = signal<User | null>(null);
private readonly _loading = signal<boolean>(false);

// Computed signals
public readonly filteredUsers = computed(() => 
    this._users().filter(user => user.active)
);
```

## Import and Export Patterns

### Barrel Exports
```typescript
// index.ts files for clean imports
export * from './user.entity';
export * from './role.entity';
export { type UserRepository } from './user.repository';
```

### Import Aliases
```typescript
// Use path aliases defined in tsconfig.json
import { User } from '@domain/entities/user.entity';
import { AuthFacade } from '@application/facades/auth.facade';
import { UserCard } from '@shared/components/user-card/user-card';
import type { LoginRequest } from '@application/types/auth.types';
```

### Type-only Imports
```typescript
// Use type imports for type-only dependencies
import type { User } from '@domain/entities/user.entity';
import type { AuthContract } from '@domain/contracts/auth.contract';
import type { ComponentRef } from '@angular/core';
```

## Test File Naming

### Test Files
```typescript
// Same name as source file with .spec.ts extension
user.entity.spec.ts
auth.facade.spec.ts
user-card.spec.ts
login-page.spec.ts

// Test utilities and helpers
test-helpers.ts
test-data.ts
mock-factories.ts
```

## Configuration File Naming

### Configuration Files
```typescript
// Feature configuration
auth.config.ts
export.config.ts
roles.config.ts

// Environment configuration
environment.ts
environment.prod.ts

// Application configuration
app.config.ts
app.routes.ts
```

## Validation and Error Naming

### Error Classes
```typescript
// Domain errors: specific business context
export class InvalidEmailError extends DomainError { }
export class UserNotFoundError extends DomainError { }
export class InsufficientPermissionsError extends DomainError { }

// Application errors: application-level concerns
export class ValidationError extends ApplicationError { }
export class UnauthorizedError extends ApplicationError { }
export class ResourceNotFoundError extends ApplicationError { }
```

### Validation Methods
```typescript
// Validation method naming
private validateEmail(email: string): boolean { }
private validatePasswordStrength(password: string): boolean { }
private validateUserPermissions(user: User, action: string): boolean { }

// Validation result types
export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};
```

## Summary of Key Patterns

1. **Files**: Always `kebab-case` with descriptive type suffixes
2. **Classes/Interfaces**: `PascalCase` without redundant suffixes
3. **Methods/Properties**: `camelCase` with descriptive verbs
4. **Constants**: `UPPER_SNAKE_CASE` for application constants
5. **Folders**: `kebab-case` focused on business capabilities
6. **Components**: Clean naming without `.component` suffix in class names
7. **Types**: Import types with `type` keyword when possible
8. **Signals**: Private signals with `_` prefix, public computed properties
9. **Observables**: Descriptive names with `$` suffix when using RxJS
10. **Tests**: Same name as source with `.spec.ts` extension

These conventions ensure consistency across the entire codebase and provide clear guidance for GitHub Copilot when generating new code.
