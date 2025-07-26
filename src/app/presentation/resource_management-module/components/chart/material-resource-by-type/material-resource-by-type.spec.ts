import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialResourceByType } from './material-resource-by-type';

describe('MaterialResourceByType', () => {
    let component: MaterialResourceByType;
    let fixture: ComponentFixture<MaterialResourceByType>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MaterialResourceByType],
        }).compileComponents();

        fixture = TestBed.createComponent(MaterialResourceByType);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
