import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RoleTable } from './role-table';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { RoleListModel } from '@domain/models/role/role-list.model';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';
import { Button } from '@shared/components/ui/button/button';

describe('RoleTable', () => {
    let component: RoleTable;
    let fixture: ComponentFixture<RoleTable>;
    let mockGetRolesUseCase: jasmine.SpyObj<GetRolesUseCase>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockRoles: RoleListModel[] = [
        {
            id: 1,
            name: 'Administrator',
            description: 'Full system access',
            access_level: RoleAccessLevel.ADMINISTRATOR,
            is_active: true,
            user_count: 2,
        },
        {
            id: 2,
            name: 'Developer',
            description: 'Development access',
            access_level: RoleAccessLevel.DEVELOPER,
            is_active: true,
            user_count: 5,
        },
        {
            id: 3,
            name: 'User',
            description: 'Basic user access',
            access_level: RoleAccessLevel.USER,
            is_active: false,
            user_count: 0,
        },
    ];

    const mockNotification = new NotificationEntity({
        type: NotificationType.SUCCESS,
        title: 'Test',
        message: 'Test message',
    });

    beforeEach(async () => {
        const getRolesUseCaseSpy = jasmine.createSpyObj('GetRolesUseCase', ['execute']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'info',
            'warning',
        ]);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [RoleTable, Button],
            providers: [
                { provide: GetRolesUseCase, useValue: getRolesUseCaseSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RoleTable);
        component = fixture.componentInstance;

        mockGetRolesUseCase = TestBed.inject(GetRolesUseCase) as jasmine.SpyObj<GetRolesUseCase>;
        mockNotificationService = TestBed.inject(
            NotificationService
        ) as jasmine.SpyObj<NotificationService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        // Setup default mock returns
        mockGetRolesUseCase.execute.and.returnValue(of(mockRoles));
        mockNotificationService.success.and.returnValue(of(mockNotification));
        mockNotificationService.error.and.returnValue(of(mockNotification));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load roles on init', () => {
        fixture.detectChanges();
        expect(mockGetRolesUseCase.execute).toHaveBeenCalled();
        expect(component['roles']()).toEqual(mockRoles);
    });

    it('should calculate stats correctly', () => {
        fixture.detectChanges();
        expect(component['totalRoles']()).toBe(3);
        expect(component['activeRoles']()).toBe(2);
        expect(component['inactiveRoles']()).toBe(1);
    });

    it('should filter roles by search query', () => {
        fixture.detectChanges();
        component['onSearchChange']('Admin');
        const filteredRoles = component['filteredAndSortedRoles']();
        expect(filteredRoles.length).toBe(1);
        expect(filteredRoles[0].name).toBe('Administrator');
    });

    it('should filter roles by access level', () => {
        fixture.detectChanges();
        component['onAccessLevelFilterChange'](RoleAccessLevel.DEVELOPER.toString());
        const filteredRoles = component['filteredAndSortedRoles']();
        expect(filteredRoles.length).toBe(1);
        expect(filteredRoles[0].access_level).toBe(RoleAccessLevel.DEVELOPER);
    });

    it('should sort roles correctly', () => {
        fixture.detectChanges();
        component['sort']('name');
        const sortedRoles = component['filteredAndSortedRoles']();
        expect(sortedRoles[0].name).toBe('Administrator');
        expect(sortedRoles[1].name).toBe('Developer');
        expect(sortedRoles[2].name).toBe('User');
    });

    it('should navigate to create role page', () => {
        component['navigateToCreate']();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles/create']);
    });

    it('should navigate to view role page', () => {
        component['navigateToView'](1);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', 1]);
    });

    it('should navigate to edit role page', () => {
        component['navigateToEdit'](1);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', 1, 'edit']);
    });

    it('should generate access level options correctly', () => {
        fixture.detectChanges();
        const options = component['accessLevelOptions']();
        expect(options.length).toBe(6); // 5 access levels + "Todos los niveles"
        expect(options[0].label).toBe('Todos los niveles');
    });

    it('should show correct access level labels', () => {
        expect(component['getAccessLevelLabel'](RoleAccessLevel.ADMINISTRATOR)).toBe(
            'Administrator'
        );
        expect(component['getAccessLevelLabel'](RoleAccessLevel.DEVELOPER)).toBe('Developer');
    });

    it('should apply correct badge classes', () => {
        expect(component['getAccessLevelBadgeClass'](RoleAccessLevel.ADMINISTRATOR)).toBe(
            'access-level-admin'
        );
        expect(component['getStatusBadgeClass'](true)).toBe('status-badge-active');
        expect(component['getStatusBadgeClass'](false)).toBe('status-badge-inactive');
    });

    it('should handle delete confirmation', () => {
        const roleToDelete = mockRoles[2]; // Role with 0 users
        component['confirmDeleteRole'](roleToDelete);
        expect(component['selectedRole']()).toBe(roleToDelete);
        expect(component['showDeleteModal']()).toBe(true);
    });

    it('should handle toggle status confirmation', () => {
        const roleToToggle = mockRoles[0];
        component['confirmToggleRoleStatus'](roleToToggle);
        expect(component['selectedRole']()).toBe(roleToToggle);
        expect(component['showToggleModal']()).toBe(true);
    });

    it('should show correct modal messages', () => {
        const role = mockRoles[0];
        component['selectedRole'].set(role);

        expect(component['getDeleteModalTitle']()).toBe('Eliminar Rol');
        expect(component['getDeleteModalMessage']()).toContain(role.name);
        expect(component['getToggleModalTitle']()).toBe('Desactivar Rol');
        expect(component['getToggleConfirmText']()).toBe('Desactivar');
    });

    it('should refresh roles when refresh is called', () => {
        fixture.detectChanges();
        mockGetRolesUseCase.execute.calls.reset();

        component['refresh']();

        expect(mockGetRolesUseCase.execute).toHaveBeenCalled();
    });

    it('should handle errors when loading roles', () => {
        mockGetRolesUseCase.execute.and.throwError('API Error');

        fixture.detectChanges();

        expect(component['error']()).toBe('Error al cargar la lista de roles');
        expect(component['isLoading']()).toBe(false);
    });
});
