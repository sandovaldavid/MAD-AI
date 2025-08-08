import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RoleTable } from './role-table';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { DeleteRoleUseCase } from '@application/use-cases/role/delete-role.use-case';
import { UpdateRoleUseCase } from '@application/use-cases/role/update-role.use-case';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';
import { Button } from '@shared/components/ui/button/button';

describe('RoleTable', () => {
    let component: RoleTable;
    let fixture: ComponentFixture<RoleTable>;
    let mockGetRolesUseCase: jasmine.SpyObj<GetRolesUseCase>;
    let mockDeleteRoleUseCase: jasmine.SpyObj<DeleteRoleUseCase>;
    let mockUpdateRoleUseCase: jasmine.SpyObj<UpdateRoleUseCase>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockRoles: RoleEntity[] = [
        new RoleEntity({
            id: 1,
            name: 'Administrator',
            description: 'Full system access',
            accessLevel: RoleAccessLevel.ADMINISTRATOR,
            isActive: true,
            userCount: 2,
            canLeadProjects: true,
            isUniquePerTeam: false,
            createdAt: new Date('2024-01-01T00:00:00Z'),
        }),
        new RoleEntity({
            id: 2,
            name: 'Developer',
            description: 'Development access',
            accessLevel: RoleAccessLevel.DEVELOPER,
            isActive: true,
            userCount: 5,
            canLeadProjects: false,
            isUniquePerTeam: false,
            createdAt: new Date('2024-01-02T00:00:00Z'),
        }),
        new RoleEntity({
            id: 3,
            name: 'User',
            description: 'Basic user access',
            accessLevel: RoleAccessLevel.USER,
            isActive: false,
            userCount: 0,
            canLeadProjects: false,
            isUniquePerTeam: false,
            createdAt: new Date('2024-01-03T00:00:00Z'),
        }),
    ];

    const mockNotification = new NotificationEntity({
        type: NotificationType.SUCCESS,
        title: 'Test',
        message: 'Test message',
    });

    beforeEach(async () => {
        const getRolesUseCaseSpy = jasmine.createSpyObj('GetRolesUseCase', ['execute']);
        const deleteRoleUseCaseSpy = jasmine.createSpyObj('DeleteRoleUseCase', ['execute']);
        const updateRoleUseCaseSpy = jasmine.createSpyObj('UpdateRoleUseCase', ['execute']);
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
                { provide: DeleteRoleUseCase, useValue: deleteRoleUseCaseSpy },
                { provide: UpdateRoleUseCase, useValue: updateRoleUseCaseSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RoleTable);
        component = fixture.componentInstance;

        mockGetRolesUseCase = TestBed.inject(GetRolesUseCase) as jasmine.SpyObj<GetRolesUseCase>;
        mockDeleteRoleUseCase = TestBed.inject(
            DeleteRoleUseCase
        ) as jasmine.SpyObj<DeleteRoleUseCase>;
        mockUpdateRoleUseCase = TestBed.inject(
            UpdateRoleUseCase
        ) as jasmine.SpyObj<UpdateRoleUseCase>;
        mockNotificationService = TestBed.inject(
            NotificationService
        ) as jasmine.SpyObj<NotificationService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        // Setup default mock returns
        mockGetRolesUseCase.execute.and.returnValue(of(mockRoles));
        mockDeleteRoleUseCase.execute.and.returnValue(of(void 0));
        mockUpdateRoleUseCase.execute.and.returnValue(of(mockRoles[0])); // Return updated entity
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
        expect(filteredRoles[0].accessLevel).toBe(RoleAccessLevel.DEVELOPER);
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

    it('should navigate to delete role page', () => {
        fixture.detectChanges();
        component['navigateToDelete'](1);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', 1, 'delete']);
    });

    it('should delete role successfully', () => {
        mockDeleteRoleUseCase.execute.and.returnValue(of(void 0));
        fixture.detectChanges();

        // Set selected role
        component['selectedRole'].set(mockRoles[0]);

        component['onConfirmDelete']();

        expect(mockDeleteRoleUseCase.execute).toHaveBeenCalledWith(1);
        expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should handle delete role error', () => {
        const error = new Error('Delete error');
        (error as any).status = 400;
        mockDeleteRoleUseCase.execute.and.throwError(error);
        fixture.detectChanges();

        // Set selected role
        component['selectedRole'].set(mockRoles[0]);

        component['onConfirmDelete']();

        expect(mockDeleteRoleUseCase.execute).toHaveBeenCalledWith(1);
        expect(mockNotificationService.error).toHaveBeenCalledWith(
            'Error',
            'No se puede eliminar el rol porque tiene usuarios asignados'
        );
    });

    it('should toggle role status successfully', () => {
        const mockUpdatedRole = new RoleEntity({
            id: 1,
            name: 'Administrator',
            description: 'Full system access',
            accessLevel: RoleAccessLevel.ADMINISTRATOR,
            canLeadProjects: true,
            isUniquePerTeam: false,
            isActive: false, // toggled
            createdAt: new Date('2024-01-01T00:00:00Z'),
            userCount: 2,
        });

        mockUpdateRoleUseCase.execute.and.returnValue(of(mockUpdatedRole));
        fixture.detectChanges();

        // Set selected role
        component['selectedRole'].set(mockRoles[0]);

        component['onConfirmToggleStatus']();

        expect(mockUpdateRoleUseCase.execute).toHaveBeenCalled();
        expect(mockNotificationService.success).toHaveBeenCalled();
    });

    it('should handle toggle status error', () => {
        mockUpdateRoleUseCase.execute.and.throwError('Update error');
        fixture.detectChanges();

        // Set selected role
        component['selectedRole'].set(mockRoles[0]);

        component['onConfirmToggleStatus']();

        expect(mockUpdateRoleUseCase.execute).toHaveBeenCalled();
        expect(mockNotificationService.error).toHaveBeenCalled();
    });
});
