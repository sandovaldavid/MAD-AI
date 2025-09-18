import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, signal } from '@angular/core';
import { ThemeToggle } from './theme-toggle';
import { ThemeService } from '@/app/presentation/services/theme.service';
import { Icon } from '@presentation/shared/ui/icon/icon';
import { IconRegistry } from '@/app/presentation/services/icon-registry.service';
import { ICON_REGISTRY_OPTIONS } from '@app/di/tokens';

// Import the component directly to ensure it's instrumented for coverage
import './theme-toggle';

@Component({
  standalone: true,
  imports: [ThemeToggle, Icon],
  template: ` <ui-theme-toggle></ui-theme-toggle> `,
})
class TestHostComponent {}

describe('ThemeToggle', () => {
  let component: ThemeToggle;
  let fixture: ComponentFixture<ThemeToggle>;
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let isDarkModeSignal: any;

  beforeEach(async () => {
    // Create signal for testing
    isDarkModeSignal = signal(false);

    // Create mock ThemeService
    mockThemeService = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkMode: isDarkModeSignal,
    });

    // Configure toggleTheme to actually toggle the signal
    mockThemeService.toggleTheme.and.callFake(() => {
      isDarkModeSignal.set(!isDarkModeSignal());
    });

    // Create mock IconRegistry
    const mockIconRegistry = jasmine.createSpyObj('IconRegistry', ['getWithVariant', 'list']);
    mockIconRegistry.getWithVariant.and.callFake((name: string, variant: string) => {
      return `<svg data-testid="icon-${name}-${variant}" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>`;
    });
    mockIconRegistry.list.and.returnValue(['sun', 'moon']);

    await TestBed.configureTestingModule({
      imports: [ThemeToggle, TestHostComponent],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
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

    fixture = TestBed.createComponent(ThemeToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should inject ThemeService correctly', () => {
      expect(component['themeService']).toBe(mockThemeService);
    });

    it('should expose isDarkMode from ThemeService', () => {
      expect(component['isDarkMode']).toBe(mockThemeService.isDarkMode);
    });
  });

  describe('Template Rendering', () => {
    it('should render button element', () => {
      const button = hostFixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.getAttribute('type')).toBe('button');
    });

    it('should have correct CSS class', () => {
      const button = hostFixture.nativeElement.querySelector('button');
      expect(button.classList.contains('theme-toggle')).toBe(true);
    });

    it('should render Icon component', () => {
      const icon = hostFixture.nativeElement.querySelector('ui-icon');
      expect(icon).toBeTruthy();
    });
  });

  describe('Icon Display', () => {
    it('should show moon icon when in light mode', () => {
      // Arrange
      isDarkModeSignal.set(false);
      hostFixture.detectChanges();

      // Act
      const iconComponent = hostFixture.debugElement.query(By.directive(Icon)).componentInstance;

      // Assert
      expect(iconComponent.name()).toBe('outline/moon');
    });

    it('should show sun icon when in dark mode', () => {
      // Arrange
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();

      // Act
      const iconComponent = hostFixture.debugElement.query(By.directive(Icon)).componentInstance;

      // Assert
      expect(iconComponent.name()).toBe('outline/sun');
    });

    it('should have correct icon size', () => {
      const icon = hostFixture.nativeElement.querySelector('ui-icon');
      expect(icon.getAttribute('size')).toBe('md');
    });

    it('should have correct icon CSS class', () => {
      const icon = hostFixture.nativeElement.querySelector('ui-icon');
      expect(icon.getAttribute('class')).toContain('theme-toggle__icon');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label when in light mode', () => {
      // Arrange
      isDarkModeSignal.set(false);
      hostFixture.detectChanges();

      // Act
      const button = hostFixture.nativeElement.querySelector('button');

      // Assert
      expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    });

    it('should have correct aria-label when in dark mode', () => {
      // Arrange
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();

      // Act
      const button = hostFixture.nativeElement.querySelector('button');

      // Assert
      expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
    });

    it('should have correct aria-pressed when in light mode', () => {
      // Arrange
      isDarkModeSignal.set(false);
      hostFixture.detectChanges();

      // Act
      const button = hostFixture.nativeElement.querySelector('button');

      // Assert
      expect(button.getAttribute('aria-pressed')).toBe('false');
    });

    it('should have correct aria-pressed when in dark mode', () => {
      // Arrange
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();

      // Act
      const button = hostFixture.nativeElement.querySelector('button');

      // Assert
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('User Interactions', () => {
    it('should call themeService.toggleTheme when button is clicked', () => {
      // Arrange
      const button = hostFixture.nativeElement.querySelector('button');

      // Act
      button.click();

      // Assert
      expect(mockThemeService.toggleTheme).toHaveBeenCalled();
    });

    it('should call onToggle method when button is clicked', () => {
      // Arrange
      const themeToggleComponent = hostFixture.debugElement.query(
        By.directive(ThemeToggle)
      ).componentInstance;
      spyOn(themeToggleComponent, 'onToggle');
      const button = hostFixture.nativeElement.querySelector('button');

      // Act
      button.click();

      // Assert
      expect(themeToggleComponent.onToggle).toHaveBeenCalled();
    });
  });

  describe('Method Behavior', () => {
    it('should call themeService.toggleTheme when onToggle is called', () => {
      // Act
      component.onToggle();

      // Assert
      expect(mockThemeService.toggleTheme).toHaveBeenCalled();
    });
  });

  describe('Reactive State Updates', () => {
    it('should update aria-label when theme changes from light to dark', () => {
      // Arrange
      const button = hostFixture.nativeElement.querySelector('button');
      isDarkModeSignal.set(false);
      hostFixture.detectChanges();

      // Initial state
      expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');

      // Act - Change to dark mode
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();

      // Assert
      expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
    });

    it('should update aria-pressed when theme changes from light to dark', () => {
      // Arrange
      const button = hostFixture.nativeElement.querySelector('button');
      isDarkModeSignal.set(false);
      hostFixture.detectChanges();

      // Initial state
      expect(button.getAttribute('aria-pressed')).toBe('false');

      // Act - Change to dark mode
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();

      // Assert
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    it('should update icon when theme changes from light to dark', () => {
      // Arrange
      const iconComponent = hostFixture.debugElement.query(By.directive(Icon)).componentInstance;
      isDarkModeSignal.set(false);
      hostFixture.detectChanges();

      // Initial state
      expect(iconComponent.name()).toBe('outline/moon');

      // Act - Change to dark mode
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();

      // Assert
      expect(iconComponent.name()).toBe('outline/sun');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid theme changes', () => {
      // Arrange
      const button = hostFixture.nativeElement.querySelector('button');

      // Act - Multiple rapid clicks
      button.click();
      button.click();
      button.click();

      // Assert
      expect(mockThemeService.toggleTheme).toHaveBeenCalledTimes(3);
    });

    it('should maintain button functionality after multiple interactions', () => {
      // Arrange
      const button = hostFixture.nativeElement.querySelector('button');

      // Act - Multiple interactions
      button.click();
      hostFixture.detectChanges();
      isDarkModeSignal.set(true);
      hostFixture.detectChanges();
      button.click();
      hostFixture.detectChanges();

      // Assert
      expect(mockThemeService.toggleTheme).toHaveBeenCalledTimes(2);
      expect(button.getAttribute('aria-pressed')).toBe('false');
    });
  });
});
