import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecurringTransaction } from '../../../../shared/models/budget.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
    selector: 'app-recurring-manager-modal',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    template: `
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in transition-colors duration-300">
        <div class="flex justify-between items-center mb-6">
             <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ 'recurring.title' | translate }}</h3>
             <button (click)="close.emit()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                 <span class="text-xl dark:text-white">✕</span>
             </button>
        </div>

        @if (recurringItems.length === 0) {
            <div class="text-center py-12 text-gray-400 dark:text-gray-500">
                <p>{{ 'recurring.empty' | translate }}</p>
                <p class="text-xs mt-2">{{ 'recurring.empty_hint' | translate }}</p>
            </div>
        } @else {
            <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                @for (item of recurringItems; track item.id) {
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <div class="font-bold text-gray-900 dark:text-white">{{ item.label }}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                <span class="capitalize">{{ (item.frequency === 'weekly' ? 'common.weekly' : item.frequency === 'monthly' ? 'common.monthly' : 'common.yearly') | translate }}</span>
                                <span>•</span>
                                <span>{{ 'common.next' | translate }} {{ item.nextDueDate | date:'dd MMM' }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="font-bold text-gray-900 dark:text-white">
                                {{ item.amount | currency:'CAD':'symbol-narrow':'1.0-0' }}
                            </div>
                            <button 
                                (click)="delete.emit(item.id)" 
                                class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                title="Arrêter la récurrence"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                }
            </div>
        }
      </div>
    </div>
  `
})
export class RecurringManagerModalComponent {
    @Input() recurringItems: RecurringTransaction[] = [];
    @Output() close = new EventEmitter<void>();
    @Output() delete = new EventEmitter<string>();
}
