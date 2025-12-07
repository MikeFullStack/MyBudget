import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Transaction } from '../../shared/models/budget.models';
import { AuthService } from '../../services/auth.service';
import { BudgetService } from '../../services/budget.service';
import { ToastService } from '../../shared/services/toast.service';

// Child Components
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { CalculatorComponent } from '../../shared/components/calculator/calculator.component';
import { TransactionModalComponent } from './components/transaction-modal/transaction-modal.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { CreateBudgetModalComponent } from './components/create-budget-modal/create-budget-modal.component';
import { MonthlyBudgetViewComponent } from './components/monthly-budget-view/monthly-budget-view.component';
import { AddGoalModalComponent } from './components/add-goal-modal/add-goal-modal.component';
import { SavingsGoalCardComponent } from './components/savings-goal-card/savings-goal-card.component';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { RecurringManagerModalComponent } from './components/recurring-manager-modal/recurring-manager-modal.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SidebarComponent,
    StatCardComponent,
    TransactionModalComponent,
    TransactionListComponent,
    CreateBudgetModalComponent,
    CalculatorComponent,
    MonthlyBudgetViewComponent,
    AddGoalModalComponent,
    SavingsGoalCardComponent,
    PieChartComponent,
    RecurringManagerModalComponent,
    TranslatePipe
  ],
  template: `
    <div class="h-screen flex flex-col md:flex-row overflow-hidden bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-gray-100 font-sans transition-colors duration-300">
      
      <app-sidebar 
        [budgets]="budgets()" 
        [selectedBudgetId]="selectedBudgetId()" 
        [isLoading]="isLoading()"
        (selectBudget)="selectBudget($event)"
        (logout)="handleLogout()"
        (createBudget)="showNewBudgetForm.set(true)"
        (calculator)="showGlobalCalculator.set(true)"
        (deleteBudget)="handleDeleteBudget($event)"
      ></app-sidebar>

      <main class="flex-1 relative overflow-y-auto h-screen bg-[#F5F5F7]">
        <!-- Empty State -->
        @if (!currentBudget() && !isLoading() && budgets().length === 0) {
           <div class="h-full flex flex-col items-center justify-center text-gray-400 p-8 animate-fade-in-up">
             <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-3xl">👋</div>
             <h2 class="text-xl font-bold text-gray-600 mb-2">{{ 'dashboard.welcome' | translate }}</h2>
             <p class="text-center max-w-md mb-6">{{ 'dashboard.create_first' | translate }}</p>
             <div class="flex gap-3">
               <button (click)="showNewBudgetForm.set(true)" class="px-6 py-3 bg-black text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all font-medium">{{ 'dashboard.create_budget' | translate }}</button>
               <button (click)="handleSeedData()" class="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-medium">{{ 'dashboard.demo_mode' | translate }}</button>
             </div>
           </div>
        }

        @if (currentBudget(); as budget) {
          
          <!-- Monthly Planner View -->
          @if (budget.type === 'monthly') {
               <app-monthly-budget-view [budget]="budget"></app-monthly-budget-view>
          } 
          
          <!-- Standard Wallet View -->
          @else {
            <div class="max-w-5xl mx-auto p-4 md:p-10 space-y-8 pb-32">
                
                <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 animate-fade-in-up">
                <div>
                    <h2 class="text-3xl font-bold text-gray-900 tracking-tight">{{ budget.name }}</h2>
                    <p class="text-gray-500 mt-1">Aperçu financier actuel</p>
                </div>
                <div class="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-end min-w-[200px]">
                    <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Solde Disponible</span>
                    <span class="text-3xl font-bold tracking-tight" [class.text-red-500]="balance() < 0" [class.text-gray-900]="balance() >= 0">
                    {{ balance() | currency:'CAD':'symbol-narrow':'1.2-2' }}
                    </span>
                </div>
                </header>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <app-stat-card type="income" [amount]="totalIncome()"></app-stat-card>
                <app-stat-card type="outcome" [amount]="totalOutcome()"></app-stat-card>
                </div>

                <!-- Goals Section -->
                 <div>
                    <div class="flex items-center justify-between mb-4 px-1">
                        <h3 class="text-lg font-bold text-gray-900">Objectifs Épargne</h3>
                        <button (click)="showAddGoalModal.set(true)" class="text-xs font-semibold text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
                            + Nouveau
                        </button>
                    </div>
                    
                    @if (budget.goals && budget.goals.length > 0) {
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            @for (goal of budget.goals; track goal.id) {
                                <app-savings-goal-card 
                                    [goal]="goal" 
                                    (updateAmount)="handleUpdateGoal(goal, $event)"
                                    (delete)="handleDeleteGoal(goal.id)"
                                ></app-savings-goal-card>
                            }
                        </div>
                    } @else {
                        <div class="p-6 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                            <p class="text-gray-400 text-sm">Aucun objectif défini</p>
                            <button (click)="showAddGoalModal.set(true)" class="text-blue-500 text-xs font-semibold mt-1 hover:underline">Créer un objectif</button>
                        </div>
                    }
                 </div>

                <!-- Floating Action Button for Adding Transaction -->
                <button 
                (click)="showTransactionModal.set(true)"
                class="fixed bottom-8 right-8 md:absolute md:bottom-auto md:right-0 md:top-24 md:mr-10 z-30 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-105 transition-transform"
                >
                +
                </button>

                <!-- <app-transaction-form (add)="handleAddTransaction($event)"></app-transaction-form> -->

                <!-- View Toggle & Actions -->
                <div class="flex items-center justify-between mt-8 mb-4">
                     <h3 class="text-lg font-bold text-gray-900">Transactions</h3>
                     <div class="flex bg-gray-200 p-1 rounded-lg">
                        <button 
                            (click)="viewMode.set('list')" 
                            class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                            [class.bg-white]="viewMode() === 'list'"
                            [class.shadow-sm]="viewMode() === 'list'"
                            [class.text-gray-900]="viewMode() === 'list'"
                            [class.text-gray-500]="viewMode() !== 'list'"
                        >Liste</button>
                        <button 
                            (click)="viewMode.set('analytics')" 
                            class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                            [class.bg-white]="viewMode() === 'analytics'"
                            [class.shadow-sm]="viewMode() === 'analytics'"
                            [class.text-gray-900]="viewMode() === 'analytics'"
                            [class.text-gray-500]="viewMode() !== 'analytics'"
                        >Analyses</button>
                     </div>
                </div>

                @if (viewMode() === 'list') {
                    <app-transaction-list 
                    [transactions]="sortedTransactions()" 
                    (delete)="handleDeleteTransaction($event)"
                    ></app-transaction-list>
                } @else {
                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[400px]">
                        @if (chartData().length > 0) {
                            <h4 class="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Répartition des Dépenses</h4>
                            <app-pie-chart [data]="chartData()"></app-pie-chart>
                        } @else {
                            <div class="flex flex-col items-center justify-center h-full text-gray-400 italic">
                                <span>Aucune donnée de dépense à analyser</span>
                            </div>
                        }
                    </div>
                }
            </div>
          }
        }
      </main>

      @if (showNewBudgetForm()) {
        <app-create-budget-modal 
            (close)="showNewBudgetForm.set(false)"
            (create)="handleCreateBudget($event)"
        ></app-create-budget-modal>
      }

      @if (showTransactionModal()) {
        <app-transaction-modal
            (close)="showTransactionModal.set(false)"
            (save)="handleAddTransaction($event)"
        ></app-transaction-modal>
      }

      @if (showAddGoalModal()) {
        <app-add-goal-modal
            (close)="showAddGoalModal.set(false)"
            (save)="handleAddGoal($event)"
        ></app-add-goal-modal>
      }

      @if (showGlobalCalculator()) {
        <app-calculator
            (close)="showGlobalCalculator.set(false)"
        ></app-calculator>
      }
      @if (showRecurringManager()) {
        <app-recurring-manager-modal
            [recurringItems]="currentBudgetRecurring()"
            (close)="showRecurringManager.set(false)"
            (delete)="handleDeleteRecurring($event)"
        ></app-recurring-manager-modal>
      }

    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private budgetService = inject(BudgetService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private langService = inject(LanguageService);

  budgets = this.budgetService.budgets;
  isLoading = this.budgetService.isLoading;

  selectedBudgetId = signal<string>('');
  showNewBudgetForm = signal(false);
  showTransactionModal = signal(false);
  showGlobalCalculator = signal(false);
  showAddGoalModal = signal(false);

  // Analytics
  viewMode = signal<'list' | 'analytics'>('list');

  chartData = computed(() => {
    // Use the existing sortedTransactions signal which is derived from the budget
    const transactions = this.sortedTransactions();
    if (!transactions.length) return [];

    const grouped = transactions
      .filter((t: Transaction) => t.type === 'outcome')
      .reduce((acc: Record<string, number>, t: Transaction) => {
        const cat = t.category || 'Autre';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Apple-style palette
    const colors = [
      '#FF3B30', // Red
      '#FF9500', // Orange
      '#FFCC00', // Yellow
      '#34C759', // Green
      '#00C7BE', // Teal
      '#30B0C7', // Blue
      '#32ADE6', // Light Blue
      '#007AFF', // Blue
      '#5856D6', // Purple
      '#AF52DE', // Pink
      '#FF2D55', // Red-Pink
      '#A2845E', // Brown
    ];

    return Object.entries(grouped)
      .map(([label, value], index) => ({
        label,
        value: value as number,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  });

  constructor() {
    effect(() => {
      // Auto-select first budget if none selected
      if (!this.selectedBudgetId() && this.budgets().length > 0) {
        this.selectedBudgetId.set(this.budgets()[0].id);
      }
    });
  }

  currentBudget = computed(() => this.budgets().find(b => b.id === this.selectedBudgetId()));

  sortedTransactions = computed(() => {
    const b = this.currentBudget();
    return b ? [...b.transactions].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()) : [];
  });

  totalIncome = computed(() => this.currentBudget()?.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0);
  totalOutcome = computed(() => this.currentBudget()?.transactions.filter(t => t.type === 'outcome').reduce((acc, t) => acc + t.amount, 0) || 0);
  balance = computed(() => this.totalIncome() - this.totalOutcome());

  selectBudget(id: string) { this.selectedBudgetId.set(id); }

  async handleAddTransaction(data: {
    amount: number,
    label: string,
    type: 'income' | 'outcome',
    dateStr: string,
    category?: string,
    description?: string,
    recurring?: { frequency: 'weekly' | 'monthly' | 'yearly' }
  }) {
    if (!this.selectedBudgetId()) return;
    const currentBudget = this.budgets().find(b => b.id === this.selectedBudgetId());
    if (!currentBudget) return;

    try {
      // 1. Create the Transaction (One-time)
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        amount: data.amount,
        label: data.label,
        type: data.type,
        dateStr: data.dateStr,
        category: data.category || 'Autre',
        description: data.description || '' // Ensure no undefined
      };
      await this.budgetService.addTransaction(this.selectedBudgetId(), transaction);

      // 2. If Recurring, Setup the Rule
      if (data.recurring) {
        const nextDate = new Date(data.dateStr);
        if (data.recurring.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (data.recurring.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (data.recurring.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        const recurringRule: import('../../shared/models/budget.models').RecurringTransaction = {
          id: crypto.randomUUID(),
          label: data.label,
          amount: data.amount,
          type: data.type,
          category: data.category || 'Autre',
          frequency: data.recurring.frequency,
          nextDueDate: nextDate.toISOString().split('T')[0]
        };
        await this.budgetService.addRecurringTransaction(this.selectedBudgetId(), recurringRule);
        this.toast.show('Transaction récurrente programmée', 'info');
      }

      this.showTransactionModal.set(false);
      this.toast.show('Transaction ajoutée', 'success');
    } catch (err) {
      console.error('Failed to add transaction', err);
      this.toast.show('Erreur lors de l\'ajout', 'error');
    }
  }

  async handleDeleteTransaction(txId: string) {
    if (!this.selectedBudgetId()) return;
    try {
      await this.budgetService.deleteTransaction(this.selectedBudgetId(), txId);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  }

  async handleCreateBudget(data: { name: string, color: string, icon: string, type: 'wallet' | 'monthly' }) {
    try {
      console.log('Creating budget:', data.name, data.type);
      const id = await this.budgetService.createBudget(data.name, data.color, data.icon, data.type);

      if (id) {
        this.selectedBudgetId.set(id);
        this.showNewBudgetForm.set(false);
        this.toast.show('Budget créé avec succès', 'success');
      } else {
        this.toast.show('Impossible de créer le budget', 'error');
      }
    } catch (err) {
      console.error('Failed to create budget:', err);
      this.toast.show('Erreur lors de la création', 'error');
    }
  }

  async handleDeleteBudget(id: string) {
    try {
      await this.budgetService.deleteBudget(id);
      if (this.selectedBudgetId() === id) {
        this.selectedBudgetId.set('');
      }
      this.toast.show('Budget supprimé', 'success');
    } catch (err) {
      console.error("Failed to delete budget", err);
      this.toast.show('Erreur lors de la suppression', 'error');
    }
  }


  async handleLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  // --- Goals ---
  async handleAddGoal(data: { name: string, targetAmount: number, icon: string }) {
    if (!this.selectedBudgetId()) return;
    try {
      const goal: import('../../shared/models/budget.models').SavingsGoal = {
        id: crypto.randomUUID(),
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        icon: data.icon,
        color: 'blue'
      };
      await this.budgetService.addGoal(this.selectedBudgetId(), goal);
      this.showAddGoalModal.set(false);
      this.toast.show('Objectif ajouté', 'success');
    } catch (err) {
      console.error('Failed to add goal', err);
      this.toast.show('Erreur lors de l\'ajout', 'error');
    }
  }

  async handleUpdateGoal(goal: import('../../shared/models/budget.models').SavingsGoal, newAmount: number) {
    if (!this.selectedBudgetId()) return;
    try {
      const updated = { ...goal, currentAmount: newAmount };
      await this.budgetService.updateGoal(this.selectedBudgetId(), updated);
    } catch (err) {
      console.error('Failed to update goal', err);
      this.toast.show('Erreur de mise à jour', 'error');
    }
  }

  async handleDeleteGoal(goalId: string) {
    if (!this.selectedBudgetId() || !confirm(this.langService.translate('dashboard.delete_goal'))) return;
    try {
      await this.budgetService.deleteGoal(this.selectedBudgetId(), goalId);
      this.toast.show('Objectif supprimé', 'success');
    } catch (err) {
      console.error('Failed to delete goal', err);
      this.toast.show('Erreur lors de la suppression', 'error');
    }
  }

  // --- Recurring Manager ---
  showRecurringManager = signal(false);

  currentBudgetRecurring = computed(() => {
    const b = this.budgets().find(b => b.id === this.selectedBudgetId());
    return b?.recurring || [];
  });

  async handleDeleteRecurring(id: string) {
    if (!this.selectedBudgetId() || !confirm('Arrêter cette transaction récurrente ?')) return;
    try {
      await this.budgetService.deleteRecurringTransaction(this.selectedBudgetId(), id);
      this.toast.show('Récurrence supprimée', 'success');
    } catch (err) {
      console.error('Failed to delete recurring', err);
      this.toast.show('Erreur suppression', 'error');
    }
  }

  async handleSeedData() {
    this.isLoading.set(true);
    try {
      await this.budgetService.seedDemoData();
      this.toast.show('Données de démo générées !', 'success');
    } catch (err) {
      this.toast.show('Erreur génération démo', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
