import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HumanResourcesStats } from './human-resources-stats';

describe('HumanResourcesStats', () => {
    let component: HumanResourcesStats;
    let fixture: ComponentFixture<HumanResourcesStats>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HumanResourcesStats],
        }).compileComponents();

        fixture = TestBed.createComponent(HumanResourcesStats);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
