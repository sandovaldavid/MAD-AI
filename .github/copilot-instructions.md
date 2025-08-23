# MAD-AI Project Copilot Instructions

> **Comprehensive development guidelines for GitHub Copilot to maintain consistency in the MAD-AI Angular project**

## Project Overview

**MAD-AI** is a modern Angular 20.1.6 application built with Clean Architecture principles and Domain-Driven Design (DDD) patterns. The project emphasizes type safety, performance, accessibility, and maintainability through sophisticated architectural patterns and modern Angular features.

### Core Technologies

- **Angular**: 20.1.6 (Latest with signals, standalone components, new control flow)
- **TypeScript**: 5.8.2 (ES2022 target with strict mode)
- **Testing**: Jasmine 5.7.0 + Karma 6.4.0 + Puppeteer 24.16.1
- **Build**: Angular CLI with @angular/build:application
- **State Management**: Angular Signals (primary) + RxJS (HTTP operations)

## Architecture Guidelines

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │ ← Components, Pages, Layouts
├─────────────────────────────────────────┤
│            Application Layer            │ ← Facades, Use Cases, Services
├─────────────────────────────────────────┤
│              Domain Layer               │ ← Entities, Value Objects, Events
├─────────────────────────────────────────┤
│           Infrastructure Layer          │ ← Repositories, HTTP, Mappers
└─────────────────────────────────────────┘
```

**Layer Dependencies**: Always depend inward (Presentation → Application → Domain ← Infrastructure)

### Project Structure Pattern

```
src/app/
├── presentation/           # UI Layer
│   ├── features/          # Feature modules (auth, dashboard, users, roles)
│   ├── layouts/           # Layout components (main-layout, auth-layout)
│   ├── navigation/        # Navigation components
│   └── shell/             # Shell components (sidebar, header)
├── application/           # Business Logic Coordination
│   ├── facades/           # State management facades
│   ├── use-cases/         # Business use cases
│   ├── services/          # Application services
│   └── types/             # Application types
├── domain/                # Pure Business Logic
│   ├── entities/          # Domain entities
│   ├── value-objects/     # Domain value objects
│   ├── repositories/      # Repository interfaces
│   ├── events/            # Domain events
│   └── errors/            # Domain errors
├── infrastructure/        # External Concerns
│   ├── repositories/      # Repository implementations
│   ├── http/              # HTTP client implementations
│   ├── mappers/           # DTO ↔ Domain mappers
│   └── services/          # Infrastructure services
├── shared/                # Shared Components
│   ├── components/        # Reusable components
│   ├── ui/                # UI components (button, input, modal)
│   └── types/             # Shared types
├── core/                  # Core Functionality
│   ├── guards/            # Route guards
│   ├── interceptors/      # HTTP interceptors
│   └── cross-cutting/     # Cross-cutting concerns
└── di/                    # Dependency Injection
    ├── tokens.ts          # DI tokens
    └── provide-*.ts       # DI providers
```

## Naming Conventions

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| **Components** | `kebab-case.ts` | `user-list.ts`, `login.ts` |
| **Services/Facades** | `kebab-case.service.ts` | `auth.facade.ts`, `users.facade.ts` |
| **Use Cases** | `kebab-case.use-case.ts` | `login-with-credentials.use-case.ts` |
| **Entities** | `kebab-case.entity.ts` | `user.entity.ts`, `role.entity.ts` |
| **Value Objects** | `kebab-case.value-object.ts` | `email.value-object.ts` |
| **Repositories** | `kebab-case.repository.ts` | `user.repository.ts` |
| **Types** | `kebab-case.types.ts` | `auth.types.ts`, `user.types.ts` |
| **Tests** | `{name}.spec.ts` | `login.spec.ts`, `user.entity.spec.ts` |

### Code Naming

| Element | Convention | Example |
|---------|------------|---------|
| **Classes** | `PascalCase` | `User`, `LoginWithCredentials`, `AuthFacade` |
| **Interfaces** | `PascalCase` (no I prefix) | `UserRepository`, `AuthRepository` |
| **Variables** | `camelCase` | `currentUser`, `isAuthenticated` |
| **Functions** | `camelCase` with action verbs | `createUser`, `validateEmail` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `DEFAULT_PAGE_SIZE`, `API_BASE_URL` |
| **Signals** | `camelCase` with descriptive names | `users`, `loading`, `selectedUser` |
| **Computed** | `camelCase` with descriptive names | `activeUsers`, `isFormValid` |

## Angular Patterns

### 1. Component Structure

**Always use standalone components with this pattern:**

```typescript
@Component({
    selector: 'app-feature-name',
    changeDetection: ChangeDetectionStrategy.OnPush, // Always use OnPush
    imports: [CommonModule, /* other imports */],
    template: `
        <!-- Use new control flow syntax -->
        @if (loading()) {
            <app-loading-spinner />
        } @else if (error()) {
            <app-error-message [error]="error()" />
        } @else {
            @for (item of items(); track item.id) {
                <app-item-card [item]="item" />
            }
        }
    `,
    styleUrls: ['./feature-name.css']
})
export class FeatureName {
    // Use functional injection
    private readonly facade = inject(SomeFacade);
    private readonly router = inject(Router);
    
