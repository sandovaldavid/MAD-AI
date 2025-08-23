import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Toggle, ToggleSize, ToggleColor } from './toggle';

describe('Toggle', () => {
    let component: Toggle;
    let fixture: ComponentFixture<Toggle>;
    let debugElement: DebugElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Toggle],
        }).compileComponents();

        fixture = TestBed.createComponent(Toggle);
        component = fixture.componentInstance;
        debugElement = fixture.debugElement;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have default values', () => {
        expect(component.checked()).toBe(false);
        expect(component.disabled()).toBe(false);
        expect(component.size()).toBe('md');
        expect(component.color()).toBe('primary');
        expect(component.label()).toBe('');
        expect(component.labelPosition()).toBe('right');
    });

    it('should generate unique ID', () => {
        const toggle1 = TestBed.createComponent(Toggle).componentInstance;
        const toggle2 = TestBed.createComponent(Toggle).componentInstance;

        expect(toggle1.toggleId).not.toEqual(toggle2.toggleId);
        expect(toggle1.toggleId).toMatch(/^toggle-\d+$/);
    });

    describe('Toggle Classes', () => {
        it('should apply base toggle classes', () => {
            fixture.detectChanges();
            const classes = component.toggleClasses();
            expect(classes).toContain('toggle');
            expect(classes).toContain('toggle--md');
            expect(classes).toContain('toggle--primary');
        });

        it('should apply checked state class', () => {
            fixture.componentRef.setInput('checked', true);
            fixture.detectChanges();

            const classes = component.toggleClasses();
            expect(classes).toContain('toggle--checked');
        });

        it('should apply disabled state class', () => {
            fixture.componentRef.setInput('disabled', true);
            fixture.detectChanges();

            const classes = component.toggleClasses();
            expect(classes).toContain('toggle--disabled');
        });

        it('should apply size classes', () => {
            const sizes: ToggleSize[] = ['sm', 'md', 'lg'];

            sizes.forEach((size) => {
                fixture.componentRef.setInput('size', size);
                fixture.detectChanges();

                const classes = component.toggleClasses();
                expect(classes).toContain(`toggle--${size}`);
            });
        });

        it('should apply color classes', () => {
            const colors: ToggleColor[] = [
                'primary',
                'secondary',
                'tertiary',
                'successful',
                'error',
                'warning',
                'info',
            ];

            colors.forEach((color) => {
                fixture.componentRef.setInput('color', color);
                fixture.detectChanges();

                const classes = component.toggleClasses();
                expect(classes).toContain(`toggle--${color}`);
            });
        });
    });

    describe('Events', () => {
        it('should emit toggle event when clicked', () => {
            spyOn(component.toggle, 'emit');
            fixture.detectChanges();

            const toggleElement = debugElement.query(By.css('.toggle'));
            toggleElement.nativeElement.click();

            expect(component.toggle.emit).toHaveBeenCalledWith(true);
        });

        it('should not emit when disabled', () => {
            fixture.componentRef.setInput('disabled', true);
            spyOn(component.toggle, 'emit');
            fixture.detectChanges();

            const toggleElement = debugElement.query(By.css('.toggle'));
            toggleElement.nativeElement.click();

            expect(component.toggle.emit).not.toHaveBeenCalled();
        });

        it('should toggle checked state', () => {
            spyOn(component.toggle, 'emit');
            fixture.componentRef.setInput('checked', false);
            fixture.detectChanges();

            component.onToggle();
            expect(component.toggle.emit).toHaveBeenCalledWith(true);

            fixture.componentRef.setInput('checked', true);
            component.onToggle();
            expect(component.toggle.emit).toHaveBeenCalledWith(false);
        });
    });

    describe('Keyboard Navigation', () => {
        it('should toggle on Space key', () => {
            spyOn(component.toggle, 'emit');
            fixture.detectChanges();

            const event = new KeyboardEvent('keydown', { key: ' ' });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.toggle.emit).toHaveBeenCalledWith(true);
        });

        it('should toggle on Enter key', () => {
            spyOn(component.toggle, 'emit');
            fixture.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'Enter' });
            spyOn(event, 'preventDefault');

            component.onKeyDown(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.toggle.emit).toHaveBeenCalledWith(true);
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            fixture.detectChanges();
        });

        it('should have correct ARIA attributes', () => {
            const toggleElement = debugElement.query(By.css('.toggle'));
            const element = toggleElement.nativeElement;

            expect(element.getAttribute('role')).toBe('switch');
            expect(element.getAttribute('aria-checked')).toBe('false');
            expect(element.getAttribute('aria-disabled')).toBe('false');
            expect(element.getAttribute('aria-label')).toBe('Toggle switch');
            expect(element.getAttribute('tabindex')).toBe('0');
        });

        it('should update ARIA attributes when checked', () => {
            fixture.componentRef.setInput('checked', true);
            fixture.detectChanges();

            const toggleElement = debugElement.query(By.css('.toggle'));
            expect(toggleElement.nativeElement.getAttribute('aria-checked')).toBe('true');
        });

        it('should update ARIA attributes when disabled', () => {
            fixture.componentRef.setInput('disabled', true);
            fixture.detectChanges();

            const toggleElement = debugElement.query(By.css('.toggle'));
            expect(toggleElement.nativeElement.getAttribute('aria-disabled')).toBe('true');
            expect(toggleElement.nativeElement.getAttribute('tabindex')).toBe('-1');
        });

        it('should use custom label in aria-label', () => {
            fixture.componentRef.setInput('label', 'Dark mode');
            fixture.detectChanges();

            const toggleElement = debugElement.query(By.css('.toggle'));
            expect(toggleElement.nativeElement.getAttribute('aria-label')).toBe('Dark mode');
        });
    });
});
