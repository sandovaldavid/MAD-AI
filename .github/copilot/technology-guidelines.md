# Technology-Specific Guidelines

> **Detailed technology guidelines for maintaining consistency across the MAD-AI project**

## Angular 20.x Specific Guidelines

### 1. Modern Angular Features

**Always use the latest Angular patterns:**

```typescript
// ✅ Use new control flow syntax
@Component({
    template: `
        @if (user(); as currentUser) {
            <div class="user-profile">
                <h2>Welcome, {{ currentUser.name }}!</h2>
                
                @for (notification of notifications(); track notification.id) {
                    <app-notification [data]="notification" />
                } @empty {
                    <p>No notifications</p>
                }
                
                @switch (user().status) {
                    @case ('active') {
                        <span class="status-active">Active</span>
                    }
                    @case ('inactive') {
                        <span class="status-inactive">Inactive</span>
                    }
                    @default {
                        <span class="status-unknown">Unknown</span>
                    }
                }
            </div>
        } @else {
            <app-login />
        }
    `
})
```

**Avoid legacy Angular patterns:**

```typescript
// ❌ Don't use old structural directives
*ngIf="user"
*ngFor="let item of items; trackBy: trackByFn"
[ngSwitch]="status"

// ❌ Don't use constructor injection
constructor(private service: Service) {}

// ❌ Don't use Subject/BehaviorSubject for local state
private dataSubject = new BehaviorSubject(null);
```

### 2. Signal-Based Architecture

**Primary state management pattern:**

```typescript
@Injectable({ providedIn: 'root' })
export class ModernFacade {
    // Private state signals
    private readonly _data = signal<Data[]>([]);
    private readonly _loading = signal(false);
    private readonly _filter = signal('');
    
    // Public computed state
    readonly data = computed(() => this._data());
    readonly loading = computed(() => this._loading());
    readonly filteredData = computed(() => {
        const data = this._data();
        const filter = this._filter();
        
        if (!filter) return data;
        
        return data.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase())
        );
    });
    
    // Derived computed values
    readonly dataCount = computed(() => this.filteredData().length);
    readonly hasData = computed(() => this.dataCount() > 0);
    readonly isEmpty = computed(() => !this.loading() && !this.hasData());
    
    // Effects for side effects
    private readonly persistEffect = effect(() => {
        const data = this._data();
        if (data.length > 0) {
            this.persistToStorage(data);
        }
    });
    
    // State mutations
    setData(data: Data[]): void {
        this._data.set(data);
    }
    
    setFilter(filter: string): void {
        this._filter.set(filter);
    }
    
    // Batch updates for performance
    updateState(data: Data[], loading: boolean): void {
        batch(() => {
            this._data.set(data);
            this._loading.set(loading);
        });
    }
}
```

### 3. New Input/Output API

**Use modern input/output patterns:**

```typescript
@Component({
    selector: 'app-user-card',
    template: `
        <div class="user-card" [class.compact]="compact()">
            <img [src]="user().avatar" [alt]="user().name">
            <h3>{{ user().name }}</h3>
            <p>{{ user().email }}</p>
            
            @if (!readOnly()) {
                <button (click)="onEdit()" 
                        [disabled]="disabled()">
                    Edit User
                </button>
            }
        </div>
    `
})
export class UserCard {
    // Modern input syntax with transforms and validation
    readonly user = input.required<User>();
    readonly compact = input(false, { transform: booleanAttribute });
    readonly readOnly = input(false, { alias: 'readonly' });
    readonly disabled = input(false, { 
        transform: (value: boolean | string) => 
            value === '' || value === true || value === 'true'
    });
    
    // Modern output syntax
    readonly userEdit = output<User>();
    readonly userDelete = output<{ id: number; name: string }>();
    
    onEdit(): void {
        const currentUser = this.user();
        this.userEdit.emit(currentUser);
    }
    
    onDelete(): void {
        const user = this.user();
        this.userDelete.emit({
            id: user.id,
            name: user.name
        });
    }
    
    // Input validation effect
    private readonly validationEffect = effect(() => {
        const user = this.user();
        if (!user.id || !user.name) {
            console.warn('Invalid user data provided:', user);
        }
    });
}
```

## TypeScript 5.8.2 Guidelines

### 1. Strict Type Configuration

**Always use strict TypeScript settings:**

