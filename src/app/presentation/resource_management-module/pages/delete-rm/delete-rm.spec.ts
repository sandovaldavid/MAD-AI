import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteRm } from './delete-rm';

describe('DeleteRm', () => {
  let component: DeleteRm;
  let fixture: ComponentFixture<DeleteRm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteRm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteRm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
