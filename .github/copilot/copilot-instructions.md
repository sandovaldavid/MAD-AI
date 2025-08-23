# GitHub Copilot Instructions for MAD-AI Project

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always detect and respect the exact versions of languages, frameworks, and libraries used in this project
2. **Context Files**: Prioritize patterns and standards defined in the .github/instructions directory
3. **Codebase Patterns**: When context files don't provide specific guidance, scan the codebase for established patterns
4. **Architectural Consistency**: Maintain our Clean Architecture style and established layer boundaries
5. **Code Quality**: Prioritize maintainability, performance, security, accessibility, and testability in all generated code

## Technology Version Detection

Before generating code, scan the codebase to identify:

### Language Versions

-   **TypeScript**: ~5.8.2 (as defined in package.json)
-   **Target**: ES2022 (as configured in tsconfig.json)
-   **Module**: preserve (as configured in tsconfig.json)
-   **Strict mode**: enabled with enhanced type checking (noImplicitReturns, noFallthroughCasesInSwitch, etc.)

### Framework Versions

-   **Angular**: ^20.1.6 (latest Angular version with standalone components)
-   **Angular CLI**: ^20.0.2
-   **Angular SSR**: ^20.0.2 (Server-Side Rendering enabled)
-   **RxJS**: ~7.8.0
-   **Zone.js**: ~0.15.0

### Key Libraries

-   **Tailwind CSS**: ^4.1.11 (with PostCSS ^8.5.6)
-   **Chart.js**: ^4.5.0 with ng2-charts ^8.0.0
-   **jsPDF**: ^3.0.1 with jspdf-autotable ^5.0.2
-   **PapaParse**: ^5.5.3 for CSV processing
-   **Express**: ^5.1.0 for SSR server

### Testing Framework

-   **Jasmine**: ~5.7.0
-   **Karma**: ~6.4.0
-   **Puppeteer**: ^24.16.1 for E2E testing

## Context Files

Prioritize the following files in .github/instructions directory:

-   **angular.instructions.md**: Angular-specific coding standards and best practices
-   **style-guide.instructions.md**: Comprehensive Tailwind CSS v4.1 guidelines and color palette usage

## Clean Architecture Implementation

This project follows a strict Clean Architecture pattern with clear layer boundaries:

### Domain Layer (`src/app/domain/`)

-   **Entities**: Rich domain objects with business logic and invariants
-   **Value Objects**: Immutable objects representing domain concepts
-   **Repositories**: Abstract contracts for data access
-   **Events**: Domain events for cross-cutting concerns
-   **Errors**: Domain-specific error types and validation

**Patterns to Follow**:

```typescript
// Entity pattern with factory methods and domain events
export class User {
    private _domainEvents: DomainEvent[] = [];

    private constructor(
        public readonly id: number,
        private _username: Username
    ) // ... other properties
    {}

    static create(props: CreateUserProps): User {
        // Factory method with validation
    }
}

// Value Object pattern
export class Email {
    private constructor(private readonly _value: string) {}

    static create(value: string): Email {
        // Validation logic
        return new Email(value);
    }
}
```

### Application Layer (`src/app/application/`)

-   **Use Cases**: Single-responsibility business operations
-   **Facades**: Coordinating services that orchestrate use cases
-   **Types**: Application-specific type definitions
-   **Services**: Cross-cutting application services

**Patterns to Follow**:

```typescript
// Use Case pattern
@Injectable()
export class LoginWithCredentials {
    constructor(
        @Inject(AUTH_REPOSITORY) private authRepository: AuthRepository,
        @Inject(TOKEN_STORE_PORT) private tokenStore: TokenStorePort
    ) {}

    async execute(credentials: CredentialsContract): Promise<Session> {
        // Business logic implementation
    }
}

// Facade pattern with Angular Signals
@Injectable()
export class AuthFacade {
    private loginUseCase = inject(LoginWithCredentials);

    loading = signal(false);
    user = signal<User | null>(null);
    error = signal<string | null>(null);

    async login(credentials: LoginRequest): Promise<void> {
        // Orchestration logic
    }
}
```

### Infrastructure Layer (`src/app/infrastructure/`)

-   **Repositories**: Concrete implementations of domain repository contracts
-   **DTOs**: Data Transfer Objects for external APIs
-   **Mappers**: Transform between DTOs and domain entities
-   **HTTP**: HTTP clients and interceptors
-   **Services**: Infrastructure-specific services (storage, clock, etc.)

**Patterns to Follow**:

```typescript
// Repository implementation
@Injectable()
export class HttpAuthRepository implements AuthRepository {
    constructor(
        private http: HttpClient,
        @Inject(TOKEN_STORE_PORT) private tokenStore: TokenStorePort
    ) {}

    async login(credentials: CredentialsContract): Promise<Session> {
        const dto = await firstValueFrom(
            this.http.post<LoginResponseDTO>('/api/auth/login', credentials)
        );
        return SessionMapper.toDomain(dto);
    }
}
```