```typescript
// Use exact types, avoid any
interface StrictUserData {
    readonly id: number;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roles: readonly Role[];
    readonly metadata: Record<string, unknown>;
    readonly createdAt: Date;
    readonly updatedAt?: Date;
}

// Use utility types for variations
type CreateUserData = Omit<StrictUserData, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUserData = Partial<Pick<StrictUserData, 'firstName' | 'lastName'>>;
type UserSummary = Pick<StrictUserData, 'id' | 'email' | 'firstName' | 'lastName'>;

// Use branded types for IDs
type UserId = number & { readonly __brand: 'UserId' };
type RoleId = number & { readonly __brand: 'RoleId' };

function createUserId(id: number): UserId {
    return id as UserId;
}
```

### 2. Advanced Type Patterns

**Leverage TypeScript's advanced features:**

```typescript
// Conditional types for API responses
type ApiResponse<T> = T extends User 
    ? { user: T; permissions: string[] }
    : T extends User[]
    ? { users: T; totalCount: number; page: number }
    : { data: T };

// Template literal types for event names
type UserEvents = `user-${string}`;
type SystemEvents = `system-${string}`;
type AllEvents = UserEvents | SystemEvents;

// Mapped types for form validation
type ValidationRules<T> = {
    readonly [K in keyof T]: {
        readonly required?: boolean;
        readonly minLength?: number;
        readonly maxLength?: number;
        readonly pattern?: RegExp;
        readonly validator?: (value: T[K]) => boolean;
    };
};

const userValidation: ValidationRules<CreateUserData> = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        validator: (email) => !email.includes('test')
    },
    firstName: {
        required: true,
        minLength: 2,
        maxLength: 50
    }
} as const;

// Discriminated unions for error handling
type Result<T, E = Error> = 
    | { success: true; data: T }
    | { success: false; error: E };

async function safeApiCall<T>(
    apiCall: () => Promise<T>
): Promise<Result<T, ApplicationError>> {
    try {
        const data = await apiCall();
        return { success: true, data };
    } catch (error) {
        const appError = error instanceof ApplicationError 
            ? error 
            : new ApplicationError('api', 'Unknown error', 'API_ERROR', error);
        return { success: false, error: appError };
    }
}
```

### 3. Type Guards and Assertions

**Implement proper type checking:**

```typescript
// Type guards for runtime type checking
function isUser(obj: unknown): obj is User {
    return typeof obj === 'object' && 
           obj !== null && 
           'id' in obj && 
           'email' in obj &&
           typeof (obj as any).id === 'number' &&
           typeof (obj as any).email === 'string';
}

function isUserArray(arr: unknown): arr is User[] {
    return Array.isArray(arr) && arr.every(isUser);
}

// Assertion functions for validation
function assertIsValidEmail(email: string): asserts email is string {
    if (!email.includes('@')) {
        throw new Error('Invalid email format');
    }
}

// Custom type predicates
function hasPermission<T extends string>(
    user: User,
    permission: T
): user is User & { permissions: T[] } {
    return user.permissions.includes(permission);
}

// Usage in components
export class UserComponent {
    processUserData(data: unknown): void {
        if (isUser(data)) {
            // TypeScript knows data is User
            console.log(data.email);
            
            if (hasPermission(data, 'admin')) {
                // TypeScript knows user has admin permission
                this.showAdminFeatures();
            }
        }
    }
}
```

## Testing Framework Guidelines

### 1. Jasmine 5.7.0 Patterns

**Modern Jasmine testing patterns:**

