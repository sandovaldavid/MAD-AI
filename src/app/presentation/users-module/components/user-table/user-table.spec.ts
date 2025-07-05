import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserTable } from './user-table';
import { Button } from '@shared/components/ui/button/button';

describe('UserTable', () => {
    let component: UserTable;
    let fixture: ComponentFixture<UserTable>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserTable, Button],
        }).compileComponents();

        fixture = TestBed.createComponent(UserTable);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display user table with new icon system', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.user-table-container')).toBeTruthy();
    });

    it('should have create user button with plus icon', () => {
        const compiled = fixture.nativeElement;
        const createButton = compiled.querySelector('app-button[icon="plus"]');
        expect(createButton).toBeTruthy();
    });

    it('should have refresh button with refresh icon', () => {
        const compiled = fixture.nativeElement;
        const refreshButton = compiled.querySelector('app-button[icon="refresh"]');
        expect(refreshButton).toBeTruthy();
    });
});
