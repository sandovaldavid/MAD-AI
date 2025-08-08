import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListIcon } from './user-list.icon';

describe('UserListIcon', () => {
  let component: UserListIcon;
  let fixture: ComponentFixture<UserListIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListIcon);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
