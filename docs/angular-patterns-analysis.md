# Angular Patterns Analysis

> **Comprehensive catalog of Angular 20.x specific patterns and practices used in MAD-AI**

## Summary

This document analyzes Angular-specific implementation patterns found throughout the MAD-AI project, focusing on Angular 20.x features like signals, standalone components, new control flow, and modern dependency injection patterns.

## Angular Version and Features

### Core Framework Version
- **Angular**: 20.1.6 (latest stable)
- **TypeScript**: 5.8.2 (ES2022 target)
- **RxJS**: 7.8.0 (for async operations)
- **Zone.js**: 0.15.0 (change detection)

### Modern Angular Features Used
- ✅ **Standalone Components** (default architecture)
- ✅ **Angular Signals** (primary state management)
- ✅ **New Control Flow** (`@if`, `@for`, `@switch`)
- ✅ **Functional Injection** (`inject()` function)
- ✅ **New Input/Output APIs** (`input()`, `output()`)
- ✅ **Signal-based Forms** (reactive forms with signals)
- ✅ **OnPush Change Detection** (performance optimization)

## Component Architecture Patterns

### 1. Standalone Component Structure

**Standard Pattern:**
```typescript
@Component({
    selector: 'app-component-name',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CustomComponents...],
    templateUrl: './component-name.html',
    styleUrl: './component-name.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentName {
    // Dependency injection using inject()
    private readonly facade = inject(SomeFacade);
    private readonly router = inject(Router);
    
    // Input/Output using new APIs
    data = input.required<DataType>();
    optional = input<string>('default');
    action = output<ActionType>();
    
    // Signal-based state
    private readonly _loading = signal(false);
    readonly loading = computed(() => this._loading());
    
    // Methods
    async onAction(): Promise<void> {
        await this.facade.performAction();
    }
}
```

**Real Example from Project:**
```typescript
// src/app/presentation/shell/nav-rail-footer/nav-rail-footer.ts
@Component({
    selector: 'app-nav-rail-footer',
    standalone: true,
    imports: [CommonModule, Icon, ThemeToggle],
    templateUrl: './nav-rail-footer.html',
    styleUrl: './nav-rail-footer.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailFooter {
    protected authFacade = inject(AuthFacade);
    private router = inject(Router);

    // New input API
    collapsed = input.required<boolean>();

    // Computed properties from facade state
    readonly user = computed(() => this.authFacade.user());
    readonly profileButtonLabel = computed(
        () => `Perfil de ${this.user()?.firstName || 'usuario'}`
    );

    async onLogout(): Promise<void> {
        await this.authFacade.logout();
        this.router.navigate(['/auth/login']);
    }
}
```

### 2. Modern Input/Output APIs

**Input Patterns:**
```typescript
// Required inputs
level = input.required<number>();
data = input.required<User>();

// Optional inputs with defaults
size = input<'sm' | 'md' | 'lg'>('md');
showIcon = input<boolean>(true);
variant = input<'badge' | 'chip'>('badge');

// Complex type inputs
config = input<ComponentConfig>({
    theme: 'dark',
    size: 'md',
    interactive: true
});
```

**Output Patterns:**
```typescript
// Event outputs using new API
userSelected = output<User>();
formSubmitted = output<FormData>();
actionCompleted = output<void>();

// Usage in methods
onUserClick(user: User): void {
    this.userSelected.emit(user);
}
```

### 3. Signal-Based State Management

**Component State Pattern:**
```typescript
export class ComponentWithState {
    // Private mutable signals
    private readonly _items = signal<Item[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    
    // Public readonly signals
    readonly items = computed(() => this._items());
    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    
    // Computed derived state
    readonly activeItems = computed(() => 
        this._items().filter(item => item.active)
    );
    readonly isEmpty = computed(() => this._items().length === 0);
    
    // State updates
    addItem(item: Item): void {
        this._items.update(items => [...items, item]);
    }
    
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }
}
```

