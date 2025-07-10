import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Roles } from './roles';
import { TitleService } from '@core/services/title.service';
import { GetRolesUseCase } from '@application/use-cases/role/get-roles.use-case';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { RoleListModel } from '@domain/models/role/role-list.model';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';

describe('Roles', () => {
    let component: Roles;
    let fixture: ComponentFixture<Roles>;
    let mockTitleService: jasmine.SpyObj<TitleService>;
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
    ];

    beforeEach(async () => {
        const titleServiceSpy = jasmine.createSpyObj('TitleService', ['setTitle']);
        const getRolesUseCaseSpy = jasmine.createSpyObj('GetRolesUseCase', ['execute']);
        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'info',
            'warning',
        ]);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [Roles],
            providers: [
                { provide: TitleService, useValue: titleServiceSpy },
                { provide: GetRolesUseCase, useValue: getRolesUseCaseSpy },
                { provide: NotificationService, useValue: notificationServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Roles);
        component = fixture.componentInstance;

        mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
        mockGetRolesUseCase = TestBed.inject(GetRolesUseCase) as jasmine.SpyObj<GetRolesUseCase>;
        mockNotificationService = TestBed.inject(
            NotificationService
        ) as jasmine.SpyObj<NotificationService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

        // Setup default mock returns
        mockGetRolesUseCase.execute.and.returnValue(of(mockRoles));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set page title on init', () => {
        component.ngOnInit();
        expect(mockTitleService.setTitle).toHaveBeenCalledWith('Gestión de Roles');
    });

    it('should display page header', () => {
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        
        expect(compiled.querySelector('.page-title').textContent).toContain('Gestión de Roles');
        expect(compiled.querySelector('.page-description').textContent).toContain(
            'Administra los roles del sistema'
        );
    });

    it('should contain role-table component', () => {
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        
        expect(compiled.querySelector('app-role-table')).toBeTruthy();
    });

    it('should have proper page structure', () => {
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        
        expect(compiled.querySelector('.roles-page')).toBeTruthy();
        expect(compiled.querySelector('.page-container')).toBeTruthy();
        expect(compiled.querySelector('.page-header')).toBeTruthy();
        expect(compiled.querySelector('.content-section')).toBeTruthy();
    });
});
