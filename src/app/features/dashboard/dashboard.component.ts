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
import { TrendChartComponent } from '../../shared/components/trend-chart/trend-chart.component';
import { PieChartComponent } from '../../shared/components/pie-chart/pie-chart.component';
import { RecurringManagerModalComponent } from './components/recurring-manager-modal/recurring-manager-modal.component';
import { BudgetWizardComponent } from './components/budget-wizard/budget-wizard.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { AiAdvisorModalComponent } from './components/ai-advisor-modal/ai-advisor-modal.component';
import { ShareModalComponent } from './components/share-modal/share-modal.component';

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
    TrendChartComponent,
    RecurringManagerModalComponent,
    BudgetWizardComponent,
    TranslatePipe,
    SkeletonComponent,
    AiAdvisorModalComponent,
    ShareModalComponent
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
        (exportData)="handleExportData()"
      ></app-sidebar>

      <main class="flex-1 relative overflow-y-auto h-screen bg-[#F5F5F7] dark:bg-[#000000]">
        
        <!-- Loading State (Skeleton) -->
        @if (isLoading()) {
            <div class="max-w-5xl mx-auto p-4 md:p-10 space-y-8 animate-pulse">
                <!-- Header Skeleton -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div class="space-y-3">
                        <app-skeleton width="250px" height="40px"></app-skeleton>
                        <app-skeleton width="180px" height="20px"></app-skeleton>
                    </div>
                    <app-skeleton width="240px" height="90px" borderRadius="1rem" className="hidden md:block"></app-skeleton>
                </div>

                <!-- Stats Skeleton -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <app-skeleton height="140px" borderRadius="1.5rem"></app-skeleton>
                    <app-skeleton height="140px" borderRadius="1.5rem"></app-skeleton>
                </div>

                <!-- List Skeleton -->
                <div class="space-y-4 mt-8">
                    <app-skeleton width="150px" height="24px"></app-skeleton>
                    <div class="space-y-3">
                         <app-skeleton height="70px" borderRadius="1rem"></app-skeleton>
                         <app-skeleton height="70px" borderRadius="1rem"></app-skeleton>
                         <app-skeleton height="70px" borderRadius="1rem"></app-skeleton>
                    </div>
                </div>
            </div>
        }

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
                        <div class="flex items-center gap-3">
                            <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{ budget.name }}</h2>
                            <button (click)="showAiAdvisor.set(true)" class="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full text-white shadow-md hover:scale-110 transition-transform" [title]="'dashboard.ai_advisor' | translate">
                                ✨
                            </button>
                            <button (click)="showShareModal.set(true)" class="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-white shadow-md hover:scale-110 transition-transform" [title]="'dashboard.share' | translate">
                                📤
                            </button>
                        </div>
                        <p class="text-gray-500 dark:text-gray-400 mt-1">{{ 'dashboard.financial_overview' | translate }}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-end min-w-[200px]">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ 'dashboard.available_balance' | translate }}</span>
                        <span class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" [class.text-red-500]="balance() < 0" [class.text-gray-900]="balance() >= 0" [class.dark:text-white]="balance() >= 0">
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
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ 'dashboard.goals_title' | translate }}</h3>
                        <button (click)="showAddGoalModal.set(true)" class="text-xs font-semibold text-black dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                            {{ 'dashboard.new_goal' | translate }}
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
                        <div class="p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-center">
                            <p class="text-gray-400 text-sm">{{ 'dashboard.no_goals' | translate }}</p>
                            <button (click)="showAddGoalModal.set(true)" class="text-blue-500 text-xs font-semibold mt-1 hover:underline">{{ 'dashboard.create_goal_link' | translate }}</button>
                        </div>
                    }
                 </div>

                <!-- Floating Action Button for Adding Transaction -->
                <button 
                (click)="showTransactionModal.set(true)"
                class="fixed bottom-8 right-8 md:absolute md:bottom-auto md:right-0 md:top-24 md:mr-10 z-30 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-105 transition-transform"
                >
                +
                </button>

                <!-- View Toggle & Actions -->
                <div class="flex items-center justify-between mt-8 mb-4">
                     <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ 'dashboard.transactions_title' | translate }}</h3>
                     <div class="hidden md:flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                            (click)="viewMode.set('list')" 
                            class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                            [class.bg-white]="viewMode() === 'list'"
                            [class.dark:bg-gray-700]="viewMode() === 'list'"
                            [class.shadow-sm]="viewMode() === 'list'"
                            [class.text-gray-900]="viewMode() === 'list'"
                            [class.dark:text-white]="viewMode() === 'list'"
                            [class.text-gray-500]="viewMode() !== 'list'"
                        >{{ 'dashboard.view_list' | translate }}</button>
                        <button 
                            (click)="viewMode.set('analytics')" 
                            class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                            [class.bg-white]="viewMode() === 'analytics'"
                            [class.dark:bg-gray-700]="viewMode() === 'analytics'"
                            [class.shadow-sm]="viewMode() === 'analytics'"
                            [class.text-gray-900]="viewMode() === 'analytics'"
                            [class.dark:text-white]="viewMode() === 'analytics'"
                            [class.text-gray-500]="viewMode() !== 'analytics'"
                        >{{ 'dashboard.view_analytics' | translate }}</button> 
                     </div>
                     
                     <!-- Mobile Toggle (Simplified) -->
                     <button (click)="toggleViewMode()" class="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        {{ viewMode() === 'list' ? '📊' : '📄' }}
                     </button>
                </div>

                @if (viewMode() === 'list') {
                    <app-transaction-list 
                    [transactions]="sortedTransactions()" 
                    (delete)="handleDeleteTransaction($event)"
                    ></app-transaction-list>
                } @else {
                    <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 min-h-[400px]">
                        
                        <!-- Analysis Type Toggle -->
                        <div class="flex justify-center mb-6">
                            <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button (click)="analyticsMode.set('distribution')" [class.bg-white]="analyticsMode() === 'distribution'" [class.shadow-sm]="analyticsMode() === 'distribution'" class="px-4 py-1.5 rounded-md text-xs font-bold transition-all text-gray-500" [class.text-black]="analyticsMode() === 'distribution'">{{ 'analytics.distribution_label' | translate }}</button>
                                <button (click)="analyticsMode.set('trend')" [class.bg-white]="analyticsMode() === 'trend'" [class.shadow-sm]="analyticsMode() === 'trend'" class="px-4 py-1.5 rounded-md text-xs font-bold transition-all text-gray-500" [class.text-black]="analyticsMode() === 'trend'">{{ 'analytics.trend_label' | translate }}</button>
                            </div>
                        </div>

                        @if (analyticsMode() === 'distribution') {
                            @if (chartData().length > 0) {
                                <h4 class="text-center text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">{{ 'analytics.distribution' | translate }}</h4>
                                <app-pie-chart [data]="chartData()"></app-pie-chart>
                            } @else {
                                <div class="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 italic">
                                    <span>{{ 'analytics.no_data' | translate }}</span>
                                </div>
                            }
                        } @else {
                             <!-- Trend View -->
                             <app-trend-chart [data]="trendData()"></app-trend-chart>
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
            (startWizard)="showNewBudgetForm.set(false); showWizard.set(true)" 
            (create)="handleCreateBudget($event)"
        ></app-create-budget-modal>
      }

      <!-- Wizard -->
      @if (showWizard()) {
        <app-budget-wizard
            (close)="showWizard.set(false)"
            (create)="handleCreateBudget($event)"
        ></app-budget-wizard>
      }

      <!-- Transaction Modal -->
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

      @if (showAiAdvisor()) {
        <app-ai-advisor-modal
            [budgetContext]="aiContext()"
            (close)="showAiAdvisor.set(false)"
        ></app-ai-advisor-modal>
      }

      @if (showShareModal()) {
        <app-share-modal
            [budgetId]="selectedBudgetId()"
            [participants]="currentBudget()?.participants || []"
            (close)="showShareModal.set(false)"
        ></app-share-modal>
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
  showWizard = signal(false);
  showTransactionModal = signal(false);
  showGlobalCalculator = signal(false);
  showAddGoalModal = signal(false);
  showRecurringManager = signal(false);

  // AI Advisor
  showAiAdvisor = signal(false);
  showShareModal = signal(false);

  aiContext = computed(() => {
    return {
      income: this.totalIncome(),
      outcome: this.totalOutcome(),
      transactions: this.sortedTransactions().slice(0, 50), // Limit payload
      goals: this.currentBudget()?.goals || []
    };
  });

  // State
  viewMode = signal<'list' | 'analytics'>('list');
  analyticsMode = signal<'distribution' | 'trend'>('distribution');

  toggleViewMode() {
    this.viewMode.set(this.viewMode() === 'list' ? 'analytics' : 'list');
  }

  trendData = computed(() => {
    const transactions = this.sortedTransactions(); // All transactions
    const months: Record<string, { income: number, outcome: number }> = {};

    // Generate last 6 months keys
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7); // YYYY-MM
      months[key] = { income: 0, outcome: 0 };
    }

    // Fill data
    transactions.forEach(t => {
      const key = t.dateStr.slice(0, 7);
      if (months[key]) {
        if (t.type === 'income') months[key].income += t.amount;
        if (t.type === 'outcome') months[key].outcome += t.amount;
      }
    });

    // Convert to array
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    return Object.entries(months).map(([key, val]) => {
      const [y, m] = key.split('-');
      const period = `${monthNames[parseInt(m) - 1]}`;
      return {
        period,
        income: val.income,
        outcome: val.outcome
      };
    });
  });

  chartData = computed(() => {
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

    effect(() => {
      const id = this.selectedBudgetId();
      if (id) {
        this.budgetService.loadBudgetTransactions(id);
      }
    });
  }

  currentBudget = computed(() => this.budgets().find(b => b.id === this.selectedBudgetId()));

  sortedTransactions = computed(() => {
    return [...this.budgetService.activeTransactions()].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
  });

  totalIncome = computed(() => this.budgetService.activeTransactions().filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 0);
  totalOutcome = computed(() => this.budgetService.activeTransactions().filter(t => t.type === 'outcome').reduce((acc, t) => acc + t.amount, 0) || 0);
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
    const budget = this.budgets().find(b => b.id === this.selectedBudgetId());
    // Use activeTransactions instead of budget.transactions
    const transaction = this.budgetService.activeTransactions().find(t => t.id === txId);

    if (!transaction) return;

    try {
      await this.budgetService.deleteTransaction(this.selectedBudgetId(), txId);

      this.toast.show('Transaction supprimée', 'success', {
        label: 'ANNULER',
        onClick: async () => {
          try {
            await this.budgetService.addTransaction(this.selectedBudgetId(), transaction);
            this.toast.show('Transaction restaurée', 'info');
          } catch (err) {
            console.error('Failed to restore transaction', err);
            this.toast.show('Impossible de restaurer', 'error');
          }
        }
      });
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      this.toast.show('Erreur lors de la suppression', 'error');
    }
  }

  async handleCreateBudget(data: any) {
    // 🛡️ Limit Check (Abuse Prevention)
    if (this.budgets().length >= 10) {
      this.toast.show('Limite de 10 budgets atteinte. Supprimez-en un.', 'error');
      return;
    }

    try {
      console.log('Creating budget:', data);
      const color = data.color || data.themeColor || '#000000';
      const extraData = data.monthlyData ? { monthlyData: data.monthlyData } : {};

      const id = await this.budgetService.createBudget(data.name, color, data.icon, data.type, extraData);

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

  handleExportData() {
    try {
      const dataStr = JSON.stringify(this.budgets(), null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Format: mon-budget-backup-YYYY-MM-DD.json
      const date = new Date().toISOString().split('T')[0];
      a.download = `mon-budget-backup-${date}.json`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      this.toast.show('Export réussi !', 'success');
    } catch (err) {
      console.error('Export failed', err);
      this.toast.show('Erreur lors de l\'export', 'error');
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

      // 🎉 Celebration if goal reached
      if (newAmount >= goal.targetAmount) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FFA500', '#FF4500'] // Gold theme
          });
          this.toast.show(`Félicitations ! Objectif "${goal.name}" atteint ! 🏆`, 'success');
        }).catch(err => {
          console.warn('Confetti failed to load', err);
          this.toast.show(`Félicitations ! Objectif "${goal.name}" atteint ! 🏆`, 'success');
        });
      }
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
