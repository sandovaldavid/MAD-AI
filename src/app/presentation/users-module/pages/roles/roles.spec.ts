import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Roles } from './roles';
import { TitleService } from '@core/services/title.service';
import { RoleEntity } from '@domain/entities/role.entity';
import { RoleAccessLevel } from '@domain/enums/role-access-level.enum';

describe('Roles', () => {
    let component: Roles;
    let fixture: ComponentFixture<Roles>;
    let mockTitleService: jasmine.SpyObj<TitleService>;
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
            createdAt: new Date(),
        }),
    ];

    beforeEach(async () => {
        const titleServiceSpy = jasmine.createSpyObj('TitleService', ['setTitle']);
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [Roles],
            providers: [
                { provide: TitleService, useValue: titleServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Roles);
        component = fixture.componentInstance;

        mockTitleService = TestBed.inject(TitleService) as jasmine.SpyObj<TitleService>;
        mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
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

    it('should navigate back to users when goBack is called', () => {
        component.goBack();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
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
