import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMaterialResources } from './dashboard-material-resources';

describe('DashboardMaterialResources', () => {
    let component: DashboardMaterialResources;
    let fixture: ComponentFixture<DashboardMaterialResources>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DashboardMaterialResources],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardMaterialResources);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
