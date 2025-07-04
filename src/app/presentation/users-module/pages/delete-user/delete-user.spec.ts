import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteUser } from './delete-user';

describe('DeleteUser', () => {
  let component: DeleteUser;
  let fixture: ComponentFixture<DeleteUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
