import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavingsGoal } from '../../../../shared/models/budget.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
    selector: 'app-savings-goal-card',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
  <div class="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative group overflow-hidden transition-colors duration-300">
    <!-- Delete Action -->
    <button (click)="delete.emit()" class="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>

    <div class="flex items-center gap-4 mb-4">
        <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-2xl shadow-inner">
            {{ goal.icon }}
        </div>
        <div>
            <h4 class="font-bold text-gray-900 dark:text-white leading-tight">{{ goal.name }}</h4>
            <p class="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{{ 'modal.goal.target' | translate }}: {{ goal.targetAmount | currency:'CAD':'symbol-narrow':'1.0-0' }}</p>
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div 
            class="h-full rounded-full transition-all duration-1000 ease-out relative"
            [style.width.%]="percentage"
            [class.bg-green-500]="percentage >= 100"
            [class.bg-blue-500]="percentage < 100"
        >
            <div class="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
        </div>
    </div>
    
    <div class="flex justify-between items-end">
        <div class="text-xs font-bold text-gray-500 dark:text-gray-400">{{ percentage | number:'1.0-0' }}%</div>
        
        <!-- Quick Add -->
        <div class="flex items-center gap-1">
            <span class="text-gray-400 text-xs">$</span>
            <input 
                type="number" 
                [ngModel]="goal.currentAmount" 
                (ngModelChange)="updateAmount.emit($event)"
                class="w-20 text-right font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white text-sm p-0 bg-transparent transition-colors"
            >
        </div>
    </div>
  </div>
  `
})
export class SavingsGoalCardComponent {
    @Input({ required: true }) goal!: SavingsGoal;
    @Output() updateAmount = new EventEmitter<number>();
    @Output() delete = new EventEmitter<void>();

    get percentage() {
        if (!this.goal.targetAmount) return 0;
        return Math.min(100, (this.goal.currentAmount / this.goal.targetAmount) * 100);
    }
}
