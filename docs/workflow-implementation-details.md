# Workflow Implementation Details

**Generated:** August 2025  
**Project:** MAD-AI  
**Purpose:** Detailed implementation documentation for each workflow

---

## Table of Contents

1. [Authentication Workflow Deep Dive](#authentication-workflow-deep-dive)
2. [Role Management Implementation](#role-management-implementation)
3. [User Management System](#user-management-system)
4. [Notification System Architecture](#notification-system-architecture)
5. [Dashboard & Navigation](#dashboard--navigation)

---

## Authentication Workflow Deep Dive

### Complete File Path Analysis

**Frontend Components:**
```
src/app/presentation/features/auth/
├── pages/
│   ├── login/
│   │   ├── login.page.ts          # Main login component
│   │   ├── login.page.html        # Login template
│   │   └── login.page.css         # Login styles
│   └── register/
│       ├── register.page.ts       # Registration component
│       ├── register.page.html     # Registration template
│       └── register.page.css      # Registration styles
├── components/
│   ├── login-form/
│   │   ├── login-form.ts          # Reactive login form
│   │   ├── login-form.html        # Form template
│   │   └── login-form.css         # Form styles
│   └── auth-layout/
│       ├── auth-layout.ts         # Authentication layout
│       ├── auth-layout.html       # Layout template
│       └── auth-layout.css        # Layout styles
└── auth.routes.ts                 # Authentication routing
```

**Application Layer:**
```
src/app/application/
├── facades/
│   └── auth.facade.ts             # Authentication state management
├── use-cases/
│   └── auth/
│       ├── login.usecase.ts       # Login business logic
│       ├── register.usecase.ts    # Registration business logic
│       ├── logout.usecase.ts      # Logout business logic
│       └── refresh-token.usecase.ts # Token refresh logic
├── types/
│   └── auth.types.ts              # Authentication type definitions
└── services/
    └── session.service.ts         # Session management
```

**Domain Layer:**
```
src/app/domain/
├── entities/
│   ├── user.entity.ts             # User domain entity
│   ├── session.entity.ts          # Session domain entity
│   └── auth-token.entity.ts       # Token domain entity
├── repositories/
│   └── business/
│       └── auth.repository.ts     # Authentication repository contract
├── value-objects/
│   ├── email.value-object.ts      # Email validation
│   ├── password.value-object.ts   # Password validation
│   └── username.value-object.ts   # Username validation
├── contracts/
│   ├── login.contract.ts          # Login request/response contracts
│   ├── register.contract.ts       # Registration contracts
│   └── session.contract.ts       # Session contracts
└── errors/
    ├── unauthorized.error.ts      # Authentication errors
    ├── account-locked.error.ts    # Account status errors
    └── email-not-confirmed.error.ts # Email verification errors
```

**Infrastructure Layer:**
```
src/app/infrastructure/
├── repositories/
│   └── http-auth.repository.ts    # HTTP authentication implementation
├── dtos/
│   ├── login-request.dto.ts       # Login API request format
│   ├── login-response.dto.ts      # Login API response format
│   ├── register-request.dto.ts    # Registration API request format
│   └── register-response.dto.ts   # Registration API response format
├── mappers/
│   ├── auth.mapper.ts             # Entity to/from DTO mapping
│   ├── user.mapper.ts             # User entity mapping
│   └── session.mapper.ts          # Session entity mapping
├── services/
│   ├── token-store.service.ts     # Token storage service
│   ├── auth-user-store.service.ts # User data storage
│   └── session-store.service.ts   # Session persistence
└── http/
    └── auth.endpoints.ts          # API endpoint definitions
```

### Data Flow Implementation

**Login Request Flow:**
```typescript
// 1. User submits login form
interface LoginFormData {
  identifier: string;  // email or username
  password: string;
  rememberMe: boolean;
}

// 2. Component calls facade
async onLogin(formData: LoginFormData): Promise<void> {
  const request: LoginRequest = {
    identifier: { type: 'email', value: formData.identifier },
    password: formData.password,
    rememberMe: formData.rememberMe
  };
  
  await this.authFacade.login(request);
}

// 3. Facade manages state and calls use case
async login(request: LoginRequest): Promise<void> {
  this._loading.set(true);
  this._error.set(null);
  
  try {
    const session = await this.loginUC.execute(request);
    this._session.set(session);
    this._user.set(session.user);
    
    // Navigate to dashboard
    await this.router.navigateByUrl('/dashboard');
  } catch (error) {
    this._error.set(this.transformError(error));
  } finally {
    this._loading.set(false);
  }
}

// 4. Use case validates and calls repository
async execute(request: LoginRequest): Promise<Session> {
  // Validate business rules
  this.validateLoginAttempt(request);
  
  // Call domain repository
  const session = await this.authRepo.login({
    identifier: request.identifier,
    password: request.password,
    rememberMe: request.rememberMe
  });
  
  // Handle side effects
  await this.logSuccessfulLogin(session);
  
  return session;
}

// 5. Repository makes HTTP call and maps response
async login(creds: CredentialsContract): Promise<Session> {
  const requestDto: LoginRequestDTO = {
    identifier: creds.identifier.value,
    password: creds.password,
    remember_me: creds.rememberMe
  };
  
  const response = await firstValueFrom(
    this.http.post<LoginResponseDTO>('/api/auth/login/', requestDto)
  );
  
  // Store tokens locally
  this.tokenStore.setTokens({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: response.expires_at
  });
  
  // Map to domain entities
  const user = this.userMapper.fromDto(response.user);
  const session = this.sessionMapper.fromLoginResponse(response, user);
  
  return session;
}
```

### Error Handling Implementation

**Authentication Error Mapping:**
```typescript
@Injectable()
export class AuthErrorMapper {
  mapHttpError(error: HttpErrorResponse): AuthenticationError {
    switch (error.status) {
      case 401:
        if (error.error?.code === 'ACCOUNT_LOCKED') {
          return new AccountLockedError(
            `Account temporarily locked. Try again in ${error.error.lockout_duration} minutes.`
          );
        }
        if (error.error?.code === 'EMAIL_NOT_CONFIRMED') {
          return new EmailNotConfirmedError(
            'Please confirm your email address before logging in.'
          );
        }
        return new UnauthorizedError('Invalid email or password.');
        
      case 429:
        return new TooManyAttemptsError(
          'Too many login attempts. Please try again later.'
        );
        
      case 503:
        return new MaintenanceError(
          'System is currently under maintenance. Please try again later.'
        );
        
      default:
        return new AuthenticationError(
          'An unexpected error occurred during login.'
        );
    }
  }
}
```

### Session Management

**Session State Implementation:**
```typescript
@Injectable()
export class SessionService {
  private readonly _currentSession = signal<Session | null>(null);
  private readonly _isAuthenticated = signal(false);
  
  readonly currentSession = computed(() => this._currentSession());
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly currentUser = computed(() => this._currentSession()?.user || null);
  
  constructor() {
    // Restore session on app start
    this.initializeFromStorage();
    
    // Auto-refresh tokens
    this.startTokenRefreshTimer();
  }
  
  private async initializeFromStorage(): Promise<void> {
    const storedTokens = this.tokenStore.getTokens();
    
    if (storedTokens && !this.isTokenExpired(storedTokens.accessToken)) {
      try {
        const user = await this.authRepo.me();
        const session = Session.create({
          user,
          accessToken: storedTokens.accessToken,
          refreshToken: storedTokens.refreshToken,
          expiresAt: storedTokens.expiresAt
        });
        
        this.setSession(session);
      } catch (error) {
        // Token invalid, clear storage
        this.clearSession();
      }
    }
  }
  
  private startTokenRefreshTimer(): void {
    // Check every minute for token expiration
    setInterval(() => {
      const session = this._currentSession();
      if (session && this.shouldRefreshToken(session)) {
        this.refreshToken();
      }
    }, 60000);
  }
}
```

---

## Role Management Implementation

### Complete File Structure

**Presentation Layer:**
```
src/app/presentation/features/roles/
├── pages/
│   ├── roles-list/
│   │   ├── roles-list.ts          # Roles listing component
│   │   ├── roles-list.html        # List template
│   │   └── roles-list.css         # List styles
│   ├── role-detail/
│   │   ├── role-detail.ts         # Role detail view
│   │   ├── role-detail.html       # Detail template
│   │   └── role-detail.css        # Detail styles
│   └── role-form/
│       ├── role-form.ts           # Role creation/edit form
│       ├── role-form.html         # Form template
│       └── role-form.css          # Form styles
├── components/
│   ├── role-card/
│   │   ├── role-card.ts           # Role card component
│   │   ├── role-card.html         # Card template
│   │   └── role-card.css          # Card styles
│   ├── role-table/
│   │   ├── role-table.ts          # Role table component
│   │   ├── role-table.html        # Table template
│   │   └── role-table.css         # Table styles
│   └── permission-selector/
│       ├── permission-selector.ts  # Permission selection
│       ├── permission-selector.html # Selector template
│       └── permission-selector.css # Selector styles
└── roles.routes.ts                # Role management routing
```

### Role Entity Business Logic

**Domain Entity Implementation:**
```typescript
export class Role {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly accessLevel: number,
    public readonly description: string | null,
    public readonly isActive: boolean,
    public readonly canLeadProjects: boolean,
    public readonly isUniquePerTeam: boolean,
    public readonly userCount: number,
    public readonly permissions: Permission[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date | null
  ) {}
  
  // Business rule: Role hierarchy validation
  canAssignRole(targetRole: Role): boolean {
    // Can only assign roles with lower or equal access level
    return this.accessLevel >= targetRole.accessLevel;
  }
  
  // Business rule: Permission validation
  hasPermission(permissionName: string): boolean {
    return this.permissions.some(p => p.name === permissionName && p.isActive);
  }
  
  // Business rule: Role assignment validation
  canBeAssignedToUser(user: User): boolean {
    if (!this.isActive) return false;
    
    // Check if role is unique per team
    if (this.isUniquePerTeam) {
      // Validate no other user in the same team has this role
      return !user.team?.hasUserWithRole(this.id);
    }
    
    return true;
  }
  
  // Business rule: Deletion validation
  canBeDeleted(): boolean {
    // Cannot delete roles that are currently assigned
    if (this.userCount > 0) {
      throw new BusinessRuleError(
        'Cannot delete role that is currently assigned to users'
      );
    }
    
    // Cannot delete system roles
    if (this.isSystemRole()) {
      throw new BusinessRuleError(
        'Cannot delete system roles'
      );
    }
    
    return true;
  }
  
  // Business rule: System role identification
  isSystemRole(): boolean {
    const systemRoles = ['Administrator', 'User', 'Guest'];
    return systemRoles.includes(this.name);
  }
  
  // Business rule: Administrative privileges
  hasAdministrativePrivileges(): boolean {
    return this.accessLevel >= 90 && this.isActive;
  }
}
```

### Role Repository Implementation

**HTTP Repository with Caching:**
```typescript
@Injectable()
export class HttpRoleRepository implements RoleRepository {
  private http = inject(HttpClient);
  private cache = inject(CacheService);
  private errorMapper = inject(InfraErrorToDomainMapper);
  
  private readonly baseUrl = `${environment.API_URL}/roles`;
  private readonly cacheKey = 'roles_list';
  private readonly cacheTTL = 300000; // 5 minutes
  
  async list(filter?: ListRolesFilterContract): Promise<Role[]> {
    const cacheKey = this.buildCacheKey(filter);
    
    // Check cache first
    const cached = this.cache.get<Role[]>(cacheKey);
    if (cached && !this.isCacheExpired(cacheKey)) {
      return cached;
    }
    
    try {
      const params = this.buildQueryParams(filter);
      const response = await firstValueFrom(
        this.http.get<ListRolesResponseDTO>(`${this.baseUrl}/`, { params })
      );
      
      const roles = response.results.map(dto => 
        RoleMapper.toEntityFromListDTO(dto)
      );
      
      // Cache the results
      this.cache.set(cacheKey, roles, this.cacheTTL);
      
      return roles;
    } catch (error) {
      throw this.transformError(error, 'LIST_ROLES');
    }
  }
  
  async create(spec: CreateRoleContract): Promise<Role> {
    try {
      const requestDto: CreateRoleRequestDTO = {
        name: spec.name,
        access_level: spec.accessLevel,
        description: spec.description || null,
        is_active: spec.isActive ?? true,
        can_lead_projects: spec.canLeadProjects ?? false,
        is_unique_per_team: spec.isUniquePerTeam ?? false,
        permission_ids: spec.permissionIds || []
      };
      
      const response = await firstValueFrom(
        this.http.post<CreateRoleResponseDTO>(this.baseUrl, requestDto)
      );
      
      // Invalidate cache
      this.cache.invalidatePattern('roles_');
      
      return RoleMapper.toEntityFromCreateDTO(response);
    } catch (error) {
      throw this.transformError(error, 'CREATE_ROLE');
    }
  }
  
  private buildQueryParams(filter?: ListRolesFilterContract): HttpParams {
    let params = new HttpParams();
    
    if (filter?.isActive !== undefined) {
      params = params.set('is_active', filter.isActive.toString());
    }
    
    if (filter?.accessLevelMin) {
      params = params.set('access_level__gte', filter.accessLevelMin.toString());
    }
    
    if (filter?.accessLevelMax) {
      params = params.set('access_level__lte', filter.accessLevelMax.toString());
    }
    
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    
    if (filter?.ordering) {
      params = params.set('ordering', filter.ordering);
    }
    
    return params;
  }
}
```

### Role Use Cases

**Create Role Use Case:**
```typescript
@Injectable({ providedIn: 'root' })
export class CreateRole {
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly permissionRepo = inject<PermissionRepository>(PERMISSION_REPOSITORY);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly eventProcessor = inject(DomainEventProcessor);
  
  async execute(request: CreateRoleRequest): Promise<Role> {
    try {
      // Step 1: Validate application rules
      await this.validateApplicationRules(request);
      
      // Step 2: Validate business rules
      await this.validateBusinessRules(request);
      
      // Step 3: Create role through repository
      const role = await this.roleRepo.create({
        name: request.name,
        accessLevel: request.accessLevel,
        description: request.description,
        isActive: request.isActive,
        canLeadProjects: request.canLeadProjects,
        isUniquePerTeam: request.isUniquePerTeam,
        permissionIds: request.permissionIds
      });
      
      // Step 4: Handle side effects
      await this.handleRoleCreationSideEffects(role, request);
      
      return role;
    } catch (error) {
      throw new ApplicationError(
        'create_role',
        this.transformError(error),
        'ROLE_CREATION_FAILED'
      );
    }
  }
  
  private async validateApplicationRules(request: CreateRoleRequest): Promise<void> {
    // Validate required fields
    if (!request.name || request.name.trim().length === 0) {
      throw new ApplicationError(
        'create_role',
        'INVALID_NAME',
        'Role name is required and cannot be empty'
      );
    }
    
    if (request.accessLevel < 0 || request.accessLevel > 100) {
      throw new ApplicationError(
        'create_role',
        'INVALID_ACCESS_LEVEL',
        'Access level must be between 0 and 100'
      );
    }
    
    // Validate name uniqueness
    const existingRoles = await this.roleRepo.list({ search: request.name });
    const duplicateName = existingRoles.some(role => 
      role.name.toLowerCase() === request.name.toLowerCase()
    );
    
    if (duplicateName) {
      throw new ApplicationError(
        'create_role',
        'DUPLICATE_ROLE_NAME',
        'A role with this name already exists'
      );
    }
  }
  
  private async validateBusinessRules(request: CreateRoleRequest): Promise<void> {
    // Validate permissions exist and are valid
    if (request.permissionIds && request.permissionIds.length > 0) {
      const permissions = await this.permissionRepo.getByIds(request.permissionIds);
      
      if (permissions.length !== request.permissionIds.length) {
        throw new ApplicationError(
          'create_role',
          'INVALID_PERMISSIONS',
          'One or more specified permissions do not exist'
        );
      }
      
      // Validate permission compatibility with access level
      const incompatiblePermissions = permissions.filter(permission =>
        permission.requiredAccessLevel > request.accessLevel
      );
      
      if (incompatiblePermissions.length > 0) {
        throw new ApplicationError(
          'create_role',
          'INCOMPATIBLE_PERMISSIONS',
          `Permissions require higher access level: ${incompatiblePermissions.map(p => p.name).join(', ')}`
        );
      }
    }
  }
  
  private async handleRoleCreationSideEffects(
    role: Role,
    request: CreateRoleRequest
  ): Promise<void> {
    // Process domain events
    await this.eventProcessor.processEntityEvents(role);
    
    // Create audit log entry
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
    console.log('[Role Created]', {
      timestamp: timestamp.toISOString(),
      roleId: role.id,
      roleName: role.name,
      accessLevel: role.accessLevel,
      createdBy: request.createdBy || 'system',
      action: 'create_role',
      status: 'success'
    });
    
    // Send notification to administrators
    if (role.accessLevel >= 80) {
      // High-privilege role created, notify admins
      await this.notifyAdministrators(role);
    }
  }
}
```

---

## User Management System

### User Entity with Business Logic

**Rich Domain Entity:**
```typescript
export class User {
  constructor(
    public readonly id: number,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly username: string,
    public readonly role: Role,
    public readonly isActive: boolean,
    public readonly isEmailConfirmed: boolean,
    public readonly lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date | null,
    public readonly team?: Team | null,
    public readonly profile?: UserProfile | null
  ) {}
  
  // Business rule: Full name computation
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  
  // Business rule: Display name with fallback
  get displayName(): string {
    if (this.firstName && this.lastName) {
      return this.fullName;
    }
    return this.username || this.email;
  }
  
  // Business rule: Administrative privileges
  isAdministrator(): boolean {
    return this.role.hasAdministrativePrivileges() && this.isActive;
  }
  
  // Business rule: Account status validation
  canLogin(): boolean {
    return this.isActive && this.isEmailConfirmed;
  }
  
  // Business rule: Role assignment validation
  canBeAssignedRole(newRole: Role): boolean {
    // Cannot change role to higher privilege without proper authorization
    if (newRole.accessLevel > this.role.accessLevel) {
      return false;
    }
    
    // Check if new role is compatible with user's team
    if (this.team && newRole.isUniquePerTeam) {
      return !this.team.hasUserWithRole(newRole.id);
    }
    
    return true;
  }
  
  // Business rule: Profile completeness
  hasCompleteProfile(): boolean {
    return !!(
      this.firstName &&
      this.lastName &&
      this.email &&
      this.isEmailConfirmed &&
      this.profile?.avatar &&
      this.profile?.bio
    );
  }
  
  // Business rule: Account age
  getAccountAge(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Days
  }
  
  // Business rule: Recent activity
  isRecentlyActive(): boolean {
    if (!this.lastLoginAt) return false;
    
    const daysSinceLogin = Math.ceil(
      (Date.now() - this.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLogin <= 30; // Active within last 30 days
  }
  
  // Business rule: Team leadership validation
  canLeadTeam(): boolean {
    return this.isActive && 
           this.role.canLeadProjects && 
           this.hasCompleteProfile();
  }
}
```

### User Repository with Advanced Filtering

**Advanced Repository Implementation:**
```typescript
@Injectable()
export class HttpUserRepository implements UserRepository {
  private http = inject(HttpClient);
  private cache = inject(CacheService);
  private errorMapper = inject(InfraErrorToDomainMapper);
  
  private readonly baseUrl = `${environment.API_URL}/users`;
  
  async list(filter?: ListUsersFilterContract): Promise<PaginatedResult<User>> {
    try {
      const params = this.buildAdvancedQueryParams(filter);
      
      const response = await firstValueFrom(
        this.http.get<ListUsersResponseDTO>(`${this.baseUrl}/`, { params })
      );
      
      const users = response.results.map(dto => 
        UserMapper.toEntityFromListDTO(dto)
      );
      
      return {
        items: users,
        totalCount: response.count,
        pageNumber: filter?.page || 1,
        pageSize: filter?.pageSize || 20,
        hasNextPage: !!response.next,
        hasPreviousPage: !!response.previous
      };
    } catch (error) {
      throw this.transformError(error, 'LIST_USERS');
    }
  }
  
  async update(id: number, patch: UpdateUserPatchContract): Promise<User> {
    try {
      const requestDto: UpdateUserRequestDTO = {
        first_name: patch.firstName,
        last_name: patch.lastName,
        email: patch.email,
        role_id: patch.roleId,
        is_active: patch.isActive,
        team_id: patch.teamId
      };
      
      // Remove undefined values
      Object.keys(requestDto).forEach(key => {
        if (requestDto[key] === undefined) {
          delete requestDto[key];
        }
      });
      
      const response = await firstValueFrom(
        this.http.patch<UpdateUserResponseDTO>(`${this.baseUrl}/${id}/`, requestDto)
      );
      
      // Invalidate related caches
      this.cache.invalidatePattern(`user_${id}`);
      this.cache.invalidatePattern('users_list');
      
      return UserMapper.toEntityFromUpdateDTO(response);
    } catch (error) {
      throw this.transformError(error, 'UPDATE_USER');
    }
  }
  
  private buildAdvancedQueryParams(filter?: ListUsersFilterContract): HttpParams {
    let params = new HttpParams();
    
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    
    if (filter?.isActive !== undefined) {
      params = params.set('is_active', filter.isActive.toString());
    }
    
    if (filter?.roleIds && filter.roleIds.length > 0) {
      params = params.set('role_id__in', filter.roleIds.join(','));
    }
    
    if (filter?.teamIds && filter.teamIds.length > 0) {
      params = params.set('team_id__in', filter.teamIds.join(','));
    }
    
    if (filter?.isEmailConfirmed !== undefined) {
      params = params.set('is_email_confirmed', filter.isEmailConfirmed.toString());
    }
    
    if (filter?.lastLoginAfter) {
      params = params.set('last_login__gte', filter.lastLoginAfter.toISOString());
    }
    
    if (filter?.lastLoginBefore) {
      params = params.set('last_login__lte', filter.lastLoginBefore.toISOString());
    }
    
    if (filter?.createdAfter) {
      params = params.set('created_at__gte', filter.createdAfter.toISOString());
    }
    
    if (filter?.createdBefore) {
      params = params.set('created_at__lte', filter.createdBefore.toISOString());
    }
    
    if (filter?.ordering) {
      params = params.set('ordering', filter.ordering);
    } else {
      params = params.set('ordering', '-created_at'); // Default ordering
    }
    
    if (filter?.page) {
      params = params.set('page', filter.page.toString());
    }
    
    if (filter?.pageSize) {
      params = params.set('page_size', filter.pageSize.toString());
    }
    
    return params;
  }
}
```

### User Update Use Case with Validation

**Complex Update Logic:**
```typescript
@Injectable({ providedIn: 'root' })
export class UpdateUser {
  private readonly userRepo = inject<UserRepository>(USER_REPOSITORY);
  private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
  private readonly teamRepo = inject<TeamRepository>(TEAM_REPOSITORY);
  private readonly emailService = inject<EmailService>(EMAIL_SERVICE);
  private readonly clock = inject<ClockPort>(CLOCK_PORT);
  private readonly eventProcessor = inject(DomainEventProcessor);
  
  async execute(
    userId: number,
    patch: UpdateUserPatchContract,
    requesterId?: number
  ): Promise<User> {
    try {
      // Step 1: Get current user state
      const currentUser = await this.userRepo.getById(userId);
      
      // Step 2: Validate application rules
      await this.validateApplicationRules(currentUser, patch, requesterId);
      
      // Step 3: Validate business rules
      await this.validateBusinessRules(currentUser, patch);
      
      // Step 4: Apply update
      const updatedUser = await this.userRepo.update(userId, patch);
      
      // Step 5: Handle side effects
      await this.handleUpdateSideEffects(currentUser, updatedUser, patch, requesterId);
      
      return updatedUser;
    } catch (error) {
      throw new ApplicationError(
        'update_user',
        this.transformError(error),
        'USER_UPDATE_FAILED'
      );
    }
  }
  
  private async validateApplicationRules(
    currentUser: User,
    patch: UpdateUserPatchContract,
    requesterId?: number
  ): Promise<void> {
    // Validate requester permissions
    if (requesterId && requesterId !== currentUser.id) {
      const requester = await this.userRepo.getById(requesterId);
      
      if (!requester.isAdministrator()) {
        throw new ApplicationError(
          'update_user',
          'INSUFFICIENT_PERMISSIONS',
          'You do not have permission to update other users'
        );
      }
      
      // Cannot update users with higher or equal privilege
      if (currentUser.role.accessLevel >= requester.role.accessLevel) {
        throw new ApplicationError(
          'update_user',
          'CANNOT_UPDATE_HIGHER_PRIVILEGE',
          'Cannot update users with equal or higher privileges'
        );
      }
    }
    
    // Validate email uniqueness if changing email
    if (patch.email && patch.email !== currentUser.email) {
      const existingUser = await this.userRepo.getByEmail(patch.email);
      if (existingUser) {
        throw new ApplicationError(
          'update_user',
          'EMAIL_ALREADY_EXISTS',
          'A user with this email already exists'
        );
      }
    }
  }
  
  private async validateBusinessRules(
    currentUser: User,
    patch: UpdateUserPatchContract
  ): Promise<void> {
    // Validate role change
    if (patch.roleId && patch.roleId !== currentUser.role.id) {
      const newRole = await this.roleRepo.getById(patch.roleId);
      
      if (!currentUser.canBeAssignedRole(newRole)) {
        throw new ApplicationError(
          'update_user',
          'INVALID_ROLE_ASSIGNMENT',
          'User cannot be assigned to this role'
        );
      }
    }
    
    // Validate team change
    if (patch.teamId && patch.teamId !== currentUser.team?.id) {
      const newTeam = await this.teamRepo.getById(patch.teamId);
      
      // Check team capacity
      if (newTeam.isFull()) {
        throw new ApplicationError(
          'update_user',
          'TEAM_FULL',
          'The selected team has reached its maximum capacity'
        );
      }
      
      // Check role compatibility with team
      const userRole = patch.roleId ? 
        await this.roleRepo.getById(patch.roleId) : 
        currentUser.role;
        
      if (userRole.isUniquePerTeam && newTeam.hasUserWithRole(userRole.id)) {
        throw new ApplicationError(
          'update_user',
          'ROLE_UNIQUE_VIOLATION',
          'Another user in this team already has this role'
        );
      }
    }
    
    // Validate account deactivation
    if (patch.isActive === false && currentUser.isActive) {
      // Cannot deactivate the last administrator
      if (currentUser.isAdministrator()) {
        const adminCount = await this.userRepo.countAdministrators();
        if (adminCount <= 1) {
          throw new ApplicationError(
            'update_user',
            'CANNOT_DEACTIVATE_LAST_ADMIN',
            'Cannot deactivate the last administrator'
          );
        }
      }
    }
  }
  
  private async handleUpdateSideEffects(
    currentUser: User,
    updatedUser: User,
    patch: UpdateUserPatchContract,
    requesterId?: number
  ): Promise<void> {
    // Process domain events
    await this.eventProcessor.processEntityEvents(updatedUser);
    
    // Send email notifications for important changes
    if (patch.email && patch.email !== currentUser.email) {
      await this.emailService.sendEmailChangeNotification(updatedUser, currentUser.email);
    }
    
    if (patch.roleId && patch.roleId !== currentUser.role.id) {
      await this.emailService.sendRoleChangeNotification(updatedUser, currentUser.role);
    }
    
    if (patch.isActive === false && currentUser.isActive) {
      await this.emailService.sendAccountDeactivationNotification(updatedUser);
    }
    
    // Create audit log
    const timestamp = new Date(this.clock.nowEpochSeconds() * 1000);
    const changedFields = Object.keys(patch);
    
    console.log('[User Updated]', {
      timestamp: timestamp.toISOString(),
      userId: updatedUser.id,
      userEmail: updatedUser.email,
      changedFields,
      requesterId: requesterId || 'system',
      previousValues: this.extractChangedValues(currentUser, changedFields),
      newValues: this.extractChangedValues(updatedUser, changedFields),
      action: 'update_user',
      status: 'success'
    });
  }
}
```

---

## Notification System Architecture

### Notification Entity and Value Objects

**Rich Notification Domain:**
```typescript
export class Notification {
  constructor(
    public readonly id: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly userId: string | null,
    public readonly isRead: boolean,
    public readonly isPersistent: boolean,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date,
    public readonly readAt: Date | null,
    public readonly metadata: NotificationMetadata,
    public readonly actions: NotificationAction[]
  ) {}
  
  // Business rule: Expiration validation
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
  
  // Business rule: Auto-dismiss validation
  shouldAutoDismiss(): boolean {
    return !this.isPersistent && 
           this.type !== 'error' && 
           this.expiresAt !== null;
  }
  
  // Business rule: Action availability
  hasActions(): boolean {
    return this.actions.length > 0;
  }
  
  // Business rule: Priority calculation
  getPriority(): NotificationPriority {
    switch (this.type) {
      case 'error': return 'high';
      case 'warning': return 'medium';
      case 'success': return 'low';
      case 'info': return 'low';
      default: return 'low';
    }
  }
  
  // Business rule: Read state management
  markAsRead(): Notification {
    if (this.isRead) return this;
    
    return new Notification(
      this.id,
      this.type,
      this.title,
      this.message,
      this.userId,
      true, // isRead
      this.isPersistent,
      this.expiresAt,
      this.createdAt,
      new Date(), // readAt
      this.metadata,
      this.actions
    );
  }
  
  // Business rule: Duplicate detection
  isDuplicateOf(other: Notification): boolean {
    return this.type === other.type &&
           this.title === other.title &&
           this.message === other.message &&
           this.userId === other.userId &&
           Math.abs(this.createdAt.getTime() - other.createdAt.getTime()) < 5000; // Within 5 seconds
  }
}

// Value Objects
export class NotificationMetadata {
  constructor(
    public readonly source: string,
    public readonly category: string,
    public readonly tags: string[],
    public readonly data: Record<string, any>
  ) {}
}

export class NotificationAction {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly style: 'primary' | 'secondary' | 'danger',
    public readonly handler: () => void | Promise<void>
  ) {}
}
```

### Notification Service Implementation

**Advanced Notification Management:**
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly maxVisible = 5;
  private readonly maxStored = 100;
  private readonly duplicateCheckWindow = 5000; // 5 seconds
  
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _unreadCount = signal(0);
  
  readonly notifications = computed(() => this._notifications());
  readonly unreadCount = computed(() => this._unreadCount());
  readonly visibleNotifications = computed(() => 
    this._notifications().slice(0, this.maxVisible)
  );
  
  constructor() {
    this.startCleanupTimer();
  }
  
  async notify(request: CreateNotificationRequest): Promise<string> {
    const notification = this.createNotification(request);
    
    // Check for duplicates
    if (this.isDuplicate(notification)) {
      console.log('[NotificationService] Duplicate notification ignored:', notification.title);
      return notification.id;
    }
    
    // Add to notifications list
    this._notifications.update(notifications => {
      const updated = [notification, ...notifications];
      
      // Maintain maximum stored notifications
      if (updated.length > this.maxStored) {
        return updated.slice(0, this.maxStored);
      }
      
      return updated;
    });
    
    // Update unread count
    this.updateUnreadCount();
    
    // Set up auto-dismiss if applicable
    if (notification.shouldAutoDismiss() && notification.expiresAt) {
      this.scheduleAutoDismiss(notification);
    }
    
    // Persist to storage if needed
    if (notification.isPersistent) {
      await this.persistNotification(notification);
    }
    
    return notification.id;
  }
  
  dismiss(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
    this.updateUnreadCount();
  }
  
  markAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n => 
        n.id === notificationId ? n.markAsRead() : n
      )
    );
    this.updateUnreadCount();
  }
  
  markAllAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => n.markAsRead())
    );
    this.updateUnreadCount();
  }
  
  clearAll(): void {
    this._notifications.set([]);
    this.updateUnreadCount();
  }
  
  private createNotification(request: CreateNotificationRequest): Notification {
    const id = this.generateNotificationId();
    const now = new Date();
    
    const expiresAt = request.duration ? 
      new Date(now.getTime() + request.duration) : 
      null;
    
    const actions = request.actions?.map(action => 
      new NotificationAction(
        action.id,
        action.label,
        action.style,
        action.handler
      )
    ) || [];
    
    const metadata = new NotificationMetadata(
      request.source || 'system',
      request.category || 'general',
      request.tags || [],
      request.data || {}
    );
    
    return new Notification(
      id,
      request.type,
      request.title,
      request.message,
      request.userId || null,
      false, // isRead
      request.isPersistent || false,
      expiresAt,
      now,
      null, // readAt
      metadata,
      actions
    );
  }
  
  private isDuplicate(notification: Notification): boolean {
    const recent = this._notifications().filter(n => 
      Math.abs(n.createdAt.getTime() - notification.createdAt.getTime()) < this.duplicateCheckWindow
    );
    
    return recent.some(n => notification.isDuplicateOf(n));
  }
  
  private scheduleAutoDismiss(notification: Notification): void {
    if (!notification.expiresAt) return;
    
    const delay = notification.expiresAt.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, delay);
    }
  }
  
  private startCleanupTimer(): void {
    // Clean up expired notifications every minute
    setInterval(() => {
      this._notifications.update(notifications =>
        notifications.filter(n => !n.isExpired())
      );
      this.updateUnreadCount();
    }, 60000);
  }
  
  private updateUnreadCount(): void {
    const unread = this._notifications().filter(n => !n.isRead).length;
    this._unreadCount.set(unread);
  }
  
  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Dashboard & Navigation

