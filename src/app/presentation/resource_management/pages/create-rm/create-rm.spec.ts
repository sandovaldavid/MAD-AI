import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRm } from './create-rm';

describe('CreateRm', () => {
  let component: CreateRm;
  let fixture: ComponentFixture<CreateRm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateRm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateRm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
