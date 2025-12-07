import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-create-budget-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl transition-colors duration-300">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">{{ 'modal.create_budget.title' | translate }}</h3>
        <div class="space-y-4">
          <input type="text" [(ngModel)]="name" class="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" [placeholder]="'modal.create_budget.name' | translate">
          
          <!-- Type Selector -->
          <div class="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
               <button 
                (click)="type = 'wallet'" 
                [class.bg-white]="type === 'wallet'" 
                [class.dark:bg-gray-700]="type === 'wallet'" 
                [class.text-black]="type === 'wallet'"
                [class.dark:text-white]="type === 'wallet'"
                [class.shadow-sm]="type === 'wallet'" 
                class="py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 transition-all"
               >{{ 'modal.create_budget.wallet' | translate }}</button>
               <button 
                (click)="type = 'monthly'" 
                [class.bg-white]="type === 'monthly'" 
                [class.dark:bg-gray-700]="type === 'monthly'" 
                [class.text-black]="type === 'monthly'"
                [class.dark:text-white]="type === 'monthly'"
                [class.shadow-sm]="type === 'monthly'" 
                class="py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 transition-all"
               >{{ 'modal.create_budget.monthly' | translate }}</button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 px-1">
              {{ (type === 'wallet' ? 'modal.create_budget.wallet_desc' : 'modal.create_budget.monthly_desc') | translate }}
          </p>

          <div class="flex gap-2 justify-between">
              <button *ngFor="let c of colors" 
              (click)="color = c"
              class="w-8 h-8 rounded-full"
              [style.background-color]="c">
                <span *ngIf="color === c" class="block w-2 h-2 bg-white rounded-full mx-auto mt-3 shadow-sm"></span>
              </button>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button (click)="close.emit()" class="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-colors">{{ 'modal.create_budget.cancel' | translate }}</button>
          <button (click)="submit()" [disabled]="!name" class="flex-1 px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{{ 'modal.create_budget.create' | translate }}</button>
        </div>
      </div>
    </div>
  `
})
export class CreateBudgetModalComponent {
  name = '';
  type: 'wallet' | 'monthly' = 'wallet';
  color = '#3B82F6';
  icon = '💰';

  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<{ name: string, color: string, icon: string, type: 'wallet' | 'monthly' }>();

  submit() {
    if (this.name) {
      this.create.emit({ name: this.name, color: this.color, icon: this.icon, type: this.type });
    }
  }
}
