import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmation } from './modal-confirmation';

describe('ModalConfirmation', () => {
  let component: ModalConfirmation;
  let fixture: ComponentFixture<ModalConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalConfirmation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
