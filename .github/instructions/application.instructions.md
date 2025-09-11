---
description: 'Application Layer implementation guidelines for use case orchestration'
applyTo: '**/application/**/*.ts'
---

# Application Layer Implementation Instructions

## Core Principles

You WILL implement Application Layer components following these fundamental rules:

**CRITICAL**: The Application Layer is the orchestrator that directs Domain and Infrastructure layers to execute user-requested operations. You MUST NOT contain business logic - only orchestration logic.

You MUST follow this **Golden Rule**: Every use case should read like a script or recipe: "1. Get user from repository. 2. Ask domain to apply business rule. 3. Save updated user. 4. Notify result."

You WILL ensure the Application Layer:

- **Orchestrates Operations**: Coordinates Domain entities and Infrastructure services to fulfill user intentions
- **Translates User Actions**: Converts UI requests into Domain operations using the appropriate sequence of steps
- **Manages Application State**: Provides reactive state management for the Presentation layer through Facades
- **Handles Transactions**: Ensures use case operations are atomic and handle failures appropriately
- **Bridges Layers**: Serves as the communication hub between Presentation, Domain, and Infrastructure

**MANDATORY**: Application Layer never implements business rules - it only directs Domain entities to execute their own business logic.

## Structural Requirements

### `/use-cases` - Operation Orchestration

You WILL create use cases that:

- Represent a single user intention or system action (e.g., `LoginUseCase`, `CreateUserUseCase`, `ActivateRoleUseCase`)
- Follow a clear sequence of orchestration steps without business logic
- Use Domain repository interfaces to retrieve and persist entities
- Invoke Domain entity methods to execute business rules
- Handle and transform errors appropriately for the Facade layer

You MUST ensure use cases:

- Have names that clearly express the user's intention using action verbs
- Execute a single, focused operation from start to finish
- Return structured results that indicate success or failure with relevant data
- Include proper error handling and transaction management
- Are completely stateless and side-effect free except for intended persistence

**Example Use Case Implementation:**

```typescript
// ✅ CORRECT - Pure orchestration without business logic
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly logger: ILogger
  ) {}

  async execute(credentials: LoginCredentials): Promise<Result<Session>> {
    try {
      // Step 1: Validate credentials through domain repository
      const loginResult = await this.authRepository.login(credentials.email, credentials.password);

      if (loginResult.isFailure()) {
        this.logger.warn('Login attempt failed', { email: credentials.email });
        return Result.fail(loginResult.error);
      }

      // Step 2: Get the authenticated session
      const session = loginResult.value;

      // Step 3: Log successful login
      this.logger.info('User logged in successfully', {
        userId: session.getUserId(),
        email: credentials.email,
      });

      return Result.ok(session);
    } catch (error) {
      this.logger.error('Login use case failed', error, { email: credentials.email });
      return Result.fail(new ApplicationError('Login operation failed', error));
    }
  }
}
```

### `/facades` - Scalable State Management by Feature

You WILL organize facades using feature-based structure for scalability:

- Create a folder for each major business context (e.g., `auth/`, `users/`, `roles/`)
- Place related facades within their respective feature folders
- Allow facade splitting as features grow (e.g., `session.facade.ts`, `password.facade.ts`)
- Maintain each facade as the single entry point for its domain area

**Required Folder Structure:**

```
application/facades/
├── auth/
│   └── auth.facade.ts
├── users/
│   └── users.facade.ts
└── roles/
    └── roles.facade.ts
```

You WILL implement facades that:

- Serve as the **only** entry point from Presentation layer to Application layer
- Manage reactive state using Angular Signals or Observables
- Call appropriate use cases and update state based on results
- Provide loading states, error states, and data states for UI consumption
- Handle state synchronization and cache invalidation

You MUST ensure facades:

- Contain no orchestration logic - only use case invocation and state updates
- Expose reactive state through Signals or Observables for UI subscription
- Provide clear, focused APIs that match UI needs
- Handle all error scenarios with appropriate user-friendly error states
- Maintain state consistency across multiple UI components

**Example Facade Implementation:**

```typescript
// ✅ CORRECT - State management and use case coordination
@Injectable()
export class AuthFacade {
  // State signals for reactive UI
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _isAuthenticated = computed(() => this._currentUser() !== null);

  // Public readonly state
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase
  ) {}

  async login(credentials: LoginCredentials): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await this.loginUseCase.execute(credentials);

      if (result.isSuccess()) {
        this._currentUser.set(result.value.getUser());
      } else {
        this._error.set(result.error.message);
      }
    } catch (error) {
      this._error.set('An unexpected error occurred during login');
    } finally {
      this._isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    this._isLoading.set(true);

    try {
      await this.logoutUseCase.execute();
      this._currentUser.set(null);
      this._error.set(null);
    } catch (error) {
      this._error.set('Failed to logout properly');
    } finally {
      this._isLoading.set(false);
    }
  }
}
```

### `/services` - Cross-Cutting Application Logic

