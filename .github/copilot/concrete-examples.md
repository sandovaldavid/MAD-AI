# Concrete Codebase Examples

> **Real examples from the MAD-AI project demonstrating best practices and patterns**

## Table of Contents

1. [Clean Architecture Implementation](#clean-architecture-implementation)
2. [Domain-Driven Design Patterns](#domain-driven-design-patterns)
3. [Signal-Based State Management](#signal-based-state-management)
4. [Dependency Injection Patterns](#dependency-injection-patterns)
5. [Error Handling Implementation](#error-handling-implementation)
6. [Testing Patterns](#testing-patterns)
7. [Component Examples](#component-examples)
8. [Service Integration](#service-integration)

## Clean Architecture Implementation

### 1. Domain Layer Example

**From `src/app/domain/entities/user.entity.ts`:**

```typescript
import { Email } from '../value-objects/email.value-object';
import { UserRole } from '../enums/user-role.enum';
import { DomainEntity } from './domain-entity.base';

export interface UserData {
    readonly id: number;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly active: boolean;
    readonly roles: UserRole[];
    readonly createdAt: Date;
    readonly updatedAt?: Date;
}

export class User extends DomainEntity<UserData> {
    static create(data: Omit<UserData, 'id' | 'createdAt'>): User {
        // Domain validation
        Email.validate(data.email);
        
        if (!data.firstName.trim()) {
            throw new Error('First name is required');
        }
        
        if (!data.lastName.trim()) {
            throw new Error('Last name is required');
        }
        
        return new User({
            ...data,
            id: 0, // Will be assigned by repository
            createdAt: new Date()
        });
    }
    
    get email(): Email {
        return Email.create(this.data.email);
    }
    
    get fullName(): string {
        return `${this.data.firstName} ${this.data.lastName}`;
    }
    
    get isActive(): boolean {
        return this.data.active;
    }
    
    get hasAdminRole(): boolean {
        return this.data.roles.includes(UserRole.ADMIN);
    }
    
    activate(): User {
        return this.update({ active: true });
    }
    
    deactivate(): User {
        return this.update({ active: false });
    }
    
    updateProfile(firstName: string, lastName: string): User {
        if (!firstName.trim() || !lastName.trim()) {
            throw new Error('First name and last name are required');
        }
        
        return this.update({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            updatedAt: new Date()
        });
    }
    
    assignRole(role: UserRole): User {
        if (this.data.roles.includes(role)) {
            return this;
        }
        
        return this.update({
            roles: [...this.data.roles, role],
            updatedAt: new Date()
        });
    }
    
    removeRole(role: UserRole): User {
        return this.update({
            roles: this.data.roles.filter(r => r !== role),
            updatedAt: new Date()
        });
    }
    
    private update(changes: Partial<UserData>): User {
        return new User({
            ...this.data,
            ...changes
        });
    }
}
```

**From `src/app/domain/repositories/user.repository.ts`:**

```typescript
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.value-object';

export interface UserRepository {
    findAll(): Promise<User[]>;
    findById(id: number): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findActiveUsers(): Promise<User[]>;
    save(user: User): Promise<User>;
    delete(id: number): Promise<void>;
    existsByEmail(email: Email): Promise<boolean>;
}

// Repository token for DI
export const USER_REPOSITORY = Symbol('UserRepository');
```

### 2. Application Layer Example

**From `src/app/application/facades/users.facade.ts`:**

```typescript
import { Injectable, computed, signal, inject, effect } from '@angular/core';
import { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { ApplicationError } from '../errors/application-error';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';
import { LoadUsersUseCase } from '../use-cases/load-users.use-case';
import { NOTIFICATION_SERVICE, NotificationService } from '../services/notification.service';

@Injectable({ providedIn: 'root' })
export class UsersFacade {
    // Dependencies
    private readonly userRepository = inject(USER_REPOSITORY);
    private readonly notificationService = inject(NOTIFICATION_SERVICE);
    
    // Use cases
    private readonly createUserUseCase = inject(CreateUserUseCase);
    private readonly updateUserUseCase = inject(UpdateUserUseCase);
    private readonly deleteUserUseCase = inject(DeleteUserUseCase);
    private readonly loadUsersUseCase = inject(LoadUsersUseCase);
    
    // Private state signals
    private readonly _users = signal<User[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<ApplicationError | null>(null);
    private readonly _selectedUserId = signal<number | null>(null);
    
    // Public computed state
    readonly users = computed(() => this._users());
    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    readonly selectedUserId = computed(() => this._selectedUserId());
    
    // Derived computed values
    readonly activeUsers = computed(() => 
        this._users().filter(user => user.isActive)
    );
    
    readonly adminUsers = computed(() => 
        this._users().filter(user => user.hasAdminRole)
    );
    
    readonly userCount = computed(() => this._users().length);
    readonly activeUserCount = computed(() => this.activeUsers().length);
    readonly hasUsers = computed(() => this.userCount() > 0);
    readonly isEmpty = computed(() => !this.loading() && !this.hasUsers());
    
    readonly selectedUser = computed(() => {
        const id = this._selectedUserId();
        return id ? this._users().find(user => user.data.id === id) || null : null;
    });
    
    // Effects for side effects
    private readonly errorNotificationEffect = effect(() => {
        const error = this._error();
        if (error) {
            this.notificationService.error(error.message);
        }
    });
    
    // Public methods
    async loadUsers(): Promise<void> {
        this._loading.set(true);
        this._error.set(null);
        
        try {
            const result = await this.loadUsersUseCase.execute();
            
            if (result.success) {
                this._users.set(result.data);
                this.notificationService.info(`Loaded ${result.data.length} users`);
            } else {
                this._error.set(result.error);
            }
        } catch (error) {
            const appError = new ApplicationError(
                'users',
                'Failed to load users',
                'LOAD_USERS_ERROR',
                error
            );
            this._error.set(appError);
        } finally {
            this._loading.set(false);
        }
    }
    
    async createUser(userData: CreateUserData): Promise<void> {
        this._loading.set(true);
        this._error.set(null);
        
        try {
            const result = await this.createUserUseCase.execute(userData);
            
            if (result.success) {
                this._users.update(users => [...users, result.data]);
                this.notificationService.success('User created successfully');
            } else {
                this._error.set(result.error);
            }
        } catch (error) {
            const appError = new ApplicationError(
                'users',
                'Failed to create user',
                'CREATE_USER_ERROR',
                error
            );
            this._error.set(appError);
        } finally {
            this._loading.set(false);
        }
    }
    
    async updateUser(id: number, updates: UpdateUserData): Promise<void> {
        this._loading.set(true);
        this._error.set(null);
        
        try {
            const result = await this.updateUserUseCase.execute(id, updates);
            
            if (result.success) {
                this._users.update(users =>
                    users.map(user => 
                        user.data.id === id ? result.data : user
                    )
                );
                this.notificationService.success('User updated successfully');
            } else {
                this._error.set(result.error);
            }
        } catch (error) {
            const appError = new ApplicationError(
                'users',
                'Failed to update user',
                'UPDATE_USER_ERROR',
                error
            );
            this._error.set(appError);
        } finally {
            this._loading.set(false);
        }
    }
    
    async deleteUser(id: number): Promise<void> {
        this._loading.set(true);
        this._error.set(null);
        
        try {
            const result = await this.deleteUserUseCase.execute(id);
            
            if (result.success) {
                this._users.update(users => 
                    users.filter(user => user.data.id !== id)
                );
                
                // Clear selection if deleted user was selected
                if (this._selectedUserId() === id) {
                    this._selectedUserId.set(null);
                }
                
                this.notificationService.success('User deleted successfully');
            } else {
                this._error.set(result.error);
            }
        } catch (error) {
            const appError = new ApplicationError(
                'users',
                'Failed to delete user',
                'DELETE_USER_ERROR',
                error
            );
            this._error.set(appError);
        } finally {
            this._loading.set(false);
        }
    }
    
    selectUser(id: number | null): void {
        this._selectedUserId.set(id);
    }
    
    clearError(): void {
        this._error.set(null);
    }
    
    refresh(): Promise<void> {
        return this.loadUsers();
    }
}
```

**From `src/app/application/use-cases/create-user.use-case.ts`:**

```typescript
import { Injectable, inject } from '@angular/core';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { ApplicationError } from '../errors/application-error';
import { CreateUserData, Result } from '../types/users.types';

@Injectable({ providedIn: 'root' })
export class CreateUserUseCase {
    private readonly userRepository = inject(USER_REPOSITORY);
    
    async execute(data: CreateUserData): Promise<Result<User, ApplicationError>> {
        try {
            // Validate email format
            const email = Email.create(data.email);
            
            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                return {
                    success: false,
                    error: new ApplicationError(
                        'users',
                        `User with email ${data.email} already exists`,
                        'USER_ALREADY_EXISTS'
                    )
                };
            }
            
            // Create domain entity
            const user = User.create({
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                active: data.active ?? true,
                roles: data.roles ?? []
            });
            
            // Save to repository
            const savedUser = await this.userRepository.save(user);
            
            return {
                success: true,
                data: savedUser
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof ApplicationError 
                    ? error
                    : new ApplicationError(
                        'users',
                        'Failed to create user',
                        'CREATE_USER_ERROR',
                        error
                    )
            };
        }
    }
}
```

### 3. Infrastructure Layer Example

**From `src/app/infrastructure/repositories/http-user.repository.ts`:**

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { Email } from '../../domain/value-objects/email.value-object';
import { UserDto } from '../dtos/user.dto';
import { UserMapper } from '../mappers/user.mapper';
import { ENVIRONMENT } from '../../core/tokens';

@Injectable()
export class HttpUserRepository implements UserRepository {
    private readonly http = inject(HttpClient);
    private readonly environment = inject(ENVIRONMENT);
    private readonly mapper = inject(UserMapper);
    
    private readonly baseUrl = `${this.environment.apiUrl}/users`;
    
    async findAll(): Promise<User[]> {
        const dtos = await this.http.get<UserDto[]>(this.baseUrl).toPromise();
        return dtos?.map(dto => this.mapper.toDomain(dto)) || [];
    }
    
    async findById(id: number): Promise<User | null> {
        try {
            const dto = await this.http.get<UserDto>(`${this.baseUrl}/${id}`).toPromise();
            return dto ? this.mapper.toDomain(dto) : null;
        } catch (error) {
            if (this.isNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }
    
    async findByEmail(email: Email): Promise<User | null> {
        try {
            const dto = await this.http.get<UserDto>(`${this.baseUrl}/by-email/${email.value}`).toPromise();
            return dto ? this.mapper.toDomain(dto) : null;
        } catch (error) {
            if (this.isNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }
    
    async findActiveUsers(): Promise<User[]> {
        const dtos = await this.http.get<UserDto[]>(`${this.baseUrl}/active`).toPromise();
        return dtos?.map(dto => this.mapper.toDomain(dto)) || [];
    }
    
    async save(user: User): Promise<User> {
        const dto = this.mapper.toDto(user);
        
        if (user.data.id === 0) {
            // Create new user
            const createdDto = await this.http.post<UserDto>(this.baseUrl, dto).toPromise();
            return this.mapper.toDomain(createdDto!);
        } else {
            // Update existing user
            const updatedDto = await this.http.put<UserDto>(`${this.baseUrl}/${user.data.id}`, dto).toPromise();
            return this.mapper.toDomain(updatedDto!);
        }
    }
    
    async delete(id: number): Promise<void> {
        await this.http.delete(`${this.baseUrl}/${id}`).toPromise();
    }
    
    async existsByEmail(email: Email): Promise<boolean> {
        try {
            await this.http.head(`${this.baseUrl}/by-email/${email.value}`).toPromise();
            return true;
        } catch (error) {
            if (this.isNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }
    
    private isNotFoundError(error: any): boolean {
        return error?.status === 404;
    }
}
```

## Domain-Driven Design Patterns

### 1. Value Objects Example

**From `src/app/domain/value-objects/email.value-object.ts`:**

```typescript
export class Email {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    private constructor(private readonly _value: string) {}
    
    static create(value: string): Email {
        Email.validate(value);
        return new Email(value.toLowerCase().trim());
    }
    
    static validate(value: string): void {
        if (!value || !value.trim()) {
            throw new Error('Email is required');
        }
        
        if (!Email.EMAIL_REGEX.test(value)) {
            throw new Error('Invalid email format');
        }
        
        if (value.length > 254) {
            throw new Error('Email is too long');
        }
    }
    
    get value(): string {
        return this._value;
    }
    
    get domain(): string {
        return this._value.split('@')[1];
    }
    
    get localPart(): string {
        return this._value.split('@')[0];
    }
    
    equals(other: Email): boolean {
        return this._value === other._value;
    }
    
    toString(): string {
        return this._value;
    }
}
```

### 2. Domain Events Example

**From `src/app/domain/events/user-created.event.ts`:**

```typescript
import { DomainEvent } from './domain-event.base';
import { User } from '../entities/user.entity';

export class UserCreatedEvent implements DomainEvent {
    readonly eventType = 'UserCreated';
    readonly aggregateId: number;
    readonly occurredOn: Date;
    readonly version: number;
    
    constructor(
        public readonly user: User,
        version: number = 1
    ) {
        this.aggregateId = user.data.id;
        this.occurredOn = new Date();
        this.version = version;
    }
    
    getEventData(): Record<string, unknown> {
        return {
            userId: this.user.data.id,
            email: this.user.data.email,
            fullName: this.user.fullName,
            roles: this.user.data.roles,
            createdAt: this.user.data.createdAt
        };
    }
}
```

### 3. Domain Services Example

**From `src/app/domain/services/user-validation.service.ts`:**

```typescript
import { Injectable, inject } from '@angular/core';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.value-object';
import { USER_REPOSITORY, UserRepository } from '../repositories/user.repository';

export interface UserValidationResult {
    isValid: boolean;
    errors: string[];
}

@Injectable({ providedIn: 'root' })
export class UserValidationService {
    private readonly userRepository = inject(USER_REPOSITORY);
    
    async validateForCreation(userData: {
        email: string;
        firstName: string;
        lastName: string;
    }): Promise<UserValidationResult> {
        const errors: string[] = [];
        
        // Validate email format
        try {
            Email.validate(userData.email);
        } catch (error) {
            errors.push(error.message);
        }
        
        // Check email uniqueness
        if (errors.length === 0) {
            const email = Email.create(userData.email);
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                errors.push('Email is already in use');
            }
        }
        
        // Validate names
        if (!userData.firstName.trim()) {
            errors.push('First name is required');
        } else if (userData.firstName.length < 2) {
            errors.push('First name must be at least 2 characters');
        } else if (userData.firstName.length > 50) {
            errors.push('First name must be less than 50 characters');
        }
        
        if (!userData.lastName.trim()) {
            errors.push('Last name is required');
        } else if (userData.lastName.length < 2) {
            errors.push('Last name must be at least 2 characters');
        } else if (userData.lastName.length > 50) {
            errors.push('Last name must be less than 50 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    async validateForUpdate(
        userId: number,
        updates: Partial<{ email: string; firstName: string; lastName: string }>
    ): Promise<UserValidationResult> {
        const errors: string[] = [];
        
        // Validate email if provided
        if (updates.email !== undefined) {
            try {
                Email.validate(updates.email);
                
                // Check uniqueness (excluding current user)
                const email = Email.create(updates.email);
                const existingUser = await this.userRepository.findByEmail(email);
                if (existingUser && existingUser.data.id !== userId) {
                    errors.push('Email is already in use');
                }
            } catch (error) {
                errors.push(error.message);
            }
        }
        
        // Validate names if provided
        if (updates.firstName !== undefined) {
            if (!updates.firstName.trim()) {
                errors.push('First name cannot be empty');
            } else if (updates.firstName.length < 2) {
                errors.push('First name must be at least 2 characters');
            } else if (updates.firstName.length > 50) {
                errors.push('First name must be less than 50 characters');
            }
        }
        
        if (updates.lastName !== undefined) {
            if (!updates.lastName.trim()) {
                errors.push('Last name cannot be empty');
            } else if (updates.lastName.length < 2) {
                errors.push('Last name must be at least 2 characters');
            } else if (updates.lastName.length > 50) {
                errors.push('Last name must be less than 50 characters');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
```

## Signal-Based State Management

### 1. Complex State Example

**From `src/app/presentation/features/users/state/users-state.service.ts`:**

```typescript
import { Injectable, computed, signal, effect } from '@angular/core';
import { User } from '../../../../domain/entities/user.entity';

export interface FilterState {
    search: string;
    activeOnly: boolean;
    roles: string[];
    sortBy: 'name' | 'email' | 'createdAt';
    sortDirection: 'asc' | 'desc';
}

export interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
}

@Injectable()
export class UsersStateService {
    // Core state signals
    private readonly _users = signal<User[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);
    
    // Filter state signals
    private readonly _searchTerm = signal('');
    private readonly _activeOnly = signal(false);
    private readonly _selectedRoles = signal<string[]>([]);
    private readonly _sortBy = signal<'name' | 'email' | 'createdAt'>('name');
    private readonly _sortDirection = signal<'asc' | 'desc'>('asc');
    
    // Pagination state signals
    private readonly _currentPage = signal(1);
    private readonly _pageSize = signal(10);
    
    // Selection state signals
    private readonly _selectedUserIds = signal<Set<number>>(new Set());
    private readonly _selectAll = signal(false);
    
    // Public computed state
    readonly users = computed(() => this._users());
    readonly loading = computed(() => this._loading());
    readonly error = computed(() => this._error());
    
    // Filter computed values
    readonly searchTerm = computed(() => this._searchTerm());
    readonly activeOnly = computed(() => this._activeOnly());
    readonly selectedRoles = computed(() => this._selectedRoles());
    readonly sortBy = computed(() => this._sortBy());
    readonly sortDirection = computed(() => this._sortDirection());
    
    // Pagination computed values
    readonly currentPage = computed(() => this._currentPage());
    readonly pageSize = computed(() => this._pageSize());
    
    // Selection computed values
    readonly selectedUserIds = computed(() => this._selectedUserIds());
    readonly selectAll = computed(() => this._selectAll());
    
    // Complex computed values
    readonly filteredUsers = computed(() => {
        let filtered = this._users();
        const search = this._searchTerm().toLowerCase();
        const activeOnly = this._activeOnly();
        const roles = this._selectedRoles();
        
        // Apply search filter
        if (search) {
            filtered = filtered.filter(user =>
                user.fullName.toLowerCase().includes(search) ||
                user.data.email.toLowerCase().includes(search)
            );
        }
        
        // Apply active filter
        if (activeOnly) {
            filtered = filtered.filter(user => user.isActive);
        }
        
        // Apply role filter
        if (roles.length > 0) {
            filtered = filtered.filter(user =>
                user.data.roles.some(role => roles.includes(role))
            );
        }
        
        return filtered;
    });
    
    readonly sortedUsers = computed(() => {
        const users = [...this.filteredUsers()];
        const sortBy = this._sortBy();
        const direction = this._sortDirection();
        
        users.sort((a, b) => {
            let aValue: string | number | Date;
            let bValue: string | number | Date;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.fullName.toLowerCase();
                    bValue = b.fullName.toLowerCase();
                    break;
                case 'email':
                    aValue = a.data.email.toLowerCase();
                    bValue = b.data.email.toLowerCase();
                    break;
                case 'createdAt':
                    aValue = a.data.createdAt;
                    bValue = b.data.createdAt;
                    break;
                default:
                    return 0;
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return users;
    });
    
    readonly paginatedUsers = computed(() => {
        const users = this.sortedUsers();
        const page = this._currentPage();
        const pageSize = this._pageSize();
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        
        return users.slice(start, end);
    });
    
    readonly paginationInfo = computed(() => {
        const total = this.filteredUsers().length;
        const page = this._currentPage();
        const pageSize = this._pageSize();
        const totalPages = Math.ceil(total / pageSize);
        const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        
        return {
            total,
            page,
            pageSize,
            totalPages,
            start,
            end,
            hasNext: page < totalPages,
            hasPrevious: page > 1
        };
    });
    
    readonly selectedUsers = computed(() => {
        const selectedIds = this._selectedUserIds();
        return this.paginatedUsers().filter(user => 
            selectedIds.has(user.data.id)
        );
    });
    
    readonly hasSelection = computed(() => this._selectedUserIds().size > 0);
    
    readonly allCurrentPageSelected = computed(() => {
        const currentPageUsers = this.paginatedUsers();
        const selectedIds = this._selectedUserIds();
        
        return currentPageUsers.length > 0 && 
               currentPageUsers.every(user => selectedIds.has(user.data.id));
    });
    
    // Effects for automatic state management
    private readonly resetPageOnFilterChange = effect(() => {
        // Reset to first page when filters change
        this._searchTerm();
        this._activeOnly();
        this._selectedRoles();
        this._currentPage.set(1);
    });
    
    private readonly updateSelectAllState = effect(() => {
        const allSelected = this.allCurrentPageSelected();
        this._selectAll.set(allSelected);
    });
    
    private readonly clearSelectionOnPageChange = effect(() => {
        this._currentPage();
        this._selectedUserIds.set(new Set());
    });
    
    // State mutations
    setUsers(users: User[]): void {
        this._users.set(users);
    }
    
    setLoading(loading: boolean): void {
        this._loading.set(loading);
    }
    
    setError(error: string | null): void {
        this._error.set(error);
    }
    
    setSearchTerm(search: string): void {
        this._searchTerm.set(search);
    }
    
    setActiveOnly(activeOnly: boolean): void {
        this._activeOnly.set(activeOnly);
    }
    
    setSelectedRoles(roles: string[]): void {
        this._selectedRoles.set(roles);
    }
    
    setSorting(sortBy: 'name' | 'email' | 'createdAt', direction: 'asc' | 'desc'): void {
        this._sortBy.set(sortBy);
        this._sortDirection.set(direction);
    }
    
    setPage(page: number): void {
        const maxPage = this.paginationInfo().totalPages;
        if (page >= 1 && page <= maxPage) {
            this._currentPage.set(page);
        }
    }
    
    setPageSize(pageSize: number): void {
        this._pageSize.set(pageSize);
        this._currentPage.set(1); // Reset to first page
    }
    
    selectUser(userId: number): void {
        const selected = new Set(this._selectedUserIds());
        selected.add(userId);
        this._selectedUserIds.set(selected);
    }
    
    deselectUser(userId: number): void {
        const selected = new Set(this._selectedUserIds());
        selected.delete(userId);
        this._selectedUserIds.set(selected);
    }
    
    toggleUserSelection(userId: number): void {
        const selected = this._selectedUserIds();
        if (selected.has(userId)) {
            this.deselectUser(userId);
        } else {
            this.selectUser(userId);
        }
    }
    
    selectAllCurrentPage(): void {
        const currentPageUsers = this.paginatedUsers();
        const selected = new Set(this._selectedUserIds());
        
        currentPageUsers.forEach(user => selected.add(user.data.id));
        this._selectedUserIds.set(selected);
    }
    
    deselectAllCurrentPage(): void {
        const currentPageUsers = this.paginatedUsers();
        const selected = new Set(this._selectedUserIds());
        
        currentPageUsers.forEach(user => selected.delete(user.data.id));
        this._selectedUserIds.set(selected);
    }
    
    clearSelection(): void {
        this._selectedUserIds.set(new Set());
    }
    
    resetFilters(): void {
        this._searchTerm.set('');
        this._activeOnly.set(false);
        this._selectedRoles.set([]);
        this._sortBy.set('name');
        this._sortDirection.set('asc');
    }
    
    resetState(): void {
        this.resetFilters();
        this._currentPage.set(1);
        this.clearSelection();
        this._error.set(null);
    }
}
```

## Component Examples

### 1. Feature Component with Signals

**From `src/app/presentation/features/users/components/user-list.component.ts`:**

```typescript
import { Component, inject, OnInit, computed, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersFacade } from '../../../../application/facades/users.facade';
import { UsersStateService } from '../state/users-state.service';
import { UserCardComponent } from './user-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ErrorMessageComponent } from '../../../shared/components/error-message.component';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { UserRole } from '../../../../domain/enums/user-role.enum';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        UserCardComponent,
        LoadingSpinnerComponent,
        ErrorMessageComponent,
        PaginationComponent
    ],
    providers: [UsersStateService],
    template: `
        <div class="user-list-container">
            <!-- Filters Section -->
            <div class="filters-section">
                <div class="search-box">
                    <input
                        type="text"
                        placeholder="Search users..."
                        [value]="state.searchTerm()"
                        (input)="onSearchChange($event)"
                        class="search-input"
                    />
                </div>
                
                <div class="filter-controls">
                    <label class="checkbox-label">
                        <input
                            type="checkbox"
                            [checked]="state.activeOnly()"
                            (change)="onActiveFilterChange($event)"
                        />
                        Active users only
                    </label>
                    
                    <select
                        multiple
                        [value]="state.selectedRoles()"
                        (change)="onRoleFilterChange($event)"
                        class="role-filter"
                    >
                        @for (role of availableRoles; track role) {
                            <option [value]="role">{{ role }}</option>
                        }
                    </select>
                </div>
                
                <div class="sort-controls">
                    <select
                        [value]="state.sortBy()"
                        (change)="onSortChange($event)"
                        class="sort-select"
                    >
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="createdAt">Created Date</option>
                    </select>
                    
                    <button
                        (click)="toggleSortDirection()"
                        class="sort-direction-btn"
                        [class.desc]="state.sortDirection() === 'desc'"
                    >
                        {{ state.sortDirection() === 'asc' ? '↑' : '↓' }}
                    </button>
                </div>
                
                <button (click)="onResetFilters()" class="reset-btn">
                    Reset Filters
                </button>
            </div>
            
            <!-- Selection Controls -->
            @if (state.paginatedUsers().length > 0) {
                <div class="selection-controls">
                    <label class="checkbox-label">
                        <input
                            type="checkbox"
                            [checked]="state.allCurrentPageSelected()"
                            (change)="onSelectAllChange($event)"
                        />
                        Select all on page
                    </label>
                    
                    @if (state.hasSelection()) {
                        <span class="selection-info">
                            {{ state.selectedUsers().length }} user(s) selected
                        </span>
                        
                        <button
                            (click)="onClearSelection()"
                            class="clear-selection-btn"
                        >
                            Clear Selection
                        </button>
                    }
                </div>
            }
            
            <!-- Loading State -->
            @if (facade.loading()) {
                <app-loading-spinner />
            }
            
            <!-- Error State -->
            @if (facade.error(); as error) {
                <app-error-message
                    [message]="error.message"
                    (retry)="onRetry()"
                    (dismiss)="onDismissError()"
                />
            }
            
            <!-- Empty State -->
            @if (!facade.loading() && state.paginatedUsers().length === 0) {
                <div class="empty-state">
                    @if (state.filteredUsers().length === 0) {
                        <p>No users found matching your filters.</p>
                        <button (click)="onResetFilters()" class="reset-btn">
                            Clear Filters
                        </button>
                    } @else {
                        <p>No users on this page.</p>
                    }
                </div>
            }
            
            <!-- User List -->
            @if (state.paginatedUsers().length > 0) {
                <div class="user-grid">
                    @for (user of state.paginatedUsers(); track user.data.id) {
                        <app-user-card
                            [user]="user"
                            [selected]="state.selectedUserIds().has(user.data.id)"
                            [readonly]="readonly()"
                            (userSelect)="onUserSelect($event)"
                            (userEdit)="onUserEdit($event)"
                            (userDelete)="onUserDelete($event)"
                        />
                    }
                </div>
                
                <!-- Pagination -->
                <app-pagination
                    [currentPage]="state.paginationInfo().page"
                    [totalPages]="state.paginationInfo().totalPages"
                    [totalItems]="state.paginationInfo().total"
                    [pageSize]="state.paginationInfo().pageSize"
                    [hasNext]="state.paginationInfo().hasNext"
                    [hasPrevious]="state.paginationInfo().hasPrevious"
                    (pageChange)="onPageChange($event)"
                    (pageSizeChange)="onPageSizeChange($event)"
                />
            }
        </div>
    `,
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
    // Dependencies
    protected readonly facade = inject(UsersFacade);
    protected readonly state = inject(UsersStateService);
    
    // Inputs
    readonly readonly = input(false);
    
    // Component state
    protected readonly availableRoles = Object.values(UserRole);
    
    // Lifecycle
    async ngOnInit(): Promise<void> {
        await this.loadUsers();
    }
    
    // Event handlers
    onSearchChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.state.setSearchTerm(target.value);
    }
    
    onActiveFilterChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.state.setActiveOnly(target.checked);
    }
    
    onRoleFilterChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const selectedRoles = Array.from(target.selectedOptions)
            .map(option => option.value);
        this.state.setSelectedRoles(selectedRoles);
    }
    
    onSortChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const sortBy = target.value as 'name' | 'email' | 'createdAt';
        this.state.setSorting(sortBy, this.state.sortDirection());
    }
    
    toggleSortDirection(): void {
        const newDirection = this.state.sortDirection() === 'asc' ? 'desc' : 'asc';
        this.state.setSorting(this.state.sortBy(), newDirection);
    }
    
    onResetFilters(): void {
        this.state.resetFilters();
    }
    
    onSelectAllChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target.checked) {
            this.state.selectAllCurrentPage();
        } else {
            this.state.deselectAllCurrentPage();
        }
    }
    
    onClearSelection(): void {
        this.state.clearSelection();
    }
    
    onUserSelect(userId: number): void {
        this.state.toggleUserSelection(userId);
    }
    
    onUserEdit(user: User): void {
        // Emit to parent or navigate to edit form
        console.log('Edit user:', user);
    }
    
    async onUserDelete(user: User): Promise<void> {
        if (confirm(`Are you sure you want to delete ${user.fullName}?`)) {
            await this.facade.deleteUser(user.data.id);
        }
    }
    
    onPageChange(page: number): void {
        this.state.setPage(page);
    }
    
    onPageSizeChange(pageSize: number): void {
        this.state.setPageSize(pageSize);
    }
    
    async onRetry(): Promise<void> {
        await this.loadUsers();
    }
    
    onDismissError(): void {
        this.facade.clearError();
    }
    
    // Private methods
    private async loadUsers(): Promise<void> {
        await this.facade.loadUsers();
        this.state.setUsers(this.facade.users());
    }
}
```

### 2. Smart Component with Form Integration

**From `src/app/presentation/features/users/components/user-form.component.ts`:**

```typescript
import { Component, inject, input, output, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole } from '../../../../domain/enums/user-role.enum';
import { UserValidationService } from '../../../../domain/services/user-validation.service';
import { CreateUserData, UpdateUserData } from '../../../../application/types/users.types';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="user-form">
            <h2>{{ formTitle() }}</h2>
            
            <!-- Email Field -->
            <div class="form-field">
                <label for="email">Email *</label>
                <input
                    id="email"
                    type="email"
                    formControlName="email"
                    [class.error]="isFieldInvalid('email')"
                    placeholder="user@example.com"
                />
                @if (isFieldInvalid('email')) {
                    <div class="field-errors">
                        @for (error of getFieldErrors('email'); track error) {
                            <span class="error-message">{{ error }}</span>
                        }
                    </div>
                }
            </div>
            
            <!-- First Name Field -->
            <div class="form-field">
                <label for="firstName">First Name *</label>
                <input
                    id="firstName"
                    type="text"
                    formControlName="firstName"
                    [class.error]="isFieldInvalid('firstName')"
                    placeholder="John"
                />
                @if (isFieldInvalid('firstName')) {
                    <div class="field-errors">
                        @for (error of getFieldErrors('firstName'); track error) {
                            <span class="error-message">{{ error }}</span>
                        }
                    </div>
                }
            </div>
            
            <!-- Last Name Field -->
            <div class="form-field">
                <label for="lastName">Last Name *</label>
                <input
                    id="lastName"
                    type="text"
                    formControlName="lastName"
                    [class.error]="isFieldInvalid('lastName')"
                    placeholder="Doe"
                />
                @if (isFieldInvalid('lastName')) {
                    <div class="field-errors">
                        @for (error of getFieldErrors('lastName'); track error) {
                            <span class="error-message">{{ error }}</span>
                        }
                    </div>
                }
            </div>
            
            <!-- Active Status -->
            <div class="form-field">
                <label class="checkbox-label">
                    <input
                        type="checkbox"
                        formControlName="active"
                    />
                    Active User
                </label>
            </div>
            
            <!-- Roles Selection -->
            <div class="form-field">
                <label>Roles</label>
                <div class="roles-selection">
                    @for (role of availableRoles; track role) {
                        <label class="checkbox-label">
                            <input
                                type="checkbox"
                                [checked]="isRoleSelected(role)"
                                (change)="onRoleChange(role, $event)"
                            />
                            {{ role }}
                        </label>
                    }
                </div>
            </div>
            
            <!-- Form Actions -->
            <div class="form-actions">
                <button
                    type="button"
                    (click)="onCancel()"
                    class="btn btn-secondary"
                >
                    Cancel
                </button>
                
                <button
                    type="submit"
                    [disabled]="!form.valid || submitting()"
                    class="btn btn-primary"
                >
                    @if (submitting()) {
                        <span class="spinner"></span>
                    }
                    {{ submitButtonText() }}
                </button>
            </div>
            
            <!-- Validation Summary -->
            @if (validationErrors().length > 0) {
                <div class="validation-summary">
                    <h4>Please fix the following errors:</h4>
                    <ul>
                        @for (error of validationErrors(); track error) {
                            <li>{{ error }}</li>
                        }
                    </ul>
                </div>
            }
        </form>
    `,
    styleUrls: ['./user-form.component.css']
})
export class UserFormComponent {
    // Dependencies
    private readonly fb = inject(FormBuilder);
    private readonly validationService = inject(UserValidationService);
    
    // Inputs
    readonly user = input<User | null>(null);
    readonly submitting = input(false);
    
    // Outputs
    readonly userSubmit = output<CreateUserData | UpdateUserData>();
    readonly formCancel = output<void>();
    
    // Form
    readonly form: FormGroup;
    
    // Component state
    readonly availableRoles = Object.values(UserRole);
    
    // Computed values
    readonly isEditMode = computed(() => this.user() !== null);
    readonly formTitle = computed(() => this.isEditMode() ? 'Edit User' : 'Create User');
    readonly submitButtonText = computed(() => this.isEditMode() ? 'Update User' : 'Create User');
    
    readonly validationErrors = computed(() => {
        const errors: string[] = [];
        
        if (this.form.get('email')?.errors?.['required']) {
            errors.push('Email is required');
        }
        if (this.form.get('email')?.errors?.['email']) {
            errors.push('Email format is invalid');
        }
        if (this.form.get('firstName')?.errors?.['required']) {
            errors.push('First name is required');
        }
        if (this.form.get('lastName')?.errors?.['required']) {
            errors.push('Last name is required');
        }
        
        return errors;
    });
    
    constructor() {
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            active: [true],
            roles: [[] as UserRole[]]
        });
        
        // Effect to populate form when user changes
        effect(() => {
            const user = this.user();
            if (user) {
                this.form.patchValue({
                    email: user.data.email,
                    firstName: user.data.firstName,
                    lastName: user.data.lastName,
                    active: user.data.active,
                    roles: user.data.roles
                });
            }
        });
    }
    
    // Form helpers
    isFieldInvalid(fieldName: string): boolean {
        const field = this.form.get(fieldName);
        return !!(field?.invalid && (field.dirty || field.touched));
    }
    
    getFieldErrors(fieldName: string): string[] {
        const field = this.form.get(fieldName);
        const errors: string[] = [];
        
        if (field?.errors) {
            if (field.errors['required']) {
                errors.push(`${fieldName} is required`);
            }
            if (field.errors['email']) {
                errors.push('Invalid email format');
            }
            if (field.errors['minlength']) {
                errors.push(`${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`);
            }
        }
        
        return errors;
    }
    
    isRoleSelected(role: UserRole): boolean {
        const roles = this.form.get('roles')?.value || [];
        return roles.includes(role);
    }
    
    onRoleChange(role: UserRole, event: Event): void {
        const target = event.target as HTMLInputElement;
        const currentRoles = this.form.get('roles')?.value || [];
        
        let newRoles: UserRole[];
        if (target.checked) {
            newRoles = [...currentRoles, role];
        } else {
            newRoles = currentRoles.filter((r: UserRole) => r !== role);
        }
        
        this.form.patchValue({ roles: newRoles });
    }
    
    async onSubmit(): Promise<void> {
        if (this.form.valid) {
            const formValue = this.form.value;
            
            // Additional validation
            const validationResult = this.isEditMode()
                ? await this.validationService.validateForUpdate(
                    this.user()!.data.id,
                    formValue
                )
                : await this.validationService.validateForCreation(formValue);
            
            if (validationResult.isValid) {
                this.userSubmit.emit(formValue);
            } else {
                // Handle validation errors
                console.error('Validation errors:', validationResult.errors);
            }
        } else {
            // Mark all fields as touched to show validation errors
            this.form.markAllAsTouched();
        }
    }
    
    onCancel(): void {
        this.formCancel.emit();
    }
}
```

---

These concrete examples demonstrate the real implementation patterns used throughout the MAD-AI project, showing how Clean Architecture, DDD, signals, and modern Angular features work together to create a maintainable and scalable application.
