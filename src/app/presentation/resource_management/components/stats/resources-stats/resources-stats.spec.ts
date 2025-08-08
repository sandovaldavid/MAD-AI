import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesStats } from './resources-stats';

describe('ResourcesStats', () => {
    let component: ResourcesStats;
    let fixture: ComponentFixture<ResourcesStats>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResourcesStats],
        }).compileComponents();

        fixture = TestBed.createComponent(ResourcesStats);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
