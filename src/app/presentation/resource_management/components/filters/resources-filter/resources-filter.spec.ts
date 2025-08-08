import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesFilter } from './resources-filter';

describe('ResourcesFilter', () => {
    let component: ResourcesFilter;
    let fixture: ComponentFixture<ResourcesFilter>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResourcesFilter],
        }).compileComponents();

        fixture = TestBed.createComponent(ResourcesFilter);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