### Layout Service with Responsive Design

**Advanced Layout Management:**
```typescript
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private document = inject(DOCUMENT);
  
  // Constants for responsive breakpoints
  private readonly BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1280,
    largeDesktop: 1536
  } as const;
  
  // Private state signals
  private readonly _sidebarCollapsed = signal(false);
  private readonly _mobileDrawerOpen = signal(false);
  private readonly _hoveredItemId = signal<string | null>(null);
  private readonly _windowWidth = signal(this.getInitialWindowWidth());
  private readonly _windowHeight = signal(this.getInitialWindowHeight());
  private readonly _scrollPosition = signal(0);
  private readonly _isFullscreen = signal(false);
  
  // Public computed signals
  readonly sidebarCollapsed = computed(() => this._sidebarCollapsed());
  readonly mobileDrawerOpen = computed(() => this._mobileDrawerOpen());
  readonly hoveredItemId = computed(() => this._hoveredItemId());
  readonly windowWidth = computed(() => this._windowWidth());
  readonly windowHeight = computed(() => this._windowHeight());
  readonly scrollPosition = computed(() => this._scrollPosition());
  readonly isFullscreen = computed(() => this._isFullscreen());
  
  // Responsive breakpoint computed signals
  readonly isMobile = computed(() => this._windowWidth() < this.BREAKPOINTS.mobile);
  readonly isTablet = computed(() => 
    this._windowWidth() >= this.BREAKPOINTS.mobile && 
    this._windowWidth() < this.BREAKPOINTS.desktop
  );
  readonly isDesktop = computed(() => this._windowWidth() >= this.BREAKPOINTS.desktop);
  readonly isLargeDesktop = computed(() => this._windowWidth() >= this.BREAKPOINTS.largeDesktop);
  
  // Layout computed signals
  readonly shouldShowMobileNav = computed(() => this.isMobile());
  readonly shouldCollapseSidebar = computed(() => 
    this.isMobile() || (this.isTablet() && this._sidebarCollapsed())
  );
  readonly contentWidth = computed(() => {
    if (this.isMobile()) return this._windowWidth();
    if (this.shouldCollapseSidebar()) return this._windowWidth() - 80; // Collapsed sidebar width
    return this._windowWidth() - 280; // Full sidebar width
  });
  
  constructor() {
    this.initializeFromStorage();
    this.setupEventListeners();
    this.setupEffects();
  }
  
  // Public methods
  toggleSidebarCollapsed(): void {
    this._sidebarCollapsed.update(collapsed => !collapsed);
  }
  
  setSidebarCollapsed(collapsed: boolean): void {
    this._sidebarCollapsed.set(collapsed);
  }
  
  openMobileDrawer(): void {
    this._mobileDrawerOpen.set(true);
    this.lockBodyScroll();
  }
  
  closeMobileDrawer(): void {
    this._mobileDrawerOpen.set(false);
    this.unlockBodyScroll();
  }
  
  toggleMobileDrawer(): void {
    if (this._mobileDrawerOpen()) {
      this.closeMobileDrawer();
    } else {
      this.openMobileDrawer();
    }
  }
  
  setHoveredItem(itemId: string | null): void {
    this._hoveredItemId.set(itemId);
  }
  
  onNavigate(): void {
    // Close mobile drawer on navigation
    if (this.isMobile()) {
      this.closeMobileDrawer();
    }
    
    // Clear hovered item
    this.setHoveredItem(null);
    
    // Scroll to top
    this.scrollToTop();
  }
  
  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  enterFullscreen(): void {
    if (this.document.documentElement.requestFullscreen) {
      this.document.documentElement.requestFullscreen();
    }
  }
  
  exitFullscreen(): void {
    if (this.document.exitFullscreen) {
      this.document.exitFullscreen();
    }
  }
  
  toggleFullscreen(): void {
    if (this._isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }
  
  // Private methods
  private initializeFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) {
        try {
          const config = JSON.parse(stored);
          this._sidebarCollapsed.set(config.sidebarCollapsed || false);
        } catch (error) {
          console.warn('[LayoutService] Failed to parse stored layout config:', error);
        }
      }
    }
  }
  
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;
    
    // Window resize listener
    const handleResize = () => {
      this._windowWidth.set(window.innerWidth);
      this._windowHeight.set(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Scroll listener
    const handleScroll = () => {
      this._scrollPosition.set(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fullscreen change listener
    const handleFullscreenChange = () => {
      this._isFullscreen.set(!!this.document.fullscreenElement);
    };
    
    this.document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        this.toggleSidebarCollapsed();
      }
      
      // Toggle fullscreen with F11
      if (event.key === 'F11') {
        event.preventDefault();
        this.toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
  }
  
  private setupEffects(): void {
    // Persist sidebar state
    effect(() => {
      if (typeof window !== 'undefined') {
        const config = {
          sidebarCollapsed: this._sidebarCollapsed()
        };
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(config));
      }
    });
    
    // Auto-close mobile drawer when switching to desktop
    effect(() => {
      if (!this.isMobile() && this._mobileDrawerOpen()) {
        this.closeMobileDrawer();
      }
    });
    
    // Auto-collapse sidebar on tablet in portrait mode
    effect(() => {
      if (this.isTablet() && this._windowHeight() > this._windowWidth()) {
        // Portrait tablet - collapse sidebar for more content space
        this._sidebarCollapsed.set(true);
      }
    });
  }
  
  private lockBodyScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }
  
  private unlockBodyScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
  
  private getInitialWindowWidth(): number {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  }
  
  private getInitialWindowHeight(): number {
    return typeof window !== 'undefined' ? window.innerHeight : 768;
  }
}
```

