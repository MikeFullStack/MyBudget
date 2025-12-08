import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Budget, Transaction, SavingsGoal } from '../../../../shared/models/budget.models';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { SavingsGoalCardComponent } from '../savings-goal-card/savings-goal-card.component';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';
import { TrendChartComponent } from '../../../../shared/components/trend-chart/trend-chart.component';
import { PieChartComponent } from '../../../../shared/components/pie-chart/pie-chart.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TextScrambleDirective } from '../../../../shared/directives/text-scramble.directive';

@Component({
    selector: 'app-wallet-view',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        StatCardComponent,
        SavingsGoalCardComponent,
        TransactionListComponent,
        TrendChartComponent,
        PieChartComponent,
        TranslatePipe,
        TextScrambleDirective
    ],
    template: `
    <div class="max-w-5xl mx-auto p-4 md:p-10 space-y-8 pb-32">
        
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 animate-fade-in-up">
            <div>
                <div class="flex items-center gap-3">
                    <h2 class="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{{ budget.name }}</h2>
                    <button (click)="openAiAdvisor.emit()" class="p-2 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full text-white shadow-md hover:scale-110 transition-transform" [title]="'dashboard.ai_advisor' | translate">
                        ✨
                    </button>
                    <button (click)="openShareModal.emit()" class="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-white shadow-md hover:scale-110 transition-transform" [title]="'dashboard.share' | translate">
                        📤
                    </button>
                </div>
                <p class="text-gray-500 dark:text-gray-400 mt-1" [appScramble]="'dashboard.financial_overview' | translate"></p>
            </div>
            <div class="bg-white dark:bg-gray-800 px-6 py-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-end min-w-[200px]">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide" [appScramble]="'dashboard.available_balance' | translate"></span>
                <span class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" [class.text-red-500]="balance < 0" [class.text-gray-900]="balance >= 0" [class.dark:text-white]="balance >= 0">
                {{ balance | currency:'CAD':'symbol-narrow':'1.2-2' }}
                </span>
            </div>
        </header>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-stat-card type="income" [amount]="totalIncome"></app-stat-card>
            <app-stat-card type="outcome" [amount]="totalOutcome"></app-stat-card>
        </div>

        <!-- Goals Section -->
        <div>
            <div class="flex items-center justify-between mb-4 px-1">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white" [appScramble]="'dashboard.goals_title' | translate"></h3>
                <button (click)="openAddGoalModal.emit()" class="text-xs font-semibold text-black dark:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                [appScramble]="'dashboard.new_goal' | translate">
                </button>
            </div>
            
            @if (budget.goals && budget.goals.length > 0) {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (goal of budget.goals; track goal.id) {
                        <app-savings-goal-card 
                            [goal]="goal" 
                            (updateAmount)="updateGoal.emit({goal: goal, amount: $event})"
                            (delete)="deleteGoal.emit(goal.id)"
                        ></app-savings-goal-card>
                    }
                </div>
            } @else {
                <div class="p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-center">
                    <p class="text-gray-400 text-sm" [appScramble]="'dashboard.no_goals' | translate"></p>
                    <button (click)="openAddGoalModal.emit()" class="text-blue-500 text-xs font-semibold mt-1 hover:underline" [appScramble]="'dashboard.create_goal_link' | translate"></button>
                </div>
            }
        </div>

        <!-- Floating Action Button -->
        <button 
        (click)="openTransactionModal.emit()"
        class="fixed bottom-8 right-8 md:absolute md:bottom-auto md:right-0 md:top-24 md:mr-10 z-30 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-105 transition-transform"
        >
        +
        </button>

        <!-- View Toggle & Actions -->
        <div class="flex items-center justify-between mt-8 mb-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white" [appScramble]="'dashboard.transactions_title' | translate"></h3>
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
                    [appScramble]="'dashboard.view_list' | translate"
                ></button>
                <button 
                    (click)="viewMode.set('analytics')" 
                    class="px-3 py-1 text-xs font-bold rounded-md transition-all"
                    [class.bg-white]="viewMode() === 'analytics'"
                    [class.dark:bg-gray-700]="viewMode() === 'analytics'"
                    [class.shadow-sm]="viewMode() === 'analytics'"
                    [class.text-gray-900]="viewMode() === 'analytics'"
                    [class.dark:text-white]="viewMode() === 'analytics'"
                    [class.text-gray-500]="viewMode() !== 'analytics'"
                    [appScramble]="'dashboard.view_analytics' | translate"
                ></button> 
                </div>
                
                <!-- Mobile Toggle -->
                <button (click)="toggleViewMode()" class="md:hidden p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                {{ viewMode() === 'list' ? '📊' : '📄' }}
                </button>
        </div>

        @if (viewMode() === 'list') {
            <app-transaction-list 
            [transactions]="sortedTransactions()" 
            (delete)="deleteTransaction.emit($event)"
            ></app-transaction-list>
        } @else {
            <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 min-h-[400px]">
                
                <!-- Analysis Type Toggle -->
                <div class="flex justify-center mb-6">
                    <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button (click)="analyticsMode.set('distribution')" [class.bg-white]="analyticsMode() === 'distribution'" [class.shadow-sm]="analyticsMode() === 'distribution'" class="px-4 py-1.5 rounded-md text-xs font-bold transition-all text-gray-500" [class.text-black]="analyticsMode() === 'distribution'"
                        [appScramble]="'analytics.distribution_label' | translate"></button>
                        <button (click)="analyticsMode.set('trend')" [class.bg-white]="analyticsMode() === 'trend'" [class.shadow-sm]="analyticsMode() === 'trend'" class="px-4 py-1.5 rounded-md text-xs font-bold transition-all text-gray-500" [class.text-black]="analyticsMode() === 'trend'"
                        [appScramble]="'analytics.trend_label' | translate"></button>
                    </div>
                </div>

                @if (analyticsMode() === 'distribution') {
                    @if (chartData().length > 0) {
                        <h4 class="text-center text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4" [appScramble]="'analytics.distribution' | translate"></h4>
                        <app-pie-chart [data]="chartData()"></app-pie-chart>
                    } @else {
                        <div class="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 italic">
                            <span [appScramble]="'analytics.no_data' | translate"></span>
                        </div>
                    }
                } @else {
                        <app-trend-chart [data]="trendData()"></app-trend-chart>
                }
            </div>
        }
    </div>
  `
})
export class WalletViewComponent {
    @Input({ required: true }) budget!: Budget;
    @Input({ required: true }) transactions: Transaction[] = []; // Raw list
    @Input({ required: true }) balance: number = 0;
    @Input({ required: true }) totalIncome: number = 0;
    @Input({ required: true }) totalOutcome: number = 0;

