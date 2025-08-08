import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CreateRole } from './create-role';
import { TitleService } from '@core/services/title.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';
import { CreateRoleUseCase } from '@application/use-cases/role/create-role.use-case';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import { RoleEntity } from '@domain/entities/role.entity';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';

describe('CreateRole', () => {
    let component: CreateRole;
    let fixture: ComponentFixture<CreateRole>;
    let mockTitleService: jasmine.SpyObj<TitleService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;
    let mockAuthService: jasmine.SpyObj<AuthService>;
    let mockCreateRoleUseCase: jasmine.SpyObj<CreateRoleUseCase>;
    let mockRouter: jasmine.SpyObj<Router>;

    const mockCreatedRole = new RoleEntity({
        id: 1,
        name: 'Test Role',
        description: 'Test Description',
        accessLevel: RoleAccessLevel.USER,
        canLeadProjects: false,
        isUniquePerTeam: false,
        isActive: true,
        userCount: 0,
    });

    const mockNotification = new NotificationEntity({
        type: NotificationType.SUCCESS,
        title: 'Test',
        message: 'Test message',
    });

    beforeEach(async () => {
        const titleServiceSpy = jasmine.createSpyObj('TitleService', ['setTitle']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
        ]);
        
        // Setup default mock returns
        notificationServiceSpy.success.and.returnValue(of(mockNotification));
        notificationServiceSpy.error.and.returnValue(of(mockNotification));
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
        const createRoleUseCaseSpy = jasmine.createSpyObj('CreateRoleUseCase', ['execute']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [CreateRole, ReactiveFormsModule],
            providers: [
                { provide: TitleService, useValue: titleServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: CreateRoleUseCase, useValue: createRoleUseCaseSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
        mockNotificationService = TestBed.inject(
            NotificationService
        ) as jasmine.SpyObj<NotificationService>;
        mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
        mockCreateRoleUseCase = TestBed.inject(
            CreateRoleUseCase
        ) as jasmine.SpyObj<CreateRoleUseCase>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        fixture = TestBed.createComponent(CreateRole);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set page title on init', () => {
        component.ngOnInit();
        expect(mockTitleService.setTitle).toHaveBeenCalledWith('Crear Nuevo Rol');
    });

    it('should initialize form with default values', () => {
        expect(component['createForm'].get('name')?.value).toBe('');
        expect(component['createForm'].get('description')?.value).toBe('');
        expect(component['createForm'].get('accessLevel')?.value).toBe(RoleAccessLevel.USER);
        expect(component['createForm'].get('canLeadProjects')?.value).toBe(false);
        expect(component['createForm'].get('isUniquePerTeam')?.value).toBe(false);
    });

    it('should validate required fields', () => {
        const form = component['createForm'];

        expect(form.valid).toBeFalsy();

        form.patchValue({
            name: 'Test Role',
            description: 'Test Description',
        });

        expect(form.valid).toBeTruthy();
    });

    it('should create role successfully', () => {
        mockCreateRoleUseCase.execute.and.returnValue(of(mockCreatedRole));

        component['createForm'].patchValue({
            name: 'Test Role',
            description: 'Test Description',
            accessLevel: RoleAccessLevel.USER,
            canLeadProjects: false,
            isUniquePerTeam: false,
        });

        component['onSubmit']();

        expect(mockCreateRoleUseCase.execute).toHaveBeenCalled();
        expect(mockNotificationService.success).toHaveBeenCalledWith(
            'Éxito',
            'Rol "Test Role" creado exitosamente'
        );
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', 1]);
    });

    it('should handle create role error', () => {
        mockCreateRoleUseCase.execute.and.returnValue(throwError('API Error'));

        component['createForm'].patchValue({
            name: 'Test Role',
            description: 'Test Description',
        });

        component['onSubmit']();

        expect(mockNotificationService.error).toHaveBeenCalledWith(
            'Error',
            'Error al crear el rol. Por favor, intenta nuevamente.'
        );
    });

    it('should reset form', () => {
        component['createForm'].patchValue({
            name: 'Test Role',
            description: 'Test Description',
        });

        component['resetForm']();

        expect(component['createForm'].get('name')?.value).toBe('');
        expect(component['createForm'].get('description')?.value).toBe('');
        expect(component['createForm'].get('accessLevel')?.value).toBe(RoleAccessLevel.USER);
    });

    it('should navigate back to roles page', () => {
        component['goBack']();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles']);
    });

    it('should display form sections', () => {
        const compiled = fixture.nativeElement;

        expect(compiled.querySelector('.form-title').textContent).toContain('Crear Nuevo Rol');
        expect(compiled.querySelector('.section-title')).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
        const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
        expect(submitButton.disabled).toBeTruthy();
    });

    it('should enable submit button when form is valid', () => {
        component['createForm'].patchValue({
            name: 'Test Role',
            description: 'Test Description',
        });
        fixture.detectChanges();

        const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
        expect(submitButton.disabled).toBeFalsy();
    });

    it('should correctly compute canSubmit state', () => {
        // Initially should not be able to submit (form invalid)
        expect(component['canSubmit']()).toBeFalsy();

        // Fill required fields
        component['createForm'].patchValue({
            name: 'Test Role',
            description: 'Test Description',
        });

        // Now should be able to submit
        expect(component['canSubmit']()).toBeTruthy();

        // Set creating state
        component['isCreating'].set(true);

        // Should not be able to submit while creating
        expect(component['canSubmit']()).toBeFalsy();
    });

    it('should correctly count form errors', () => {
        // Initially no errors shown (not submitted)
        expect(component['formErrorsCount']()).toBe(0);

        // Submit form to show errors
        component['isSubmitted'].set(true);

        // Now errors should be counted
        expect(component['formErrorsCount']()).toBeGreaterThan(0);

        // Fill required fields
        component['createForm'].patchValue({
            name: 'Test Role',
            description: 'Test Description',
        });

        // Errors count should decrease
        expect(component['formErrorsCount']()).toBe(0);
    });
});
