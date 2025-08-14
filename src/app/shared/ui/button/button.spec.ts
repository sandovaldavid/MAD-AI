import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Button } from './button';

@Component({
    template: `
        <app-button
            [variant]="variant"
            [size]="size"
            [disabled]="disabled"
            [loading]="loading"
            (clicked)="onClicked()">
            Test Button
        </app-button>
    `,
})
class TestHostComponent {
    variant: any = 'primary';
    size: any = 'md';
    disabled = false;
    loading = false;
    onClicked = jasmine.createSpy('onClicked');
}

describe('Button', () => {
    let component: Button;
    let fixture: ComponentFixture<Button>;
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Button],
            declarations: [TestHostComponent],
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

    it('should apply correct variant classes', () => {
        hostComponent.variant = 'secondary';
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn-secondary');
    });

    it('should apply correct size classes', () => {
        hostComponent.size = 'lg';
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.className).toContain('btn-lg');
    });

    it('should be disabled when disabled input is true', () => {
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.disabled).toBe(true);
        expect(buttonElement.className).toContain('btn-disabled');
    });

    it('should be disabled when loading is true', () => {
        hostComponent.loading = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        expect(buttonElement.disabled).toBe(true);
        expect(buttonElement.className).toContain('btn-loading');
    });

    it('should emit clicked event when clicked and not disabled', () => {
        const buttonElement = hostFixture.nativeElement.querySelector('button');
        buttonElement.click();

        expect(hostComponent.onClicked).toHaveBeenCalled();
    });

    it('should not emit clicked event when disabled', () => {
        hostComponent.disabled = true;
        hostFixture.detectChanges();

        const buttonElement = hostFixture.nativeElement.querySelector('button');
        buttonElement.click();

        expect(hostComponent.onClicked).not.toHaveBeenCalled();
    });
});