**Real Example from Facades:**
```typescript
// src/app/application/facades/auth.facade.ts
@Injectable({ providedIn: 'root' })
export class AuthFacade {
    // Private State Signals
    private readonly _loading = signal(false);
    private readonly _user = signal<User | null>(null);
    private readonly _session = signal<Session | null>(null);

    // Public Computed State
    readonly loading = computed(() => this._loading());
    readonly user = computed(() => this._user());
    readonly session = computed(() => this._session());
    readonly isAuthenticated = computed(() => !!this._user());
    readonly isSessionValid = computed(() => {
        const session = this._session();
        return session ? new Date() < session.expiresAt : false;
    });
}
```

### 4. Modern Template Control Flow

**New Control Flow Syntax:**
```html
<!-- Conditional rendering with @if -->
@if (loading()) {
    <div class="loading-spinner">Loading...</div>
} @else if (error()) {
    <div class="error-message">{{ error() }}</div>
} @else {
    <div class="content">{{ content() }}</div>
}

<!-- List rendering with @for -->
@for (item of items(); track item.id) {
    <div class="item">
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
    </div>
} @empty {
    <p>No items available</p>
}

<!-- Switch statements with @switch -->
@switch (status()) {
    @case ('loading') {
        <app-spinner />
    }
    @case ('error') {
        <app-error-display [error]="error()" />
    }
    @case ('success') {
        <app-success-content [data]="data()" />
    }
    @default {
        <app-default-state />
    }
}
```

### 5. Functional Dependency Injection

**Injection Patterns:**
```typescript
export class ModernComponent {
    // Services injection
    private readonly authFacade = inject(AuthFacade);
    private readonly router = inject(Router);
    private readonly titleService = inject(TitleService);
    
    // Token-based injection
    private readonly config = inject(APP_CONFIG);
    private readonly exportService = inject(EXPORT_PORT);
    
    // Optional injection
    private readonly optionalService = inject(OptionalService, { optional: true });
    
    // Self injection for template access
    protected readonly facade = inject(SomeFacade);
}
```

**Token Definition Pattern:**
```typescript
// src/app/di/tokens.ts
export const AUTH_REPOSITORY = new InjectionToken<AuthRepository>('AUTH_REPOSITORY');
export const USER_REPOSITORY = new InjectionToken<UserRepository>('USER_REPOSITORY');
export const EXPORT_PORT = new InjectionToken<ExportPort>('EXPORT_PORT');

export interface NotificationConfig {
    maxVisibleDesktop: number;
    maxVisibleMobile: number;
    duration: number;
    position: UINotificationPosition;
}

export const NOTIFICATION_CONFIG = new InjectionToken<NotificationConfig>('NOTIFICATION_CONFIG');
```

## Service and Facade Patterns

### 1. Signal-Based Facades

**Facade Architecture:**
```typescript
@Injectable({ providedIn: 'root' })
export class ModernFacade {
    // Use Case Dependencies
    private readonly createUC = inject(CreateUseCase);
    private readonly updateUC = inject(UpdateUseCase);
    private readonly deleteUC = inject(DeleteUseCase);
    
    // Cross-facade dependencies
    private readonly notifications = inject(NotificationsFacade);
    
    // Private State
    private readonly _entities = signal<Entity[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<ApplicationError | null>(null);
    
    // Public Computed State
    readonly entities = computed(() => this._entities());
    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    readonly entityCount = computed(() => this._entities().length);
    
    // Use Case Orchestration
    async create(request: CreateRequest): Promise<Entity> {
        this._loading.set(true);
        this._error.set(null);
        
        try {
            const entity = await this.createUC.execute(request);
            this._entities.update(entities => [...entities, entity]);
            this.notifications.success('Entity created successfully');
            return entity;
        } catch (error) {
            const appError = this.transformError(error);
            this._error.set(appError);
            this.notifications.error(appError.message);
            throw appError;
        } finally {
            this._loading.set(false);
        }
    }
}
```

### 2. Cross-Cutting Services with Signals

