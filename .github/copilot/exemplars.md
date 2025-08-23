# MAD-AI Code Exemplars Blueprint

**Generated**: 2025-01-24  
**Purpose**: Identify and document high-quality code examples that establish coding standards for the MAD-AI project  
**Architecture**: Clean Architecture + Domain-Driven Design + Angular Signals  

---

## Executive Summary

This document catalogs exemplary code implementations within the MAD-AI codebase that demonstrate:
- Modern Angular patterns with OnPush change detection
- Signal-based reactive state management
- Clean Architecture adherence with proper layer separation
- Domain-Driven Design principles
- Consistent dependency injection patterns
- Error handling and user feedback integration

These exemplars serve as reference implementations for maintaining code quality, architectural consistency, and development standards across the project.

---

## Presentation Layer Exemplars

### 1. Register Component - OnPush + Reactive Forms Pattern

**File**: `src/app/presentation/features/auth/register/register.component.ts`

**Why it's exemplary**:
- Perfect OnPush change detection implementation
- Standalone component following Angular 17+ patterns
- Proper reactive form validation
- Clean separation of concerns with facade pattern
- Signal-based state management integration

**Key patterns demonstrated**:
```typescript
@Component({
	selector: 'app-register',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [ReactiveFormsModule, /* ... */]
})
export class RegisterComponent implements OnInit {
	private readonly facade = inject(AuthFacade);
	private readonly formBuilder = inject(FormBuilder);
	
	// Reactive state from facade
	loading = this.facade.loading;
	error = this.facade.error;
	
	form: FormGroup = this.createForm();
	
	ngOnInit(): void {
		this.facade.clearAuthState();
	}
	
	private createForm(): FormGroup {
		return this.formBuilder.group({
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(8)]]
		});
	}
}
```

**Standards established**:
- Always use OnPush change detection for components
- Inject facades for business logic coordination
- Use reactive forms with proper validation
- Clear state management on component initialization

---

### 2. Error Details Component - Signal-Based State Management

**File**: `src/app/presentation/features/admin/users/error-details/error-details.component.ts`

**Why it's exemplary**:
- Modern signal-based component architecture
- Clean input property handling
- Proper change detection optimization
- Self-contained error display logic

**Key patterns demonstrated**:
```typescript
@Component({
	selector: 'app-error-details',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (error()) {
			<div class="error-container">
				<h3>{{ error()?.message }}</h3>
				<p>{{ error()?.details }}</p>
			</div>
		}
	`
})
export class ErrorDetailsComponent {
	error = input<ApplicationError | null>();
	
