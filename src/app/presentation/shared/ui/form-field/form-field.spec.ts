import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormField } from './form-field';

describe('FormField', () => {
  let component: FormField;
  let fixture: ComponentFixture<FormField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormField],
    }).compileComponents();

    fixture = TestBed.createComponent(FormField);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display icon when iconName is provided', () => {
    // Set input value
    fixture.componentRef.setInput('iconName', 'user');
    fixture.detectChanges();

    const iconElement = fixture.nativeElement.querySelector('ui-icon');
    expect(iconElement).toBeTruthy();
    expect(iconElement.getAttribute('ng-reflect-name')).toBe('user');
  });

  it('should not display icon when iconName is not provided', () => {
    // iconName is undefined by default
    fixture.detectChanges();

    const iconElement = fixture.nativeElement.querySelector('ui-icon');
    expect(iconElement).toBeFalsy();
  });

  it('should pass icon properties to ui-icon component', () => {
    fixture.componentRef.setInput('iconName', 'email');
    fixture.componentRef.setInput('iconSize', 'lg');
    fixture.componentRef.setInput('iconVariant', 'filled');
    fixture.componentRef.setInput('iconAriaLabel', 'Email icon');
    fixture.detectChanges();

    const iconElement = fixture.nativeElement.querySelector('ui-icon');
    expect(iconElement.getAttribute('ng-reflect-name')).toBe('email');
    expect(iconElement.getAttribute('ng-reflect-size')).toBe('lg');
    expect(iconElement.getAttribute('ng-reflect-variant')).toBe('filled');
    expect(iconElement.getAttribute('ng-reflect-aria-label')).toBe('Email icon');
  });
});
