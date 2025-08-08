import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRm } from './update-rm';

describe('UpdateRm', () => {
  let component: UpdateRm;
  let fixture: ComponentFixture<UpdateRm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateRm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateRm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
