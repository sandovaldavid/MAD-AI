import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { DeleteUser } from './delete-user';
import { DeactivateUserUseCase } from '@application/use-cases/user/deactivate-user.use-case';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { NotificationService } from '@core/services/notification.service';
import { UserEntity } from '@domain/entities/user.entity';
import { UserStatus } from '@domain/enums/user_status.enum';
import { NotificationEntity } from '@domain/entities/notification.entity';
import { NotificationType } from '@domain/enums/notification.enum';

describe('DeleteUser', () => {
  let component: DeleteUser;
  let fixture: ComponentFixture<DeleteUser>;
  let mockDeactivateUserUseCase: jasmine.SpyObj<DeactivateUserUseCase>;
  let mockGetUserByIdUseCase: jasmine.SpyObj<GetUserByIdUseCase>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
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
  });

  const mockNotification = new NotificationEntity({
    type: NotificationType.SUCCESS,
    title: 'Test',
    message: 'Test message',
  });

  beforeEach(async () => {
    const deactivateUserUseCaseSpy = jasmine.createSpyObj('DeactivateUserUseCase', ['execute']);
    const getUserByIdUseCaseSpy = jasmine.createSpyObj('GetUserByIdUseCase', ['execute']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
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
      imports: [DeleteUser],
      providers: [
        { provide: DeactivateUserUseCase, useValue: deactivateUserUseCaseSpy },
        { provide: GetUserByIdUseCase, useValue: getUserByIdUseCaseSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteUser);
    component = fixture.componentInstance;

    mockDeactivateUserUseCase = TestBed.inject(DeactivateUserUseCase) as jasmine.SpyObj<DeactivateUserUseCase>;
    mockGetUserByIdUseCase = TestBed.inject(GetUserByIdUseCase) as jasmine.SpyObj<GetUserByIdUseCase>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockGetUserByIdUseCase.execute.and.returnValue(of(mockUser));
    mockDeactivateUserUseCase.execute.and.returnValue(of(mockUser));
    mockNotificationService.success.and.returnValue(of(mockNotification));
    mockNotificationService.error.and.returnValue(of(mockNotification));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user on init', () => {
    expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(component['user']()).toEqual(mockUser);
  });

  it('should navigate to users list on successful deactivation', () => {
    component['onConfirmDelete']();

    expect(mockDeactivateUserUseCase.execute).toHaveBeenCalledWith(1, 'Desactivado desde la interfaz de administración');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    expect(mockNotificationService.success).toHaveBeenCalled();
  });

  it('should navigate to users list on cancel', () => {
    component['onCancelDelete']();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
  });
});
