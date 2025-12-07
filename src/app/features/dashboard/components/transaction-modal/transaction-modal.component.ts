import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalculatorComponent } from '../../../../shared/components/calculator/calculator.component';

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, CalculatorComponent],
  template: `
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in transition-colors duration-300">
        <h3 class="text-xl font-bold mb-6 text-gray-900 dark:text-white">Nouvelle Transaction</h3>
        
        <div class="space-y-4">
            <!-- Type Switcher -->
            <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button 
                  (click)="type = 'outcome'"
                  [class.bg-white]="type === 'outcome'"
                  [class.dark:bg-gray-700]="type === 'outcome'"
                  [class.shadow-sm]="type === 'outcome'"
                  [class.text-black]="type === 'outcome'"
                  [class.dark:text-white]="type === 'outcome'"
                  class="flex-1 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 transition-all text-center"
                >Dépense</button>
                <button 
                  (click)="type = 'income'"
                  [class.bg-white]="type === 'income'"
                  [class.dark:bg-gray-700]="type === 'income'"
                  [class.shadow-sm]="type === 'income'"
                  [class.text-black]="type === 'income'"
                  [class.dark:text-white]="type === 'income'"
                  class="flex-1 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 transition-all text-center"
                >Revenu</button>
            </div>

            <!-- Amount & Label -->
            <div class="grid grid-cols-2 gap-4">
                <div class="relative">
                     <label class="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 ml-1">Montant ($)</label>
                     <div class="relative">
                        <input type="number" [(ngModel)]="amount" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-4 pr-10 py-3 font-bold text-lg text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="0.00">
                        <button (click)="showCalc = true" class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white">
                            🧮
                        </button>
                     </div>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 ml-1">Date</label>
                    <input type="date" [(ngModel)]="date" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-black dark:focus:border-white transition-colors">
                </div>
            </div>

            <!-- Label -->
            <div>
                <label class="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 ml-1">Titre</label>
                <input type="text" [(ngModel)]="label" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="Ex: Épicerie, Loyer...">
            </div>

             <!-- Category -->
             <div>
                <label class="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 ml-1">Catégorie</label>
                <select [(ngModel)]="category" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors appearance-none">
                    <option value="" class="dark:bg-gray-800">Aucune</option>
                    <option *ngFor="let cat of (type === 'income' ? incomeCategories : outcomeCategories)" [value]="cat" class="dark:bg-gray-800">{{ cat }}</option>
                </select>
            </div>

            <!-- Notes -->
            <div>
                <label class="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 ml-1">Notes</label>
                <textarea [(ngModel)]="description" class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 h-20 resize-none text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors" placeholder="Détails optionnels..."></textarea>
            </div>

            <!-- Recurring Toggle -->
            <div class="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div class="flex items-center justify-between">
                    <label class="font-bold text-sm text-gray-700 dark:text-gray-300">Répéter</label>
                    <div 
                        class="w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300"
                        [class.bg-gray-200]="!isRecurring"
                        [class.dark:bg-gray-700]="!isRecurring"
                        [class.bg-black]="isRecurring"
                        [class.dark:bg-white]="isRecurring"
                        (click)="isRecurring = !isRecurring"
                    >
                        <div 
                            class="w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform duration-300"
                            [class.translate-x-5]="isRecurring"
                        ></div>
                    </div>
                </div>

                @if (isRecurring) {
                    <div class="animate-fade-in-up">
                        <label class="block text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1 ml-1">Fréquence</label>
                        <div class="flex gap-2">
                            <button 
                                (click)="frequency = 'weekly'" 
                                class="flex-1 py-2 rounded-lg text-xs font-bold border transition-colors"
                                [class.bg-black]="frequency === 'weekly'"
                                [class.dark:bg-white]="frequency === 'weekly'"
                                [class.text-white]="frequency === 'weekly'"
                                [class.dark:text-black]="frequency === 'weekly'"
                                [class.border-black]="frequency === 'weekly'"
                                [class.bg-white]="frequency !== 'weekly'"
                                [class.dark:bg-transparent]="frequency !== 'weekly'"
                                [class.text-gray-500]="frequency !== 'weekly'"
                                [class.dark:text-gray-400]="frequency !== 'weekly'"
                                [class.dark:border-gray-700]="frequency !== 'weekly'"
                            >Hebdo</button>

                            <button 
                                (click)="frequency = 'monthly'" 
                                class="flex-1 py-2 rounded-lg text-xs font-bold border transition-colors"
                                [class.bg-black]="frequency === 'monthly'"
                                [class.dark:bg-white]="frequency === 'monthly'"
                                [class.text-white]="frequency === 'monthly'"
                                [class.dark:text-black]="frequency === 'monthly'"
                                [class.border-black]="frequency === 'monthly'"
                                [class.bg-white]="frequency !== 'monthly'"
                                [class.dark:bg-transparent]="frequency !== 'monthly'"
                                [class.text-gray-500]="frequency !== 'monthly'"
                                [class.dark:text-gray-400]="frequency !== 'monthly'"
                                [class.dark:border-gray-700]="frequency !== 'monthly'"
                            >Mensuel</button>

                            <button 
                                (click)="frequency = 'yearly'" 
                                class="flex-1 py-2 rounded-lg text-xs font-bold border transition-colors"
                                [class.bg-black]="frequency === 'yearly'"
                                [class.dark:bg-white]="frequency === 'yearly'"
                                [class.text-white]="frequency === 'yearly'"
                                [class.dark:text-black]="frequency === 'yearly'"
                                [class.border-black]="frequency === 'yearly'"
                                [class.bg-white]="frequency !== 'yearly'"
                                [class.dark:bg-transparent]="frequency !== 'yearly'"
                                [class.text-gray-500]="frequency !== 'yearly'"
                                [class.dark:text-gray-400]="frequency !== 'yearly'"
                                [class.dark:border-gray-700]="frequency !== 'yearly'"
                            >Annuel</button>
                        </div>
                    </div>
                }
            </div>
        </div>

        <div class="flex gap-2 mt-8">
          <button (click)="close.emit()" class="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Annuler</button>
          <button 
            (click)="submit()" 
            [disabled]="!amount || !label"
            class="flex-1 px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Ajouter
          </button>
        </div>

        @if (showCalc) {
            <app-calculator 
                [initialValue]="amount" 
                (close)="showCalc = false" 
                (apply)="amount = $event"
            ></app-calculator>
        }
      </div>
    </div>
  `
})
export class TransactionModalComponent {
  showCalc = false;