	// Computed signals for derived state
	hasError = computed(() => !!this.error());
	errorType = computed(() => this.error()?.type || 'unknown');
}
```

**Standards established**:
- Use signal inputs for component properties
- Leverage computed signals for derived state
- Keep templates reactive with @if control flow
- Maintain component isolation and reusability

---

### 3. Toast Container - Event Handling Excellence

**File**: `src/app/presentation/features/notifications/toast-container/toast-container.component.ts`

**Why it's exemplary**:
- Comprehensive event handling patterns
- Perfect integration with notification facade
- Animation and lifecycle management
- Accessibility considerations

**Key patterns demonstrated**:
- Reactive state subscription from facades
- Event-driven architecture for user interactions
- Proper cleanup and memory management
- Animation coordination with Angular signals

**Standards established**:
- Integrate with facade services for data management
- Implement proper event handling for user interactions
- Consider accessibility in UI component design
- Use signals for coordinating animations and state

---

### 4. Icon Component - Dependency Injection Pattern

**File**: `src/app/shared/ui/icon/icon.component.ts`

**Why it's exemplary**:
- Clean dependency injection implementation
- Service integration for icon management
- Reusable component architecture
- Type-safe icon handling

**Key patterns demonstrated**:
```typescript
@Component({
	selector: 'app-icon',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent {
	private readonly iconService = inject(IconService);
	
	name = input.required<string>();
	size = input<'sm' | 'md' | 'lg'>('md');
	
	iconData = computed(() => this.iconService.getIcon(this.name()));
}
```

**Standards established**:
- Use dependency injection for service integration
- Implement required and optional inputs appropriately
- Create computed properties for derived data
- Maintain type safety throughout component

---

### 5. Navigation Layout - Complex UI State Management

**File**: `src/app/presentation/layouts/main-layout/main-layout.component.ts`

**Why it's exemplary**:
- Complex state coordination between multiple services
- Responsive design patterns with signal-based state
- Integration with authentication and layout services
- Proper template structure with control flow

**Standards established**:
- Coordinate multiple services through facade patterns
- Use signals for responsive state management
- Implement proper authentication state checking
- Structure templates with modern Angular control flow

---

## Application Layer Exemplars

### 1. Authentication Facade - Master Facade Pattern

**File**: `src/app/application/facades/auth.facade.ts`

**Why it's exemplary**:
- Perfect facade pattern implementation
- Comprehensive use case orchestration
- Signal-based reactive state management
- Cross-facade coordination with notifications
- Robust error handling and transformation

**Key patterns demonstrated**:
```typescript
@Injectable({ providedIn: 'root' })
export class AuthFacade {
	// Use Case Dependencies
	private readonly loginUC = inject(LoginWithCredentials);
	private readonly logoutUC = inject(Logout);
	private readonly profileUC = inject(GetProfile);
	private readonly registerUC = inject(Register);
	
	// Cross-Facade Dependencies
	private readonly notifications = inject(NotificationsFacade);
	private readonly errorTransformer = inject(ApplicationErrorTransformer);
	
	// Private State Signals
	private readonly _loading = signal(false);
	private readonly _user = signal<User | null>(null);
	private readonly _session = signal<Session | null>(null);
	private readonly _authError = signal<ApplicationError | null>(null);
	
	// Public Computed State
	readonly loading = computed(() => this._loading());
	readonly user = computed(() => this._user());
	readonly isAuthenticated = computed(() => !!this._session());
	readonly error = computed(() => this._authError());
	
	async login(request: LoginRequest, opts?: FacadeOpts): Promise<void> {
		if (!opts?.skipLoading) this._loading.set(true);
		this._authError.set(null);
		
		try {
			const session = await this.loginUC.execute(request);
			this._session.set(session);
			this._user.set(session.user);
			
			if (!opts?.skipNotifications) {
				await this.notifications.success('Login successful');
			}
		} catch (error) {
			const transformedError = this.errorTransformer.transform(error);
			this._authError.set(transformedError);
			
			if (!opts?.skipNotifications) {
				await this.notifications.error(transformedError.userMessage);
			}
		} finally {
			if (!opts?.skipLoading) this._loading.set(false);
		}
	}
}
```

**Standards established**:
- Use dependency injection for all dependencies (use cases, cross-facades, transformers)
- Implement private signal state with public computed read-only accessors
- Follow consistent async operation patterns with loading/error states
- Integrate with notification facade for user feedback
- Use error transformation for consistent error handling
- Support operation options for flexibility (skipLoading, skipNotifications)

---

### 2. Notifications Facade - Real-time State Synchronization

**File**: `src/app/application/facades/notifications.facade.ts`

**Why it's exemplary**:
- Real-time subscription management with observables
- Service layer synchronization patterns
- Event-driven architecture for cross-facade communication
- Comprehensive notification lifecycle management

**Key patterns demonstrated**:
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
	// Use Case Dependencies
	private readonly notifyUC = inject(Notify);
	private readonly dismissUC = inject(DismissNotification);
	private readonly clearUC = inject(ClearNotifications);
	
	// Private Reactive State
	private readonly _notifications = signal<Notification[]>([]);
	private readonly _loading = signal(false);
	private readonly _unreadCount = signal(0);
	
	// Real-time subscription management
	private notificationSubject = new BehaviorSubject<NotificationEvent | null>(null);
	
	constructor() {
		this.initializeNotificationSync();
	}
	
	// Public Reactive State (Computed - Read-only)
	readonly notifications = computed(() => this._notifications());
	readonly unreadCount = computed(() => this._unreadCount());
	readonly hasNotifications = computed(() => this._notifications().length > 0);
	
	private initializeNotificationSync(): void {
		try {
			const callback = (notifications: Notification[]) => {
				this._notifications.set(notifications);
				this._unreadCount.set(notifications.filter(n => !n.isRead).length);
			};
			
			this.subscribeUC.execute(callback);
		} catch (error) {
			console.warn('NotificationsFacade: Failed to initialize sync', error);
		}
	}
}
```

**Standards established**:
- Initialize real-time synchronization in constructor
- Use BehaviorSubject for event coordination
- Implement service layer synchronization patterns
- Provide computed properties for derived state
- Handle synchronization errors gracefully

---

### 3. Users Facade - Complex State Orchestration

**File**: `src/app/application/facades/users.facade.ts`

**Why it's exemplary**:
- Comprehensive CRUD operation orchestration
- Multi-use case coordination for complex workflows
- Event emission for cross-facade communication
- Bulk operation handling with proper feedback

**Standards established**:
- Orchestrate multiple use cases for complex business workflows
- Emit events for cross-facade coordination and communication
- Handle bulk operations with progress tracking
- Provide convenience methods for common operations

---

### 4. Layout Service - Cross-cutting State Management

**File**: `src/app/core/cross-cutting/ui-state/layout.service.ts`

**Why it's exemplary**:
- SSR-safe initialization patterns
- Effect-based state persistence
- Responsive design state management
- Window resize handling with Angular signals

**Key patterns demonstrated**:
```typescript
@Injectable({ providedIn: 'root' })
export class LayoutService {
	private readonly _sidebarCollapsed = signal(false);
	private readonly _mobileDrawerOpen = signal(false);
	
	constructor() {
		this.initializeFromStorage();
		
		if (typeof window !== 'undefined') {
			this.setupWindowResize();
		}
		
		// Persist sidebar state
		effect(() => {
			if (typeof window !== 'undefined') {
				const collapsed = this._sidebarCollapsed();
				localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(collapsed));
			}
		});
		
		// Auto-close mobile drawer when switching to desktop
		effect(() => {
			if (!this.isMobile() && this._mobileDrawerOpen()) {
				this._mobileDrawerOpen.set(false);
			}
		});
	}
}
```

**Standards established**:
- Check for browser environment before using browser APIs
- Use effects for state persistence and side effects
- Implement responsive behavior with signal coordination
- Initialize state from storage safely in SSR environments

---

### 5. Application Error Transformer - Error Handling Excellence

**File**: `src/app/application/errors/application-error.transformer.ts`

**Why it's exemplary**:
- Consistent error transformation patterns
- User-friendly error message generation
- Type-safe error handling
- Integration with application layer concerns

**Standards established**:
- Transform all errors to application layer format
- Provide user-friendly error messages
- Maintain error type safety throughout transformation
- Integrate error handling with application concerns

---

## Domain Layer Exemplars

### 1. User Entity - Domain Logic Encapsulation

**File**: `src/app/domain/entities/user.entity.ts`

**Why it's exemplary**:
- Proper domain entity structure with business rules
- Value object integration
- Domain validation logic
- Immutable state patterns

**Standards established**:
- Encapsulate business logic within entity methods
- Use value objects for complex properties
- Implement domain validation rules
- Maintain entity immutability where appropriate

---

### 2. Email Value Object - Validation and Immutability

**File**: `src/app/domain/value-objects/email.value-object.ts`

**Why it's exemplary**:
- Immutable value object implementation
- Domain validation logic
- Type safety and encapsulation
- Equality comparison methods

**Standards established**:
- Implement value objects as immutable structures
- Encapsulate validation logic within value objects
- Provide equality comparison methods
- Maintain type safety for domain concepts

---

### 3. Domain Events - Event-Driven Architecture

**File**: `src/app/domain/events/user-registered.event.ts`

**Why it's exemplary**:
- Clean domain event structure
- Immutable event data
- Timestamp and metadata inclusion
- Type-safe event payload

**Standards established**:
- Structure domain events with immutable data
- Include relevant metadata (timestamp, event type)
- Maintain type safety for event payloads
- Follow consistent naming conventions

---

### 4. Repository Contracts - Interface Segregation

**File**: `src/app/domain/contracts/user.repository.ts`

**Why it's exemplary**:
- Clear interface segregation
- Async operation patterns
- Domain-focused method signatures
- Error handling contracts

**Standards established**:
- Define repository interfaces in domain layer
- Use async patterns for all data operations
- Focus on domain concepts rather than data structures
- Specify error handling expectations

---

### 5. Domain Services - Business Logic Coordination

**File**: `src/app/domain/services/user-validation.service.ts`

**Why it's exemplary**:
- Pure business logic implementation
- No framework dependencies
- Composable validation rules
- Clear service boundaries

**Standards established**:
- Keep domain services free of framework dependencies
- Implement pure business logic functions
- Create composable and testable validation rules
- Maintain clear service boundaries and responsibilities

---

## Infrastructure Layer Exemplars

### 1. HTTP User Repository - Repository Implementation

**File**: `src/app/infrastructure/repositories/user-http.repository.ts`

**Why it's exemplary**:
- Clean repository pattern implementation
- DTO to entity mapping
- HTTP client integration with error handling
- Angular HTTP client patterns

**Key patterns demonstrated**:
```typescript
@Injectable({ providedIn: 'root' })
export class UserHttpRepository implements UserRepository {
	private readonly http = inject(HttpClient);
	private readonly mapper = inject(UserMapper);
	
	async getById(id: UserId): Promise<User> {
		try {
			const response = await firstValueFrom(
				this.http.get<UserDto>(`/api/users/${id.value}`)
			);
			return this.mapper.toDomain(response);
		} catch (error) {
			throw new RepositoryError('Failed to fetch user', error);
		}
	}
	
	async save(user: User): Promise<void> {
		try {
			const dto = this.mapper.toDto(user);
			await firstValueFrom(
				this.http.put<void>(`/api/users/${user.id.value}`, dto)
			);
		} catch (error) {
			throw new RepositoryError('Failed to save user', error);
		}
	}
}
```

**Standards established**:
- Implement domain repository interfaces in infrastructure
- Use mappers for DTO to entity conversion
- Handle HTTP errors and transform to domain errors
- Use firstValueFrom for converting observables to promises

---

### 2. User Mapper - Data Transformation Excellence

**File**: `src/app/infrastructure/mappers/user.mapper.ts`

**Why it's exemplary**:
- Bidirectional mapping between DTOs and entities
- Validation during mapping process
- Error handling for malformed data
- Type-safe transformation logic

**Standards established**:
- Provide bidirectional mapping methods (toDomain, toDto)
- Validate data during transformation
- Handle mapping errors appropriately
- Maintain type safety throughout transformation

---

### 3. HTTP Error Mapper - Error Transformation

**File**: `src/app/infrastructure/errors/http-error.mapper.ts`

**Why it's exemplary**:
- Comprehensive HTTP error status handling
- Transformation to domain error types
- User-friendly error message generation
- Consistent error format creation

**Standards established**:
- Map HTTP status codes to domain error types
- Generate appropriate user-facing error messages
- Maintain error context and details
- Follow consistent error transformation patterns

---

### 4. HTTP Interceptor - Cross-cutting Concerns

**File**: `src/app/core/interceptors/auth.interceptor.ts`

**Why it's exemplary**:
- Clean interceptor implementation
- Token management integration
- Error handling for authentication failures
- Request/response transformation

**Standards established**:
- Implement interceptors for cross-cutting HTTP concerns
- Integrate with authentication services for token management
- Handle authentication errors consistently
- Transform requests and responses as needed

---

### 5. Local Storage Service - Data Persistence

**File**: `src/app/infrastructure/services/storage.service.ts`

**Why it's exemplary**:
- SSR-safe storage operations
- Type-safe data serialization
- Error handling for storage failures
- Consistent API for data persistence

**Standards established**:
- Check for browser environment before storage operations
- Implement type-safe serialization/deserialization
- Handle storage errors gracefully
- Provide consistent API for data persistence needs

---

## Core Layer Exemplars

### 1. HTTP Client Service - API Integration

**File**: `src/app/core/cross-cutting/http/http-client.service.ts`

**Why it's exemplary**:
- Centralized HTTP configuration
- Request/response interceptor integration
- Error handling standardization
- Type-safe API methods

**Standards established**:
- Centralize HTTP client configuration
- Integrate with interceptors for cross-cutting concerns
- Standardize error handling across API calls
- Provide type-safe methods for common HTTP operations

---

### 2. Validation Utilities - Reusable Validation Logic

**File**: `src/app/core/cross-cutting/utilities/validation.utils.ts`

**Why it's exemplary**:
- Pure validation functions
- Composable validation rules
- Type-safe validation logic
- Framework-agnostic implementation

**Standards established**:
- Create pure, composable validation functions
- Maintain type safety in validation logic
- Keep utilities framework-agnostic
- Provide clear and reusable validation patterns

---

### 3. Logger Service - Structured Logging

**File**: `src/app/core/cross-cutting/utilities/logger.service.ts`

**Why it's exemplary**:
- Structured logging implementation
- Multiple log level support
- Environment-specific configuration
- Integration with external logging services

**Standards established**:
- Implement structured logging with consistent format
- Support multiple log levels for different scenarios
- Configure logging based on environment
- Integrate with external logging services when needed

---

### 4. Date Utilities - Domain-Specific Helpers

**File**: `src/app/core/cross-cutting/utilities/date.utils.ts`

**Why it's exemplary**:
- Pure utility functions for date operations
- Business logic specific to application needs
- Type-safe date handling
- Timezone-aware date operations

**Standards established**:
- Create pure utility functions for common operations
- Implement business-specific date logic
- Handle timezones appropriately
- Maintain type safety in utility functions

---

### 5. Configuration Service - Environment Management

**File**: `src/app/core/cross-cutting/utilities/config.service.ts`

**Why it's exemplary**:
- Environment-specific configuration management
- Type-safe configuration access
- Default value handling
- Runtime configuration validation

**Standards established**:
- Manage environment-specific configuration centrally
- Provide type-safe access to configuration values
- Handle default values appropriately
- Validate configuration at runtime

---

## DI Layer Exemplars

### 1. Authentication Providers - Service Registration

**File**: `src/app/di/provide-auth.ts`

**Why it's exemplary**:
- Clean provider registration patterns
- Token-based dependency injection
- Factory provider implementations
- Environment-specific provider configuration

**Key patterns demonstrated**:
```typescript
export const provideAuth = (): Provider[] => [
	// Use Cases
	LoginWithCredentials,
	Logout,
	GetProfile,
	Register,
	RefreshSession,
	ConfirmEmail,
	RequestPasswordReset,
	ConfirmPasswordReset,
	
	// Repositories
	{ provide: UserRepository, useClass: UserHttpRepository },
	{ provide: SessionRepository, useClass: SessionHttpRepository },
	
	// Services
	{ provide: AUTH_CONFIG, useValue: getAuthConfig() },
	{ provide: AuthService, useFactory: createAuthService, deps: [AUTH_CONFIG] },
	
	// Mappers
	UserMapper,
	SessionMapper,
];

function createAuthService(config: AuthConfig): AuthService {
	return new AuthService(config);
}
```

**Standards established**:
- Group related providers in dedicated provider functions
- Use tokens for configuration and interface-based dependencies
- Implement factory providers for complex service creation
- Register use cases, repositories, and services consistently

---

### 2. Notification Providers - Event-Driven Services

**File**: `src/app/di/provide-notifications.ts`

**Why it's exemplary**:
- Event-driven service registration
- Real-time subscription configuration
- Cross-cutting service integration
- Proper dependency graph management

**Standards established**:
- Register event-driven services with proper configuration
- Configure real-time subscriptions and event handling
- Integrate cross-cutting services (logging, monitoring)
- Manage complex dependency graphs effectively

---

### 3. Domain Event Providers - Event Processing

**File**: `src/app/di/provide-domain-events.ts`

**Why it's exemplary**:
- Domain event processor registration
- Event handler configuration
- Cross-facade event coordination
- Event sourcing infrastructure setup

**Standards established**:
- Register domain event processors and handlers
- Configure event processing infrastructure
- Set up cross-facade event coordination
- Implement event sourcing patterns when needed

---

### 4. Export Service Providers - Feature-Specific Services

**File**: `src/app/di/provide-export.ts`

**Why it's exemplary**:
- Feature-specific service registration
- Strategy pattern implementation for export formats
- Configuration-driven service selection
- Plugin-style architecture support

**Standards established**:
- Register feature-specific services in dedicated modules
- Implement strategy patterns for variable behavior
- Use configuration to drive service selection
- Support plugin-style architecture when appropriate

---

### 5. Dependency Tokens - Type-Safe Injection

**File**: `src/app/di/tokens.ts`

**Why it's exemplary**:
- Type-safe injection token definitions
- Clear token naming conventions
- Configuration token patterns
- Interface-based token registration

**Key patterns demonstrated**:
```typescript
// Configuration tokens
export const AUTH_CONFIG = new InjectionToken<AuthConfig>('auth.config');
export const API_CONFIG = new InjectionToken<ApiConfig>('api.config');

// Service tokens for interfaces
export const UserRepository = new InjectionToken<IUserRepository>('user.repository');
export const NotificationService = new InjectionToken<INotificationService>('notification.service');

// Feature tokens
export const EXPORT_STRATEGIES = new InjectionToken<ExportStrategy[]>('export.strategies');
```

**Standards established**:
- Define injection tokens for all interface-based dependencies
- Use descriptive token names with appropriate namespacing
- Create configuration tokens for environment-specific values
- Group related tokens together for better organization

---

## Summary of Architectural Standards

Based on these exemplars, the MAD-AI project establishes the following key standards:

### Component Standards
- Always use `ChangeDetectionStrategy.OnPush` for optimal performance
- Implement standalone components following Angular 17+ patterns
- Use signal-based state management with computed properties
- Inject facades for business logic coordination
- Clear component state on initialization

### Service Standards
- Implement facade pattern for application layer services
- Use dependency injection for all service dependencies
- Provide private signal state with public computed read-only accessors
- Follow consistent async operation patterns with loading/error states
- Integrate with notification facade for user feedback

### State Management Standards
- Use Angular signals for reactive state management
- Implement private signals with public computed accessors
- Use effects for side effects and state persistence
- Handle SSR safely with environment checks
- Coordinate cross-service state through facade patterns

### Error Handling Standards
- Transform all errors to application layer format
- Provide user-friendly error messages
- Maintain error type safety throughout the application
- Integrate error handling with notification systems
- Handle errors gracefully without breaking user experience

### Dependency Injection Standards
- Group related providers in dedicated provider functions
- Use injection tokens for interface-based dependencies
- Implement factory providers for complex service creation
- Register services consistently across layers
- Manage dependency graphs effectively

These exemplars demonstrate the high quality and consistency of the MAD-AI codebase, providing clear patterns for future development while maintaining architectural integrity and code quality.
