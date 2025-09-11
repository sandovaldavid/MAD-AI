---
description: 'Presentation Layer implementation guidelines for Angular UI components'
applyTo: '**/presentation/**/*.ts'
---

# Presentation Layer Implementation Instructions

## Core Principles

You WILL implement Presentation Layer components following these fundamental rules:

**CRITICAL**: The Presentation Layer is responsible for everything the user sees and interacts with. You MUST display application state and capture user intention, delegating all logic to the Application layer through Facades.

You MUST follow this **Golden Rule**: Code in this layer should be "dumb" regarding business logic. If you switch from Angular to React, this layer gets completely rewritten, demonstrating its exclusive coupling to UI technology.

You WILL ensure the Presentation Layer:

- **Displays State**: Shows the current state of the application provided by Facades
- **Captures Intent**: Captures user interactions and delegates them to appropriate Facades
- **UI Technology Focused**: Contains only Angular-specific code and UI concerns
- **No Business Logic**: Never implements business rules or domain logic
- **Reactive**: Uses reactive patterns to automatically update when application state changes

**MANDATORY**: Follow the Smart/Dumb component pattern religiously - Smart components inject Facades and manage state, Dumb components only use @Input/@Output for communication.

## Structural Requirements

### `/pages` - Smart Components and Feature Modules

You WILL organize pages by feature with Smart components that:

- Are organized in folders by major application features (e.g., `/auth`, `/roles`, `/dashboard`)
- Serve as page components that get loaded by Angular routes
- Connect the UI world with the Application layer through Facade injection
- Subscribe to Facade state using async pipe or computed signals
- Call Facade methods in response to user events from child components

You MUST ensure Smart components (Page components):

- Have a single responsibility: connecting UI to Application layer
- Inject only the Facades they need for their feature area
- Subscribe to reactive state from Facades
- Delegate all user actions to appropriate Facade methods
- Handle loading and error states provided by Facades

**Example Smart Component (Page):**