### Navigation Service with Role-Based Access

**Advanced Navigation Management:**
```typescript
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);
  private readonly layoutService = inject(LayoutService);
  
  private readonly _currentPath = signal<string>('/');
  private readonly _breadcrumbs = signal<Breadcrumb[]>([]);
  private readonly _navigationHistory = signal<string[]>([]);
  
  readonly currentPath = computed(() => this._currentPath());
  readonly breadcrumbs = computed(() => this._breadcrumbs());
  readonly navigationHistory = computed(() => this._navigationHistory());
  
  // Navigation sections with role-based filtering
  readonly accessibleSections = computed(() => {
    const user = this.authFacade.user();
    return this.filterSectionsByUserRole(NAV_SECTIONS, user);
  });
  
  // Active section detection
  readonly activeSection = computed(() => {
    const currentPath = this._currentPath();
    return this.accessibleSections().find(section =>
      section.items.some(item => this.isPathActive(item.path, currentPath))
    );
  });
  
  // Active navigation item
  readonly activeItem = computed(() => {
    const currentPath = this._currentPath();
    const sections = this.accessibleSections();
    
    for (const section of sections) {
      const activeItem = section.items.find(item => 
        this.isPathActive(item.path, currentPath)
      );
      if (activeItem) return activeItem;
    }
    
    return null;
  });
  
  constructor() {
    this.initializeRouter();
  }
  
  // Navigation methods
  async navigateTo(path: string, options?: NavigationOptions): Promise<boolean> {
    try {
      // Check if user has access to the path
      if (!this.canAccessPath(path)) {
        console.warn(`[NavigationService] Access denied to path: ${path}`);
        await this.navigateToFallback();
        return false;
      }
      
      // Add to history
      this.addToHistory(path);
      
      // Navigate
      const result = await this.router.navigateByUrl(path);
      
      // Handle post-navigation actions
      if (result) {
        this.layoutService.onNavigate();
        
        if (options?.updateBreadcrumbs !== false) {
          this.updateBreadcrumbs(path);
        }
      }
      
      return result;
    } catch (error) {
      console.error('[NavigationService] Navigation error:', error);
      return false;
    }
  }
  
  async navigateBack(): Promise<void> {
    const history = this._navigationHistory();
    
    if (history.length > 1) {
      // Remove current path and navigate to previous
      const previousPath = history[history.length - 2];
      this._navigationHistory.update(h => h.slice(0, -1));
      await this.navigateTo(previousPath, { updateHistory: false });
    } else {
      // No history, navigate to dashboard
      await this.navigateTo('/dashboard');
    }
  }
  
  async navigateToFallback(): Promise<void> {
    const user = this.authFacade.user();
    
    if (!user) {
      await this.navigateTo('/auth/login');
    } else if (user.isAdministrator()) {
      await this.navigateTo('/dashboard');
    } else {
      // Navigate to first accessible section
      const firstSection = this.accessibleSections()[0];
      if (firstSection && firstSection.items.length > 0) {
        await this.navigateTo(firstSection.items[0].path);
      } else {
        await this.navigateTo('/dashboard');
      }
    }
  }
  
  // Utility methods
  canAccessPath(path: string): boolean {
    const user = this.authFacade.user();
    if (!user) return false;
    
    const sections = this.accessibleSections();
    
    for (const section of sections) {
      const item = section.items.find(item => 
        this.isPathActive(item.path, path)
      );
      
      if (item) {
        return this.canAccessNavItem(item, user);
      }
    }
    
    // Allow access to basic paths
    const publicPaths = ['/dashboard', '/profile', '/settings'];
    return publicPaths.some(publicPath => path.startsWith(publicPath));
  }
  
  isPathActive(itemPath: string, currentPath: string): boolean {
    if (itemPath === currentPath) return true;
    
    // Handle dynamic segments
    const itemSegments = itemPath.split('/').filter(Boolean);
    const currentSegments = currentPath.split('/').filter(Boolean);
    
    if (itemSegments.length !== currentSegments.length) {
      // Check for parent path matching
      return currentPath.startsWith(itemPath + '/') || itemPath.startsWith(currentPath + '/');
    }
    
    return itemSegments.every((segment, index) => {
      const currentSegment = currentSegments[index];
      
      // Dynamic segment (starts with :)
      if (segment.startsWith(':')) return true;
      
      return segment === currentSegment;
    });
  }
  
  // Private methods
  private initializeRouter(): void {
    this._currentPath.set(this.router.url);
    this.addToHistory(this.router.url);
    this.updateBreadcrumbs(this.router.url);
    
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this._currentPath.set(event.url);
      });
  }
  
  private filterSectionsByUserRole(sections: NavSection[], user: User | null): NavSection[] {
    if (!user) return [];
    
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => this.canAccessNavItem(item, user))
    })).filter(section => section.items.length > 0);
  }
  
  private canAccessNavItem(item: NavItem, user: User): boolean {
    // No role requirements - accessible to all
    if (!item.requireRoles || item.requireRoles.length === 0) {
      return true;
    }
    
    // Administrator can access everything
    if (user.isAdministrator()) {
      return true;
    }
    
    // Check specific role requirements
    return item.requireRoles.includes(user.role.name);
  }
  
  private addToHistory(path: string): void {
    this._navigationHistory.update(history => {
      const newHistory = [...history];
      
      // Remove if already exists to avoid duplicates
      const existingIndex = newHistory.indexOf(path);
      if (existingIndex !== -1) {
        newHistory.splice(existingIndex, 1);
      }
      
      // Add to end
      newHistory.push(path);
      
      // Limit history size
      if (newHistory.length > 50) {
        return newHistory.slice(-50);
      }
      
      return newHistory;
    });
  }
  
  private updateBreadcrumbs(path: string): void {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: Breadcrumb[] = [];
    
    let currentPath = '';
    
    for (const segment of segments) {
      currentPath += `/${segment}`;
      
      const navItem = this.findNavItemByPath(currentPath);
      
      breadcrumbs.push({
        label: navItem?.label || this.formatSegmentLabel(segment),
        path: currentPath,
        icon: navItem?.icon,
        isActive: currentPath === path
      });
    }
    
    this._breadcrumbs.set(breadcrumbs);
  }
  
  private findNavItemByPath(path: string): NavItem | null {
    const sections = NAV_SECTIONS;
    
    for (const section of sections) {
      const item = section.items.find(item => 
        this.isPathActive(item.path, path)
      );
      if (item) return item;
    }
    
    return null;
  }
  
  private formatSegmentLabel(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Supporting interfaces
interface NavigationOptions {
  updateHistory?: boolean;
  updateBreadcrumbs?: boolean;
}

interface Breadcrumb {
  label: string;
  path: string;
  icon?: string;
  isActive: boolean;
}
```

---

## Summary

This document provides detailed implementation documentation for all 5 workflows in the MAD-AI application:

1. **Authentication Workflow**: Complete login/logout flow with session management and error handling
2. **Role Management**: CRUD operations with business rule validation and permission management  
3. **User Management**: User lifecycle with role assignments and team management
4. **Notification System**: Rich notification management with actions and persistence
5. **Dashboard & Navigation**: Responsive layout and role-based navigation

Each workflow includes:
- Complete file path analysis
- Rich domain entities with business logic
- Advanced repository implementations
- Comprehensive use case orchestration
- Error handling and validation
- State management with Angular Signals
- Responsive design considerations

The implementations follow Clean Architecture principles with clear separation of concerns and provide a solid foundation for extending the MAD-AI application.
