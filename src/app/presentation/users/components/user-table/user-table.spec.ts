import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserTable } from './user-table';
import { Button } from '@shared/components/ui/button/button';
import { GetUsersUseCase } from '@application/use-cases/user/get-users.use-case';
import { ActivateUserUseCase } from '@application/use-cases/user/activate-user.use-case';
import { DeactivateUserUseCase } from '@application/use-cases/user/deactivate-user.use-case';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import { UserStatus } from '@domain/enums/user_status.enum';

describe('UserTable', () => {
    let component: UserTable;
    let fixture: ComponentFixture<UserTable>;
    let mockGetUsersUseCase: jasmine.SpyObj<GetUsersUseCase>;
    let mockActivateUserUseCase: jasmine.SpyObj<ActivateUserUseCase>;
    let mockDeactivateUserUseCase: jasmine.SpyObj<DeactivateUserUseCase>;
    let mockGetRolesUseCase: jasmine.SpyObj<GetRolesUseCase>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockUsers: UserEntity[] = [
        new UserEntity({
            id: 1,
            username: 'user1',
            email: 'user1@test.com',
            firstName: 'John',
            lastName: 'Doe',
            isActive: true,
            roleName: 'Admin',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            status: UserStatus.ACTIVE,
        }),
        new UserEntity({
            id: 2,
            username: 'user2',
            email: 'user2@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
            isActive: false,
            roleName: 'User',
            createdAt: new Date('2024-01-02T00:00:00Z'),
            status: UserStatus.INACTIVE,
        }),
    ];

    const mockRoles: RoleEntity[] = [
        new RoleEntity({
            id: 1,
            name: 'Admin',
            description: 'Administrator role',
            accessLevel: RoleAccessLevel.ADMINISTRATOR,
            isActive: true,
            userCount: 1,
        }),
        new RoleEntity({
            id: 2,
            name: 'User',
            description: 'Regular user role',
            accessLevel: RoleAccessLevel.USER,
            isActive: true,
            userCount: 1,
        }),
    ];

    const mockNotification = new NotificationEntity({
        type: NotificationType.SUCCESS,
        title: 'Test',
        message: 'Test message',
    });

    beforeEach(async () => {
        const getUsersUseCaseSpy = jasmine.createSpyObj('GetUsersUseCase', ['execute']);
        const activateUserUseCaseSpy = jasmine.createSpyObj('ActivateUserUseCase', ['execute']);
        const deactivateUserUseCaseSpy = jasmine.createSpyObj('DeactivateUserUseCase', ['execute']);
        const getRolesUseCaseSpy = jasmine.createSpyObj('GetRolesUseCase', ['execute']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
        ]);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [UserTable, Button],
            providers: [
                { provide: GetUsersUseCase, useValue: getUsersUseCaseSpy },
                { provide: ActivateUserUseCase, useValue: activateUserUseCaseSpy },
                { provide: DeactivateUserUseCase, useValue: deactivateUserUseCaseSpy },
                { provide: GetRolesUseCase, useValue: getRolesUseCaseSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(UserTable);
        component = fixture.componentInstance;

        mockGetUsersUseCase = TestBed.inject(GetUsersUseCase) as jasmine.SpyObj<GetUsersUseCase>;
        mockActivateUserUseCase = TestBed.inject(
            ActivateUserUseCase
        ) as jasmine.SpyObj<ActivateUserUseCase>;
        mockDeactivateUserUseCase = TestBed.inject(
            DeactivateUserUseCase
        ) as jasmine.SpyObj<DeactivateUserUseCase>;
        mockGetRolesUseCase = TestBed.inject(GetRolesUseCase) as jasmine.SpyObj<GetRolesUseCase>;
        mockNotificationService = TestBed.inject(
            NotificationService
        ) as jasmine.SpyObj<NotificationService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        // Setup default mock returns
        mockGetUsersUseCase.execute.and.returnValue(of(mockUsers));
        mockGetRolesUseCase.execute.and.returnValue(of(mockRoles));
        mockNotificationService.success.and.returnValue(of(mockNotification));
        mockNotificationService.error.and.returnValue(of(mockNotification));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load users on init', () => {
        fixture.detectChanges();
        expect(mockGetUsersUseCase.execute).toHaveBeenCalled();
        expect(component['users']()).toEqual(mockUsers);
    });

    it('should activate inactive user and update local state', () => {
        // Setup
        fixture.detectChanges();
        const userToUpdate = mockUsers[1]; // inactive user
        const updatedUser = new UserEntity({
            ...userToUpdate,
            isActive: true,
            status: UserStatus.ACTIVE,
        });

        mockActivateUserUseCase.execute.and.returnValue(of(updatedUser));

        // Execute
        component['selectedUser'].set(userToUpdate);
        component['onConfirmToggleStatus']();

        // Verify
        expect(mockActivateUserUseCase.execute).toHaveBeenCalledWith(2);
        expect(mockNotificationService.success).toHaveBeenCalled();

        // Check that local state was updated
        const currentUsers = component['users']();
        const updatedUserInState = currentUsers.find((u) => u.id === 2);
        expect(updatedUserInState?.isActive).toBe(true);
    });

    it('should deactivate active user and update local state', () => {
        // Setup
        fixture.detectChanges();
        const userToUpdate = mockUsers[0]; // active user
        const updatedUser = new UserEntity({
            ...userToUpdate,
            isActive: false,
            status: UserStatus.INACTIVE,
        });

        mockDeactivateUserUseCase.execute.and.returnValue(of(updatedUser));

        // Execute
        component['selectedUser'].set(userToUpdate);
        component['onConfirmToggleStatus']();

        // Verify
        expect(mockDeactivateUserUseCase.execute).toHaveBeenCalledWith(1);
        expect(mockNotificationService.success).toHaveBeenCalled();

        // Check that local state was updated
        const currentUsers = component['users']();
        const updatedUserInState = currentUsers.find((u) => u.id === 1);
        expect(updatedUserInState?.isActive).toBe(false);
    });

    it('should handle toggle status error', () => {
        // Setup
        fixture.detectChanges();
        const userToUpdate = mockUsers[0];

        mockDeactivateUserUseCase.execute.and.throwError('API Error');

        // Execute
        component['selectedUser'].set(userToUpdate);
        component['onConfirmToggleStatus']();

        // Verify error handling
        expect(mockNotificationService.error).toHaveBeenCalled();
    });

    it('should display user table with new icon system', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.user-table-container')).toBeTruthy();
    });

    it('should have create user button with plus icon', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const createButton = compiled.querySelector('app-button[icon="plus"]');
        expect(createButton).toBeTruthy();
    });

    it('should have refresh button with refresh icon', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const refreshButton = compiled.querySelector('app-button[icon="refresh"]');
        expect(refreshButton).toBeTruthy();
    });

    it('should compute filtered and sorted users correctly', () => {
        fixture.detectChanges();

        // Test initial state
        expect(component['filteredAndSortedUsers']().length).toBe(2);

        // Test search filtering
        component['searchQuery'].set('john');
        const filtered = component['filteredAndSortedUsers']();
        expect(filtered.length).toBe(1);
        expect(filtered[0].firstName).toBe('John');

        // Test sorting
        component['searchQuery'].set('');
        component['sort']('firstName');
        const sorted = component['filteredAndSortedUsers']();
        expect(sorted[0].firstName).toBe('Jane'); // Jane comes before John alphabetically
    });

    it('should compute user statistics correctly', () => {
        fixture.detectChanges();

        expect(component['totalUsers']()).toBe(2);
        expect(component['activeUsers']()).toBe(1);
        expect(component['inactiveUsers']()).toBe(1);
    });

    it('should load roles on init', () => {
        fixture.detectChanges();
        expect(mockGetRolesUseCase.execute).toHaveBeenCalled();
        expect(component['roles']()).toEqual(mockRoles);
    });

    it('should generate role options correctly', () => {
        fixture.detectChanges();
        const roleOptions = component['roleOptions']();

        expect(roleOptions).toEqual([
            { value: '', label: 'Todos los roles' },
            { value: '1', label: 'Admin' },
            { value: '2', label: 'User' },
        ]);
    });

    it('should filter users by role', () => {
        fixture.detectChanges();

        // Filter by Admin role (id: 1)
        component['onRoleFilterChange']('1');
        const filteredUsers = component['filteredAndSortedUsers']();

        expect(filteredUsers.length).toBe(1);
        expect(filteredUsers[0].roleName).toBe('Admin');
    });

    it('should show all users when no role filter is selected', () => {
        fixture.detectChanges();

        // No filter selected
        component['onRoleFilterChange']('');
        const filteredUsers = component['filteredAndSortedUsers']();

        expect(filteredUsers.length).toBe(2);
    });

    it('should combine search and role filters', () => {
        fixture.detectChanges();

        // Set search query and role filter
        component['onSearchChange']('user1');
        component['onRoleFilterChange']('1'); // Admin role
        const filteredUsers = component['filteredAndSortedUsers']();

        expect(filteredUsers.length).toBe(1);
        expect(filteredUsers[0].username).toBe('user1');
        expect(filteredUsers[0].roleName).toBe('Admin');
    });

    it('should display correct selected role name', () => {
        fixture.detectChanges();

        component['onRoleFilterChange']('1');
        const selectedRoleName = component['selectedRoleName']();

        expect(selectedRoleName).toBe('Admin');
    });

    it('should have role filter select component', () => {
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        const roleFilter = compiled.querySelector('.role-filter-container app-select');
        expect(roleFilter).toBeTruthy();
    });

    it('should navigate to deactivate page when deactivate button is clicked', () => {
        fixture.detectChanges();

        // Execute
        component['navigateToDelete'](1);

        // Verify
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users', 1, 'delete']);
    });
});