```typescript
describe('UsersFacade', () => {
    let facade: UsersFacade;
    let mockRepository: jasmine.SpyObj<UserRepository>;
    let mockNotifications: jasmine.SpyObj<NotificationService>;
    
    beforeEach(() => {
        // Create sophisticated spy objects
        const repositorySpy = jasmine.createSpyObj('UserRepository', {
            findAll: Promise.resolve([]),
            findById: Promise.resolve(null),
            save: Promise.resolve(),
            delete: Promise.resolve()
        });
        
        const notificationsSpy = jasmine.createSpyObj('NotificationService', {
            success: undefined,
            error: undefined,
            info: undefined
        });
        
        TestBed.configureTestingModule({
            providers: [
                UsersFacade,
                { provide: USER_REPOSITORY, useValue: repositorySpy },
                { provide: NOTIFICATION_SERVICE, useValue: notificationsSpy }
            ]
        });
        
        facade = TestBed.inject(UsersFacade);
        mockRepository = TestBed.inject(USER_REPOSITORY) as jasmine.SpyObj<UserRepository>;
        mockNotifications = TestBed.inject(NOTIFICATION_SERVICE) as jasmine.SpyObj<NotificationService>;
    });
    
    describe('loadUsers', () => {
        it('should load users and update state', async () => {
            // Arrange
            const mockUsers = [
                createMockUser({ id: 1, name: 'John' }),
                createMockUser({ id: 2, name: 'Jane' })
            ];
            mockRepository.findAll.and.returnValue(Promise.resolve(mockUsers));
            
            // Act
            await facade.loadUsers();
            
            // Assert
            expect(facade.users()).toEqual(mockUsers);
            expect(facade.loading()).toBe(false);
            expect(facade.error()).toBeNull();
            expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
        });
        
        it('should handle errors gracefully', async () => {
            // Arrange
            const error = new Error('Network error');
            mockRepository.findAll.and.returnValue(Promise.reject(error));
            
            // Act
            await facade.loadUsers();
            
            // Assert
            expect(facade.users()).toEqual([]);
            expect(facade.loading()).toBe(false);
            expect(facade.error()).toBeTruthy();
            expect(facade.error()?.message).toContain('Failed to load users');
        });
        
        it('should set loading state during operation', async () => {
            // Arrange
            let loadingDuringCall = false;
            mockRepository.findAll.and.callFake(async () => {
                loadingDuringCall = facade.loading();
                return [];
            });
            
            // Act
            await facade.loadUsers();
            
            // Assert
            expect(loadingDuringCall).toBe(true);
            expect(facade.loading()).toBe(false);
        });
    });
    
    describe('signal state management', () => {
        it('should update computed values when state changes', () => {
            // Arrange
            const users = [
                createMockUser({ id: 1, active: true }),
                createMockUser({ id: 2, active: false }),
                createMockUser({ id: 3, active: true })
            ];
            
            // Act
            facade['_users'].set(users);
            
            // Assert
            expect(facade.users()).toEqual(users);
            expect(facade.activeUsers()).toHaveLength(2);
            expect(facade.userCount()).toBe(3);
            expect(facade.hasUsers()).toBe(true);
        });
        
        it('should handle empty state correctly', () => {
            // Act
            facade['_users'].set([]);
            
            // Assert
            expect(facade.users()).toEqual([]);
            expect(facade.activeUsers()).toHaveLength(0);
            expect(facade.userCount()).toBe(0);
            expect(facade.hasUsers()).toBe(false);
        });
    });
});
```

### 2. Component Testing with Signals

**Signal-aware component testing:**

```typescript
describe('UserListComponent', () => {
    let component: UserListComponent;
    let fixture: ComponentFixture<UserListComponent>;
    let mockFacade: jasmine.SpyObj<UsersFacade>;
    
    beforeEach(() => {
        // Create facade spy with signal properties
        const facadeSpy = jasmine.createSpyObj('UsersFacade', ['loadUsers', 'selectUser']);
        
        // Add signal properties
        Object.defineProperty(facadeSpy, 'users', {
            value: signal<User[]>([]),
            writable: true
        });
        Object.defineProperty(facadeSpy, 'loading', {
            value: signal(false),
            writable: true
        });
        Object.defineProperty(facadeSpy, 'error', {
            value: signal<ApplicationError | null>(null),
            writable: true
        });
        
        TestBed.configureTestingModule({
            imports: [UserListComponent],
            providers: [
                { provide: UsersFacade, useValue: facadeSpy }
            ]
        });
        
        fixture = TestBed.createComponent(UserListComponent);
        component = fixture.componentInstance;
        mockFacade = TestBed.inject(UsersFacade) as jasmine.SpyObj<UsersFacade>;
    });
    
    it('should display users when loaded', () => {
        // Arrange
        const users = [
            createMockUser({ id: 1, name: 'John Doe' }),
            createMockUser({ id: 2, name: 'Jane Smith' })
        ];
        
        // Act
        mockFacade.users.set(users);
        fixture.detectChanges();
        
        // Assert
        const userElements = fixture.nativeElement.querySelectorAll('.user-item');
        expect(userElements).toHaveLength(2);
        expect(userElements[0].textContent).toContain('John Doe');
        expect(userElements[1].textContent).toContain('Jane Smith');
    });
    
    it('should show loading state', () => {
        // Act
        mockFacade.loading.set(true);
        fixture.detectChanges();
        
        // Assert
        const loadingElement = fixture.nativeElement.querySelector('.loading-spinner');
        expect(loadingElement).toBeTruthy();
    });
    
    it('should display error message', () => {
        // Arrange
        const error = new ApplicationError('test', 'Test error message', 'TEST_ERROR');
        
        // Act
        mockFacade.error.set(error);
        fixture.detectChanges();
        
        // Assert
        const errorElement = fixture.nativeElement.querySelector('.error-message');
        expect(errorElement).toBeTruthy();
        expect(errorElement.textContent).toContain('Test error message');
    });
});
```