**UI State Service Pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class LayoutService {
    // Private signals for internal state
    private _sidebarCollapsed = signal(false);
    private _mobileDrawerOpen = signal(false);
    private _hoveredItemId = signal<string | null>(null);
    
    // Public computed signals
    readonly sidebarCollapsed = computed(() => this._sidebarCollapsed());
    readonly mobileDrawerOpen = computed(() => this._mobileDrawerOpen());
    readonly hoveredItemId = computed(() => this._hoveredItemId());
    
    // Effect for persistence
    constructor() {
        effect(() => {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('sidebar.collapsed', 
                    JSON.stringify(this._sidebarCollapsed()));
            }
        });
    }
    
    // State mutations
    toggleSidebarCollapsed(): void {
        this._sidebarCollapsed.update(collapsed => !collapsed);
    }
    
    setHoveredItem(itemId: string | null): void {
        this._hoveredItemId.set(itemId);
    }
}
```

## Form Integration Patterns

### 1. Reactive Forms with Signals

**Form Component Pattern:**
```typescript
export class FormComponent implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly facade = inject(EntityFacade);
    
    // Form state
    form: FormGroup = this.createForm();
    
    // Signal-based reactive state
    readonly loading = computed(() => this.facade.loading());
    readonly error = computed(() => this.facade.error());
    
    // Form creation
    private createForm(): FormGroup {
        return this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            active: [true]
        });
    }
    
    // Form submission
    async onSubmit(): Promise<void> {
        if (this.form.valid) {
            const formValue = this.form.value;
            await this.facade.create(formValue);
            
            if (!this.error()) {
                this.form.reset();
            }
        }
    }
}
```

### 2. Custom Form Controls with CVA

**Control Value Accessor Pattern:**
```typescript
@Component({
    selector: 'ui-input',
    standalone: true,
    templateUrl: './input.html',
    styleUrl: './input.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: Input }
    ],
})
export class Input implements ControlValueAccessor {
    // Input configuration
    type = input<InputType>('text');
    size = input<InputSize>('md');
    placeholder = input<string>('');
    disabled = input<boolean>(false);
    
    // Internal state
    private readonly _value = signal<string>('');
    private readonly _focused = signal(false);
    private readonly _touched = signal(false);
    
    // Computed properties
    readonly value = computed(() => this._value());
    readonly cssClasses = computed(() => {
        const size = this.size();
        const disabled = this.disabled();
        return [`input-${size}`, disabled ? 'input-disabled' : ''].filter(Boolean);
    });
    
    // CVA implementation
    private onChange = (value: string) => {};
    private onTouched = () => {};
    
    writeValue(value: string | null): void {
        this._value.set(value || '');
    }
    
    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }
    
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }
    
    setDisabledState(isDisabled: boolean): void {
        // Handle disabled state
    }
    
    // Event handlers
    onInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this._value.set(value);
        this.onChange(value);
    }
    
    onBlur(): void {
        this._touched.set(true);
        this.onTouched();
    }
}
```

## Data Flow and HTTP Patterns

### 1. RxJS + Signals Hybrid

**HTTP Service Pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
    private readonly http = inject(HttpClient);
    
    // Signal-based state
    private readonly _data = signal<Data[]>([]);
    readonly data = this._data.asReadonly();
    
    // RxJS for HTTP operations
    async loadData(): Promise<void> {
        try {
            const response$ = this.http.get<DataDTO[]>('/api/data').pipe(
                map(dtos => dtos.map(dto => this.mapper.toDomain(dto))),
                retry(3),
                catchError(this.handleError)
            );
            
            const data = await firstValueFrom(response$);
            this._data.set(data);
        } catch (error) {
            this.handleError(error);
        }
    }
    
    private handleError = (error: HttpErrorResponse): Observable<never> => {
        console.error('HTTP Error:', error);
        return EMPTY;
    };
}
```

### 2. Repository Implementation

**HTTP Repository Pattern:**
```typescript
@Injectable()
export class HttpUserRepository implements UserRepository {
    private readonly http = inject(HttpClient);
    private readonly mapper = inject(UserMapper);
    
    async findById(id: number): Promise<User> {
        const response$ = this.http.get<UserDTO>(`/api/users/${id}`).pipe(
            catchError(this.handleHttpError)
        );
        
        const dto = await firstValueFrom(response$);
        return this.mapper.toDomain(dto);
    }
    
    async save(user: User): Promise<void> {
        const dto = this.mapper.toDTO(user);
        
        if (user.id) {
            await firstValueFrom(
                this.http.put(`/api/users/${user.id}`, dto)
            );
        } else {
            await firstValueFrom(
                this.http.post('/api/users', dto)
            );
        }
    }
    
    private handleHttpError = (error: HttpErrorResponse): Observable<never> => {
        throw new InfrastructureError(`HTTP Error: ${error.message}`);
    };
}
```

