import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesTable } from './resources-table';

describe('ResourcesTable', () => {
  let component: ResourcesTable;
  let fixture: ComponentFixture<ResourcesTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcesTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
