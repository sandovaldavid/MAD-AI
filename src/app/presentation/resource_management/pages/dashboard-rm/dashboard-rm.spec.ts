import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRm } from './dashboard-rm';

describe('DashboardRm', () => {
  let component: DashboardRm;
  let fixture: ComponentFixture<DashboardRm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
