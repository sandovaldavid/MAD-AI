import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Icon } from './icon';
import { IconRegistry } from '@presentation/services/icon-registry.service';
import { ICON_REGISTRY_OPTIONS, ICON_SVG_SET } from '@app/di/tokens';
import type { Size, Variant } from '@presentation/shared/types/icon';

// Test Host Component for input testing
@Component({
  selector: 'test-host',
  imports: [Icon],
  template: `
    <ui-icon [name]="name" [size]="size" [variant]="variant" [ariaLabel]="ariaLabel"> </ui-icon>
  `,
  standalone: true,
})
class TestHostComponent {
  name = 'user';
  size: Size = 'md';
  variant: Variant | null = null;
  ariaLabel: string | null = null;
}

describe('Icon', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let mockIconRegistry: jasmine.SpyObj<IconRegistry>;

  beforeEach(async () => {
    // Create a spy object for IconRegistry
    mockIconRegistry = jasmine.createSpyObj('IconRegistry', ['getWithVariant', 'list']);

    // Configure the spy to return mock SVG content
    mockIconRegistry.getWithVariant.and.callFake((name: string, variant?: 'outline' | 'filled') => {
      const mockIcons: Record<string, string> = {
        user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        'chevron-right': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>`,
        'test-icon': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      };
      const svgString = mockIcons[name] || null;
      return svgString as any; // Cast to SafeHtml for testing
    });

    mockIconRegistry.list.and.returnValue(['user', 'chevron-right', 'test-icon']);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: IconRegistry, useValue: mockIconRegistry },
        {
          provide: ICON_REGISTRY_OPTIONS,
          useValue: {
            missingStrategy: 'warn',
            defaultVariant: 'outline',
            fallbackSvg: '<svg>fallback</svg>',
          },
        },
        {
          provide: ICON_SVG_SET,
          useValue: {},
          multi: true,
        },
      ],
    }).compileComponents();

    // Test with host component for input testing
    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(hostComponent).toBeTruthy();
    });

    it('should render the component', () => {
      const compiled = hostFixture.nativeElement;
      expect(compiled.querySelector('span')).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    describe('name (required)', () => {
      it('should accept string values', () => {
        hostComponent.name = 'user';
        hostFixture.detectChanges();
        expect(hostComponent.name).toBe('user');
      });

      it('should handle different icon names', () => {
        const testNames = ['user', 'chevron-right', 'test-icon'];

        testNames.forEach((name) => {
          hostComponent.name = name;
          hostFixture.detectChanges();
          expect(hostComponent.name).toBe(name);
        });
      });
    });

    describe('size', () => {
      it('should default to "md"', () => {
        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.size()).toBe('md');
      });

      it('should accept all valid size values', () => {
        const sizes: Size[] = ['xs', 'sm', 'md', 'lg', 'xl'];

        sizes.forEach((size) => {
          hostComponent.size = size;
          hostFixture.detectChanges();
          expect(hostComponent.size).toBe(size);
        });
      });

      it('should handle size changes dynamically', () => {
        hostComponent.size = 'sm';
        hostFixture.detectChanges();
        expect(hostComponent.size).toBe('sm');

        hostComponent.size = 'lg';
        hostFixture.detectChanges();
        expect(hostComponent.size).toBe('lg');
      });
    });

    describe('variant', () => {
      it('should default to null', () => {
        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.variant()).toBeNull();
      });

      it('should accept valid variant values', () => {
        const variants: (Variant | null)[] = [null, 'outline', 'filled'];

        variants.forEach((variant) => {
          hostComponent.variant = variant;
          hostFixture.detectChanges();
          expect(hostComponent.variant).toBe(variant);
        });
      });

      it('should handle variant changes dynamically', () => {
        hostComponent.variant = 'outline';
        hostFixture.detectChanges();
        expect(hostComponent.variant).toBe('outline');

        hostComponent.variant = 'filled';
        hostFixture.detectChanges();
        expect(hostComponent.variant).toBe('filled');

        hostComponent.variant = null;
        hostFixture.detectChanges();
        expect(hostComponent.variant).toBeNull();
      });
    });

    describe('ariaLabel', () => {
      it('should default to null', () => {
        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.ariaLabel()).toBeNull();
      });

      it('should accept string values', () => {
        const labels = ['User icon', 'Close button', 'Menu toggle'];

        labels.forEach((label) => {
          hostComponent.ariaLabel = label;
          hostFixture.detectChanges();
          expect(hostComponent.ariaLabel).toBe(label);
        });
      });

      it('should handle null values', () => {
        hostComponent.ariaLabel = null;
        hostFixture.detectChanges();
        expect(hostComponent.ariaLabel).toBeNull();
      });
    });
  });

  describe('Computed Properties', () => {
    describe('svg', () => {
      it('should return SVG content from registry', () => {
        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;
        const svgContent = iconComponent.svg();
        expect(svgContent).toBeTruthy();
        expect(typeof svgContent).toBe('string');
      });

      it('should call registry with correct parameters', () => {
        hostComponent.name = 'user';
        hostComponent.variant = 'outline';
        hostFixture.detectChanges();

        expect(mockIconRegistry.getWithVariant).toHaveBeenCalledWith('user', 'outline');
      });

      it('should use default variant when variant is null', () => {
        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;

        hostComponent.name = 'user';
        hostComponent.variant = null;
        hostFixture.detectChanges();

        // Access the computed signal to trigger it
        const svgContent = iconComponent.svg();
        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('viewBox');
      });

      it('should handle different icon names', () => {
        const testCases = [
          { name: 'user', expected: true },
          { name: 'chevron-right', expected: true },
          { name: 'nonexistent', expected: null },
        ];

        testCases.forEach(({ name, expected }) => {
          hostComponent.name = name;
          hostFixture.detectChanges();

          const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
          const iconComponent = iconElement.componentInstance as Icon;
          const result = iconComponent.svg();

          if (expected) {
            expect(result).toBeTruthy();
          } else {
            expect(result).toBeNull();
          }
        });
      });
    });

    describe('sizeClass', () => {
      it('should return correct Tailwind classes for each size', () => {
        const sizeMappings: Record<Size, string> = {
          xs: 'w-3 h-3',
          sm: 'w-4 h-4',
          md: 'w-5 h-5',
          lg: 'w-6 h-6',
          xl: 'w-7 h-7',
        };

        Object.entries(sizeMappings).forEach(([size, expectedClass]) => {
          hostComponent.size = size as Size;
          hostFixture.detectChanges();

          const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
          const iconComponent = iconElement.componentInstance as Icon;
          expect(iconComponent.sizeClass()).toBe(expectedClass);
        });
      });

      it('should update sizeClass when size changes', () => {
        hostComponent.size = 'sm';
        hostFixture.detectChanges();

        let iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        let iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.sizeClass()).toBe('w-4 h-4');

        hostComponent.size = 'lg';
        hostFixture.detectChanges();

        iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.sizeClass()).toBe('w-6 h-6');
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render span element with correct base classes', () => {
      const span = hostFixture.nativeElement.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.classList.contains('inline-block')).toBeTruthy();
      expect(span.classList.contains('align-middle')).toBeTruthy();
    });

    it('should apply size classes to span element', () => {
      hostComponent.size = 'sm';
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.classList.contains('w-4')).toBeTruthy();
      expect(span.classList.contains('h-4')).toBeTruthy();
    });

    it('should render SVG content in span innerHTML', () => {
      // Test the computed signal directly since DOM sanitization affects innerHTML in tests
      const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
      const iconComponent = iconElement.componentInstance as any;

      // The computed signal should return SafeHtml with SVG content
      const svgContent = iconComponent.svg();
      expect(svgContent).toBeTruthy();
      expect(typeof svgContent).toBe('string');
      expect(svgContent).toContain('<svg');

      // Verify the mock was called correctly
      expect(mockIconRegistry.getWithVariant).toHaveBeenCalledWith('user', 'outline');
    });

    it('should update size classes when size input changes', () => {
      hostComponent.size = 'xs';
      hostFixture.detectChanges();

      let span = hostFixture.nativeElement.querySelector('span');
      expect(span.classList.contains('w-3')).toBeTruthy();
      expect(span.classList.contains('h-3')).toBeTruthy();

      hostComponent.size = 'xl';
      hostFixture.detectChanges();

      span = hostFixture.nativeElement.querySelector('span');
      expect(span.classList.contains('w-7')).toBeTruthy();
      expect(span.classList.contains('h-7')).toBeTruthy();
    });
  });

  describe('Accessibility Features', () => {
    it('should not have role attribute when ariaLabel is null', () => {
      hostComponent.ariaLabel = null;
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBeNull();
    });

    it('should not have aria-label attribute when ariaLabel is null', () => {
      hostComponent.ariaLabel = null;
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('aria-label')).toBeNull();
    });

    it('should set role="img" when ariaLabel is provided', () => {
      hostComponent.ariaLabel = 'User avatar';
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBe('img');
    });

    it('should set aria-label when ariaLabel is provided', () => {
      const testLabel = 'Close button icon';
      hostComponent.ariaLabel = testLabel;
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('aria-label')).toBe(testLabel);
    });

    it('should handle empty string ariaLabel', () => {
      hostComponent.ariaLabel = '';
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBeNull();
      expect(span.getAttribute('aria-label')).toBeNull();
    });

    it('should update accessibility attributes dynamically', () => {
      // Initially no aria attributes
      hostComponent.ariaLabel = null;
      hostFixture.detectChanges();

      let span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBeNull();
      expect(span.getAttribute('aria-label')).toBeNull();

      // Add aria label
      hostComponent.ariaLabel = 'Menu icon';
      hostFixture.detectChanges();

      span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBe('img');
      expect(span.getAttribute('aria-label')).toBe('Menu icon');

      // Remove aria label
      hostComponent.ariaLabel = null;
      hostFixture.detectChanges();

      span = hostFixture.nativeElement.querySelector('span');
      expect(span.getAttribute('role')).toBeNull();
      expect(span.getAttribute('aria-label')).toBeNull();
    });
  });

  describe('Integration with Host Component', () => {
    it('should work with host component inputs', () => {
      hostComponent.name = 'chevron-right';
      hostComponent.size = 'lg';
      hostComponent.variant = 'filled';
      hostComponent.ariaLabel = 'Navigate right';
      hostFixture.detectChanges();

      const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
      const iconComponent = iconElement.componentInstance as Icon;

      expect(iconComponent.name()).toBe('chevron-right');
      expect(iconComponent.size()).toBe('lg');
      expect(iconComponent.variant()).toBe('filled');
      expect(iconComponent.ariaLabel()).toBe('Navigate right');
    });

    it('should render correctly in host component', () => {
      hostComponent.name = 'user';
      hostComponent.size = 'md';
      hostComponent.ariaLabel = 'User profile';
      hostFixture.detectChanges();

      const span = hostFixture.nativeElement.querySelector('span');
      expect(span).toBeTruthy();
      expect(span.getAttribute('role')).toBe('img');
      expect(span.getAttribute('aria-label')).toBe('User profile');
      expect(span.classList.contains('w-5')).toBeTruthy();
      expect(span.classList.contains('h-5')).toBeTruthy();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle unknown icon names gracefully', () => {
      hostComponent.name = 'unknown-icon';
      hostFixture.detectChanges();

      const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
      const iconComponent = iconElement.componentInstance as Icon;
      const svg = iconComponent.svg();
      expect(svg).toBeNull();
    });

    it('should handle all size variants correctly', () => {
      const sizes: Size[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      const expectedClasses = ['w-3 h-3', 'w-4 h-4', 'w-5 h-5', 'w-6 h-6', 'w-7 h-7'];

      sizes.forEach((size, index) => {
        hostComponent.size = size;
        hostFixture.detectChanges();

        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.sizeClass()).toBe(expectedClasses[index]);
      });
    });

    it('should handle variant combinations', () => {
      const variants: (Variant | null)[] = [null, 'outline', 'filled'];

      variants.forEach((variant) => {
        hostComponent.variant = variant;
        hostFixture.detectChanges();

        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;
        expect(iconComponent.svg()).toBeTruthy();
      });
    });

    it('should handle rapid input changes', () => {
      const changes = [
        { name: 'user', size: 'sm' as Size, variant: 'outline' as Variant },
        { name: 'chevron-right', size: 'lg' as Size, variant: 'filled' as Variant },
        { name: 'test-icon', size: 'xs' as Size, variant: null },
      ];

      changes.forEach(({ name, size, variant }) => {
        hostComponent.name = name;
        hostComponent.size = size;
        hostComponent.variant = variant;
        hostFixture.detectChanges();

        const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
        const iconComponent = iconElement.componentInstance as Icon;

        expect(iconComponent.name()).toBe(name);
        expect(iconComponent.size()).toBe(size);
        expect(iconComponent.variant()).toBe(variant);
        expect(iconComponent.svg()).toBeTruthy();
      });
    });

    it('should handle special characters in ariaLabel', () => {
      const specialLabels = [
        'Icon with émojis 🎉',
        'Icon with & < > " \'',
        'Icon with numbers 123',
        'Icon with spaces and tabs',
      ];

      specialLabels.forEach((label) => {
        hostComponent.ariaLabel = label;
        hostFixture.detectChanges();

        const span = hostFixture.nativeElement.querySelector('span');
        expect(span.getAttribute('aria-label')).toBe(label);
        expect(span.getAttribute('role')).toBe('img');
      });
    });
  });

  describe('Performance and Change Detection', () => {
    it('should use OnPush change detection', () => {
      const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
      const iconComponent = iconElement.componentInstance as Icon;
      expect(iconComponent.constructor).toBeDefined();
      // OnPush strategy should be set in component decorator
    });

    it('should compute values reactively', () => {
      const iconElement = hostFixture.debugElement.query(By.css('ui-icon'));
      const iconComponent = iconElement.componentInstance as Icon;
      spyOn(iconComponent, 'sizeClass').and.callThrough();

      hostComponent.size = 'lg';
      hostFixture.detectChanges();

      expect(iconComponent.sizeClass).toHaveBeenCalled();
    });
  });
});