    // Signal-based state (readonly for public)
    readonly items = computed(() => this.facade.items());
    readonly loading = computed(() => this.facade.loading());
    readonly error = computed(() => this.facade.error());
    
    // Use new input/output APIs
    readonly itemId = input<number>();
    readonly itemSelected = output<Item>();
    
    // Event handlers
    onItemClick(item: Item): void {
        this.itemSelected.emit(item);
    }
    
    // Lifecycle
    ngOnInit(): void {
        // Use effect for side effects
        effect(() => {
            const id = this.itemId();
            if (id) {
                this.facade.loadItem(id);
            }
        });
    }
}
```

### 2. Facade Pattern

**State management with facades:**

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureFacade {
    // Private state signals
    private readonly _items = signal<Item[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<ApplicationError | null>(null);
    private readonly _selectedItem = signal<Item | null>(null);
    
    // Public computed state
    readonly items = computed(() => this._items());
    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    readonly selectedItem = computed(() => this._selectedItem());
    
    // Derived state
    readonly activeItems = computed(() => 
        this._items().filter(item => item.isActive)
    );
    readonly itemCount = computed(() => this._items().length);
    readonly hasItems = computed(() => this._items().length > 0);
    
    constructor(
        @Inject(USE_CASE_TOKEN) private readonly useCase: UseCase
    ) {}
    
    // Public actions
    async loadItems(): Promise<void> {
        try {
            this._loading.set(true);
            this._error.set(null);
            
            const items = await this.useCase.execute();
            this._items.set(items);
        } catch (error) {
            this._error.set(ApplicationError.fromError('load-items', error));
        } finally {
            this._loading.set(false);
        }
    }
    
    selectItem(item: Item): void {
        this._selectedItem.set(item);
    }
    
    clearError(): void {
        this._error.set(null);
    }
}
```

### 3. Use Case Pattern

**Business logic in use cases:**

```typescript
@Injectable()
export class CreateItemUseCase implements UseCase<CreateItemRequest, Item> {
    constructor(
        @Inject(ITEM_REPOSITORY) private readonly itemRepo: ItemRepository,
        @Inject(DOMAIN_EVENT_PROCESSOR) private readonly eventProcessor: DomainEventProcessor
    ) {}
    
    async execute(request: CreateItemRequest): Promise<Item> {
        // 1. Validate input
        this.validateRequest(request);
        
        // 2. Create domain entity
        const item = Item.create({
            name: request.name,
            description: request.description,
            category: request.category
        });
        
        // 3. Save to repository
        await this.itemRepo.save(item);
        
        // 4. Process domain events
        await this.eventProcessor.processEntityEvents(item);
        
        return item;
    }
    
    private validateRequest(request: CreateItemRequest): void {
        if (!request.name?.trim()) {
            throw new ValidationError([{
                field: 'name',
                message: 'Name is required',
                code: ValidationErrorCode.REQUIRED
            }]);
        }
    }
}
```

### 4. Domain Entity Pattern

**Rich domain entities:**

```typescript
export class Item extends AggregateRoot<ItemProps> {
    private constructor(props: ItemProps, id?: UniqueEntityID) {
        super(props, id);
    }
    
    public static create(props: CreateItemProps): Item {
        // Validation
        if (!props.name?.trim()) {
            throw new ValidationError([{
                field: 'name',
                message: 'Name is required',
                code: ValidationErrorCode.REQUIRED
            }]);
        }
        
        const item = new Item({
            name: ItemName.create(props.name),
            description: props.description,
            category: props.category,
            active: true,
            createdAt: new Date()
        });
        
        // Domain event
        item.addDomainEvent(new ItemCreatedEvent(item.id));
        
        return item;
    }
    
    // Getters
    get name(): ItemName { return this.props.name; }
    get description(): string { return this.props.description; }
    get isActive(): boolean { return this.props.active; }
    
    // Business methods
    activate(): void {
        if (this.props.active) {
            throw new DomainError('Item is already active');
        }
        
        this.props.active = true;
        this.addDomainEvent(new ItemActivatedEvent(this.id));
    }
    
    deactivate(): void {
        if (!this.props.active) {
            throw new DomainError('Item is already inactive');
        }
        
        this.props.active = false;
        this.addDomainEvent(new ItemDeactivatedEvent(this.id));
    }
    
    updateDescription(description: string): void {
        if (description.trim() === this.props.description) {
            return; // No change
        }
        
        this.props.description = description.trim();
        this.addDomainEvent(new ItemUpdatedEvent(this.id));
    }
}
```

