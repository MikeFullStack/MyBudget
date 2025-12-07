import { Component, Input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Budget, MonthlyExpense } from '../../../../shared/models/budget.models';
import { BudgetService } from '../../../../services/budget.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-monthly-budget-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="max-w-6xl mx-auto p-4 md:p-8 space-y-6 pb-32 font-mono text-sm">
      
      <!-- Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4 border-b border-gray-200 pb-4 animate-fade-in-up">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 uppercase tracking-widest">{{ _budget()?.name }}</h2>
            <p class="text-gray-500 text-xs mt-1 uppercase">Exercice Mensuel</p>
          </div>
          
          <div class="flex items-center gap-4">
             <div class="text-right">
                <div class="text-[10px] uppercase text-gray-400 font-bold mb-1">Revenus Totaux</div>
                <div class="flex items-center gap-1 justify-end">
                    <span class="text-gray-400">$</span>
                    <input 
                        type="number" 
                        [ngModel]="salary()" 
                        (ngModelChange)="updateSalary($event)"
                        class="text-xl font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:border-black focus:ring-0 p-0 w-32 text-right placeholder-gray-300 transition-colors" 
                        placeholder="0.00"
                    >
                </div>
             </div>
          </div>
      </header>

      <!-- Executive Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
             <div class="text-[10px] uppercase text-gray-500 font-bold mb-1">Revenu Mensuel</div>
             <div class="text-lg font-bold text-gray-900">{{ salary() | currency:'CAD':'symbol-narrow':'1.2-2' }}</div>
          </div>
          <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
             <div class="text-[10px] uppercase text-gray-500 font-bold mb-1">Total Fixe</div>
             <div class="text-lg font-bold text-red-600">-{{ totalFixed() | currency:'CAD':'symbol-narrow':'1.2-2' }}</div>
             <div class="text-[10px] text-gray-400 mt-1">{{ fixedRatio() | percent:'1.1-1' }} du revenu</div>
          </div>
          <div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">
             <div class="text-[10px] uppercase text-gray-500 font-bold mb-1">Total Variable</div>
             <div class="text-lg font-bold text-orange-600">-{{ totalVariable() | currency:'CAD':'symbol-narrow':'1.2-2' }}</div>
             <div class="text-[10px] text-gray-400 mt-1">{{ variableRatio() | percent:'1.1-1' }} du revenu</div>
          </div>
          <div class="p-4 bg-gray-900 text-white border border-gray-900 rounded-lg shadow-md">
             <div class="text-[10px] uppercase text-gray-400 font-bold mb-1">Capacité Nette</div>
             <div class="text-2xl font-bold">{{ remaining() | currency:'CAD':'symbol-narrow':'1.2-2' }}</div>
             <div class="text-[10px] text-gray-400 mt-1">{{ remainingRatio() | percent:'1.1-1' }} de marge</div>
          </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Fixed Expenses Table -->
          <section class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 class="font-bold text-gray-700 uppercase text-xs tracking-wider flex items-center gap-2">
                      <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                      Charges Fixes
                  </h3>
                  <span class="text-xs font-bold text-gray-500">{{ totalFixed() | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
              </div>
              
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                          <th class="px-4 py-2 font-medium w-1/2">Poste</th>
                          <th class="px-4 py-2 font-medium text-right">Montant</th>
                          <th class="px-4 py-2 font-medium text-right">% Rev.</th>
                          <th class="px-4 py-2 text-right w-10"></th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                      @for (item of fixedExpenses(); track item.id) {
                          <tr class="hover:bg-gray-50 group transition-colors">
                              <td class="px-4 py-2 text-gray-700 font-medium">{{ item.label }}</td>
                              <td class="px-4 py-2 text-right text-gray-900 font-bold">{{ item.amount | currency:'CAD':'':'1.2-2' }}</td>
                              <td class="px-4 py-2 text-right text-gray-400 text-xs">{{ (salary() > 0 ? item.amount / salary() : 0) | percent:'1.1-1' }}</td>
                              <td class="px-4 py-2 text-right">
                                  <button (click)="removeItem('fixed', item.id)" class="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 px-2">×</button>
                              </td>
                          </tr>
                      }
                      @if (fixedExpenses().length === 0) {
                          <tr><td colspan="4" class="px-4 py-6 text-center text-gray-300 italic text-xs">Aucune charge fixe</td></tr>
                      }
                  </tbody>
                  <tfoot class="bg-gray-50 border-t border-gray-200">
                      <tr>
                          <td class="p-2">
                              <input type="text" [(ngModel)]="newFixedLabel" (keyup.enter)="addItem('fixed')" class="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-black focus:border-black" placeholder="Nouveau poste...">
                          </td>
                          <td class="p-2">
                              <input type="number" [(ngModel)]="newFixedAmount" (keyup.enter)="addItem('fixed')" class="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-black focus:border-black" placeholder="0.00">
                          </td>
                          <td colspan="2" class="p-2 text-right">
                              <button (click)="addItem('fixed')" [disabled]="!newFixedLabel || !newFixedAmount" class="bg-black text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors uppercase tracking-wide">Ajouter</button>
                          </td>
                      </tr>
                  </tfoot>
              </table>
          </section>

          <!-- Variable Expenses Table -->
          <section class="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 class="font-bold text-gray-700 uppercase text-xs tracking-wider flex items-center gap-2">
                      <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Charges Variables (Estimées)
                  </h3>
                  <span class="text-xs font-bold text-gray-500">{{ totalVariable() | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
              </div>
              
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="text-[10px] text-gray-400 uppercase border-b border-gray-100">
                          <th class="px-4 py-2 font-medium w-1/2">Poste</th>
                          <th class="px-4 py-2 font-medium text-right">Montant</th>
                          <th class="px-4 py-2 font-medium text-right">% Rev.</th>
                          <th class="px-4 py-2 text-right w-10"></th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-50">
                      @for (item of variableExpenses(); track item.id) {
                          <tr class="hover:bg-gray-50 group transition-colors">
                              <td class="px-4 py-2 text-gray-700 font-medium">{{ item.label }}</td>
                              <td class="px-4 py-2 text-right text-gray-900 font-bold">{{ item.amount | currency:'CAD':'':'1.2-2' }}</td>
                              <td class="px-4 py-2 text-right text-gray-400 text-xs">{{ (salary() > 0 ? item.amount / salary() : 0) | percent:'1.1-1' }}</td>
                              <td class="px-4 py-2 text-right">
                                  <button (click)="removeItem('variable', item.id)" class="text-gray-300 hover:text-orange-500 transition-colors opacity-0 group-hover:opacity-100 px-2">×</button>
                              </td>
                          </tr>
                      }
                      @if (variableExpenses().length === 0) {
                          <tr><td colspan="4" class="px-4 py-6 text-center text-gray-300 italic text-xs">Aucune charge variable</td></tr>
                      }
                  </tbody>
                   <tfoot class="bg-gray-50 border-t border-gray-200">
                      <tr>
                          <td class="p-2">
                              <input type="text" [(ngModel)]="newVariableLabel" (keyup.enter)="addItem('variable')" class="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-black focus:border-black" placeholder="Nouveau poste...">
                          </td>
                          <td class="p-2">
                              <input type="number" [(ngModel)]="newVariableAmount" (keyup.enter)="addItem('variable')" class="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-right font-bold focus:ring-1 focus:ring-black focus:border-black" placeholder="0.00">
                          </td>
                          <td colspan="2" class="p-2 text-right">
                              <button (click)="addItem('variable')" [disabled]="!newVariableLabel || !newVariableAmount" class="bg-black text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors uppercase tracking-wide">Ajouter</button>
                          </td>
                      </tr>
                  </tfoot>
              </table>
          </section>
      </div>

       <div class="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
          Document généré par Mon Budget • {{ _budget()?.id | slice:0:8 }}
      </div>
    </div>
  `
})
export class MonthlyBudgetViewComponent {
    // Reactive Input
    _budget = signal<Budget | null>(null);
    @Input({ required: true }) set budget(value: Budget) {
        this._budget.set(value);
    }

    private budgetService = inject(BudgetService);

    // Computed derived from _budget signal
    salary = computed(() => this._budget()?.monthlyData?.salary || 0);
    fixedExpenses = computed(() => this._budget()?.monthlyData?.fixedExpenses || []);
    variableExpenses = computed(() => this._budget()?.monthlyData?.variableExpenses || []);

    totalFixed = computed(() => this.fixedExpenses().reduce((acc, item) => acc + item.amount, 0));
    totalVariable = computed(() => this.variableExpenses().reduce((acc, item) => acc + item.amount, 0));
    remaining = computed(() => this.salary() - this.totalFixed() - this.totalVariable());

    // Ratios
    fixedRatio = computed(() => this.salary() > 0 ? this.totalFixed() / this.salary() : 0);
    variableRatio = computed(() => this.salary() > 0 ? this.totalVariable() / this.salary() : 0);
    remainingRatio = computed(() => this.salary() > 0 ? this.remaining() / this.salary() : 0);

    // Form inputs
    newFixedLabel = '';
    newFixedAmount: number | null = null;
    newVariableLabel = '';
    newVariableAmount: number | null = null;

    async updateSalary(newVal: number) {
        const b = this._budget();
        if (!b) return;

        const currentData = b.monthlyData || { salary: 0, fixedExpenses: [], variableExpenses: [] };
        const data = { ...currentData, salary: newVal };

        await this.saveData(b.id, data);
    }

    async addItem(type: 'fixed' | 'variable') {
        const b = this._budget();
        if (!b) return;

        const label = type === 'fixed' ? this.newFixedLabel : this.newVariableLabel;
        const amount = type === 'fixed' ? this.newFixedAmount : this.newVariableAmount;

        if (!label || !amount) return;

        const newItem: MonthlyExpense = { id: crypto.randomUUID(), label, amount };

        const currentData = b.monthlyData || { salary: 0, fixedExpenses: [], variableExpenses: [] };
        const currentList = type === 'fixed' ? currentData.fixedExpenses : currentData.variableExpenses;
        const newList = [...currentList, newItem];

        const data = {
            ...currentData,
            [type === 'fixed' ? 'fixedExpenses' : 'variableExpenses']: newList
        };

        await this.saveData(b.id, data);

        // Reset form
        if (type === 'fixed') { this.newFixedLabel = ''; this.newFixedAmount = null; }
        else { this.newVariableLabel = ''; this.newVariableAmount = null; }
    }

    async removeItem(type: 'fixed' | 'variable', id: string) {
        const b = this._budget();
        if (!b) return;

        const currentData = b.monthlyData || { salary: 0, fixedExpenses: [], variableExpenses: [] };
        const currentList = type === 'fixed' ? currentData.fixedExpenses : currentData.variableExpenses;
        const newList = currentList.filter(item => item.id !== id);

        const data = {
            ...currentData,
            [type === 'fixed' ? 'fixedExpenses' : 'variableExpenses']: newList
        };
        await this.saveData(b.id, data);
    }

    private toast = inject(ToastService);

    private async saveData(budgetId: string, data: any) {
        try {
            await this.budgetService.updateBudget(budgetId, { monthlyData: data });
            this.toast.show('Mise à jour enregistrée', 'success');
        } catch (err) {
            console.error('Failed to save monthly data', err);
            this.toast.show('Erreur de sauvegarde', 'error');
        }
    }
}
