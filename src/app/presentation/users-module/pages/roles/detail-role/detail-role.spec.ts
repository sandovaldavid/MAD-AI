import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DetailRole } from './detail-role';
import { GetRoleByIdUseCase } from '@application/use-cases/role/get-role-by-id.use-case';
import { TitleService } from '@core/services/title.service';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';

describe('DetailRole', () => {
    let component: DetailRole;
    let fixture: ComponentFixture<DetailRole>;
    let mockGetRoleByIdUseCase: jasmine.SpyObj<GetRoleByIdUseCase>;
    let mockTitleService: jasmine.SpyObj<TitleService>;
    let mockRouter: jasmine.SpyObj<Router>;
    let mockActivatedRoute: any;

    const mockRole = new RoleEntity({
        id: 1,
        name: 'Administrator',
        description: 'Full system access',
        accessLevel: RoleAccessLevel.ADMINISTRATOR,
        canLeadProjects: true,
        isUniquePerTeam: false,
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        userCount: 2,
    });

    beforeEach(async () => {
        const getRoleByIdUseCaseSpy = jasmine.createSpyObj('GetRoleByIdUseCase', ['execute']);
        const titleServiceSpy = jasmine.createSpyObj('TitleService', ['setTitle']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        mockActivatedRoute = {
            snapshot: {
                paramMap: {
                    get: jasmine.createSpy('get').and.returnValue('1'),
                },
            },
        };

        await TestBed.configureTestingModule({
            imports: [DetailRole],
            providers: [
                { provide: GetRoleByIdUseCase, useValue: getRoleByIdUseCaseSpy },
                { provide: TitleService, useValue: titleServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DetailRole);
        component = fixture.componentInstance;

        mockGetRoleByIdUseCase = TestBed.inject(
            GetRoleByIdUseCase
        ) as jasmine.SpyObj<GetRoleByIdUseCase>;
        mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        // Setup default mock returns
        mockGetRoleByIdUseCase.execute.and.returnValue(of(mockRole));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load role details on init', () => {
        fixture.detectChanges();

        expect(mockGetRoleByIdUseCase.execute).toHaveBeenCalledWith(1);
        expect(component.role()).toEqual(mockRole);
        expect(component.isLoading()).toBe(false);
        expect(component.error()).toBeNull();
    });

    it('should set title when role is loaded', () => {
        fixture.detectChanges();

        expect(mockTitleService.setTitle).toHaveBeenCalledWith('Detalles del Rol: Administrator');
    });

    it('should handle role loading error', () => {
        mockGetRoleByIdUseCase.execute.and.returnValue(throwError(() => new Error('API Error')));

        fixture.detectChanges();

        expect(component.error()).toBe('Error al cargar los detalles del rol');
        expect(component.isLoading()).toBe(false);
        expect(component.role()).toBeNull();
    });

    it('should handle invalid role ID', () => {
        mockActivatedRoute.snapshot.paramMap.get.and.returnValue('invalid');

        fixture.detectChanges();

        expect(component.error()).toBe('ID de rol inválido');
        expect(component.isLoading()).toBe(false);
    });

    it('should handle missing role ID', () => {
        mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);

        fixture.detectChanges();

        expect(component.error()).toBe('ID de rol no encontrado');
        expect(component.isLoading()).toBe(false);
    });

    it('should navigate back to roles list', () => {
        component.goBack();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles']);
    });

    it('should navigate to edit role', () => {
        fixture.detectChanges(); // Load the role first
        component.navigateToEdit();

        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users/roles', 1, 'edit']);
    });

    it('should refresh role data', () => {
        fixture.detectChanges(); // Initial load
        mockGetRoleByIdUseCase.execute.calls.reset();

        component.refresh();

        expect(mockGetRoleByIdUseCase.execute).toHaveBeenCalledWith(1);
    });

    it('should compute role access info correctly', () => {
        fixture.detectChanges();

        const accessInfo = component.roleAccessInfo();
        expect(accessInfo).toBeTruthy();
        expect(accessInfo!.label).toBe('Administrator');
        expect(accessInfo!.level).toBe(RoleAccessLevel.ADMINISTRATOR);
        expect(accessInfo!.class).toBe('access-level-1');
    });

    it('should compute formatted created date correctly', () => {
        fixture.detectChanges();

        const formattedDate = component.formattedCreatedAt();
        expect(formattedDate).toBeTruthy();
        expect(typeof formattedDate).toBe('string');
        expect(formattedDate).toContain('2024');
    });

    it('should compute access level description correctly', () => {
        fixture.detectChanges();

        const description = component.accessLevelDescription();
        expect(description).toBe('Acceso total al sistema y configuraciones administrativas');
    });
});
