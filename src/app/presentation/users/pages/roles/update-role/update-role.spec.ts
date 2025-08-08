import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { UpdateRole } from './update-role';
import { TitleService } from '@core/services/title.service';
import { NotificationService } from '@core/services/notification.service';
import { GetRoleByIdUseCase } from '@app/application/use-cases/role/get-role-by-id.use-case';
import { UpdateRoleUseCase } from '@app/application/use-cases/role/update-role.use-case';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';

describe('UpdateRole', () => {
  let component: UpdateRole;
  let fixture: ComponentFixture<UpdateRole>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockTitleService: jasmine.SpyObj<TitleService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockGetRoleByIdUseCase: jasmine.SpyObj<GetRoleByIdUseCase>;
  let mockUpdateRoleUseCase: jasmine.SpyObj<UpdateRoleUseCase>;

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
    const updateRoleUseCaseSpy = jasmine.createSpyObj('UpdateRoleUseCase', ['execute']);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1'),
        },
      },
    };

    // Setup notification service to return observables
    notificationServiceSpy.success.and.returnValue(of({}));
    notificationServiceSpy.error.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [UpdateRole, ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: TitleService, useValue: titleServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: GetRoleByIdUseCase, useValue: getRoleByIdUseCaseSpy },
        { provide: UpdateRoleUseCase, useValue: updateRoleUseCaseSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateRole);
    component = fixture.componentInstance;

    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
    mockNotificationService = TestBed.inject(
      NotificationService
    ) as jasmine.SpyObj<NotificationService>;
    mockGetRoleByIdUseCase = TestBed.inject(
      GetRoleByIdUseCase
    ) as jasmine.SpyObj<GetRoleByIdUseCase>;
    mockUpdateRoleUseCase = TestBed.inject(
      UpdateRoleUseCase
    ) as jasmine.SpyObj<UpdateRoleUseCase>;

    // Setup default mock returns
    mockGetRoleByIdUseCase.execute.and.returnValue(of(mockRole));
    mockUpdateRoleUseCase.execute.and.returnValue(of(mockRole));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set initial title', () => {
    fixture.detectChanges();
    expect(mockTitleService.setTitle).toHaveBeenCalledWith('Editar Rol');
  });

  it('should load role data on init', () => {
    fixture.detectChanges();
    expect(mockGetRoleByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(component.role()).toEqual(mockRole);
    expect(component.isLoading()).toBeFalse();
  });

  it('should update title when role is loaded', () => {
    fixture.detectChanges();
    expect(mockTitleService.setTitle).toHaveBeenCalledWith(`Editar Rol: ${mockRole.name}`);
  });

  it('should populate form with role data', () => {
    fixture.detectChanges();
    
    expect(component.updateForm.get('name')?.value).toBe(mockRole.name);
    expect(component.updateForm.get('description')?.value).toBe(mockRole.description);
    expect(component.updateForm.get('accessLevel')?.value).toBe(mockRole.accessLevel);
    expect(component.updateForm.get('canLeadProjects')?.value).toBe(mockRole.canLeadProjects);
    expect(component.updateForm.get('isUniquePerTeam')?.value).toBe(mockRole.isUniquePerTeam);
    expect(component.updateForm.get('isActive')?.value).toBe(mockRole.isActive);
  });

  it('should detect form changes', () => {
    fixture.detectChanges();
    
    // Initially no changes
    expect(component.hasChanges()).toBeFalse();
    
    // Make a change
    component.updateForm.patchValue({ name: 'Updated Name' });
    expect(component.hasChanges()).toBeTrue();
  });

  it('should handle role loading error', () => {
    mockGetRoleByIdUseCase.execute.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();

    expect(component.error()).toBeTruthy();
    expect(component.isLoading()).toBeFalse();
    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should navigate back on cancel', () => {
    fixture.detectChanges();
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles']);
  });

  it('should navigate to detail page', () => {
    fixture.detectChanges();
    component.navigateToDetail();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', mockRole.id]);
  });

  it('should submit form when valid and has changes', () => {
    fixture.detectChanges();
    
    // Make changes to form
    component.updateForm.patchValue({ name: 'Updated Name' });
    
    component.onSubmit();

    expect(mockUpdateRoleUseCase.execute).toHaveBeenCalledWith(1, jasmine.objectContaining({
      name: 'Updated Name',
      description: mockRole.description,
      accessLevel: mockRole.accessLevel,
      canLeadProjects: mockRole.canLeadProjects,
      isUniquePerTeam: mockRole.isUniquePerTeam,
      isActive: mockRole.isActive,
    }));
    expect(mockNotificationService.success).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', 1]);
  });

  it('should not submit form when invalid', () => {
    fixture.detectChanges();
    
    // Make form invalid
    component.updateForm.patchValue({ name: '' });
    
    component.onSubmit();

    expect(mockUpdateRoleUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle update error', () => {
    mockUpdateRoleUseCase.execute.and.returnValue(throwError(() => new Error('Update error')));
    fixture.detectChanges();
    
    // Make changes and submit
    component.updateForm.patchValue({ name: 'Updated Name' });
    component.onSubmit();

    expect(component.isUpdating()).toBeFalse();
    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should refresh role data', () => {
    fixture.detectChanges();
    mockGetRoleByIdUseCase.execute.calls.reset();

    component.refresh();

    expect(mockGetRoleByIdUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('should compute role access info correctly', () => {
    fixture.detectChanges();
    
    const accessInfo = component.roleAccessInfo();
    expect(accessInfo).toBeTruthy();
    expect(accessInfo!.label).toBe('Team Lead');
    expect(accessInfo!.level).toBe(RoleAccessLevel.TEAM_LEAD);
    expect(accessInfo!.class).toBe('access-level-3');
  });

  it('should compute formatted created date correctly', () => {
    fixture.detectChanges();
    
    const formattedDate = component.formattedCreatedAt();
    expect(formattedDate).toBeTruthy();
    expect(typeof formattedDate).toBe('string');
    expect(formattedDate).toContain('2024');
  });
});