You WILL create application services for:

- Operations that coordinate multiple domains but aren't core use cases
- Complex data transformations that span multiple entities
- Report generation and export operations
- Batch processing operations
- Complex validation that requires multiple repository calls

You MUST ensure application services:

- Focus on application-level concerns, not domain business rules
- Coordinate multiple use cases or repositories when necessary
- Remain stateless and focused on a single responsibility
- Use dependency injection for all external dependencies

**Example Application Service:**

```typescript
// ✅ CORRECT - Application-level coordination service
@Injectable()
export class RoleExportReportService {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userRepository: IUserRepository,
    private readonly exportRepository: IExportRepository,
    private readonly roleExportMapper: RoleExportMapper
  ) {}

  async generateRoleReport(criteria: ExportCriteria): Promise<ExportResult> {
    // Step 1: Fetch roles using domain repository
    const roles = await this.roleRepository.findByCriteria(criteria);

    // Step 2: Fetch related users for each role
    const roleData = await Promise.all(
      roles.map(async (role) => ({
        role,
        users: await this.userRepository.findByRole(role.getId()),
      }))
    );

    // Step 3: Transform to export format
    const exportData = this.roleExportMapper.toExportFormat(roleData);

    // Step 4: Generate and return export file
    return await this.exportRepository.generateReport(exportData);
  }
}
```

### `/mappers` - Domain to Application Transformation

You WILL create mappers that:

- Convert Domain entities to Application layer data structures
- Transform Domain objects to state models used by Facades
- Prepare data for specific Application layer needs
- Handle complex object graph transformations

You MUST distinguish Application mappers from Infrastructure mappers:

- **Infrastructure mappers**: DTO ↔ Domain Entity
- **Application mappers**: Domain Entity ↔ Application State/View Model

**Example Application Mapper:**

```typescript
// ✅ CORRECT - Domain to Application state transformation
@Injectable()
export class UserStateMapper {
  toUserState(user: User): UserState {
    return {
      id: user.getId().toString(),
      email: user.getEmail().toString(),
      fullName: `${user.getFirstName()} ${user.getLastName()}`,
      isActive: user.isActive(),
      roleNames: user.getRoles().map((role) => role.getName()),
      lastLoginAt: user.getLastLoginAt()?.toISOString() || null,
    };
  }

  toUserList(users: User[]): UserListState {
    return {
      users: users.map((user) => this.toUserState(user)),
      totalCount: users.length,
      activeCount: users.filter((user) => user.isActive()).length,
    };
  }
}
```

### `/errors` - Application Error Management

You WILL create error handling components for:

- `ApplicationError`: Base class for Application layer errors
- `ApplicationErrorTransformer`: Converts lower-layer errors to Application errors
- Error types specific to use case failures
- Error context preservation for debugging

You MUST ensure error handling:

- Translates Domain and Infrastructure errors to user-appropriate messages
- Preserves technical details for logging while providing safe messages for UI
- Includes sufficient context for troubleshooting
- Follows consistent error structure across all use cases

### `/types` - Application Data Contracts

You WILL define types for:

- Use case input and output parameters
- Facade state structures
- Application-specific data transfer objects
- Result types and operation outcomes

You MUST ensure types:

- Are specific to Application layer needs
- Support type safety across use cases and facades
- Include proper generic constraints where applicable
- Are documented with clear purpose and usage

## Implementation Standards

### Use Case Pattern Requirements

You WILL implement use cases following this pattern:

```typescript
// Required use case structure
@Injectable()
export class [Action]UseCase {
  constructor(
    // Domain repository interfaces only
    private readonly repository: IRepository,
    private readonly logger: ILogger
  ) {}

  async execute(input: InputType): Promise<Result<OutputType>> {
    try {
      // 1. Input validation (delegate to Domain objects)
      // 2. Retrieve entities using repositories
      // 3. Execute domain logic through entity methods
      // 4. Persist changes through repositories
      // 5. Return structured result
    } catch (error) {
      // Convert to ApplicationError with proper context
    }
  }
}
```

### State Management Standards

You WILL implement reactive state management in facades using:

- Angular Signals for state that needs computed values
- RxJS Observables for complex async operations
- Clear separation between private mutable state and public readonly state
- Proper error state management with user-friendly messages
- Loading states for all async operations

### Dependency Injection Requirements

You MUST use proper dependency injection:

- Inject Domain repository interfaces, never concrete implementations
- Use Angular's `@Injectable()` decorator on all Application layer classes
- Inject Core layer services through their interfaces
- Never inject Infrastructure services directly
- Use injection tokens for configuration values

## Integration Guidelines

### Coordination with Domain Layer

You WILL ensure proper Domain coordination by:

- Using only Domain repository interfaces for data access
- Calling Domain entity methods for all business logic execution
- Never implementing business rules in use cases
- Delegating all validation to Domain objects
- Handling Domain errors appropriately

### Coordination with Infrastructure Layer

