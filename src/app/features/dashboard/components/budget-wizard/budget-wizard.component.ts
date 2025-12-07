import { Component, EventEmitter, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { MonthlyExpense, Budget } from '../../../../shared/models/budget.models';

@Component({
    selector: 'app-budget-wizard',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Progress Bar -->
        <div class="h-1 bg-gray-100 dark:bg-gray-800 w-full">
            <div class="h-full bg-black dark:bg-white transition-all duration-500 ease-out" [style.width.%]="progress()"></div>
        </div>

        <!-- Header -->
        <div class="p-8 pb-0 text-center">
             <div class="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Etape {{ step() }} / 4
             </div>
             <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in-up">{{ currentTitle() | translate }}</h2>
             <p class="text-gray-500 dark:text-gray-400 animate-fade-in-up delay-100">{{ currentSubtitle() | translate }}</p>
        </div>

        <!-- Body -->
        <div class="p-8 flex-1 overflow-y-auto">
            
            <!-- Step 1: Identity -->
            <div *ngIf="step() === 1" class="space-y-6 animate-fade-in">
                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block">Nom</label>
                    <input [(ngModel)]="name" class="w-full text-2xl font-bold border-b-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-black dark:focus:border-white focus:outline-none py-2 text-gray-900 dark:text-white placeholder-gray-300 transition-colors" [placeholder]="'modal.create_budget.name' | translate">
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-wider block">Couleur</label>
                    <div class="flex gap-3 flex-wrap">
                        <button *ngFor="let c of colors" (click)="color = c" class="w-10 h-10 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900" [style.background-color]="c" [style.ring-color]="c">
                             <span *ngIf="color === c" class="block w-3 h-3 bg-white rounded-full mx-auto mt-3.5 shadow-sm animate-scale-in"></span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Step 2: Income -->
            <div *ngIf="step() === 2" class="flex flex-col items-center justify-center space-y-6 animate-fade-in h-full">
                <div class="relative">
                    <span class="absolute left-0 top-1/2 -translate-y-1/2 text-4xl text-gray-300 font-light">$</span>
                    <input type="number" [(ngModel)]="salary" class="w-full pl-12 text-6xl font-bold bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-200 p-0" placeholder="0">
                </div>
                <p class="text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-full">Net mensuel (après impôts)</p>
            </div>

            <!-- Step 3: Fixed Expenses -->
            <div *ngIf="step() === 3" class="space-y-6 animate-fade-in">
                 <!-- List -->
                 <div class="space-y-2">
                    <div *ngFor="let item of fixedExpenses; let i = index" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl animate-fade-in-right" [style.animation-delay]="i * 50 + 'ms'">
                        <div class="w-2 h-2 rounded-full bg-red-500"></div>
                        <span class="font-medium text-gray-700 dark:text-gray-200 flex-1">{{ item.label }}</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ item.amount | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
                        <button (click)="removeFixed(i)" class="text-gray-400 hover:text-red-500">×</button>
                    </div>
                 </div>

                 <!-- Add Form -->
                 <div class="flex gap-3 items-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div class="flex-1 space-y-1">
                        <label class="text-[10px] uppercase font-bold text-gray-400">{{ 'wizard.label' | translate }}</label>
                        <input [(ngModel)]="newFixedLabel" (keyup.enter)="addFixed()" class="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                    </div>
                    <div class="w-32 space-y-1">
                        <label class="text-[10px] uppercase font-bold text-gray-400">{{ 'wizard.amount' | translate }}</label>
                        <input type="number" [(ngModel)]="newFixedAmount" (keyup.enter)="addFixed()" class="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                    </div>
                    <button (click)="addFixed()" [disabled]="!newFixedLabel || !newFixedAmount" class="bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50 p-2 rounded-lg transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                 </div>
            </div>

            <!-- Step 4: Variable Expenses -->
            <div *ngIf="step() === 4" class="space-y-6 animate-fade-in">
                 <!-- List -->
                 <div class="space-y-2">
                    <div *ngFor="let item of variableExpenses; let i = index" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl animate-fade-in-right" [style.animation-delay]="i * 50 + 'ms'">
                        <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span class="font-medium text-gray-700 dark:text-gray-200 flex-1">{{ item.label }}</span>
                        <span class="font-bold text-gray-900 dark:text-white">{{ item.amount | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
                        <button (click)="removeVariable(i)" class="text-gray-400 hover:text-orange-500">×</button>
                    </div>
                 </div>

                 <!-- Add Form -->
                 <div class="flex gap-3 items-end pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div class="flex-1 space-y-1">
                        <label class="text-[10px] uppercase font-bold text-gray-400">{{ 'wizard.label' | translate }}</label>
                        <input [(ngModel)]="newVariableLabel" (keyup.enter)="addVariable()" class="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                    </div>
                    <div class="w-32 space-y-1">
                        <label class="text-[10px] uppercase font-bold text-gray-400">{{ 'wizard.amount' | translate }}</label>
                        <input type="number" [(ngModel)]="newVariableAmount" (keyup.enter)="addVariable()" class="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-black dark:focus:ring-white">
                    </div>
                    <button (click)="addVariable()" [disabled]="!newVariableLabel || !newVariableAmount" class="bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50 p-2 rounded-lg transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                 </div>
            </div>

        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
            <button *ngIf="step() > 1" (click)="prev()" class="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                {{ 'wizard.prev' | translate }}
            </button>
            <button *ngIf="step() === 1" (click)="close.emit()" class="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                {{ 'modal.create_budget.cancel' | translate }}
            </button>


            <div class="flex-1"></div>

            <button *ngIf="step() < 4" (click)="next()" [disabled]="!canProceed()" class="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none">
                 {{ 'wizard.next' | translate }}
            </button>

            <button *ngIf="step() === 4" (click)="finish()" class="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 hover:shadow-lg hover:scale-105 transition-all">
                 {{ 'wizard.finish' | translate }}
            </button>
        </div>

      </div>
    </div>
  `
})
export class BudgetWizardComponent {
    @Output() close = new EventEmitter<void>();
    @Output() create = new EventEmitter<any>(); // Returns full config

    step = signal(1);
    progress = computed(() => (this.step() / 4) * 100);

    // Data
    name = '';
    color = '#3B82F6';
    colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

    salary: number | null = null;

    fixedExpenses: MonthlyExpense[] = [];
    newFixedLabel = '';
    newFixedAmount: number | null = null;

    variableExpenses: MonthlyExpense[] = [];
    newVariableLabel = '';
    newVariableAmount: number | null = null;

    currentTitle = computed(() => `wizard.q${this.step()}.title`);
    currentSubtitle = computed(() => `wizard.q${this.step()}.subtitle`);

    canProceed() {
        if (this.step() === 1) return !!this.name;
        if (this.step() === 2) return this.salary !== null && this.salary > 0;
        return true; // Lists can be empty
    }

    next() {
        if (this.canProceed()) this.step.update(s => s + 1);
    }

    prev() {
        if (this.step() > 1) this.step.update(s => s - 1);
    }

    addFixed() {
        if (!this.newFixedLabel || !this.newFixedAmount) return;
        this.fixedExpenses.push({ id: crypto.randomUUID(), label: this.newFixedLabel, amount: this.newFixedAmount });
        this.newFixedLabel = '';
        this.newFixedAmount = null;
    }

    removeFixed(index: number) {
        this.fixedExpenses.splice(index, 1);
    }

    addVariable() {
        if (!this.newVariableLabel || !this.newVariableAmount) return;
        this.variableExpenses.push({ id: crypto.randomUUID(), label: this.newVariableLabel, amount: this.newVariableAmount });
        this.newVariableLabel = '';
        this.newVariableAmount = null;
    }

    removeVariable(index: number) {
        this.variableExpenses.splice(index, 1);
    }

    finish() {
        const payload = {
            name: this.name,
            icon: '📅', // Monthly default
            themeColor: this.color,
            type: 'monthly',
            monthlyData: {
                salary: this.salary || 0,
                fixedExpenses: this.fixedExpenses,
                variableExpenses: this.variableExpenses
            }
        };
        this.create.emit(payload);
    }
}