## Error Handling Patterns

### 1. Global Error Interceptor

**HTTP Error Interceptor:**
```typescript
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
    private notifications = inject(NotificationsFacade);
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                // Handle different error types
                if (error.status === 401) {
                    this.handleUnauthorized();
                } else if (error.status >= 500) {
                    this.notifications.error('Server error occurred');
                } else {
                    this.notifications.error(error.error?.message || 'Request failed');
                }
                
                return throwError(() => error);
            })
        );
    }
}
```

### 2. Component Error Handling

**Component Error Pattern:**
```typescript
export class ComponentWithErrorHandling {
    private readonly facade = inject(SomeFacade);
    
    // Error state from facade
    readonly error = computed(() => this.facade.error());
    readonly hasError = computed(() => !!this.error());
    
    async performAction(): Promise<void> {
        try {
            await this.facade.performAction();
        } catch (error) {
            // Error is already handled by facade and stored in signal
            // UI will reactively show error state
        }
    }
    
    clearError(): void {
        this.facade.clearError();
    }
}
```

## Testing Patterns

### 1. Component Testing with Signals

**Component Test Pattern:**
```typescript
describe('SignalComponent', () => {
    let component: SignalComponent;
    let fixture: ComponentFixture<SignalComponent>;
    let mockFacade: jasmine.SpyObj<SomeFacade>;
    
    beforeEach(() => {
        const spy = jasmine.createSpyObj('SomeFacade', ['method'], {
            data: signal([]),
            loading: signal(false),
            error: signal(null)
        });
        
        TestBed.configureTestingModule({
            imports: [SignalComponent],
            providers: [
                { provide: SomeFacade, useValue: spy }
            ]
        });
        
        fixture = TestBed.createComponent(SignalComponent);
        component = fixture.componentInstance;
        mockFacade = TestBed.inject(SomeFacade) as jasmine.SpyObj<SomeFacade>;
    });
    
    it('should react to signal changes', () => {
        // Act
        mockFacade.loading.set(true);
        fixture.detectChanges();
        
        // Assert
        expect(component.loading()).toBe(true);
    });
});
```

## Performance Optimization Patterns

### 1. OnPush Change Detection

**Consistent OnPush Usage:**
```typescript
@Component({
    // Always use OnPush with signal-based components
    changeDetection: ChangeDetectionStrategy.OnPush,
    // ... rest of component config
})
export class OptimizedComponent {
    // Signals work perfectly with OnPush
    readonly data = computed(() => this.facade.data());
    
    // Manual change detection when needed
    onManualUpdate(): void {
        // Signals will automatically trigger change detection
        this.facade.updateData();
    }
}
```

### 2. Computed Signal Optimization

**Efficient Computed Signals:**
```typescript
export class OptimizedComputation {
    private readonly _items = signal<Item[]>([]);
    private readonly _filter = signal<string>('');
    
    // Efficient computed with proper memoization
    readonly filteredItems = computed(() => {
        const items = this._items();
        const filter = this._filter();
        
        if (!filter) return items;
        
        return items.filter(item => 
            item.name.toLowerCase().includes(filter.toLowerCase())
        );
    });
    
    // Avoid expensive operations in computed
    readonly itemsCount = computed(() => this.filteredItems().length);
}
```

## Summary of Key Angular Patterns

1. **Standalone Components**: Default architecture with explicit imports
2. **Signal State Management**: Primary pattern for reactive state
3. **Functional Injection**: Using `inject()` over constructor injection
4. **New Input/Output APIs**: Modern component communication
5. **OnPush Change Detection**: Performance optimization standard
6. **New Control Flow**: `@if`, `@for`, `@switch` in templates
7. **RxJS + Signals Hybrid**: HTTP operations with RxJS, state with signals
8. **Computed Derived State**: Reactive calculations from signals
9. **Effect for Side Effects**: Persistence and external integrations
10. **Token-Based DI**: Clean dependency injection with tokens

These patterns ensure modern Angular development with optimal performance, maintainability, and developer experience.