## Code Quality Standards

### 1. TypeScript Configuration

**Always use strict TypeScript settings:**

```typescript
// tsconfig.json compliance
{
    "compilerOptions": {
        "strict": true,
        "noImplicitReturns": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noUncheckedIndexedAccess": true
    }
}

// Type everything explicitly
interface UserProps {
    readonly id: number;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly active: boolean;
    readonly createdAt: Date;
}

// Use utility types
type CreateUserRequest = Omit<UserProps, 'id' | 'createdAt'>;
type UpdateUserRequest = Partial<Pick<UserProps, 'firstName' | 'lastName'>>;
```

### 2. Error Handling

**Multi-layer error handling:**

```typescript
// Domain errors
export class ValidationError extends DomainError {
    constructor(public readonly details: ValidationErrorDetail[]) {
        super('Validation failed');
    }
}

// Application errors
export class ApplicationError extends Error {
    constructor(
        public readonly context: string,
        public readonly userMessage: string,
        public readonly code: string,
        public readonly originalError?: Error
    ) {
        super(`${context}: ${userMessage}`);
    }
    
    static fromDomainError(context: string, error: DomainError): ApplicationError {
        return new ApplicationError(
            context,
            error.message,
            'DOMAIN_ERROR',
            error
        );
    }
}

// Infrastructure error mapping
@Injectable()
export class ErrorMapper {
    mapToApplicationError(error: any): ApplicationError {
        if (error instanceof ValidationError) {
            return ApplicationError.fromDomainError('validation', error);
        }
        
        if (error.status === 401) {
            return new ApplicationError(
                'authentication',
                'Session expired. Please login again.',
                'AUTH_EXPIRED'
            );
        }
        
        return new ApplicationError(
            'system',
            'An unexpected error occurred.',
            'UNKNOWN_ERROR',
            error
        );
    }
}
```

### 3. Testing Patterns

**Comprehensive testing strategy:**

```typescript
describe('FeatureComponent', () => {
    let component: FeatureComponent;
    let fixture: ComponentFixture<FeatureComponent>;
    let mockFacade: jasmine.SpyObj<FeatureFacade>;
    
    beforeEach(async () => {
        const facadeSpy = jasmine.createSpyObj('FeatureFacade', 
            ['loadItems', 'selectItem'], 
            {
                items: signal([]),
                loading: signal(false),
                error: signal(null)
            }
        );
        
        await TestBed.configureTestingModule({
            imports: [FeatureComponent],
            providers: [
                { provide: FeatureFacade, useValue: facadeSpy }
            ]
        }).compileComponents();
        
        fixture = TestBed.createComponent(FeatureComponent);
        component = fixture.componentInstance;
        mockFacade = TestBed.inject(FeatureFacade) as jasmine.SpyObj<FeatureFacade>;
    });
    
    it('should load items on init', () => {
        fixture.detectChanges();
        expect(mockFacade.loadItems).toHaveBeenCalled();
    });
    
    it('should display loading state', () => {
        mockFacade.loading.set(true);
        fixture.detectChanges();
        
        const loadingElement = fixture.nativeElement.querySelector('.loading');
        expect(loadingElement).toBeTruthy();
    });
});

// Use case testing
describe('CreateItemUseCase', () => {
    let useCase: CreateItemUseCase;
    let mockRepository: jasmine.SpyObj<ItemRepository>;
    
    beforeEach(() => {
        const repoSpy = jasmine.createSpyObj('ItemRepository', ['save']);
        
        TestBed.configureTestingModule({
            providers: [
                CreateItemUseCase,
                { provide: ITEM_REPOSITORY, useValue: repoSpy }
            ]
        });
        
        useCase = TestBed.inject(CreateItemUseCase);
        mockRepository = TestBed.inject(ITEM_REPOSITORY) as jasmine.SpyObj<ItemRepository>;
    });
    
    it('should create item successfully', async () => {
        const request = { name: 'Test Item', description: 'Test Description' };
        
        const result = await useCase.execute(request);
        
        expect(result.name.toString()).toBe('Test Item');
        expect(mockRepository.save).toHaveBeenCalledWith(jasmine.any(Item));
    });
});
```

