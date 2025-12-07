import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-skeleton',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div 
      class="animate-pulse bg-gray-200 dark:bg-gray-800"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
      [class]="className"
    ></div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class SkeletonComponent {
    @Input() width = '100%';
    @Input() height = '1rem';
    @Input() borderRadius = '0.5rem';
    @Input() className = '';
}