    @Output() openAiAdvisor = new EventEmitter<void>();
    @Output() openShareModal = new EventEmitter<void>();
    @Output() openAddGoalModal = new EventEmitter<void>();
    @Output() openTransactionModal = new EventEmitter<void>();

    @Output() updateGoal = new EventEmitter<{ goal: SavingsGoal, amount: number }>();
    @Output() deleteGoal = new EventEmitter<string>();
    @Output() deleteTransaction = new EventEmitter<string>();

    viewMode = signal<'list' | 'analytics'>('list');
    analyticsMode = signal<'distribution' | 'trend'>('distribution');

    toggleViewMode() {
        this.viewMode.set(this.viewMode() === 'list' ? 'analytics' : 'list');
    }

    sortedTransactions = computed(() => {
        return [...this.transactions].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
    });

    trendData = computed(() => {
        const transactions = this.sortedTransactions();
        const months: Record<string, { income: number, outcome: number }> = {};
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toISOString().slice(0, 7);
            months[key] = { income: 0, outcome: 0 };
        }
        transactions.forEach(t => {
            const key = t.dateStr.slice(0, 7);
            if (months[key]) {
                if (t.type === 'income') months[key].income += t.amount;
                if (t.type === 'outcome') months[key].outcome += t.amount;
            }
        });
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        return Object.entries(months).map(([key, val]) => {
            const [y, m] = key.split('-');
            const period = `${monthNames[parseInt(m) - 1]}`;
            return { period, income: val.income, outcome: val.outcome };
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

        const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'];
        return Object.entries(grouped)
            .map(([label, value], index) => ({
                label,
                value: value as number,
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.value - a.value);
    });
}
