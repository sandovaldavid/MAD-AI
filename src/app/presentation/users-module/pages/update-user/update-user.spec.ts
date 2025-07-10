import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UpdateUser } from './update-user';
import { UpdateUserUseCase } from '@application/use-cases/user/update-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { NotificationService } from '@core/services/notification.service';
import { TitleService } from '@core/services/title.service';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleEntity } from '@domain/entities/role.entity';
import { UserStatus } from '@domain/enums/user_status.enum';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';

describe('UpdateUser', () => {
  let component: UpdateUser;
  let fixture: ComponentFixture<UpdateUser>;
  let mockUpdateUserUseCase: jasmine.SpyObj<UpdateUserUseCase>;
  let mockGetUserByIdUseCase: jasmine.SpyObj<GetUserByIdUseCase>;
  let mockGetRolesUseCase: jasmine.SpyObj<GetRolesUseCase>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockTitleService: jasmine.SpyObj<TitleService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  const mockUser = new UserEntity({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    status: UserStatus.ACTIVE,
    isActive: true,
    isEmailConfirmed: true,
    profileCompleted: true,
    emailNotificationsEnabled: true,
    systemNotificationsEnabled: true,
    taskNotificationsEnabled: false,
    roleId: 1,
    roleName: 'Administrator',
  });

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
      userCount: 5,
    }),
  ];

  const mockNotification = new NotificationEntity({
    type: NotificationType.SUCCESS,
    title: 'Test',
    message: 'Test message',
  });

  beforeEach(async () => {
    const updateUserUseCaseSpy = jasmine.createSpyObj('UpdateUserUseCase', ['execute']);
    const getUserByIdUseCaseSpy = jasmine.createSpyObj('GetUserByIdUseCase', ['execute']);
    const getRolesUseCaseSpy = jasmine.createSpyObj('GetRolesUseCase', ['execute']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);
    const titleServiceSpy = jasmine.createSpyObj('TitleService', ['setTitle']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1'),
          has: jasmine.createSpy('has').and.returnValue(true),
          getAll: jasmine.createSpy('getAll').and.returnValue(['1']),
          keys: ['id']
        }
      } as any
    };

    await TestBed.configureTestingModule({
      imports: [UpdateUser, ReactiveFormsModule],
      providers: [
        { provide: UpdateUserUseCase, useValue: updateUserUseCaseSpy },
        { provide: GetUserByIdUseCase, useValue: getUserByIdUseCaseSpy },
        { provide: GetRolesUseCase, useValue: getRolesUseCaseSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: TitleService, useValue: titleServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateUser);
    component = fixture.componentInstance;

    mockUpdateUserUseCase = TestBed.inject(UpdateUserUseCase) as jasmine.SpyObj<UpdateUserUseCase>;
    mockGetUserByIdUseCase = TestBed.inject(GetUserByIdUseCase) as jasmine.SpyObj<GetUserByIdUseCase>;
    mockGetRolesUseCase = TestBed.inject(GetRolesUseCase) as jasmine.SpyObj<GetRolesUseCase>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockGetUserByIdUseCase.execute.and.returnValue(of(mockUser));
    mockGetRolesUseCase.execute.and.returnValue(of(mockRoles));
    mockUpdateUserUseCase.execute.and.returnValue(of(mockUser));
    mockNotificationService.success.and.returnValue(of(mockNotification));
    mockNotificationService.error.and.returnValue(of(mockNotification));
    mockNotificationService.info.and.returnValue(of(mockNotification));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user and roles on init', () => {
    expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(mockGetRolesUseCase.execute).toHaveBeenCalled();
    expect(component['user']()).toEqual(mockUser);
    expect(component['roles']()).toEqual(mockRoles);
  });

  it('should set title when user is loaded', () => {
    expect(mockTitleService.setTitle).toHaveBeenCalledWith('Editar Usuario: Test User');
  });

  it('should populate form with user data', () => {
    expect(component.form.get('firstName')?.value).toBe('Test');
    expect(component.form.get('lastName')?.value).toBe('User');
    expect(component.form.get('email')?.value).toBe('test@example.com');
    expect(component.form.get('isActive')?.value).toBe(true);
    expect(component.form.get('roleId')?.value).toBe(1);
  });

  it('should navigate back to users list on cancel', () => {
    component['onCancel']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('should submit form with changed data only', () => {
    // Change only the first name
    component.form.patchValue({ firstName: 'Updated' });
    
    component['onSubmit']();

    expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith(1, {
      firstName: 'Updated'
    });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    expect(mockNotificationService.success).toHaveBeenCalled();
  });

  it('should show info message when no changes are detected', () => {
    // Don't change anything
    component['onSubmit']();

    expect(mockUpdateUserUseCase.execute).not.toHaveBeenCalled();
    expect(mockNotificationService.info).toHaveBeenCalledWith('Sin cambios', 'No se detectaron cambios para actualizar');
  });

  it('should generate role options correctly', () => {
    const roleOptions = component['roleOptions']();
    expect(roleOptions).toEqual([
      { value: 1, label: 'Admin', disabled: false },
      { value: 2, label: 'User', disabled: false },
    ]);
  });

  it('should generate user status options correctly', () => {
    const statusOptions = component['getUserStatusOptions']();
    expect(statusOptions.length).toBeGreaterThan(0);
    expect(statusOptions[0].value).toBeDefined();
    expect(statusOptions[0].label).toBeDefined();
    expect(typeof statusOptions[0].value).toBe('string');
    expect(typeof statusOptions[0].label).toBe('string');
  });
});
