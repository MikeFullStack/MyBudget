import { Component, computed, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Transaction } from '../../shared/models/budget.models';
import { AuthService } from '../../services/auth.service';
import { BudgetService } from '../../services/budget.service';
import { ToastService } from '../../shared/services/toast.service';

// Child Components
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CalculatorComponent } from '../../shared/components/calculator/calculator.component';
import { TransactionModalComponent } from './components/transaction-modal/transaction-modal.component';
import { WalletViewComponent } from './components/wallet-view/wallet-view.component';
import { CreateBudgetModalComponent } from './components/create-budget-modal/create-budget-modal.component';
import { MonthlyBudgetViewComponent } from './components/monthly-budget-view/monthly-budget-view.component';
import { AddGoalModalComponent } from './components/add-goal-modal/add-goal-modal.component';
import { RecurringManagerModalComponent } from './components/recurring-manager-modal/recurring-manager-modal.component';
import { BudgetWizardComponent } from './components/budget-wizard/budget-wizard.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { AiAdvisorModalComponent } from './components/ai-advisor-modal/ai-advisor-modal.component';
import { ShareModalComponent } from './components/share-modal/share-modal.component';
import { TextScrambleDirective } from '../../shared/directives/text-scramble.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    SidebarComponent,
    WalletViewComponent,
    TransactionModalComponent,
    CreateBudgetModalComponent,
    CalculatorComponent,
    MonthlyBudgetViewComponent,
    AddGoalModalComponent,
    RecurringManagerModalComponent,
    BudgetWizardComponent,
    TranslatePipe,
    SkeletonComponent,
    AiAdvisorModalComponent,
    ShareModalComponent,
    TextScrambleDirective
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
             <h2 class="text-xl font-bold text-gray-600 mb-2" [appScramble]="'dashboard.welcome' | translate"></h2>
             <p class="text-center max-w-md mb-6" [appScramble]="'dashboard.create_first' | translate"></p>
             <div class="flex gap-3">
               <button (click)="showNewBudgetForm.set(true)" class="px-6 py-3 bg-black text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all font-medium" 
                       [appScramble]="'dashboard.create_budget' | translate"></button>
               <button (click)="handleSeedData()" class="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-medium"
                       [appScramble]="'dashboard.demo_mode' | translate"></button>
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
            <app-wallet-view
                [budget]="budget"
                [transactions]="activeTransactions()"
                [balance]="balance()"
                [totalIncome]="totalIncome()"
                [totalOutcome]="totalOutcome()"
                (openAiAdvisor)="showAiAdvisor.set(true)"
                (openShareModal)="showShareModal.set(true)"
                (openAddGoalModal)="showAddGoalModal.set(true)"
                (openTransactionModal)="showTransactionModal.set(true)"
                (updateGoal)="handleUpdateGoal($event.goal, $event.amount)"
                (deleteGoal)="handleDeleteGoal($event)"
                (deleteTransaction)="handleDeleteTransaction($event)"
            ></app-wallet-view>
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
  activeTransactions = this.budgetService.activeTransactions;

  sortedTransactions = computed(() => {
    // Used for AI Context mainly. The view does its own sorting if needed, but we pass raw list.
    // Actually WalletView sorts it. AI needs it sorted? Yes.
    return [...this.activeTransactions()].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
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
