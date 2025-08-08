import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialResourceStock } from './material-resource-stock';

describe('MaterialResourceStock', () => {
    let component: MaterialResourceStock;
    let fixture: ComponentFixture<MaterialResourceStock>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MaterialResourceStock],
        }).compileComponents();

        fixture = TestBed.createComponent(MaterialResourceStock);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