## Performance Guidelines

### 1. OnPush Change Detection

**Always use OnPush change detection:**

```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush, // Required!
    // ... rest of component
})
export class OptimizedComponent {
    // Signals work perfectly with OnPush
    readonly data = computed(() => this.facade.data());
}
```

### 2. Signal Optimization

**Efficient signal usage:**

```typescript
export class OptimizedFacade {
    // Batch updates for better performance
    updateMultipleValues(users: User[], loading: boolean): void {
        batch(() => {
            this._users.set(users);
            this._loading.set(loading);
        });
    }
    
    // Use computed for derived state
    readonly filteredUsers = computed(() => {
        const users = this._users();
        const filter = this._filter();
        
        if (!filter) return users;
        
        return users.filter(user => 
            user.name.toLowerCase().includes(filter.toLowerCase())
        );
    });
}
```

### 3. Lazy Loading

**Implement lazy loading for routes:**

```typescript
export const routes: Routes = [
    {
        path: 'feature',
        loadComponent: () => import('./feature/feature.component')
            .then(m => m.FeatureComponent)
    },
    {
        path: 'admin',
        loadComponent: () => import('./admin/admin-layout.component')
            .then(m => m.AdminLayout),
        children: [
            {
                path: 'users',
                loadComponent: () => import('./admin/users/users.component')
                    .then(m => m.UsersComponent)
            }
        ]
    }
];
```

## Security Practices

### 1. Input Validation

**Always validate at multiple layers:**

```typescript
// Domain validation
export class Email extends ValueObject<EmailProps> {
    public static create(email: string): Email {
        if (!email || typeof email !== 'string') {
            throw new ValidationError([{
                field: 'email',
                message: 'Email is required',
                code: ValidationErrorCode.EMAIL_REQUIRED
            }]);
        }
        
        const sanitized = this.sanitizeEmail(email);
        
        if (!this.isValidFormat(sanitized)) {
            throw new ValidationError([{
                field: 'email',
                message: 'Invalid email format',
                code: ValidationErrorCode.EMAIL_INVALID
            }]);
        }
        
        return new Email({ value: sanitized });
    }
    
    private static sanitizeEmail(email: string): string {
        return email.trim().toLowerCase();
    }
}
```

### 2. HTTP Security

**Secure HTTP patterns:**

```typescript
@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Add security headers
        const secureReq = req.clone({
            setHeaders: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            }
        });
        
        // Add auth token if available
        const token = this.authService.getToken();
        if (token) {
            secureReq.headers.set('Authorization', `Bearer ${token}`);
        }
        
        return next.handle(secureReq).pipe(
            catchError(this.handleError),
            timeout(30000)
        );
    }
}
```

## Accessibility Requirements

### 1. Semantic HTML

**Always use proper semantic elements:**

```typescript
@Component({
    template: `
        <main class="page-content" role="main">
            <header>
                <h1 id="page-title">{{ title }}</h1>
            </header>
            
            <section aria-labelledby="page-title">
                <form [formGroup]="form" 
                      (ngSubmit)="onSubmit()" 
                      role="form">
                    
                    <div class="form-field">
                        <label for="email">Email Address</label>
                        <input id="email"
                               type="email"
                               formControlName="email"
                               [attr.aria-invalid]="hasError('email')"
                               [attr.aria-describedby]="getAriaDescribedBy('email')">
                        
                        @if (hasError('email')) {
                            <div id="email-error" 
                                 class="error-message" 
                                 role="alert">
                                {{ getErrorMessage('email') }}
                            </div>
                        }
                    </div>
                </form>
            </section>
        </main>
    `
})
```

### 2. Keyboard Navigation

**Support full keyboard navigation:**

```typescript
@Component({
    template: `
        <div class="dropdown" 
             [attr.aria-expanded]="isOpen()"
             role="combobox">
            <button (click)="toggle()"
                    (keydown)="onKeyDown($event)"
                    [attr.aria-haspopup]="listbox">
                {{ selectedLabel() }}
            </button>
            
            @if (isOpen()) {
                <ul role="listbox" 
                    (keydown)="onListKeyDown($event)">
                    @for (option of options(); track option.id) {
                        <li role="option"
                            [attr.aria-selected]="isSelected(option)"
                            (click)="select(option)">
                            {{ option.label }}
                        </li>
                    }
                </ul>
            }
        </div>
    `
})
export class AccessibleDropdown {
    onKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                this.open();
                break;
            case 'Escape':
                this.close();
                break;
        }
    }
}
```