  amount: number | null = null;
  label = '';
  type: 'income' | 'outcome' = 'outcome';
  dateStr = new Date().toISOString().split('T')[0];
  category = 'Autre';
  description: string = '';

  // Recurring
  isRecurring = false;
  frequency: 'weekly' | 'monthly' | 'yearly' = 'monthly';

  categories = ['Alimentation', 'Logement', 'Transport', 'Loisirs', 'Santé', 'Shopping', 'Services', 'Autre'];
  incomeCategories = ['Salaire', 'Investissement', 'Cadeau', 'Remboursement', 'Autre'];
  outcomeCategories = ['Alimentation', 'Logement', 'Transport', 'Loisirs', 'Santé', 'Factures', 'Shopping', 'Autre'];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    amount: number,
    label: string,
    type: 'income' | 'outcome',
    dateStr: string,
    category: string,
    description?: string,
    recurring?: { frequency: 'weekly' | 'monthly' | 'yearly' }
  }>();

  @Input() set initialType(t: 'income' | 'outcome' | null) {
    if (t) this.type = t;
  }

  get date() {
    return this.dateStr;
  }

  set date(val: string) {
    this.dateStr = val;
  }

  submit() {
    if (this.amount && this.label && this.dateStr) {
      this.save.emit({
        amount: this.amount,
        label: this.label,
        type: this.type,
        dateStr: this.dateStr,
        category: this.category,
        description: this.description || undefined,
        recurring: this.isRecurring ? { frequency: this.frequency } : undefined
      });
    }
  }
}