### Presentation Layer (`src/app/presentation/`)

-   **Features**: Feature-specific modules organized by domain
-   **Components**: Reusable UI components
-   **Pages**: Route-level components
-   **Forms**: Reactive forms with validation
-   **Layouts**: Application layout components

**Patterns to Follow**:

```typescript
// Component pattern with OnPush strategy and Signal injection
@Component({
    selector: 'app-login',
    templateUrl: './login.html',
    styleUrl: './login.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoginForm],
})
export class Login implements OnInit {
    auth = inject(AuthFacade);

    ngOnInit(): void {
        this.auth.clearAuthState();
    }
}
```

### Dependency Injection (`src/app/di/`)

**Patterns to Follow**:

```typescript
// Provider functions with token-based injection
export function provideAuth(): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
        { provide: TOKEN_STORE_PORT, useClass: LocalStorageTokenStore },
        // ... other providers
    ]);
}
```

## Path Aliases Configuration

Use the following path aliases consistently:

```typescript
// Path mappings from tsconfig.json
"@/*": ["src/*"]
"@app/*": ["src/app/*"]
"@styles/*": ["src/styles/*"]
"@components/*": ["src/app/presentation/shared/components/*"]
"@core/*": ["src/app/core/*"]
"@domain/*": ["src/app/domain/*"]
"@infrastructure/*": ["src/app/infrastructure/*"]
"@presentation/*": ["src/app/presentation/*"]
"@application/*": ["src/app/application/*"]
"@shared/*": ["src/app/shared/*"]
"@env/*": ["src/env/*"]
"@icons/*": ["src/app/presentation/shared/icons/*"]
"@di/*": ["src/app/di/*"]
"@types/*": ["src/types/*"]
"@test/*": ["src/app/test/*"]
```

## Code Quality Standards

### Maintainability

-   Write self-documenting code with descriptive variable and method names
-   Follow the established naming conventions: PascalCase for classes/components, camelCase for methods/properties
-   Use dependency injection tokens for all external dependencies
-   Keep components focused on presentation logic, delegate business logic to facades
-   Maintain clear separation between layers (domain, application, infrastructure, presentation)

### Performance

-   Use `ChangeDetectionStrategy.OnPush` for all components
-   Implement Angular Signals for reactive state management
-   Use `firstValueFrom()` for converting Observables to Promises in use cases
-   Leverage Angular's built-in lazy loading for feature modules
-   Use `trackBy` functions for `*ngFor` directives when rendering lists

### Security

-   Validate all input using domain value objects with static factory methods
-   Use parameterized HTTP requests with DTOs
-   Implement authentication interceptors for API calls
-   Store sensitive data using dedicated port abstractions (TokenStorePort, SessionStorePort)
-   Never include credentials or tokens in component state

### Accessibility

-   Follow semantic HTML structure with proper heading hierarchy
-   Use ARIA attributes consistently with existing components
-   Implement keyboard navigation support for interactive elements
-   Follow the color palette from `src/styles/colors.css` for sufficient contrast
-   Include focus indicators and screen reader support

### Testability

-   Use dependency injection with tokens for all external dependencies
-   Create mock implementations for ports in tests
-   Follow the testing patterns established in `*.spec.ts` files
-   Use TestBed.configureTestingModule with standalone components
-   Test component behavior through facade methods, not implementation details

## Documentation Requirements

-   Document public APIs using JSDoc comments with parameter and return types
-   Include usage examples for complex domain entities and value objects
-   Document architectural decisions in code comments when deviating from patterns
-   Use descriptive commit messages following conventional commit format
-   Maintain inline comments for business logic and domain rules

## Testing Approach

### Unit Testing

-   Test components using Angular TestBed with standalone component imports
-   Mock facades and use cases using jasmine spies
-   Follow the AAA pattern: Arrange, Act, Assert
-   Test both positive and negative scenarios for domain entities
-   Use descriptive test names that explain the expected behavior

**Testing Pattern**:

```typescript
describe('ComponentName', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ComponentName], // standalone components
        }).compileComponents();
    });

    it('should create the component', () => {
        const fixture = TestBed.createComponent(ComponentName);
        expect(fixture.componentInstance).toBeTruthy();
    });
});
```

### Integration Testing

-   Test use case interactions with mocked repositories
-   Verify facade orchestration logic with multiple use cases
-   Test HTTP repository implementations with mocked HTTP client
-   Validate domain entity business rules and invariants

## Angular-Specific Guidelines

### Component Standards

