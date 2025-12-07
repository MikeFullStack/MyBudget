import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../../../shared/models/budget.models';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="space-y-4">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white px-2">{{ 'list.history' | translate }}</h3>
      @if (transactions.length === 0) {
          <div class="text-center py-10 opacity-50 text-gray-500 dark:text-gray-400">{{ 'list.no_transactions' | translate }}</div>
      } @else {
        <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          @for (tx of transactions; track tx.id) {
            <div class="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:border-0 group">
              <div class="flex items-center gap-4">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800"
                  [class.text-green-600]="tx.type === 'income'"
                  [class.text-green-400]="tx.type === 'income'"
                  [class.text-red-600]="tx.type === 'outcome'"
                  [class.text-red-400]="tx.type === 'outcome'"
                >
                    {{ tx.type === 'income' ? '↓' : '↑' }}
                </div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ tx.label }}</p>
                  <p class="text-xs text-gray-400 font-medium">{{ tx.dateStr | date:'dd MMM yyyy' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-bold font-mono text-gray-900 dark:text-white">{{ tx.amount | currency:'CAD':'symbol-narrow':'1.2-2' }}</span>
                <button (click)="delete.emit(tx.id)" class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-colors">x</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TransactionListComponent {
  @Input() transactions: Transaction[] = [];
  @Output() delete = new EventEmitter<string>();
}
