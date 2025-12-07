import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="p-6 rounded-2xl border shadow-sm transition-all duration-300 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
      <div class="flex items-start justify-between mb-4">
        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
           <span class="text-xl filter grayscale" [class.grayscale-0]="true">{{ type === 'income' ? '💰' : '💸' }}</span>
        </div>
        <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
           [class.bg-green-100]="type === 'income'"
           [class.text-green-700]="type === 'income'"
           [class.dark:bg-green-900]="type === 'income'"
           [class.dark:text-green-300]="type === 'income'"
           [class.bg-red-100]="type === 'outcome'"
           [class.text-red-700]="type === 'outcome'"
           [class.dark:bg-red-900]="type === 'outcome'"
           [class.dark:text-red-300]="type === 'outcome'"
        >
          {{ (type === 'income' ? 'dashboard.income' : 'dashboard.outcome') | translate }}
        </span>
      </div>
      <div>
        <h4 class="text-sm font-semibold text-gray-400 dark:text-gray-500 mb-1">
            {{ (type === 'income' ? 'dashboard.total_income' : 'dashboard.total_outcome') | translate }}
        </h4>
        <div class="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            {{ amount | currency:'CAD':'symbol-narrow':'1.2-2' }}
        </div>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() type: 'income' | 'outcome' = 'income';
  @Input() amount = 0;
}