You WILL coordinate with Infrastructure through:

- Domain repository interfaces that Infrastructure implements
- Dependency injection to receive Infrastructure implementations
- Error handling that gracefully manages Infrastructure failures
- Configuration injection for Infrastructure-specific settings

### Serving the Presentation Layer

You WILL provide Presentation layer services through:

- Facades as the single entry point for all Application operations
- Reactive state management for real-time UI updates
- Clear error states that UI can display to users
- Loading states for all async operations
- Type-safe APIs that prevent UI programming errors

## Anti-Pattern Prevention

### ABSOLUTE PROHIBITIONS

You NEVER:

- Implement business rules or domain logic in use cases or facades
- Import anything from `@angular/common/http` or browser APIs
- Import anything from the Presentation layer
- Use concrete Infrastructure implementations directly
- Write conditional logic that represents business rules (e.g., `if (user.age > 18)`)
- Mix state management concerns with orchestration logic
- Create facades that directly manipulate Domain entities

### Common Mistakes to Avoid

**❌ WRONG - Business logic in use case:**

```typescript
// Never implement business rules in Application layer
export class CreateUserUseCase {
  async execute(userData: CreateUserData): Promise<Result<User>> {
    // ❌ Business validation doesn't belong here
    if (userData.age < 18) {
      return Result.fail('User must be 18 or older');
    }

    // ❌ Business rule implementation doesn't belong here
    const defaultRole = userData.isAdmin ? 'admin' : 'user';

    const user = User.create(userData.email, userData.name, defaultRole);
    await this.userRepository.save(user);
    return Result.ok(user);
  }
}
```

**❌ WRONG - Facade with orchestration logic:**

```typescript
// Facades should not contain orchestration - only state management
export class UserFacade {
  async createUser(userData: CreateUserData): Promise<void> {
    // ❌ This orchestration belongs in a use case
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      this._error.set('User already exists');
      return;
    }

    const user = User.create(userData);
    await this.userRepository.save(user);
    this._users.update((users) => [...users, user]);
  }
}
```

**❌ WRONG - Direct Infrastructure dependency:**

```typescript
// Never import Infrastructure implementations directly
import { HttpUserRepository } from '../infrastructure/repositories/http-user.repository';

export class UserManagementUseCase {
  constructor(
    private readonly userRepo: HttpUserRepository // ❌ Should use IUserRepository interface
  ) {}
}
```

**✅ CORRECT - Proper Application layer implementation:**

```typescript
// Use case with pure orchestration
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger: ILogger
  ) {}

  async execute(userData: CreateUserData): Promise<Result<User>> {
    try {
      // Let Domain handle all validation and business rules
      const user = User.create(userData.email, userData.name, userData.role);

      await this.userRepository.save(user);

      this.logger.info('User created successfully', { userId: user.getId() });
      return Result.ok(user);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      return Result.fail(new ApplicationError('User creation failed', error));
    }
  }
}
```

## Validation Criteria

### Code Review Checklist

You MUST verify that Application code:

- [ ] Contains zero business logic or domain rules
- [ ] Uses only Domain repository interfaces for data access
- [ ] Implements proper error handling with ApplicationError types
- [ ] Provides reactive state management through facades
- [ ] Uses dependency injection for all external dependencies
- [ ] Separates orchestration logic (use cases) from state management (facades)
- [ ] Includes comprehensive logging for debugging and monitoring
- [ ] Never imports from Presentation, Infrastructure concrete classes, or browser APIs
- [ ] Follows the single responsibility principle for each use case
- [ ] Provides proper transaction management for multi-step operations

### Quality Gates

You WILL ensure Application implementations:

- **Orchestration Clarity**: Use cases read like clear, sequential instructions
- **State Consistency**: Facades maintain consistent state across all UI interactions
- **Error Resilience**: All failure scenarios are handled with appropriate user feedback
- **Performance Acceptable**: Use cases complete within reasonable time limits
- **Type Safety**: All operations are type-safe with clear input/output contracts

### Success Indicators

Your Application implementation is successful when:

- Business logic changes don't require Application layer modifications
- Use cases can be understood by non-technical stakeholders
- UI components can reactively respond to all state changes
- Error scenarios provide meaningful feedback to users
- The Application layer serves as a clean contract between UI and Domain
- New features can be added by composing existing use cases
- Testing can be done with minimal mocking (only repository interfaces)

### Testing Requirements

You MUST implement tests that:

- Verify use case orchestration logic without testing business rules
- Test facade state management with various success and error scenarios
- Mock only Domain repository interfaces, never concrete implementations
- Validate error handling and transformation from lower layers
- Test reactive state updates and UI integration points
- Ensure proper transaction behavior for multi-step operations

---

**Remember**: The Application layer is the conductor of your architecture orchestra. It coordinates all the instruments (Domain and Infrastructure) but never plays the music itself (business logic). Keep it focused on orchestration, state management, and serving as the bridge between your UI and business logic.
