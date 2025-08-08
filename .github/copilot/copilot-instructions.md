# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always detect and respect the exact versions of languages, frameworks, and libraries used in this project
2. **Context Files**: Prioritize patterns and standards defined in the .github/copilot directory
3. **Codebase Patterns**: When context files don't provide specific guidance, scan the codebase for established patterns
4. **Architectural Consistency**: Maintain our Clean Architecture style and established boundaries
5. **Code Quality**: Prioritize maintainability, performance, security, accessibility, and testability in all generated code

## Technology Version Detection

Before generating code, scan the codebase to identify:

1. **Language Versions**: 
   - TypeScript ~5.8.2 (strict mode enabled)
   - Target: ES2022 with preserve module mode
   - Experimental decorators enabled
   - Strict TypeScript configuration with noImplicitReturns and noFallthroughCasesInSwitch

2. **Framework Versions**:
   - Angular ^20.0.0 (all Angular packages)
   - Angular CLI ^20.0.2
   - Angular SSR ^20.0.2
   - RxJS ~7.8.0
   - Express ^5.1.0 (for SSR)

3. **Library Versions**:
   - TailwindCSS ^4.1.11 with PostCSS ^8.5.6
   - Zone.js ~0.15.0
   - Jasmine ~5.7.0 and Karma ~6.4.0 for testing
   - TypeScript types for Express ^5.0.1 and Node ^20.17.19

## Context Files

Prioritize the following files in .github/copilot directory:

- **architecture.md**: Clean Architecture guidelines with domain-driven design
- **tech-stack.md**: Angular 20.x technology stack details
- **folder-structure.md**: Layer-based project organization guidelines
- **exemplars.md**: Exemplary code patterns following Clean Architecture
- **Project_Workflow_Documentation.md**: User workflows and implementation patterns

## Codebase Scanning Instructions

When context files don't provide specific guidance:

1. Identify similar files to the one being modified or created
2. Analyze patterns for:
   - Path alias usage (@app/*, @core/*, @domain/*, @infrastructure/*, @presentation/*, @application/*, @shared/*, @env/*)
   - Clean Architecture layer separation
   - Dependency injection with inject() function
   - Signal-based reactive state management
   - OnPush change detection strategy
   - Repository pattern implementation
   
3. Follow the most consistent patterns found in the codebase
4. When conflicting patterns exist, prioritize patterns in newer files or files with higher test coverage
5. Never introduce patterns not found in the existing codebase

## Clean Architecture Implementation

### Layer Structure and Dependencies
- **Presentation Layer** (`src/app/presentation/`): UI components, pages, layouts
  - Uses OnPush change detection strategy
  - Injects services from core layer
  - Implements Angular components with dedicated .html, .css, .ts files
  - Example: `Dashboard` component structure

- **Application Layer** (`src/app/application/use-cases/`): Business workflows
  - Simple use case classes with execute() methods
  - Injects repositories from domain layer
  - Orchestrates business operations
  - Example: `LoginUseCase.execute(loginData: LoginRequest)`

- **Domain Layer** (`src/app/domain/`): Business entities, repository interfaces
  - Entity classes with business logic (e.g., `UserEntity`)
  - Abstract repository classes defining contracts
  - Domain models and DTOs
  - Enums for domain concepts
  - Never depends on outer layers

- **Infrastructure Layer** (`src/app/infrastructure/`): External concerns
  - Repository implementations extending domain interfaces
  - API clients for external services
  - DTOs for API communication
  - DI tokens and providers

- **Core Layer** (`src/app/core/`): Cross-cutting concerns
  - Services, guards, interceptors
  - Uses signals for reactive state management
  - Injects use cases from application layer

- **Shared Layer** (`src/app/shared/`): Reusable components
  - UI components used across features
  - Common utilities and helpers

### Dependency Rules
- Outer layers depend on inner layers, never the reverse
- Use dependency injection with inject() function
- Repository interfaces defined in domain, implemented in infrastructure
- Use cases in application layer orchestrate domain operations

## Code Quality Standards

### Maintainability
- Write self-documenting code with descriptive names
- Follow kebab-case for files, PascalCase for classes, camelCase for methods/variables
- Use protected readonly for component properties exposed to templates
- Keep functions focused on single responsibilities
- Apply consistent JSDoc comments for complex business logic

### Performance
- Use OnPush change detection strategy for all components
- Leverage Angular signals for reactive state management
- Apply computed() for derived state
- Use RxJS operators efficiently (map, tap, catchError)
- Implement proper subscription management

### Security
- Use Angular's inject() function for dependency injection
- Implement proper input validation in DTOs
- Apply authentication guards for protected routes
- Use HTTP interceptors for cross-cutting security concerns
- Never expose sensitive data in client-side code

### Accessibility
- Follow semantic HTML structure
- Use Angular's built-in accessibility features
- Implement proper focus management
- Ensure keyboard navigation support

### Testability
- Write unit tests using Jasmine and Karma
- Mock dependencies using Angular testing utilities
- Test components, services, and use cases independently
- Follow AAA pattern (Arrange, Act, Assert)

## Documentation Requirements

### Comprehensive Documentation Style
- Follow the detailed JSDoc format found in domain entities
- Document all public methods with parameter and return types
- Include usage examples for complex business logic
- Document architectural decisions and design patterns
- Add inline comments for non-obvious business rules

Example Documentation Pattern:
```typescript
/**
 * User entity representing a system user
 * Contains core business logic and validation related to users
 */
export class UserEntity {
    // Core properties with clear naming
    id: number;
    username: string;
    // ... other properties
}
```

## Testing Approach

### Unit Testing
- Use Jasmine for unit test framework
- Use Karma for test runner
- Follow .spec.ts naming convention
- Test components, services, and use cases independently
- Mock external dependencies using Angular testing utilities

### Test Structure Pattern
```typescript
describe('ComponentName', () => {
    let component: ComponentName;
    let fixture: ComponentFixture<ComponentName>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ComponentName]
        }).compileComponents();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