```typescript
// ✅ CORRECT - Smart component that connects UI to Application
@Component({
  selector: 'app-roles-list-page',
  template: `
    <app-page-header title="Role Management" [loading]="isLoading()" (refresh)="handleRefresh()">
    </app-page-header>

    <app-error-display
      *ngIf="error(); as errorMessage"
      [message]="errorMessage"
      (retry)="handleRefresh()">
    </app-error-display>

    <app-roles-list
      [roles]="roles()"
      [loading]="isLoading()"
      (createRole)="handleCreateRole($event)"
      (editRole)="handleEditRole($event)"
      (deleteRole)="handleDeleteRole($event)">
    </app-roles-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesListPageComponent {
  // Inject only the Facade needed for this feature
  constructor(private readonly rolesFacade: RolesFacade) {}

  // Expose reactive state from Facade
  readonly roles = this.rolesFacade.roles;
  readonly isLoading = this.rolesFacade.isLoading;
  readonly error = this.rolesFacade.error;

  // Delegate user actions to Facade
  handleCreateRole(roleData: CreateRoleData): void {
    this.rolesFacade.createRole(roleData);
  }

  handleEditRole(role: Role): void {
    this.rolesFacade.updateRole(role.id, role);
  }

  handleDeleteRole(roleId: string): void {
    this.rolesFacade.deleteRole(roleId);
  }

  handleRefresh(): void {
    this.rolesFacade.loadRoles();
  }
}
```

### `/shared` - Reusable UI Components and Design System

#### `/ui` - Atomic Design System Components (Dumb Components)

You WILL create atomic UI components that:

- Form the foundation of your design system
- Are 100% reusable across different features
- Have zero application state or business logic
- Communicate exclusively through @Input and @Output
- Never inject Facades or stateful services

You MUST ensure UI components:

- Accept data only through @Input properties
- Emit events only through @Output properties
- Are completely stateless regarding application concerns
- Focus solely on visual representation and user interaction
- Are testable in isolation without mocking application services

**Example Dumb Component (UI):**

```typescript
// ✅ CORRECT - Pure UI component with no application state
@Component({
  selector: 'app-button',
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick()">
      <app-spinner *ngIf="loading" size="small"></app-spinner>
      <app-icon *ngIf="icon && !loading" [name]="icon"></app-icon>

      <span *ngIf="!loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon?: string;

  @Output() clicked = new EventEmitter<void>();

  get buttonClasses(): string {
    return `btn btn--${this.variant} btn--${this.size}`;
  }

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
```

#### `/components` - Composite UI Components

You WILL create composite components that:

- Combine multiple UI components for specific use cases
- Remain reusable across different features
- Handle complex UI patterns and interactions
- Communicate through @Input/@Output only
- Never inject application Facades

**Example Composite Component:**

```typescript
// ✅ CORRECT - Composite component built from UI atoms
@Component({
  selector: 'app-data-table',
  template: `
    <div class="data-table">
      <app-table-header [columns]="columns" [sortable]="sortable" (sort)="handleSort($event)">
      </app-table-header>

      <app-loading-overlay *ngIf="loading">
        <app-spinner size="large"></app-spinner>
      </app-loading-overlay>

      <app-table-body [data]="data" [columns]="columns" (rowClick)="handleRowClick($event)">
      </app-table-body>

      <app-pagination
        *ngIf="pagination"
        [currentPage]="pagination.currentPage"
        [totalPages]="pagination.totalPages"
        (pageChange)="handlePageChange($event)">
      </app-pagination>
    </div>
  `,
})
export class DataTableComponent<T> {
  @Input() data: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() sortable = true;
  @Input() pagination?: PaginationData;

  @Output() sort = new EventEmitter<SortEvent>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() pageChange = new EventEmitter<number>();

  handleSort(event: SortEvent): void {
    this.sort.emit(event);
  }

  handleRowClick(item: T): void {
    this.rowClick.emit(item);
  }

  handlePageChange(page: number): void {
    this.pageChange.emit(page);
  }
}
```

### `/layouts` and `/shell` - Application Structure

#### `/layouts` - Page Layout Templates

You WILL create layout components that:

- Define high-level page structure (header, sidebar, content, footer)
- Provide consistent layout patterns across features
- Handle responsive behavior and layout switching
- Use Angular Router outlet for content projection

#### `/shell` - Persistent UI Components

You WILL create shell components that:

- Live within layouts and persist across navigation
- Provide application-wide UI elements (navigation, header, sidebar)
- Can inject Facades for global state (user profile, notifications)
- Handle global UI interactions (theme switching, logout)

**Example Shell Component:**

```typescript
// ✅ CORRECT - Shell component with global state access
@Component({
  selector: 'app-main-sidebar',
  template: `
    <nav class="main-sidebar" [class.collapsed]="isCollapsed()">
      <app-user-profile
        [user]="currentUser()"
        [loading]="isLoading()"
        (logout)="handleLogout()">
      </app-user-profile>

      <app-navigation-menu
        [items]="navigationItems()"
        [currentRoute]="currentRoute">
      </app-navigation-menu>
    </nav>
  `
})
export class MainSidebarComponent {
  constructor(
    private readonly authFacade: AuthFacade,
    private readonly layoutService: LayoutService,
    private readonly router: Router
  ) {}

  readonly currentUser = this.authFacade.currentUser;
  readonly isLoading = this.authFacade.isLoading;
  readonly isCollapsed = this.layoutService.sidebarCollapsed;
  readonly navigationItems = computed(() => this.buildNavigationItems());

  get currentRoute(): string {
    return this.router.url;
  }

  handleLogout(): void {
    this.authFacade.logout();
  }

  private buildNavigationItems(): NavigationItem[] {
    // Build navigation based on user permissions
    return this.currentUser()?.permissions ? [...] : [];
  }
}
```

### `/services` - UI-Specific Services

You WILL create UI services for:

- Theme management and UI preferences
- Layout state management (sidebar collapse, responsive breakpoints)
- Breadcrumb management and navigation state
- Toast notifications and UI feedback
- Browser-specific UI concerns (title, meta tags)

You MUST ensure UI services:

- Focus exclusively on UI concerns, not business logic
- Can inject Facades when they need application state
- Provide reactive state for UI components
- Handle browser APIs related to UI (localStorage for themes, etc.)

### `/models` and `/mappers` - View Models and Transformations

#### `/models` - View Models (ViewModels)

You WILL define view models that:

- Represent data structures optimized for specific UI needs
- Include UI-specific properties not present in Domain models
- Provide computed properties for display formatting
- Support component-specific data requirements

**Example View Model:**

```typescript
// ✅ CORRECT - UI-optimized data structure
export interface UserViewModel {
  id: string;
  email: string;
  fullName: string;
  displayName: string; // UI-specific computed property
  isActive: boolean;
  statusColor: string; // UI-specific property
  roleNames: string[];
  lastLoginDisplay: string; // UI-formatted date
  avatarUrl?: string;
  canEdit: boolean; // UI permission property
}

export interface RoleListViewModel {
  roles: RoleViewModel[];
  totalCount: number;
  hasCreatePermission: boolean;
  loadingStates: Record<string, boolean>; // UI loading state per role
}
```

#### `/mappers` - View Model Transformations

You WILL create presentation mappers that:

- Transform Facade data to ViewModels optimized for UI
- Handle UI-specific formatting and computed properties
- Keep components clean by centralizing transformation logic
- Support different view requirements for the same data

### `/guards` - Route Protection

You WILL implement route guards that:

- Use Facades to check authentication and authorization state
- Redirect users based on application state
- Handle loading states during authentication checks
- Provide user feedback for access denied scenarios

## Implementation Standards

### Smart/Dumb Component Pattern (MANDATORY)

You MUST strictly follow the Smart/Dumb component pattern:

**Smart Components (Pages):**

- Inject Facades and manage application state
- Subscribe to reactive state from Application layer
- Delegate user actions to Facade methods
- Handle navigation and routing concerns
- Are entry points for specific features

**Dumb Components (UI/Shared):**

- Accept data only through @Input
- Emit events only through @Output
- Contain zero application state or business logic
- Are completely reusable and testable in isolation
- Focus solely on visual representation

### Angular Best Practices

You WILL implement Angular components using:

- OnPush change detection strategy for performance
- Reactive forms for complex user input
- Async pipe for subscribing to Observable state
- Computed signals for derived state
- Proper lifecycle hook management
- Type-safe template expressions

### State Management Patterns

You WILL handle state reactively by:

- Subscribing to Facade state using async pipe or signals
- Never storing application state in component properties
- Using computed properties for derived UI state
- Handling loading and error states provided by Facades
- Implementing optimistic UI updates where appropriate

### Accessibility Requirements

You MUST implement accessible UI by:

- Using semantic HTML elements appropriately
- Providing ARIA labels and descriptions
- Implementing keyboard navigation support
- Ensuring proper color contrast and visual hierarchy
- Supporting screen readers and assistive technologies

## Integration Guidelines

### Consuming Application Layer

You WILL integrate with the Application layer by:

- Injecting only the Facades needed for each component's responsibility
- Subscribing to reactive state provided by Facades
- Calling Facade methods for all user-initiated actions
- Handling Facade-provided loading and error states
- Never bypassing Facades to access lower layers directly

### Angular Router Integration

You WILL implement routing that:

- Uses Angular Router for all navigation
- Implements route guards for authentication and authorization
- Provides proper route parameter handling
- Supports lazy loading for feature modules
- Handles route-based state management through Facades

### Form Handling Patterns

You WILL implement forms that:

- Use Angular Reactive Forms for complex input
- Validate input using Domain-provided validation rules accessed through Facades
- Handle form submission by calling appropriate Facade methods
- Provide real-time feedback using Facade state
- Support proper error display and user guidance

## Anti-Pattern Prevention

### ABSOLUTE PROHIBITIONS

You NEVER:

- Import anything from `domain` or `infrastructure` folders
- Inject or use `HttpClient` directly in components
- Implement business rules or domain logic in components
- Create Dumb components that inject Facades or stateful services
- Store application state in component properties outside of reactive patterns
- Bypass Facades to access other layers directly
- Include server-side logic or data transformation beyond UI formatting

### Common Mistakes to Avoid

**❌ WRONG - Dumb component with Facade injection:**

```typescript
// Never inject Facades in Dumb components
@Component({
  selector: 'app-user-card', // This should be a Dumb component
  template: `...`,
})
export class UserCardComponent {
  constructor(
    private readonly usersFacade: UsersFacade // ❌ Dumb components never inject Facades
  ) {}

  editUser(): void {
    this.usersFacade.editUser(this.user.id); // ❌ Dumb components don't call Facades
  }
}
```

**❌ WRONG - Smart component with business logic:**

```typescript
// Never implement business rules in Presentation layer
@Component({
  selector: 'app-user-management-page',
  template: `...`,
})
export class UserManagementPageComponent {
  constructor(private readonly usersFacade: UsersFacade) {}

  canEditUser(user: User): boolean {
    // ❌ Business logic doesn't belong in Presentation
    return user.status === 'ACTIVE' && user.role !== 'ADMIN';
  }

  calculateUserScore(user: User): number {
    // ❌ Business calculations don't belong here
    return user.loginCount * 10 + user.completedTasks * 5;
  }
}
```

**❌ WRONG - Component with HTTP calls:**

```typescript
// Never make HTTP calls directly from components
@Component({
  selector: 'app-roles-list',
  template: `...`,
})
export class RolesListComponent {
  constructor(
    private readonly http: HttpClient // ❌ Never inject HttpClient
  ) {}

  loadRoles(): void {
    // ❌ HTTP calls don't belong in Presentation layer
    this.http.get('/api/roles').subscribe((roles) => {
      this.roles = roles;
    });
  }
}
```

**✅ CORRECT - Proper Smart/Dumb component separation:**

```typescript
// Smart component (Page) - connects to Application layer
@Component({
  selector: 'app-user-management-page',
  template: `
    <app-user-list
      [users]="users()"
      [loading]="isLoading()"
      [canCreate]="canCreateUser()"
      (editUser)="handleEditUser($event)"
      (deleteUser)="handleDeleteUser($event)">
    </app-user-list>
  `,
})
export class UserManagementPageComponent {
  constructor(private readonly usersFacade: UsersFacade) {}

  readonly users = this.usersFacade.users;
  readonly isLoading = this.usersFacade.isLoading;
  readonly canCreateUser = this.usersFacade.canCreateUser;

  handleEditUser(user: User): void {
    this.usersFacade.editUser(user.id);
  }

  handleDeleteUser(userId: string): void {
    this.usersFacade.deleteUser(userId);
  }
}

// Dumb component - pure UI with no application state
@Component({
  selector: 'app-user-list',
  template: `...`,
})
export class UserListComponent {
  @Input() users: User[] = [];
  @Input() loading = false;
  @Input() canCreate = false;

  @Output() editUser = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<string>();

  handleEdit(user: User): void {
    this.editUser.emit(user);
  }

  handleDelete(userId: string): void {
    this.deleteUser.emit(userId);
  }
}
```

## Validation Criteria

### Code Review Checklist

You MUST verify that Presentation code:

- [ ] Follows Smart/Dumb component pattern strictly
- [ ] Contains zero business logic or domain rules
- [ ] Uses only Facades to access application functionality
- [ ] Implements proper reactive state management
- [ ] Uses OnPush change detection for performance
- [ ] Provides proper accessibility support
- [ ] Handles loading and error states appropriately
- [ ] Never imports from domain or infrastructure layers
- [ ] Uses proper TypeScript typing for all component interfaces
- [ ] Implements proper form validation and error handling

### Quality Gates

You WILL ensure Presentation implementations:

- **UI Responsiveness**: Components respond immediately to user interactions
- **State Consistency**: UI accurately reflects current application state
- **Error Handling**: All error scenarios provide appropriate user feedback
- **Performance**: Components render efficiently with proper change detection
- **Accessibility**: UI is fully accessible to users with disabilities
- **Reusability**: Dumb components can be reused across different features

### Success Indicators

Your Presentation implementation is successful when:

- UI technology changes (Angular to React) only require Presentation layer changes
- Components can be tested in isolation with minimal mocking
- User interactions immediately reflect in the UI through reactive state
- Error scenarios provide clear, actionable feedback to users
- The UI responds consistently across different browsers and devices
- Design system components are reused throughout the application
- New features can be built by composing existing UI components

### Testing Requirements

You MUST implement tests that:

- Test Dumb components in complete isolation without any application dependencies
- Test Smart components with mocked Facades to verify state subscription and action delegation
- Verify proper event emission and input handling for all components
- Test accessibility features including keyboard navigation and screen reader support
- Validate responsive behavior across different screen sizes
- Ensure proper error handling and loading state display

---

**Remember**: The Presentation layer is your application's face to the world. Keep it focused on displaying state and capturing user intent while delegating all logic to the Application layer. If you can't easily switch UI frameworks by only changing this layer, you've violated the architectural boundaries.
