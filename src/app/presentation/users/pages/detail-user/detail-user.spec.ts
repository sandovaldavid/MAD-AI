import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { DetailUser } from './detail-user';
import { GetUserByIdUseCase } from '@application/use-cases/user/get-user-by-id.use-case';
import { TitleService } from '@core/services/title.service';
import { UserEntity } from '@domain/entities/user.entity';
import { UserStatus } from '@domain/enums/user_status.enum';

describe('DetailUser', () => {
  let component: DetailUser;
  let fixture: ComponentFixture<DetailUser>;
  let mockGetUserByIdUseCase: jasmine.SpyObj<GetUserByIdUseCase>;
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
    roleName: 'Administrator',
  });

  beforeEach(async () => {
    const getUserByIdUseCaseSpy = jasmine.createSpyObj('GetUserByIdUseCase', ['execute']);
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
      imports: [DetailUser],
      providers: [
        { provide: GetUserByIdUseCase, useValue: getUserByIdUseCaseSpy },
        { provide: TitleService, useValue: titleServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailUser);
    component = fixture.componentInstance;

    mockGetUserByIdUseCase = TestBed.inject(GetUserByIdUseCase) as jasmine.SpyObj<GetUserByIdUseCase>;
    mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mock returns
    mockGetUserByIdUseCase.execute.and.returnValue(of(mockUser));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user on init', () => {
    expect(mockGetUserByIdUseCase.execute).toHaveBeenCalledWith(1);
    expect(component['user']()).toEqual(mockUser);
  });

  it('should set title when user is loaded', () => {
    expect(mockTitleService.setTitle).toHaveBeenCalledWith('Perfil de Test User');
  });

  it('should navigate back to users list', () => {
    component['goBack']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
  });

  it('should navigate to edit user page', () => {
    component['navigateToEdit']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/users', 1, 'edit']);
  });

  it('should return correct status badge class', () => {
    expect(component['getStatusBadgeClass'](true)).toBe('status-badge-active');
    expect(component['getStatusBadgeClass'](false)).toBe('status-badge-inactive');
  });

  it('should return correct status text', () => {
    expect(component['getStatusText'](true)).toBe('Activo');
    expect(component['getStatusText'](false)).toBe('Inactivo');
  });

  it('should generate user initials correctly', () => {
    expect(component['getUserInitials']('Test', 'User')).toBe('TU');
  });
});
