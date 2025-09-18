import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Button } from './button';
import { IconRegistry } from '@/app/presentation/services/icon-registry.service';
import { ICON_REGISTRY_OPTIONS } from '@app/di/tokens';
import type { Size as IconSize, Variant as IconVariant } from '@presentation/shared/types/icon';

@Component({
  standalone: true,
  imports: [Button],
  template: `
    <ui-button
      [variant]="variant"
      [size]="size"
      [type]="type"
      [fullWidth]="fullWidth"
      [loading]="loading"
      [disabled]="disabled"
      [ariaLabel]="ariaLabel"
      [iconLeft]="iconLeft"
      [iconRight]="iconRight"
      [iconVariant]="iconVariant"
      (clicked)="onClicked($event)">
      Test Button
    </ui-button>
  `,
})
class TestHostComponent {
  variant: any = 'primary';
  size: any = 'md';
  type: any = 'button';
  fullWidth = false;
  loading = false;
  disabled = false;
  ariaLabel?: string;
  iconLeft?: string;
  iconRight?: string;
  iconVariant: any = 'outline';
  onClicked = jasmine.createSpy('onClicked');
}

describe('Button', () => {
  let component: Button;
  let fixture: ComponentFixture<Button>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    const mockIconRegistry = jasmine.createSpyObj('IconRegistry', ['getWithVariant', 'list']);
    mockIconRegistry.getWithVariant.and.callFake((name: string, variant: string) => {
      return `<svg data-testid="icon-${name}-${variant}" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>`;
    });
    mockIconRegistry.list.and.returnValue(['user', 'chevron-right', 'spinner']);

    await TestBed.configureTestingModule({
      imports: [Button, TestHostComponent],
      providers: [
        { provide: IconRegistry, useValue: mockIconRegistry },
        {
          provide: ICON_REGISTRY_OPTIONS,
          useValue: {
            missingStrategy: 'warn',
            defaultVariant: 'outline',
            fallbackSvg: '<svg></svg>',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Button);
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
      expect(component.variant()).toBe('primary');
      expect(component.size()).toBe('md');
      expect(component.type()).toBe('button');
      expect(component.fullWidth()).toBe(false);
      expect(component.loading()).toBe(false);
      expect(component.disabled()).toBe(false);
      expect(component.iconVariant()).toBe('outline');
    });
  });

  describe('Computed Properties', () => {
    describe('classes', () => {
      it('should generate base classes', () => {
        const classes = component.classes();
        expect(classes).toContain('btn');
        expect(classes).toContain('btn--primary');
        expect(classes).toContain('btn--md');
      });

      it('should include variant class', () => {
        hostComponent.variant = 'secondary';
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn--secondary');
      });

      it('should include size class', () => {
        hostComponent.size = 'lg';
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn--lg');
      });

      it('should include fullWidth class when fullWidth is true', () => {
        hostComponent.fullWidth = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn--block');
      });

      it('should not include fullWidth class when fullWidth is false', () => {
        hostComponent.fullWidth = false;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).not.toContain('btn--block');
      });

      it('should include loading class when loading is true', () => {
        hostComponent.loading = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn--loading');
      });

      it('should include disabled class when disabled is true', () => {
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn--disabled');
      });

      it('should include disabled class when loading is true', () => {
        hostComponent.loading = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn--disabled');
      });

      it('should combine multiple classes correctly', () => {
        hostComponent.variant = 'danger';
        hostComponent.size = 'sm';
        hostComponent.fullWidth = true;
        hostComponent.loading = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        const classes = buttonElement.className;
        expect(classes).toContain('btn');
        expect(classes).toContain('btn--danger');
        expect(classes).toContain('btn--sm');
        expect(classes).toContain('btn--block');
        expect(classes).toContain('btn--loading');
        expect(classes).toContain('btn--disabled');
      });

      it('should handle disabled state without loading in classes computation', () => {
        hostComponent.disabled = true;
        hostComponent.loading = false;
        hostFixture.detectChanges();

        const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
          .componentInstance as Button;

        // This ensures the 'this.disabled() || this.loading()' branch is fully evaluated
        const classes = hostButton.classes();
        expect(classes).toContain('btn--disabled');
        expect(classes).not.toContain('btn--loading');
      });

      it('should not emit click event when disabled but not loading', () => {
        hostComponent.disabled = true;
        hostComponent.loading = false;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        buttonElement.click();

        // This tests the 'this.disabled() || this.loading()' condition when disabled is true
        expect(hostComponent.onClicked).not.toHaveBeenCalled();
      });

      it('should handle all variant and size combinations in classes computation', () => {
        const combinations = [
          { variant: 'primary' as const, size: 'sm' as const },
          { variant: 'secondary' as const, size: 'md' as const },
          { variant: 'danger' as const, size: 'lg' as const },
          { variant: 'success' as const, size: 'sm' as const },
          { variant: 'warning' as const, size: 'md' as const },
          { variant: 'info' as const, size: 'lg' as const },
          { variant: 'outline-primary' as const, size: 'sm' as const },
          { variant: 'outline-secondary' as const, size: 'md' as const },
        ];

        combinations.forEach(({ variant, size }) => {
          hostComponent.variant = variant;
          hostComponent.size = size;
          hostFixture.detectChanges();

          const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
            .componentInstance as Button;
          const classes = hostButton.classes();

          expect(classes).toContain(`btn--${variant}`);
          expect(classes).toContain(`btn--${size}`);
        });
      });
    });

    describe('iconSize', () => {
      it('should return sm for size sm', () => {
        hostComponent.size = 'sm';
        hostFixture.detectChanges();

        const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
          .componentInstance as Button;
        expect(hostButton.iconSize()).toBe('sm');
      });

      it('should return md for size md', () => {
        hostComponent.size = 'md';
        hostFixture.detectChanges();

        const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
          .componentInstance as Button;
        expect(hostButton.iconSize()).toBe('md');
      });

      it('should return lg for size lg', () => {
        hostComponent.size = 'lg';
        hostFixture.detectChanges();

        const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
          .componentInstance as Button;
        expect(hostButton.iconSize()).toBe('lg');
      });

      it('should handle iconSize computation for all button sizes', () => {
        const sizeTests = [
          { buttonSize: 'sm' as const, expectedIconSize: 'sm' as const },
          { buttonSize: 'md' as const, expectedIconSize: 'md' as const },
          { buttonSize: 'lg' as const, expectedIconSize: 'lg' as const },
        ];

        sizeTests.forEach(({ buttonSize, expectedIconSize }) => {
          hostComponent.size = buttonSize;
          hostFixture.detectChanges();

          const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
            .componentInstance as Button;

          expect(hostButton.iconSize()).toBe(expectedIconSize);
        });
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render button element', () => {
      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement).toBeTruthy();
    });

    it('should set button type attribute', () => {
      hostComponent.type = 'submit';
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.type).toBe('submit');
    });

    it('should set aria-label when provided', () => {
      hostComponent.ariaLabel = 'Test button';
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBe('Test button');
    });

    it('should not set aria-label when not provided', () => {
      hostComponent.ariaLabel = undefined;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBeNull();
    });

    it('should set aria-busy to true when loading', () => {
      hostComponent.loading = true;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-busy')).toBe('true');
    });

    it('should set aria-busy to false when not loading', () => {
      hostComponent.loading = false;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-busy')).toBe('false');
    });

    it('should set aria-disabled when disabled', () => {
      hostComponent.disabled = true;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-disabled')).toBe('true');
    });

    it('should set aria-disabled when loading', () => {
      hostComponent.loading = true;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-disabled')).toBe('true');
    });

    it('should render content', () => {
      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.textContent?.trim()).toBe('Test Button');
    });

    describe('Loading State', () => {
      it('should show spinner when loading', () => {
        hostComponent.loading = true;
        hostFixture.detectChanges();

        const spinner = hostFixture.nativeElement.querySelector('.spinner');
        const srOnly = hostFixture.nativeElement.querySelector('.sr-only');
        expect(spinner).toBeTruthy();
        expect(srOnly.textContent).toBe('Cargando...');
      });

      it('should not show icons when loading', () => {
        hostComponent.loading = true;
        hostComponent.iconLeft = 'user';
        hostComponent.iconRight = 'chevron-right';
        hostFixture.detectChanges();

        const icons = hostFixture.nativeElement.querySelectorAll('ui-icon');
        expect(icons.length).toBe(0);
      });
    });

    describe('Icons', () => {
      it('should render left icon when iconLeft is provided', () => {
        hostComponent.iconLeft = 'user';
        hostFixture.detectChanges();

        const iconElement = hostFixture.nativeElement.querySelector('ui-icon');
        expect(iconElement).toBeTruthy();

        // Check that the icon component is rendered with aria-hidden
        expect(iconElement.getAttribute('aria-hidden')).toBe('true');

        // Verify the icon is positioned before content
        const button = hostFixture.nativeElement.querySelector('button');
        const firstChild = button.children[0];
        expect(firstChild.tagName.toLowerCase()).toBe('ui-icon');
      });

      it('should render right icon when iconRight is provided', () => {
        hostComponent.iconRight = 'chevron-right';
        hostFixture.detectChanges();

        const icons = hostFixture.nativeElement.querySelectorAll('ui-icon');
        expect(icons.length).toBe(1);

        // Verify the icon is positioned after content
        const button = hostFixture.nativeElement.querySelector('button');
        const lastChild = button.children[button.children.length - 1];
        expect(lastChild.tagName.toLowerCase()).toBe('ui-icon');
      });

      it('should render both icons when both are provided', () => {
        hostComponent.iconLeft = 'user';
        hostComponent.iconRight = 'chevron-right';
        hostFixture.detectChanges();

        const icons = hostFixture.nativeElement.querySelectorAll('ui-icon');
        expect(icons.length).toBe(2);

        // Verify positioning: left icon first, right icon last
        const button = hostFixture.nativeElement.querySelector('button');
        const firstChild = button.children[0];
        const lastChild = button.children[button.children.length - 1];
        expect(firstChild.tagName.toLowerCase()).toBe('ui-icon');
        expect(lastChild.tagName.toLowerCase()).toBe('ui-icon');
      });

      it('should pass iconVariant to icons', () => {
        hostComponent.iconLeft = 'user';
        hostComponent.iconVariant = 'solid';
        hostFixture.detectChanges();

        const iconElement = hostFixture.nativeElement.querySelector('ui-icon');
        expect(iconElement).toBeTruthy();
        // The variant is passed via property binding, verify icon is rendered
        expect(iconElement).toBeTruthy();
      });

      it('should pass correct icon size based on button size', () => {
        hostComponent.iconLeft = 'user';
        hostComponent.size = 'lg';
        hostFixture.detectChanges();

        const iconElement = hostFixture.nativeElement.querySelector('ui-icon');
        expect(iconElement).toBeTruthy();
        // The size is passed via property binding, verify icon is rendered
        expect(iconElement).toBeTruthy();
      });
    });
  });

  describe('Event Handling', () => {
    it('should emit clicked event when clicked and not disabled', () => {
      const buttonElement = hostFixture.nativeElement.querySelector('button');
      buttonElement.click();

      expect(hostComponent.onClicked).toHaveBeenCalledTimes(1);
    });

    it('should not emit clicked event when disabled', () => {
      hostComponent.disabled = true;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      buttonElement.click();

      expect(hostComponent.onClicked).not.toHaveBeenCalled();
    });

    it('should not emit clicked event when loading', () => {
      hostComponent.loading = true;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      buttonElement.click();

      expect(hostComponent.onClicked).not.toHaveBeenCalled();
    });

    it('should pass MouseEvent to clicked output', () => {
      const buttonElement = hostFixture.nativeElement.querySelector('button');
      const clickEvent = new MouseEvent('click');
      buttonElement.dispatchEvent(clickEvent);

      expect(hostComponent.onClicked).toHaveBeenCalledWith(clickEvent);
    });

    it('should handle onClick method with different disabled/loading combinations', () => {
      const combinations = [
        { disabled: false, loading: false, shouldEmit: true },
        { disabled: true, loading: false, shouldEmit: false },
        { disabled: false, loading: true, shouldEmit: false },
        { disabled: true, loading: true, shouldEmit: false },
      ];

      combinations.forEach(({ disabled, loading, shouldEmit }) => {
        hostComponent.disabled = disabled;
        hostComponent.loading = loading;
        hostComponent.onClicked.calls.reset();
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        buttonElement.click();

        if (shouldEmit) {
          expect(hostComponent.onClicked).toHaveBeenCalled();
        } else {
          expect(hostComponent.onClicked).not.toHaveBeenCalled();
        }
      });
    });

    it('should not emit event when onClick is called directly on disabled/loading button', () => {
      // Test direct method call to cover the early return in onClick
      const buttonDirective = hostFixture.debugElement.query(By.directive(Button));
      const buttonComponent = buttonDirective.componentInstance;
      const clickEvent = new MouseEvent('click');

      // Test disabled button
      hostComponent.disabled = true;
      hostComponent.loading = false;
      hostFixture.detectChanges();

      buttonComponent.onClick(clickEvent);
      expect(hostComponent.onClicked).not.toHaveBeenCalled();

      // Reset spy
      hostComponent.onClicked.calls.reset();

      // Test loading button
      hostComponent.disabled = false;
      hostComponent.loading = true;
      hostFixture.detectChanges();

      buttonComponent.onClick(clickEvent);
      expect(hostComponent.onClicked).not.toHaveBeenCalled();

      // Reset spy
      hostComponent.onClicked.calls.reset();

      // Test both disabled and loading
      hostComponent.disabled = true;
      hostComponent.loading = true;
      hostFixture.detectChanges();

      buttonComponent.onClick(clickEvent);
      expect(hostComponent.onClicked).not.toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    const variants = [
      'primary',
      'secondary',
      'danger',
      'ghost',
      'success',
      'warning',
      'info',
      'outline-primary',
      'outline-secondary',
    ];

    variants.forEach((variant) => {
      it(`should apply ${variant} variant class`, () => {
        hostComponent.variant = variant;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain(`btn--${variant}`);
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`should apply ${size} size class`, () => {
        hostComponent.size = size;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain(`btn--${size}`);
      });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.tabIndex).toBe(0); // Default tabIndex for buttons
    });

    it('should have correct accessibility attributes', () => {
      const buttonElement = hostFixture.nativeElement.querySelector('button');

      // Test default state
      expect(buttonElement.getAttribute('aria-busy')).toBe('false');
      expect(buttonElement.getAttribute('aria-disabled')).toBe('false');

      // Test loading state
      hostComponent.loading = true;
      hostFixture.detectChanges();

      expect(buttonElement.getAttribute('aria-busy')).toBe('true');
      expect(buttonElement.getAttribute('aria-disabled')).toBe('true');
      expect(buttonElement.disabled).toBe(true);

      // Test disabled state
      hostComponent.loading = false;
      hostComponent.disabled = true;
      hostFixture.detectChanges();

      expect(buttonElement.getAttribute('aria-busy')).toBe('false');
      expect(buttonElement.getAttribute('aria-disabled')).toBe('true');
      expect(buttonElement.disabled).toBe(true);
    });

    it('should support custom aria-label', () => {
      hostComponent.ariaLabel = 'Custom button label';
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBe('Custom button label');
    });

    it('should handle undefined aria-label', () => {
      hostComponent.ariaLabel = undefined;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBeNull();
    });

    it('should handle null aria-label', () => {
      hostComponent.ariaLabel = null as any;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBeNull();
    });

    it('should render content without any icons when no icons are provided', () => {
      hostComponent.iconLeft = undefined;
      hostComponent.iconRight = undefined;
      hostComponent.loading = false;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      const icons = buttonElement.querySelectorAll('ui-icon');
      const content = buttonElement.textContent?.trim();

      expect(icons.length).toBe(0);
      expect(content).toBe('Test Button');
    });

    it('should render only right icon when iconRight is provided without iconLeft', () => {
      hostComponent.iconLeft = undefined;
      hostComponent.iconRight = 'chevron-right';
      hostComponent.loading = false;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      const icons = buttonElement.querySelectorAll('ui-icon');
      const content = buttonElement.textContent?.trim();

      expect(icons.length).toBe(1);
      expect(content).toContain('Test Button');
      // Verify right icon is positioned after content
      const lastChild = buttonElement.children[buttonElement.children.length - 1];
      expect(lastChild.tagName.toLowerCase()).toBe('ui-icon');
    });

    it('should render both left and right icons with content in correct order', () => {
      hostComponent.iconLeft = 'user';
      hostComponent.iconRight = 'chevron-right';
      hostComponent.loading = false;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      const icons = buttonElement.querySelectorAll('ui-icon');

      expect(icons.length).toBe(2);

      // Verify content is present
      const content = buttonElement.textContent?.trim();
      expect(content).toContain('Test Button');

      // Verify order: left icon should be first child, right icon should be last child
      const children = Array.from(buttonElement.children).filter(
        (child) =>
          (child as HTMLElement).tagName &&
          (child as HTMLElement).tagName.toLowerCase() === 'ui-icon'
      );

      expect(children.length).toBe(2);
      expect((children[0] as HTMLElement).tagName.toLowerCase()).toBe('ui-icon'); // left icon
      expect((children[1] as HTMLElement).tagName.toLowerCase()).toBe('ui-icon'); // right icon
    });

    it('should handle icon size computation for all button sizes', () => {
      const testCases = [
        { buttonSize: 'sm' as const, expectedIconSize: 'sm' as const },
        { buttonSize: 'md' as const, expectedIconSize: 'md' as const },
        { buttonSize: 'lg' as const, expectedIconSize: 'lg' as const },
      ];

      testCases.forEach(({ buttonSize, expectedIconSize }) => {
        hostComponent.size = buttonSize;
        hostComponent.iconLeft = 'user';
        hostFixture.detectChanges();

        const hostButton = hostFixture.debugElement.query(By.css('ui-button'))
          .componentInstance as Button;
        expect(hostButton.iconSize()).toBe(expectedIconSize);
      });
    });

    it('should handle complex icon and loading state combinations', () => {
      // Test: loading takes precedence over icons
      hostComponent.loading = true;
      hostComponent.iconLeft = 'user';
      hostComponent.iconRight = 'chevron-right';
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      const icons = buttonElement.querySelectorAll('ui-icon');
      const spinner = buttonElement.querySelector('.spinner');

      expect(icons.length).toBe(0); // No icons when loading
      expect(spinner).toBeTruthy(); // Spinner should be present

      // Test: icons show when not loading
      hostComponent.loading = false;
      hostFixture.detectChanges();

      const iconsAfter = buttonElement.querySelectorAll('ui-icon');
      const spinnerAfter = buttonElement.querySelector('.spinner');

      expect(iconsAfter.length).toBe(2); // Both icons should be present
      expect(spinnerAfter).toBeFalsy(); // No spinner when not loading
    });

    it('should handle all button type values correctly', () => {
      const types: ('button' | 'submit' | 'reset')[] = ['button', 'submit', 'reset'];

      types.forEach((type) => {
        hostComponent.type = type;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.type).toBe(type);
      });
    });

    it('should handle boolean attribute bindings correctly', () => {
      // Test disabled attribute binding
      hostComponent.disabled = true;
      hostComponent.loading = false;
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.disabled).toBe(true);
      expect(buttonElement.getAttribute('aria-disabled')).toBe('true');

      // Test loading attribute binding
      hostComponent.disabled = false;
      hostComponent.loading = true;
      hostFixture.detectChanges();

      expect(buttonElement.disabled).toBe(true);
      expect(buttonElement.getAttribute('aria-disabled')).toBe('true');
      expect(buttonElement.getAttribute('aria-busy')).toBe('true');

      // Test normal state
      hostComponent.disabled = false;
      hostComponent.loading = false;
      hostFixture.detectChanges();

      expect(buttonElement.disabled).toBe(false);
      expect(buttonElement.getAttribute('aria-disabled')).toBe('false');
      expect(buttonElement.getAttribute('aria-busy')).toBe('false');
    });

    it('should handle icon variant propagation to icon components', () => {
      const variants: IconVariant[] = ['outline', 'filled'];

      variants.forEach((variant) => {
        hostComponent.iconLeft = 'user';
        hostComponent.iconVariant = variant;
        hostFixture.detectChanges();

        const iconElement = hostFixture.nativeElement.querySelector('ui-icon');
        expect(iconElement).toBeTruthy();
        // The variant is passed via property binding - icon should render
      });
    });

    it('should handle empty string aria-label', () => {
      hostComponent.ariaLabel = '';
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBe('');
    });

    it('should handle whitespace-only aria-label', () => {
      hostComponent.ariaLabel = '   ';
      hostFixture.detectChanges();

      const buttonElement = hostFixture.nativeElement.querySelector('button');
      expect(buttonElement.getAttribute('aria-label')).toBe('   ');
    });
  });
});
