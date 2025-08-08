import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailRm } from './detail-rm';

describe('DetailRm', () => {
  let component: DetailRm;
  let fixture: ComponentFixture<DetailRm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailRm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailRm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
