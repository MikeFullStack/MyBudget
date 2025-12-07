import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Budget } from '../../../../shared/models/budget.models';
import { ExportService } from '../../../../shared/services/export.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
       <aside class="w-full md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-colors duration-300 md:h-screen z-20 shadow-sm relative">
        <div class="p-6 pt-10 flex justify-between items-center">
          <div>
              <h1 class="text-2xl font-bold tracking-tight mb-1 text-gray-900 dark:text-white font-sans">Mes Finances</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                Particulier
              </p>
          </div>
          <button (click)="logout.emit()" class="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">Déconnexion</button>
        </div>

        <div class="flex-1 overflow-y-auto px-4 space-y-6 pb-4">
          
          <!-- Wallets Section -->
          <div>
            <div class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-3">Portefeuilles</div>
            
            @if (isLoading) {
              <div class="p-4 text-center text-gray-400 text-sm animate-pulse">Chargement...</div>
            }

            @for (budget of wallets; track budget.id) {
              <div class="group relative mb-1">
                  <button 
                    (click)="selectBudget.emit(budget.id)"
                    class="w-full flex items-center justify-between p-3 pl-3 rounded-lg transition-all duration-200"
                    [ngClass]="selectedBudgetId === budget.id ? 'bg-white dark:bg-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 border border-transparent'"
                  >
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm transition-transform duration-300 group-hover:scale-105"
                        [style.background-color]="budget.themeColor"
                        style="color: white"
                      >
                        {{ budget.icon }}
                      </div>
                      <div class="text-left">
                        <div class="font-semibold text-[15px] text-gray-900 dark:text-gray-200 leading-tight">{{ budget.name }}</div>
                        <div class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{{ budget.transactions.length }} transactions</div>
                      </div>
                    </div>
                </button>
                <button 
                    (click)="$event.stopPropagation(); requestDelete(budget.id)"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Supprimer ce budget"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            }

            @if (!isLoading && wallets.length === 0) {
                <div class="pl-4 text-xs text-gray-400 italic">Aucun portefeuille</div>
            }
          </div>

          <!-- Monthly Planners Section -->
          <div>
             <div class="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 pl-3">Planification</div>
             
             @for (budget of planners; track budget.id) {
              <div class="group relative mb-1">
                  <button 
                    (click)="selectBudget.emit(budget.id)"
                    class="w-full flex items-center justify-between p-3 pl-3 rounded-lg transition-all duration-200"
                    [ngClass]="selectedBudgetId === budget.id ? 'bg-white dark:bg-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 border border-transparent'"
                  >
                    <div class="flex items-center gap-3">
                      <div 
                        class="w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm transition-transform duration-300 group-hover:scale-105 bg-gray-900 dark:bg-gray-700 text-white"
                      >
                        {{ budget.icon }}
                      </div>
                      <div class="text-left">
                        <div class="font-semibold text-[15px] text-gray-900 dark:text-gray-200 leading-tight">{{ budget.name }}</div>
                        <div class="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">Plan Mensuel</div>
                      </div>
                    </div>
                  </button>
                  <button 
                    (click)="$event.stopPropagation(); requestDelete(budget.id)"
                    class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Supprimer ce plan"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            }
            @if (!isLoading && planners.length === 0) {
                <div class="pl-4 text-xs text-gray-400 italic">Aucun plan</div>
            }
          </div>

          <!-- Actions -->
          <div class="border-t border-gray-200/50 pt-6 mt-4 px-2 space-y-3">
            <button (click)="createBudget.emit()" class="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all text-[13px] font-semibold tracking-wide shadow-lg shadow-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nouveau Budget
            </button>

            <button (click)="calculator.emit()" class="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                <span class="text-lg">🧮</span>
                <span class="text-[13px] font-semibold">Calculatrice</span>
            </button>
          </div>
        </div>
        <!-- Footer -->
      <div class="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
         <!-- Dark Mode Toggle -->
         <button 
          (click)="themeService.toggle()"
          class="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
         >
            <span class="flex items-center gap-2">
                <span>{{ themeService.isDark() ? '🌙' : '☀️' }}</span>
                <span>Thème {{ themeService.isDark() ? 'Sombre' : 'Clair' }}</span>
            </span>
         </button>

         <!-- Export -->
         <button 
            (click)="exportData()"
            class="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
         >
            <span>📄</span>
            <span>Exporter les données</span>
         </button>

         <div class="pt-2">
            <button (click)="logout.emit()" class="w-full flex items-center gap-2 px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
            <span>🚪</span>
            <span>Déconnexion</span>
            </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() budgets: Budget[] = [];
  @Input() selectedBudgetId: string | null = null;
  @Input() totalBalance: number = 0;
  @Input() isLoading = false;

  @Output() selectBudget = new EventEmitter<string>();
  @Output() createBudget = new EventEmitter<void>();
  @Output() deleteBudget = new EventEmitter<string>();
  @Output() calculator = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  exportService = inject(ExportService);
  themeService = inject(ThemeService);

  get wallets() { return this.budgets.filter(b => !b.type || b.type === 'wallet'); }
  get planners() { return this.budgets.filter(b => b.type === 'monthly'); }

  exportData() {
    if (!this.selectedBudgetId) return;
    const budget = this.budgets.find(b => b.id === this.selectedBudgetId);
    if (budget) {
      this.exportService.downloadTransactionsAsCSV(budget.transactions, budget.name);
    }
  }

  requestDelete(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce budget définitivement ?')) {
      this.deleteBudget.emit(id);
    }
  }
}
