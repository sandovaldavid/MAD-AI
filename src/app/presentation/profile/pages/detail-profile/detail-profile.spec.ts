import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailProfile } from './detail-profile';

describe('DetailProfile', () => {
    let component: DetailProfile;
    let fixture: ComponentFixture<DetailProfile>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DetailProfile],
        }).compileComponents();

        fixture = TestBed.createComponent(DetailProfile);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
