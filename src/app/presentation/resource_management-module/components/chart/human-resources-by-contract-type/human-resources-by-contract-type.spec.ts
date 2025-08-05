import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HumanResourcesByContractType } from './human-resources-by-contract-type';

describe('HumanResourcesByContractType', () => {
    let component: HumanResourcesByContractType;
    let fixture: ComponentFixture<HumanResourcesByContractType>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HumanResourcesByContractType],
        }).compileComponents();

        fixture = TestBed.createComponent(HumanResourcesByContractType);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
