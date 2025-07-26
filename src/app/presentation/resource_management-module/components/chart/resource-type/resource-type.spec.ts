import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceType } from './resource-type';

describe('ResourceType', () => {
    let component: ResourceType;
    let fixture: ComponentFixture<ResourceType>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResourceType],
        }).compileComponents();

        fixture = TestBed.createComponent(ResourceType);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
