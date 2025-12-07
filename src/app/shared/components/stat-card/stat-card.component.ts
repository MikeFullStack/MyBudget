import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-white/50 dark:border-gray-800 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-2">
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center"
            [ngClass]="type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'"
          >
             <span class="text-lg">{{ type === 'income' ? '↓' : '↑' }}</span>
          </div>
          <span class="font-medium text-gray-500 dark:text-gray-400">{{ label || (type === 'income' ? 'Revenus' : 'Dépenses') }}</span>
        </div>
        <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ amount | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() type: 'income' | 'outcome' = 'income';
  @Input() amount: number = 0;
  @Input() label: string = '';
}