### 3. Mock Factories and Builders

**Consistent test data creation:**

```typescript
// Mock factory functions
export function createMockUser(overrides: Partial<UserData> = {}): User {
    const defaultData: UserData = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        active: true,
        roles: [],
        createdAt: new Date('2024-01-01'),
        ...overrides
    };
    
    return User.create(defaultData);
}

export function createMockRole(overrides: Partial<RoleData> = {}): Role {
    const defaultData: RoleData = {
        id: 1,
        name: 'user',
        description: 'Standard user role',
        permissions: ['read'],
        ...overrides
    };
    
    return Role.create(defaultData);
}

// Builder pattern for complex objects
export class UserTestBuilder {
    private data: Partial<UserData> = {};
    
    withId(id: number): this {
        this.data.id = id;
        return this;
    }
    
    withEmail(email: string): this {
        this.data.email = email;
        return this;
    }
    
    withName(firstName: string, lastName: string): this {
        this.data.firstName = firstName;
        this.data.lastName = lastName;
        return this;
    }
    
    withRoles(...roles: Role[]): this {
        this.data.roles = roles;
        return this;
    }
    
    active(): this {
        this.data.active = true;
        return this;
    }
    
    inactive(): this {
        this.data.active = false;
        return this;
    }
    
    build(): User {
        return createMockUser(this.data);
    }
}

// Usage in tests
const adminUser = new UserTestBuilder()
    .withId(1)
    .withEmail('admin@example.com')
    .withName('Admin', 'User')
    .withRoles(createMockRole({ name: 'admin' }))
    .active()
    .build();
```

## Build and Development Guidelines

### 1. Angular CLI Configuration

**Modern build configuration patterns:**

```json
{
    "projects": {
        "MAD-AI": {
            "architect": {
                "build": {
                    "builder": "@angular/build:application",
                    "options": {
                        "outputPath": "dist/mad-ai",
                        "index": "src/index.html",
                        "polyfills": ["zone.js"],
                        "tsConfig": "tsconfig.app.json",
                        "inlineStyleLanguage": "css",
                        "assets": ["public"],
                        "styles": ["src/styles.css"],
                        "scripts": [],
                        "budgets": [
                            {
                                "type": "initial",
                                "maximumWarning": "500kB",
                                "maximumError": "1MB"
                            },
                            {
                                "type": "anyComponentStyle",
                                "maximumWarning": "2kB",
                                "maximumError": "4kB"
                            }
                        ]
                    },
                    "configurations": {
                        "production": {
                            "optimization": true,
                            "outputHashing": "all",
                            "sourceMap": false,
                            "namedChunks": false,
                            "extractLicenses": true,
                            "serviceWorker": false
                        },
                        "development": {
                            "optimization": false,
                            "extractLicenses": false,
                            "sourceMap": true,
                            "namedChunks": true
                        }
                    }
                }
            }
        }
    }
}
```

### 2. Performance Monitoring

**Build performance tracking:**

```typescript
// Custom build analyzer
export class BuildAnalyzer {
    static analyzeBundles(): void {
        const stats = require('./dist/stats.json');
        
        const bundleSizes = stats.chunks.map((chunk: any) => ({
            name: chunk.names[0],
            size: chunk.size,
            modules: chunk.modules?.length || 0
        }));
        
        console.table(bundleSizes.sort((a, b) => b.size - a.size));
        
        // Check for bundle size violations
        const oversizedBundles = bundleSizes.filter(bundle => 
            bundle.size > 500 * 1024 // 500KB
        );
        
        if (oversizedBundles.length > 0) {
            console.warn('Oversized bundles detected:', oversizedBundles);
        }
    }
}
```

## CSS and Styling Guidelines

### 1. TailwindCSS Integration

**Component-scoped styling with Tailwind:**

