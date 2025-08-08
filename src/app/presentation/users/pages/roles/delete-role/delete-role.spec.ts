import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DeleteRole } from './delete-role';
import { TitleService } from '@core/services/title.service';
import { NotificationService } from '@core/services/notification.service';
import { GetRoleByIdUseCase } from '@application/use-cases/role/get-role-by-id.use-case';
import { DeleteRoleUseCase } from '@application/use-cases/role/delete-role.use-case';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';

describe('DeleteRole', () => {
    let component: DeleteRole;
    let fixture: ComponentFixture<DeleteRole>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: any;
    let mockTitleService: jasmine.SpyObj<TitleService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockGetRoleByIdUseCase: jasmine.SpyObj<GetRoleByIdUseCase>;
    let mockDeleteRoleUseCase: jasmine.SpyObj<DeleteRoleUseCase>;

    const mockRole = new RoleEntity({
        id: 1,
        name: 'Test Role',
        description: 'Test role description',
        accessLevel: RoleAccessLevel.TEAM_LEAD,
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        userCount: 5,
    });

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const titleServiceSpy = jasmine.createSpyObj('TitleService', ['setTitle']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'info',
            'warning',
        ]);
        const getRoleByIdUseCaseSpy = jasmine.createSpyObj('GetRoleByIdUseCase', ['execute']);
        const deleteRoleUseCaseSpy = jasmine.createSpyObj('DeleteRoleUseCase', ['execute']);

        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: jasmine.createSpy('get').and.returnValue('1'),
                },
            },
        };

        await TestBed.configureTestingModule({
            imports: [DeleteRole],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: TitleService, useValue: titleServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: GetRoleByIdUseCase, useValue: getRoleByIdUseCaseSpy },
                { provide: DeleteRoleUseCase, useValue: deleteRoleUseCaseSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DeleteRole);
        component = fixture.componentInstance;

        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
        mockNotificationService = TestBed.inject(
            NotificationService
        ) as jasmine.SpyObj<NotificationService>;
        mockGetRoleByIdUseCase = TestBed.inject(
            GetRoleByIdUseCase
        ) as jasmine.SpyObj<GetRoleByIdUseCase>;
        mockDeleteRoleUseCase = TestBed.inject(
            DeleteRoleUseCase
        ) as jasmine.SpyObj<DeleteRoleUseCase>;

        // Setup default mock returns
        mockGetRoleByIdUseCase.execute.and.returnValue(of(mockRole));
        mockDeleteRoleUseCase.execute.and.returnValue(of(void 0));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set initial title', () => {
        fixture.detectChanges();
        expect(mockTitleService.setTitle).toHaveBeenCalledWith('Eliminar Rol');
    });

    it('should load role data on init', () => {
        fixture.detectChanges();
        expect(mockGetRoleByIdUseCase.execute).toHaveBeenCalledWith(1);
        expect(component.role()).toEqual(mockRole);
        expect(component.isLoading()).toBeFalse();
    });

    it('should update title when role is loaded', () => {
        fixture.detectChanges();
        expect(mockTitleService.setTitle).toHaveBeenCalledWith(`Eliminar Rol: ${mockRole.name}`);
    });

    it('should handle error when loading role', () => {
        mockGetRoleByIdUseCase.execute.and.returnValue(throwError(() => new Error('Test error')));

        fixture.detectChanges();

        expect(component.error()).toBeTruthy();
        expect(component.isLoading()).toBeFalse();
        expect(mockNotificationService.error).toHaveBeenCalled();
    });

    it('should navigate back on cancel', () => {
        fixture.detectChanges();
        component.onCancel();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles']);
    });

    it('should navigate to role details', () => {
        fixture.detectChanges();
        component.onViewDetails();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', mockRole.id]);
    });

    it('should validate confirmation text', () => {
        fixture.detectChanges();

        // Initially invalid
        expect(component.isConfirmationValid()).toBeFalse();

        // Set correct name
        component.confirmationText.set(mockRole.name);
        expect(component.isConfirmationValid()).toBeTrue();

        // Case insensitive
        component.confirmationText.set(mockRole.name.toUpperCase());
        expect(component.isConfirmationValid()).toBeTrue();

        // Wrong name
        component.confirmationText.set('Wrong Name');
        expect(component.isConfirmationValid()).toBeFalse();
    });

    it('should not delete if confirmation text is invalid', () => {
        fixture.detectChanges();
        component.confirmationText.set('Wrong Name');

        component.onConfirmDelete();

        expect(mockNotificationService.error).toHaveBeenCalledWith(
            'Error',
            'El nombre del rol no coincide'
        );
        expect(mockDeleteRoleUseCase.execute).not.toHaveBeenCalled();
    });

    it('should delete role when confirmation is valid', () => {
        fixture.detectChanges();
        component.confirmationText.set(mockRole.name);

        component.onConfirmDelete();

        expect(mockDeleteRoleUseCase.execute).toHaveBeenCalledWith(mockRole.id);
        expect(mockNotificationService.success).toHaveBeenCalledWith(
            'Éxito',
            `Rol "${mockRole.name}" eliminado exitosamente`
        );
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles']);
    });

    it('should handle delete error', () => {
        mockDeleteRoleUseCase.execute.and.returnValue(throwError(() => new Error('Delete error')));
        fixture.detectChanges();
        component.confirmationText.set(mockRole.name);

        component.onConfirmDelete();

        expect(component.isDeleting()).toBeFalse();
        expect(mockNotificationService.error).toHaveBeenCalled();
    });

    it('should get role access info as computed property', () => {
        fixture.detectChanges();
        const accessLevelInfo = component.roleAccessInfo();
        expect(accessLevelInfo).toBeTruthy();
        expect(accessLevelInfo!.label).toBeTruthy();
        expect(accessLevelInfo!.class).toBe('access-level-3');
    });

    it('should format created date as computed property', () => {
        fixture.detectChanges();
        const formattedDate = component.formattedCreatedAt();
        expect(formattedDate).toBeTruthy();
        expect(typeof formattedDate).toBe('string');
    });

    it('should compute canDelete correctly', () => {
        fixture.detectChanges();

        // Initially false because no confirmation text
        expect(component.canDelete()).toBeFalse();

        // Set correct confirmation text
        component.confirmationText.set(mockRole.name);
        expect(component.canDelete()).toBeTrue();

        // Should be false when deleting
        component.isDeleting.set(true);
        expect(component.canDelete()).toBeFalse();
    });

    it('should update confirmation text on input change', () => {
        fixture.detectChanges();
        const event = { target: { value: 'New Value' } } as any;

        component.onConfirmationTextChange(event);

        expect(component.confirmationText()).toBe('New Value');
    });

    it('should retry loading role data', () => {
        fixture.detectChanges();
        mockGetRoleByIdUseCase.execute.calls.reset();

        component.onRetry();

        expect(mockGetRoleByIdUseCase.execute).toHaveBeenCalledWith(1);
    });

    it('should display loading state', () => {
        component.isLoading.set(true);
        fixture.detectChanges();

        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.loading-container')).toBeTruthy();
        expect(compiled.querySelector('.loading-text').textContent).toContain(
            'Cargando información del rol'
        );
    });

    it('should display error state', () => {
        component.error.set('Test error');
        component.role.set(null);
        fixture.detectChanges();

        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.error-container')).toBeTruthy();
        expect(compiled.querySelector('.error-message').textContent).toContain('Test error');
    });

    it('should display role information when loaded', () => {
        fixture.detectChanges();

        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('.delete-container')).toBeTruthy();
        expect(compiled.querySelector('.delete-title').textContent).toContain(
            'Confirmar Eliminación'
        );
        expect(compiled.textContent).toContain(mockRole.name);
        expect(compiled.textContent).toContain(mockRole.description);
    });
});
