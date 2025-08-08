import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HumanResourcesByRol } from './human-resources-by-rol';

describe('HumanResourcesByRol', () => {
    let component: HumanResourcesByRol;
    let fixture: ComponentFixture<HumanResourcesByRol>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HumanResourcesByRol],
        }).compileComponents();

        fixture = TestBed.createComponent(HumanResourcesByRol);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
