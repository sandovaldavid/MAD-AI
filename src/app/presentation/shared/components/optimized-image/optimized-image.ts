import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';

@Component({
  selector: 'app-optimized-image',
  template: `
    <img
      [ngSrc]="src"
      [alt]="alt"
      [width]="width"
      [height]="height"
      [priority]="priority"
      [loading]="priority ? undefined : loading"
      [class]="imageClass"
      [fill]="fill"
      [placeholder]="placeholder || false"
      [sizes]="sizes" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, CommonModule],
})
export class OptimizedImage {
  @Input() src!: string;
  @Input() alt!: string;
  @Input() width?: number;
  @Input() height?: number;
  @Input() priority = false;
  @Input() loading: 'lazy' | 'eager' = 'lazy';
  @Input() imageClass = '';
  @Input() fill = false;
  @Input() placeholder?: string;
  @Input() sizes?: string;
}