## Dependency Injection Patterns

### 1. Token-Based DI

**Use injection tokens for clean dependencies:**

```typescript
// tokens.ts
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');
export const AUTH_SERVICE = new InjectionToken<AuthService>('AuthService');

// provide-users.ts
export function provideUsers(): Provider[] {
    return [
        UsersFacade,
        { provide: USER_REPOSITORY, useClass: HttpUserRepository },
        CreateUser,
        UpdateUser,
        DeleteUser
    ];
}

// Usage in component
export class UsersComponent {
    private readonly facade = inject(UsersFacade);
    
    constructor() {
        // Dependencies injected via tokens
    }
}
```

### 2. Provider Functions

**Organize providers in functions:**

```typescript
export function provideAuth(): Provider[] {
    return [
        AuthFacade,
        { provide: AUTH_REPOSITORY, useClass: HttpAuthRepository },
        { provide: TOKEN_STORE, useClass: LocalStorageTokenStore },
        LoginWithCredentials,
        Logout,
        RefreshToken
    ];
}

// app.config.ts
export const appConfig: ApplicationConfig = {
    providers: [
        provideAuth(),
        provideUsers(),
        provideRoles(),
        // ... other providers
    ]
};
```

## Code Generation Guidelines

### 1. When Creating Components

1. Always use standalone components
2. Include OnPush change detection
3. Use functional injection with `inject()`
4. Implement proper accessibility attributes
5. Use new control flow syntax (`@if`, `@for`, `@switch`)
6. Include proper TypeScript typing

### 2. When Creating Services/Facades

1. Use `@Injectable({ providedIn: 'root' })` for singletons
2. Implement signal-based state management
3. Use computed signals for derived state
4. Include proper error handling
5. Use dependency injection tokens

### 3. When Creating Use Cases

1. Implement the `UseCase<TRequest, TResponse>` interface
2. Include input validation
3. Handle domain events
4. Use repository patterns for data access
5. Include comprehensive error handling

### 4. When Creating Tests

1. Use Angular TestBed for component tests
2. Create spy objects for dependencies
3. Test both success and error scenarios
4. Include accessibility testing
5. Test signal state changes

## Common Patterns Summary

### File Header Template

```typescript
/**
 * [Brief description of the file's purpose]
 * 
 * @example
 * // Usage example
 * const component = new ComponentName();
 * 
 * @see Related files or documentation
 */
```

### Import Organization

```typescript
// 1. Angular imports
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Third-party imports
import { Observable } from 'rxjs';

// 3. Domain imports
import { User } from '../../domain/entities/user.entity';

// 4. Application imports
import { UsersFacade } from '../../application/facades/users.facade';

// 5. Infrastructure imports
import { HttpUserRepository } from '../../infrastructure/repositories/http-user.repository';

// 6. Local imports
import './component-name.css';
```

### Error Handling Template

```typescript
try {
    this._loading.set(true);
    this._error.set(null);
    
    const result = await this.useCase.execute(request);
    this._data.set(result);
    
} catch (error) {
    const appError = error instanceof DomainError 
        ? ApplicationError.fromDomainError('context', error)
        : new ApplicationError('context', 'Operation failed', 'UNKNOWN_ERROR', error);
    
    this._error.set(appError);
    
} finally {
    this._loading.set(false);
}
```

## Anti-Patterns to Avoid

### ❌ Don't Do This

```typescript
// ❌ Don't use constructor injection with modern Angular
constructor(private userService: UserService) {}

// ❌ Don't use any types
const data: any = response.data;

// ❌ Don't use RxJS for local state management
private users$ = new BehaviorSubject<User[]>([]);

// ❌ Don't break Clean Architecture boundaries
// Domain importing from Infrastructure
import { HttpClient } from '@angular/common/http'; // In domain layer

// ❌ Don't use structural directives with old syntax
*ngIf="condition"
*ngFor="let item of items"
```

### ✅ Do This Instead

```typescript
// ✅ Use functional injection
private readonly userService = inject(UserService);

// ✅ Use proper typing
const data: UserDTO = response.data;

// ✅ Use signals for state management
private readonly _users = signal<User[]>([]);

// ✅ Respect Clean Architecture boundaries
// Use dependency injection and abstractions

// ✅ Use new control flow syntax
@if (condition) { }
@for (item of items; track item.id) { }
```

---

**Remember**: This project prioritizes maintainability, type safety, performance, and accessibility. Always follow these patterns to ensure consistency and quality across the codebase.
