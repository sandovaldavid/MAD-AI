import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceState } from './resource-state';

describe('ResourceState', () => {
  let component: ResourceState;
  let fixture: ComponentFixture<ResourceState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceState]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceState);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
