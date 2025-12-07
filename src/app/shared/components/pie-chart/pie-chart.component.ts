import { Component, Input, OnChanges, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChartData {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-center gap-8 py-8 animate-fade-in-up">
      <!-- Chart -->
      <div class="relative w-64 h-64">
        <svg viewBox="0 0 100 100" class="transform -rotate-90 w-full h-full drop-shadow-xl">
          @for (slice of slices(); track slice.label) {
            <path 
              [attr.d]="slice.path" 
              [attr.fill]="slice.color"
              class="hover:opacity-90 transition-opacity cursor-pointer stroke-white stroke-2"
            >
              <title>{{ slice.label }}: {{ slice.value | currency:'CAD' }} ({{ slice.percentage | number:'1.0-0' }}%)</title>
            </path>
          }
          <!-- Center Hole (Donut) -->
          <circle cx="50" cy="50" r="35" fill="white" />
        </svg>
        
        <!-- Center Text -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</span>
            <span class="text-xl font-bold text-gray-900 dark:text-white">{{ total() | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="grid grid-cols-1 gap-3 min-w-[200px]">
        @for (item of data; track item.label) {
            <div class="flex items-center justify-between group">
                <div class="flex items-center gap-3">
                    <span class="w-3 h-3 rounded-full" [style.background-color]="item.color"></span>
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{{ item.label }}</span>
                </div>
                <div class="text-right">
                    <div class="text-sm font-bold text-gray-900 dark:text-white">{{ item.value | currency:'CAD':'symbol-narrow':'1.0-0' }}</div>
                    <div class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ (item.value / total()) | percent:'1.0-0' }}</div>
                </div>
            </div>
        }
      </div>
    </div>
  `
})
export class PieChartComponent implements OnChanges {
  @Input({ required: true }) data: ChartData[] = [];

  total = signal(0);
  slices = signal<any[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.calculateSlices();
    }
  }

  private calculateSlices() {
    const total = this.data.reduce((acc, item) => acc + item.value, 0);
    this.total.set(total);

    let cumulativePercent = 0;

    const slices = this.data.map(item => {
      const startPercent = cumulativePercent;
      const percent = total === 0 ? 0 : item.value / total;
      cumulativePercent += percent;

      const startAngle = startPercent * Math.PI * 2;
      const endAngle = cumulativePercent * Math.PI * 2;

      // Calculate path (Arc)
      const x1 = 50 + 50 * Math.cos(startAngle);
      const y1 = 50 + 50 * Math.sin(startAngle);
      const x2 = 50 + 50 * Math.cos(endAngle);
      const y2 = 50 + 50 * Math.sin(endAngle);

      const largeArcFlag = percent > 0.5 ? 1 : 0;

      // M 50 50 (Center) -> L x1 y1 (Start) -> A 50 50 0 largeArcFlag 1 x2 y2 (Arc) -> Z (Close)
      const path = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return {
        ...item,
        percentage: percent * 100,
        path
      };
    });

    this.slices.set(slices);
  }
}