```

## Angular 20.x Specific Guidelines

### Component Structure
- Use standalone components with imports array
- Apply OnPush change detection strategy
- Use inject() function for dependency injection
- Separate template (.html) and styles (.css) files
- Use protected readonly for template-exposed properties

Example Component Pattern:
```typescript
@Component({
    selector: 'app-component-name',
    imports: [CommonModule, OtherComponents],
    templateUrl: './component-name.html',
    styleUrl: './component-name.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentName {
    private readonly service = inject(ServiceName);
    protected readonly data = signal<DataType | null>(null);
}
```

### Service Implementation
- Use providedIn: 'root' for singleton services
- Implement reactive state with signals
- Use computed() for derived state
- Inject dependencies with inject() function
- Return Observables for async operations

Example Service Pattern:
```typescript
@Injectable({
    providedIn: 'root',
})
export class ServiceName {
    private readonly repository = inject(RepositoryInterface);
    private readonly _data = signal<DataType | null>(null);
    
    readonly data = this._data.asReadonly();
    readonly computedData = computed(() => {
        // computation logic
    });
}
```

### Repository Pattern
- Define abstract repository classes in domain layer
- Implement concrete repositories in infrastructure layer
- Use inject() for API client dependencies
- Apply RxJS operators for data transformation
- Map API DTOs to domain entities

Example Repository Pattern:
```typescript
// Domain Repository Interface
export abstract class EntityRepository {
    abstract getEntities(): Observable<EntityType[]>;
}

// Infrastructure Implementation
@Injectable({
    providedIn: 'root',
})
export class EntityRepositoryImpl extends EntityRepository {
    private readonly apiClient = inject(EntityApiClient);
    
    getEntities(): Observable<EntityType[]> {
        return this.apiClient.getEntities().pipe(
            map(dtos => dtos.map(dto => new EntityType(dto)))
        );
    }
}
```

### Path Aliases Usage
Always use configured path aliases:
- `@app/*` for src/app/*
- `@core/*` for src/app/core/*
- `@domain/*` for src/app/domain/*
- `@infrastructure/*` for src/app/infrastructure/*
- `@presentation/*` for src/app/presentation/*
- `@application/*` for src/app/application/*
- `@shared/*` for src/app/shared/*
- `@env/*` for src/env/*

### RxJS Patterns
- Use RxJS ~7.8.0 operators consistently
- Apply proper error handling with catchError
- Use tap for side effects
- Implement proper subscription management
- Leverage signals for state management instead of BehaviorSubject

### SSR Considerations
- Use isPlatformBrowser for browser-specific code
- Inject PLATFORM_ID for platform detection
- Handle server-side rendering gracefully
- Avoid direct DOM manipulation

## Environment Configuration

### Development Environment
- API_URL: 'http://localhost:8000/api/v1'
- Production flag: false for development

### Configuration Pattern
```typescript
export const environment = {
    production: boolean,
    API_URL: string,
};
```

## Styling Guidelines

### TailwindCSS 4.x Usage
- Use TailwindCSS utility classes
- Follow PostCSS configuration
- Organize styles in separate .css files
- Use CSS custom properties for theming

### Component Styling Structure
- Global styles in src/styles.css
- Component-specific styles in component.css files
- Shared styles in src/styles/ directory
- Use TailwindCSS utilities for rapid development

## General Best Practices

### Naming Conventions
- Files: kebab-case (user-list.component.ts)
- Classes: PascalCase (UserEntity)
- Methods/Variables: camelCase (getUserData)
- Constants: SCREAMING_SNAKE_CASE (API_ENDPOINTS)
- Interfaces: Descriptive names without "I" prefix

### Code Organization
- Group related functionality by feature
- Maintain clear layer boundaries
- Use barrel exports (index.ts) for clean imports
- Keep components focused and reusable

### Error Handling
- Use RxJS catchError operator for async error handling
- Implement proper error logging
- Provide user-friendly error messages
- Handle both client and server errors gracefully

### Version Control
- Follow semantic versioning patterns
- Document breaking changes clearly
- Use conventional commit messages
- Maintain clean git history

## Project-Specific Guidance

### Clean Architecture Enforcement
- Never violate layer dependencies
- Always inject abstractions, not implementations
- Keep domain layer pure of external dependencies
- Use use cases to orchestrate business operations

### Angular SSR Implementation
- Handle platform detection properly
- Implement proper hydration strategies
- Avoid browser-specific APIs in SSR context
- Use Angular Universal best practices

### State Management
- Prefer Angular signals over traditional observables for state
- Use computed() for derived state
- Implement proper reactive patterns
- Avoid direct state mutation

### API Integration
- Use repository pattern for data access
- Map API DTOs to domain entities
- Implement proper error handling
- Use environment configuration for API endpoints

## Important Notes

- Prioritize consistency with existing code over external best practices
- Always respect the established Clean Architecture boundaries
- Use the exact technology versions specified in package.json
- Follow the path alias configuration defined in tsconfig.json
- Maintain the existing component and service structure patterns
- Apply the established naming conventions throughout the codebase
