import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardHumanResources } from './dashboard-human-resources';

describe('DashboardHumanResources', () => {
  let component: DashboardHumanResources;
  let fixture: ComponentFixture<DashboardHumanResources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardHumanResources]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardHumanResources);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
