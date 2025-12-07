import { Component, Input, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TrendData {
    period: string; // e.g. "Jan", "Feb"
    income: number;
    outcome: number;
}

@Component({
    selector: 'app-trend-chart',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="w-full h-64 flex flex-col items-center justify-end font-sans animate-fade-in-up">
        
      <!-- Chart Area -->
      <div class="flex items-end justify-between w-full h-full gap-2 px-2 pb-6 border-b border-gray-200 dark:border-gray-800 relative">
          
          <!-- Y-Axis Grid Lines (Optional, maybe simplified) -->
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div class="w-full h-px bg-gray-500"></div>
              <div class="w-full h-px bg-gray-500"></div>
              <div class="w-full h-px bg-gray-500"></div>
              <div class="w-full h-px bg-gray-500"></div>
              <div class="w-full h-px bg-gray-500"></div>
          </div>

          @for (item of dataSignal(); track item.period) {
              <div class="flex flex-col items-center gap-1 group relative flex-1">
                  
                  <!-- Tooltip -->
                  <div class="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 transition-opacity pointer-events-none">
                      <div class="text-green-400">+{{ item.income | currency:'CAD':'symbol-narrow':'1.0-0' }}</div>
                      <div class="text-red-400">-{{ item.outcome | currency:'CAD':'symbol-narrow':'1.0-0' }}</div>
                  </div>

                  <!-- Bars Container -->
                  <div class="flex items-end gap-1 h-48 w-full justify-center">
                      <!-- Income Bar -->
                      @if (item.income > 0) {
                          <div 
                            class="w-3 md:w-6 bg-green-500 rounded-t-sm transition-all duration-500 hover:bg-green-400"
                            [style.height.%]="(item.income / maxVal()) * 100"
                          ></div>
                      }
                      
                      <!-- Outcome Bar -->
                      @if (item.outcome > 0) {
                          <div 
                            class="w-3 md:w-6 bg-red-500 rounded-t-sm transition-all duration-500 hover:bg-red-400"
                            [style.height.%]="(item.outcome / maxVal()) * 100"
                          ></div>
                      }
                  </div>

                  <!-- Label -->
                  <span class="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">{{ item.period }}</span>
              </div>
          }
      </div>

    </div>
  `
})
export class TrendChartComponent implements OnChanges {
    @Input({ required: true }) data: TrendData[] = [];

    dataSignal = signal<TrendData[]>([]);
    maxVal = signal(100);

    ngOnChanges(changes: SimpleChanges) {
        if (changes['data']) {
            this.processData();
        }
    }

    private processData() {
        this.dataSignal.set(this.data);
        const max = Math.max(...this.data.map(d => Math.max(d.income, d.outcome)), 100); // Min 100 scale
        this.maxVal.set(max);
    }
}
