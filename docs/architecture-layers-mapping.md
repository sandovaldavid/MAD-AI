# Architecture Layers Mapping

## Clean Architecture Implementation Overview

The MAD-AI project implements a sophisticated Clean Architecture pattern with Domain-Driven Design (DDD) principles. The architecture follows strict dependency rules and clear layer separation.

## Layer Hierarchy and Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ├─ Angular Components (UI Views)                           │
│  ├─ Pages (Route Components)                                │
│  ├─ Layouts (Application Structure)                         │
│  └─ Navigation (Routing & Guards)                           │
└─────────────────────────────────────────────────────────────┘
                                │ (depends on)
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│  ├─ Facades (State Management & Coordination)               │
│  ├─ Use Cases (Business Workflow Orchestration)             │
│  ├─ Services (Cross-cutting Application Concerns)           │
│  └─ Error Transformers (Application Error Handling)         │
└─────────────────────────────────────────────────────────────┘
                                │ (depends on)
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                          │
│  ├─ Entities (Rich Business Objects with Behavior)          │
│  ├─ Value Objects (Immutable Domain Primitives)             │
│  ├─ Contracts (Repository & Service Interfaces)             │
│  ├─ Events (Domain Event Definitions)                       │
│  └─ Errors (Domain-specific Error Types)                    │
└─────────────────────────────────────────────────────────────┘
                                │ (implemented by)
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                      │
│  ├─ HTTP Repositories (API Implementation)                  │
│  ├─ DTOs (Data Transfer Objects)                            │
│  ├─ Mappers (Entity ↔ DTO Transformation)                   │
│  └─ External Services (Third-party Integration)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Core Layer                           │
│  ├─ Guards (Route Protection)                               │
│  ├─ Interceptors (HTTP Middleware)                          │
│  ├─ Utilities (Shared Technical Concerns)                   │
│  └─ UI State (Cross-cutting State Management)               │
└─────────────────────────────────────────────────────────────┘
```

## Layer Definitions and Responsibilities

### 1. Domain Layer (`src/app/domain/`)
**Position**: Innermost layer (center of the architecture)
**Dependencies**: None (framework-agnostic)
**Path Alias**: `@domain/*`

**Structure**:
```
domain/
├── contracts/              # Repository & service interfaces
├── entities/               # Rich business entities with behavior  
├── value-objects/          # Immutable domain primitives
├── events/                 # Domain event definitions
├── errors/                 # Domain-specific errors
├── enums/                  # Domain enumerations
└── repositories/           # Repository interface definitions
```

**Key Responsibilities**:
- Core business logic and rules
- Domain entities with encapsulated behavior
- Business validation and invariants
- Repository and service contracts
- Domain event definitions

**Architectural Rules**:
- No dependencies on any other layer
- No framework-specific imports (Angular, RxJS, etc.)
- Pure TypeScript business logic
- Interface definitions for external concerns

**Example Implementation**:
```typescript
// Rich domain entity with business logic
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly role: Role,
    public readonly isActive: boolean
  ) {}
  
  // Business rule implementation
  canAccessResource(resource: Resource): boolean {
    return this.isActive && 
           this.role.hasPermission(resource.requiredPermission);
  }
  
  // Domain validation
  static create(params: CreateUserParams): User {
    if (!params.email || !this.isValidEmail(params.email)) {
      throw new DomainError('Invalid email address');
    }
    
    return new User(params.id, params.email, params.role, params.isActive ?? true);
  }
}
```

### 2. Application Layer (`src/app/application/`)
**Position**: Orchestration layer
**Dependencies**: Domain layer only
**Path Alias**: `@application/*`

**Structure**:
```
application/
├── facades/                # State management & coordination
├── use-cases/              # Business workflow implementations
├── services/               # Application-level services
├── errors/                 # Application error handling
└── types/                  # Application-specific types
```

**Key Responsibilities**:
- Business workflow orchestration
- Application state management with Angular signals
- Use case coordination
- Error transformation for presentation layer
- Cross-facade communication

**Architectural Rules**:
- Can only depend on domain layer
- Orchestrates but doesn't implement business logic
- Provides reactive state management
- Transforms domain errors to application errors

**Example Implementation**:
```typescript
// Facade pattern with reactive state management
@Injectable({ providedIn: 'root' })
export class UsersFacade {
  private readonly useCase = inject(CreateUser);
  private readonly notifications = inject(NotificationsFacade);
  
  // Private state signals
  private readonly _loading = signal(false);
  private readonly _users = signal<User[]>([]);
  private readonly _error = signal<ApplicationError | null>(null);
  
  // Public computed signals
  readonly loading = computed(() => this._loading());
  readonly users = computed(() => this._users());
  readonly error = computed(() => this._error());
  
  async createUser(request: CreateUserRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const user = await this.useCase.execute(request);
      this._users.update(users => [...users, user]);
      await this.notifications.success('User created successfully');
    } catch (error) {
      this._error.set(this.transformError(error));
    } finally {
      this._loading.set(false);
    }
  }
}
```

### 3. Infrastructure Layer (`src/app/infrastructure/`)
**Position**: Implementation layer
**Dependencies**: Domain layer contracts only
**Path Alias**: `@infrastructure/*`

**Structure**:
```
infrastructure/
├── repositories/           # Repository implementations (HTTP)
├── dtos/                   # Data transfer objects
├── mappers/                # Entity ↔ DTO transformation
├── services/               # External service implementations
└── errors/                 # Infrastructure error handling
```

**Key Responsibilities**:
- Implementation of domain repository contracts
- External API communication
- Data transformation (DTO ↔ Entity mapping)
- Third-party service integration
- Infrastructure error handling

**Architectural Rules**:
- Implements domain contracts only
- No direct dependencies on application or presentation
- Registered through dependency injection in `@di/*`
- Contains no business logic

**Example Implementation**:
```typescript
// HTTP repository implementation
@Injectable()
export class HttpUserRepository implements UserRepository {
  private http = inject(HttpClient);
  private errorMapper = inject(InfraErrorToDomainMapper);
  
  async getById(id: number): Promise<User> {
    try {
      const dto = await firstValueFrom(
        this.http.get<UserResponseDTO>(`/api/users/${id}`)
      );
      
      return UserMapper.toEntityFromDTO(dto);
    } catch (error) {
      throw this.errorMapper.mapError(error, 'GET_USER');
    }
  }
  
  async save(user: User): Promise<void> {
    try {
      const dto = UserMapper.toDTOFromEntity(user);
      await firstValueFrom(
        this.http.put<void>(`/api/users/${user.id}`, dto)
      );
    } catch (error) {
      throw this.errorMapper.mapError(error, 'SAVE_USER');
    }
  }
}
```

### 4. Presentation Layer (`src/app/presentation/`)
**Position**: Outermost layer
**Dependencies**: Application layer only
**Path Alias**: `@presentation/*`

**Structure**:
```
presentation/
├── features/               # Business feature implementations
├── layouts/                # Application layouts
├── navigation/             # Navigation components
├── shell/                  # Application shell
└── shared/                 # Shared UI components
```

**Key Responsibilities**:
- User interface and interaction management
- Form handling and validation
- Route-level component coordination
- User experience orchestration
- Angular-specific UI concerns

**Architectural Rules**:
- Can only depend on application facades
- No direct access to domain or infrastructure
- Uses OnPush change detection strategy
- Standalone components with signal-based state

**Example Implementation**:
```typescript
// Standalone component with OnPush change detection
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SharedComponents],
  template: `
    @if (facade.loading()) {
      <app-loading-spinner />
    }
    
    @if (facade.error()) {
      <app-error-display [error]="facade.error()" />
    }
    
    @for (user of facade.users(); track user.id) {
      <app-user-card [user]="user" />
    }
  `
})
export class UserListComponent {
  protected readonly facade = inject(UsersFacade);
  
  ngOnInit(): void {
    this.facade.loadUsers();
  }
}
```

### 5. Core Layer (`src/app/core/`)
**Position**: Cross-cutting concerns
**Dependencies**: May depend on application and domain
**Path Alias**: `@core/*`

**Structure**:
```
core/
├── guards/                 # Route protection
├── interceptors/           # HTTP middleware
├── cross-cutting/          # Shared utilities
└── ui-state/               # Cross-cutting state management
```

**Key Responsibilities**:
- Authentication and authorization guards
- HTTP interceptors for cross-cutting concerns
- Shared technical utilities
- Cross-cutting state management (layout, theme)
- Security implementations

**Architectural Rules**:
- Provides technical utilities, not business logic
- Can depend on application and domain layers
- Should not depend on specific features
- Implements security and cross-cutting concerns

### 6. Dependency Injection Layer (`src/app/di/`)
**Position**: Configuration layer
**Dependencies**: All layers for wiring
**Path Alias**: `@di/*`

**Structure**:
```
di/
├── tokens.ts               # Injection token definitions
├── provide-auth.ts         # Authentication providers
├── provide-users.ts        # User feature providers
├── provide-notifications.ts # Notification providers
└── provide-domain-events.ts # Domain event providers
```

**Key Responsibilities**:
- Dependency injection configuration
- Interface-to-implementation mapping
- Provider function definitions
- Cross-layer dependency wiring

## Dependency Flow Rules

### Strict Dependency Rules
1. **Presentation** → **Application** (facades only)
2. **Application** → **Domain** (contracts and entities)
3. **Infrastructure** → **Domain** (implements contracts)
4. **Core** → **Application + Domain** (cross-cutting concerns)
5. **Domain** → **Nothing** (completely isolated)

### Prohibited Dependencies
- Domain cannot import from any other layer
- Application cannot import from infrastructure or presentation  
- Infrastructure cannot import from application or presentation
- Presentation cannot import from domain or infrastructure directly

### Dependency Injection Enforcement
- All cross-layer dependencies use injection tokens
- Implementations registered in `@di/*` provider functions
- TypeScript path mappings prevent incorrect imports
- Interface contracts enforce proper abstractions

## Communication Patterns

### Cross-Layer Communication
1. **Presentation to Application**: Through facades and use cases
2. **Application to Domain**: Direct entity and contract usage
3. **Application to Infrastructure**: Through injected repository contracts
4. **Domain to Infrastructure**: Via dependency inversion (contracts)

### Event-Driven Communication
- Domain events for side effects
- Application-level event processing
- Cross-facade coordination through event streams
- Real-time updates through reactive patterns

## Architectural Benefits

### Testability
- Each layer can be tested in isolation
- Domain logic is framework-agnostic
- Infrastructure can be mocked through contracts
- Application logic is pure and testable

### Maintainability
- Clear separation of concerns
- Predictable dependency flow
- Framework isolation in outer layers
- Business logic protection in domain

### Scalability
- Independent layer evolution
- Clear extension points
- Modular feature development
- Technology stack flexibility

This layered architecture ensures clean separation of concerns, maintains business logic integrity, and provides a scalable foundation for the MAD-AI application.
