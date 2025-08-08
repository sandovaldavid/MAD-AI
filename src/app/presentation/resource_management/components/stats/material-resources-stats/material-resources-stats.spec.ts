import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialResourcesStats } from './material-resources-stats';

describe('MaterialResourcesStats', () => {
    let component: MaterialResourcesStats;
    let fixture: ComponentFixture<MaterialResourcesStats>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MaterialResourcesStats],
        }).compileComponents();

        fixture = TestBed.createComponent(MaterialResourcesStats);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
