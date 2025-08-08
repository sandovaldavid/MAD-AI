import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { CreateUser } from './create-user';
import { CreateUserUseCase } from '@application/use-cases/user/create-user.use-case';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { NotificationService } from '@core/services/notification.service';
import { RoleEntity } from '@domain/entities/role.entity';
import { UserEntity } from '@domain/entities/user.entity';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';
import { UserStatus } from '@domain/enums/user_status.enum';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';

describe('CreateUser', () => {
  let component: CreateUser;
  let fixture: ComponentFixture<CreateUser>;
  let mockCreateUserUseCase: jasmine.SpyObj<CreateUserUseCase>;
  let mockGetRolesUseCase: jasmine.SpyObj<GetRolesUseCase>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockRouter: jasmine.SpyObj<Router>;

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

  const mockUser = new UserEntity({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    status: UserStatus.ACTIVE,
    isActive: true,
  });

  const mockNotification = new NotificationEntity({
    type: NotificationType.SUCCESS,
    title: 'Test',
    message: 'Test message',
  });

  beforeEach(async () => {
    const createUserUseCaseSpy = jasmine.createSpyObj('CreateUserUseCase', ['execute']);
    const getRolesUseCaseSpy = jasmine.createSpyObj('GetRolesUseCase', ['execute']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [CreateUser, ReactiveFormsModule],
      providers: [
        { provide: CreateUserUseCase, useValue: createUserUseCaseSpy },
        { provide: GetRolesUseCase, useValue: getRolesUseCaseSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateUser);
    component = fixture.componentInstance;

    mockCreateUserUseCase = TestBed.inject(CreateUserUseCase) as jasmine.SpyObj<CreateUserUseCase>;
    mockGetRolesUseCase = TestBed.inject(GetRolesUseCase) as jasmine.SpyObj<GetRolesUseCase>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockGetRolesUseCase.execute.and.returnValue(of(mockRoles));
    mockCreateUserUseCase.execute.and.returnValue(of(mockUser));
    mockNotificationService.success.and.returnValue(of(mockNotification));
    mockNotificationService.error.and.returnValue(of(mockNotification));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load roles on init', () => {
    expect(mockGetRolesUseCase.execute).toHaveBeenCalled();
    expect(component['roles']()).toEqual(mockRoles);
  });

  it('should have form with required fields', () => {
    expect(component.form.get('username')).toBeTruthy();
    expect(component.form.get('email')).toBeTruthy();
    expect(component.form.get('password')).toBeTruthy();
    expect(component.form.get('firstName')).toBeTruthy();
    expect(component.form.get('lastName')).toBeTruthy();
    expect(component.form.get('roleId')).toBeTruthy();
  });

  it('should call create user use case on valid form submission', () => {
    // Set valid form values
    component.form.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      roleId: 1,
    });

    component['onSubmit']();

    expect(mockCreateUserUseCase.execute).toHaveBeenCalled();
  });

  it('should navigate to users list on successful creation', () => {
    component.form.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    component['onSubmit']();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    expect(mockNotificationService.success).toHaveBeenCalled();
  });
});
