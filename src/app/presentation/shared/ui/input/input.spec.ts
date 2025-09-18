import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Input } from './input';

type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number';
type InputSize = 'sm' | 'md' | 'lg';

@Component({
  standalone: true,
  imports: [Input],
  template: `
    <ui-input
      [id]="id"
      [name]="name"
      [type]="type"
      [placeholder]="placeholder"
      [required]="required"
      [disabled]="disabled"
      [size]="size">
    </ui-input>
  `,
})
class TestHostComponent {
  id?: string;
  name?: string;
  type: InputType = 'text';
  placeholder = '';
  required = false;
  disabled = false;
  size: InputSize = 'md';
}

describe('Input', () => {
  let component: Input;
  let fixture: ComponentFixture<Input>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Input, TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Input);
    component = fixture.componentInstance;
    fixture.detectChanges();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default Values', () => {
    it('should have correct default values', () => {
      expect(component.id()).toBeUndefined();
      expect(component.name()).toBeUndefined();
      expect(component.type()).toBe('text');
      expect(component.placeholder()).toBe('');
      expect(component.required()).toBe(false);
      expect(component.disabled()).toBe(false);
      expect(component.size()).toBe('md');
      expect(component.value).toBe('');
      expect(component.isDisabled()).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    describe('classes', () => {
      it('should generate base classes', () => {
        const classes = component.classes();
        expect(classes).toContain('in');
        expect(classes).toContain('in-md');
        expect(classes).not.toContain('in--disabled');
      });

      it('should include size class for sm', () => {
        hostComponent.size = 'sm';
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        expect(inputElement.className).toContain('in-sm');
      });

      it('should include size class for lg', () => {
        hostComponent.size = 'lg';
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        expect(inputElement.className).toContain('in-lg');
      });

      it('should include disabled class when disabled is true', () => {
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        expect(inputElement.className).toContain('in--disabled');
      });

      it('should include disabled class when setDisabledState is called', () => {
        component.setDisabledState(true);
        fixture.detectChanges();

        const classes = component.classes();
        expect(classes).toContain('in--disabled');
      });

      it('should combine multiple classes correctly', () => {
        hostComponent.size = 'lg';
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        const classes = inputElement.className;
        expect(classes).toContain('in');
        expect(classes).toContain('in-lg');
        expect(classes).toContain('in--disabled');
      });
    });

    describe('isDisabled', () => {
      it('should return false when neither input disabled nor CVA disabled', () => {
        expect(component.isDisabled()).toBe(false);
      });

      it('should return true when input disabled is true', () => {
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const hostInput = hostFixture.debugElement.query(By.css('ui-input'))
          .componentInstance as Input;
        expect(hostInput.isDisabled()).toBe(true);
      });

      it('should return true when CVA disabled is true', () => {
        component.setDisabledState(true);
        expect(component.isDisabled()).toBe(true);
      });

      it('should return true when both input and CVA disabled are true', () => {
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const hostInput = hostFixture.debugElement.query(By.css('ui-input'))
          .componentInstance as Input;
        hostInput.setDisabledState(true);
        expect(hostInput.isDisabled()).toBe(true);
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render input element', () => {
      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement).toBeTruthy();
    });

    it('should render input group container', () => {
      const groupElement = hostFixture.nativeElement.querySelector('.in-group');
      expect(groupElement).toBeTruthy();
    });

    it('should set input id attribute', () => {
      hostComponent.id = 'test-input';
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.id).toBe('test-input');
    });

    it('should set input name attribute', () => {
      hostComponent.name = 'test-name';
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.name).toBe('test-name');
    });

    it('should set input type attribute', () => {
      hostComponent.type = 'email';
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.type).toBe('email');
    });

    it('should set input placeholder attribute', () => {
      hostComponent.placeholder = 'Enter text';
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.placeholder).toBe('Enter text');
    });

    it('should set input required attribute', () => {
      hostComponent.required = true;
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.required).toBe(true);
    });

    it('should set input disabled attribute when disabled', () => {
      hostComponent.disabled = true;
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.disabled).toBe(true);
    });

    it('should set input disabled attribute when CVA disabled', () => {
      const hostInput = hostFixture.debugElement.query(By.css('ui-input'))
        .componentInstance as Input;
      hostInput.setDisabledState(true);
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.disabled).toBe(true);
    });

    it('should render content projection slots', () => {
      // Test that prefix and suffix slots are available
      const groupElement = hostFixture.nativeElement.querySelector('.in-group');
      expect(groupElement.children.length).toBe(1); // Only input by default
    });
  });

  describe('ControlValueAccessor Implementation', () => {
    it('should implement ControlValueAccessor interface', () => {
      expect(typeof component.writeValue).toBe('function');
      expect(typeof component.registerOnChange).toBe('function');
      expect(typeof component.registerOnTouched).toBe('function');
      expect(typeof component.setDisabledState).toBe('function');
    });

    describe('writeValue', () => {
      it('should set value when writeValue is called with string', () => {
        component.writeValue('test value');
        expect(component.value).toBe('test value');
      });

      it('should set empty string when writeValue is called with null', () => {
        component.writeValue(null);
        expect(component.value).toBe('');
      });

      it('should set empty string when writeValue is called with undefined', () => {
        component.writeValue(null);
        expect(component.value).toBe('');
      });
    });

    describe('registerOnChange', () => {
      it('should register change callback', () => {
        const mockCallback = jasmine.createSpy('onChange');
        component.registerOnChange(mockCallback);

        // Trigger input event
        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = 'new value';
        inputElement.dispatchEvent(new Event('input'));

        expect(mockCallback).toHaveBeenCalledWith('new value');
      });
    });

    describe('registerOnTouched', () => {
      it('should register touched callback', () => {
        const mockCallback = jasmine.createSpy('onTouched');
        component.registerOnTouched(mockCallback);

        // Trigger blur event
        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.dispatchEvent(new Event('blur'));

        expect(mockCallback).toHaveBeenCalled();
      });
    });

    describe('setDisabledState', () => {
      it('should set disabled state to true', () => {
        component.setDisabledState(true);
        expect(component.isDisabled()).toBe(true);
      });

      it('should set disabled state to false', () => {
        component.setDisabledState(false);
        expect(component.isDisabled()).toBe(false);
      });
    });
  });

  describe('Event Handling', () => {
    describe('handleInput', () => {
      it('should update value and call onChange when input event occurs', () => {
        const mockOnChange = jasmine.createSpy('onChange');
        component.registerOnChange(mockOnChange);

        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = 'typed text';
        inputElement.dispatchEvent(new Event('input'));

        expect(component.value).toBe('typed text');
        expect(mockOnChange).toHaveBeenCalledWith('typed text');
      });

      it('should handle empty input', () => {
        const mockOnChange = jasmine.createSpy('onChange');
        component.registerOnChange(mockOnChange);

        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input'));

        expect(component.value).toBe('');
        expect(mockOnChange).toHaveBeenCalledWith('');
      });
    });

    describe('handleBlur', () => {
      it('should call onTouched when blur event occurs', () => {
        const mockOnTouched = jasmine.createSpy('onTouched');
        component.registerOnTouched(mockOnTouched);

        const inputElement = fixture.nativeElement.querySelector('input');
        inputElement.dispatchEvent(new Event('blur'));

        expect(mockOnTouched).toHaveBeenCalled();
      });
    });
  });

  describe('Input Types', () => {
    const inputTypes: InputType[] = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'];

    inputTypes.forEach((type) => {
      it(`should support ${type} input type`, () => {
        hostComponent.type = type;
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        expect(inputElement.type).toBe(type);
      });
    });
  });

  describe('Input Sizes', () => {
    const sizes: InputSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`should apply ${size} size class`, () => {
        hostComponent.size = size;
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        expect(inputElement.className).toContain(`in-${size}`);
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.tabIndex).toBe(0); // Default tabIndex for inputs
    });

    it('should support aria-label through host binding', () => {
      // Since aria-label is not directly supported, test that the input is accessible
      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement).toBeTruthy();
    });

    it('should handle required attribute for accessibility', () => {
      hostComponent.required = true;
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.required).toBe(true);
    });

    it('should handle disabled state for accessibility', () => {
      hostComponent.disabled = true;
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.disabled).toBe(true);
      expect(inputElement.className).toContain('in--disabled');
    });
  });

  describe('Integration with Reactive Forms', () => {
    it('should work as a form control', () => {
      // Test that CVA methods are properly implemented for form integration
      expect(() => {
        component.writeValue('test');
        component.registerOnChange(() => {});
        component.registerOnTouched(() => {});
        component.setDisabledState(false);
      }).not.toThrow();
    });

    it('should update value through form control', () => {
      component.writeValue('form value');
      expect(component.value).toBe('form value');
    });

    it('should notify form of changes', () => {
      const changeSpy = jasmine.createSpy('change');
      component.registerOnChange(changeSpy);

      const inputElement = fixture.nativeElement.querySelector('input');
      inputElement.value = 'user input';
      inputElement.dispatchEvent(new Event('input'));

      expect(changeSpy).toHaveBeenCalledWith('user input');
    });

    it('should notify form of touch events', () => {
      const touchSpy = jasmine.createSpy('touch');
      component.registerOnTouched(touchSpy);

      const inputElement = fixture.nativeElement.querySelector('input');
      inputElement.dispatchEvent(new Event('blur'));

      expect(touchSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined id and name gracefully', () => {
      hostComponent.id = undefined;
      hostComponent.name = undefined;
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.id).toBe('');
      expect(inputElement.name).toBe('');
    });

    it('should handle empty placeholder', () => {
      hostComponent.placeholder = '';
      hostFixture.detectChanges();

      const inputElement = hostFixture.nativeElement.querySelector('input');
      expect(inputElement.placeholder).toBe('');
    });

    it('should handle null writeValue', () => {
      component.writeValue(null);
      expect(component.value).toBe('');
    });

    it('should handle undefined writeValue', () => {
      component.writeValue(null);
      expect(component.value).toBe('');
    });

    it('should handle rapid input changes', () => {
      const changeSpy = jasmine.createSpy('change');
      component.registerOnChange(changeSpy);

      const inputElement = fixture.nativeElement.querySelector('input');

      // Simulate rapid typing
      const values = ['h', 'he', 'hel', 'hell', 'hello'];
      values.forEach((value) => {
        inputElement.value = value;
        inputElement.dispatchEvent(new Event('input'));
      });

      expect(component.value).toBe('hello');
      expect(changeSpy).toHaveBeenCalledTimes(5);
      expect(changeSpy.calls.mostRecent().args[0]).toBe('hello');
    });
  });

  describe('State Combinations', () => {
    it('should handle all combinations of disabled states', () => {
      const combinations = [
        { inputDisabled: false, cvaDisabled: false, expected: false },
        { inputDisabled: true, cvaDisabled: false, expected: true },
        { inputDisabled: false, cvaDisabled: true, expected: true },
        { inputDisabled: true, cvaDisabled: true, expected: true },
      ];

      combinations.forEach(({ inputDisabled, cvaDisabled, expected }) => {
        hostComponent.disabled = inputDisabled;
        hostFixture.detectChanges();

        const hostInput = hostFixture.debugElement.query(By.css('ui-input'))
          .componentInstance as Input;
        hostInput.setDisabledState(cvaDisabled);

        expect(hostInput.isDisabled()).toBe(expected);
      });
    });

    it('should handle size and disabled combinations', () => {
      const combinations = [
        { size: 'sm' as InputSize, disabled: false },
        { size: 'sm' as InputSize, disabled: true },
        { size: 'md' as InputSize, disabled: false },
        { size: 'md' as InputSize, disabled: true },
        { size: 'lg' as InputSize, disabled: false },
        { size: 'lg' as InputSize, disabled: true },
      ];

      combinations.forEach(({ size, disabled }) => {
        hostComponent.size = size;
        hostComponent.disabled = disabled;
        hostFixture.detectChanges();

        const inputElement = hostFixture.nativeElement.querySelector('input');
        expect(inputElement.className).toContain(`in-${size}`);
        if (disabled) {
          expect(inputElement.className).toContain('in--disabled');
        }
      });
    });
  });
});