```css
/* Component styles with Tailwind utilities */
.user-card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700;
    @apply transition-all duration-200 hover:shadow-lg;
}

.user-card.compact {
    @apply p-4;
}

.user-avatar {
    @apply w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600;
}

.user-name {
    @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.user-email {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Status indicators */
.status-active {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.status-inactive {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

/* Responsive design */
@media (max-width: 640px) {
    .user-card {
        @apply p-4 rounded-md;
    }
    
    .user-avatar {
        @apply w-10 h-10;
    }
}

/* Accessibility features */
@media (prefers-reduced-motion: reduce) {
    .user-card {
        @apply transition-none;
    }
}

@media (prefers-contrast: high) {
    .user-card {
        @apply border-2 border-black dark:border-white;
    }
}
```

### 2. CSS Custom Properties

**Dynamic theming with CSS variables:**

```css
:root {
    /* Primary colors */
    --color-primary-50: #eff6ff;
    --color-primary-100: #dbeafe;
    --color-primary-500: #3b82f6;
    --color-primary-600: #2563eb;
    --color-primary-900: #1e3a8a;
    
    /* Semantic colors */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #06b6d4;
    
    /* Typography */
    --font-family-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-family-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
    
    /* Spacing scale */
    --spacing-unit: 0.25rem; /* 4px */
    --spacing-xs: calc(var(--spacing-unit) * 1);  /* 4px */
    --spacing-sm: calc(var(--spacing-unit) * 2);  /* 8px */
    --spacing-md: calc(var(--spacing-unit) * 4);  /* 16px */
    --spacing-lg: calc(var(--spacing-unit) * 6);  /* 24px */
    --spacing-xl: calc(var(--spacing-unit) * 8);  /* 32px */
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
    :root {
        --color-background: #0f172a;
        --color-surface: #1e293b;
        --color-text-primary: #f8fafc;
        --color-text-secondary: #cbd5e1;
        --color-border: #374151;
    }
}

/* Component usage */
.themed-component {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border);
    padding: var(--spacing-md);
    font-family: var(--font-family-sans);
}
```

## Development Workflow

### 1. Code Generation Commands

**Recommended Angular CLI commands:**

```bash
# Generate standalone component
ng generate component features/users/components/user-card --standalone --change-detection=OnPush

# Generate service with DI token
ng generate service application/facades/users --flat

# Generate interface
ng generate interface domain/entities/user --type=entity

# Generate use case
ng generate class application/use-cases/create-user --type=use-case

# Generate repository interface
ng generate interface domain/repositories/user --type=repository

# Generate guard
ng generate guard core/guards/auth --functional

# Generate interceptor
ng generate interceptor core/interceptors/auth --functional
```

### 2. Development Scripts

**Package.json scripts for development:**

```json
{
    "scripts": {
        "start": "ng serve",
        "build": "ng build",
        "build:prod": "ng build --configuration production",
        "test": "ng test",
        "test:watch": "ng test --watch",
        "test:coverage": "ng test --code-coverage",
        "lint": "ng lint",
        "lint:fix": "ng lint --fix",
        "e2e": "ng e2e",
        "analyze": "ng build --configuration production --stats-json && npx webpack-bundle-analyzer dist/stats.json",
        "serve:ssr": "ng build && ng run MAD-AI:serve-ssr",
        "precommit": "npm run lint && npm run test:ci",
        "type-check": "tsc --noEmit",
        "icons:lint": "node scripts/lint-icons.cjs"
    }
}
```

### 3. Git Hooks and Quality Gates

**Pre-commit quality checks:**

```typescript
// scripts/pre-commit.ts
import { execSync } from 'child_process';

interface QualityCheck {
    name: string;
    command: string;
    required: boolean;
}

const qualityChecks: QualityCheck[] = [
    {
        name: 'TypeScript Compilation',
        command: 'npm run type-check',
        required: true
    },
    {
        name: 'Linting',
        command: 'npm run lint',
        required: true
    },
    {
        name: 'Unit Tests',
        command: 'npm run test:ci',
        required: true
    },
    {
        name: 'Build Check',
        command: 'npm run build',
        required: false
    }
];

function runQualityChecks(): void {
    console.log('🔍 Running quality checks...\n');
    
    for (const check of qualityChecks) {
        console.log(`Running ${check.name}...`);
        
        try {
            execSync(check.command, { stdio: 'inherit' });
            console.log(`✅ ${check.name} passed\n`);
        } catch (error) {
            console.error(`❌ ${check.name} failed\n`);
            
            if (check.required) {
                console.error('Commit aborted due to failed quality check.');
                process.exit(1);
            }
        }
    }
    
    console.log('🎉 All quality checks completed!');
}

runQualityChecks();
```

---

These technology-specific guidelines ensure that all team members and AI assistants use the most current and appropriate patterns for each technology in the MAD-AI project stack.