-   Use standalone components by default (Angular 20+)
-   Import only necessary modules in the `imports` array
-   Use `inject()` function for dependency injection instead of constructor injection
-   Implement `OnPush` change detection strategy for all components
-   Use Angular Signals for reactive state management

### State Management with Signals

-   Use `signal()` for mutable state in facades and services
-   Use `computed()` for derived state calculations
-   Use `effect()` sparingly for side effects, prefer explicit method calls
-   Keep signal state in application facades, not in components
-   Update signals using `.set()` for replacement or `.update()` for transformation

### Forms and Validation

-   Use reactive forms with FormBuilder and FormGroup
-   Implement custom validators for domain-specific validation rules
-   Bind form controls to domain value objects for type safety
-   Handle form submission through facade methods

### HTTP and Data Flow

-   Use HttpClient with typed response interfaces (DTOs)
-   Transform DTOs to domain entities using mapper classes
-   Handle errors using global error interceptors
-   Implement retry logic and loading states in facades

### Routing and Navigation

-   Use feature-based routing with lazy loading
-   Implement route guards for authentication and authorization
-   Use typed route parameters and query strings
-   Handle navigation errors gracefully

## Tailwind CSS v4.1 Guidelines

### Color Usage (Mandatory)

-   **ONLY** use colors defined in `src/styles/colors.css`
-   **NEVER** use direct hex codes, RGB values, or arbitrary color values
-   **NEVER** use Tailwind's default color palette (e.g., `bg-blue-500`, `text-red-600`)

### Available Color Scales

```css
/* Use these color utilities consistently */
primary-50, primary-100, ..., primary-950    /* Main actions and branding */
secondary-50, secondary-100, ..., secondary-950  /* Supporting elements */
tertiary-50, tertiary-100, ..., tertiary-950     /* Accents and highlights */
neutral-50, neutral-100, ..., neutral-950        /* Text, borders, backgrounds */
successful-50, successful-100, ..., successful-950  /* Success states */
error-50, error-100, ..., error-950             /* Error states */
warning-50, warning-100, ..., warning-950       /* Warning states */
info-50, info-100, ..., info-950               /* Information states */
white, black                                    /* Base colors */
```

### Component Styling Patterns

```css
/* Button components */
.btn-primary {
    @apply bg-primary-500 text-white hover:bg-primary-700 focus:ring-primary-300;
}

/* Form inputs */
.input-default {
    @apply border-neutral-300 focus:border-primary-500 focus:ring-primary-200;
}

/* Cards and containers */
.card {
    @apply bg-white border border-neutral-200 rounded-lg shadow-sm;
}
```

## Project-Specific Patterns

### Error Handling

-   Use domain-specific error types extending base error classes
-   Transform infrastructure errors to domain errors using mapper classes
-   Display user-friendly error messages through notification facade
-   Log technical errors using global error handler

### Authentication Flow

-   Use session-based authentication with JWT tokens
-   Store tokens securely using LocalStorageTokenStore
-   Implement automatic token refresh with HTTP interceptors
-   Handle authentication state through AuthFacade signals

### Data Export Features

-   Use jsPDF for PDF generation with jspdf-autotable for tables
-   Implement CSV export using PapaParse library
-   Handle large datasets with streaming or pagination
-   Provide user feedback during export operations

### Icons and Assets

-   Use SVG icons with custom icon service
-   Implement icon variants (outline, filled) with configuration
-   Store static assets in `public/` directory
-   Use lazy loading for images and heavy assets

## Version Control Guidelines

-   Follow semantic versioning for releases
-   Use conventional commit messages (feat:, fix:, docs:, etc.)
-   Document breaking changes in commit messages
-   Tag releases with version numbers

## General Best Practices

-   Follow TypeScript strict mode settings from tsconfig.json
-   Use meaningful variable and function names that express business intent
-   Implement comprehensive error handling with domain-specific error types
-   Keep components lightweight and delegate business logic to application layer
-   Use Angular's built-in features (DI, change detection, lifecycle hooks) effectively
-   Maintain consistent code formatting using Prettier and ESLint
-   Write tests that focus on behavior rather than implementation details
-   Document complex business rules and architectural decisions

## Project Structure Enforcement

When creating new files, follow this structure:

```
src/app/
├── domain/           # Business entities, value objects, contracts
├── application/      # Use cases, facades, application services
├── infrastructure/   # External concerns (HTTP, storage, etc.)
├── presentation/     # UI components, pages, forms
├── core/            # Cross-cutting concerns (guards, interceptors)
├── di/              # Dependency injection configuration
└── shared/          # Shared utilities and types
```

Remember: Always prioritize consistency with existing code patterns over external best practices. When in doubt, examine similar files in the codebase and follow their structure and naming conventions.
