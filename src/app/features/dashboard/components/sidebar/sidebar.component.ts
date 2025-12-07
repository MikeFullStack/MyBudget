import { Component, EventEmitter, Input, Output, inject, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Budget } from '../../../../shared/models/budget.models';
import { AuthService } from '../../../../services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <aside class="w-64 bg-[#0F172A] text-white flex flex-col h-full shadow-2xl transition-all duration-300 z-20">
      
      <!-- Header -->
      <div class="p-6 flex items-center justify-between border-b border-gray-800/50">
        <div>
           <h1 class="text-2xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
             {{ 'app.title' | translate }}
           </h1>
           <div class="flex items-center gap-2 mt-1">
             <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span class="text-xs font-medium text-gray-400">{{ userEmail }}</span>
           </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-4 space-y-3">
        <button 
          (click)="createBudget.emit()"
          class="w-full py-3 px-4 bg-white text-black rounded-xl font-bold shadow-lg hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
        >
          <span class="text-lg group-hover:rotate-90 transition-transform">＋</span>
          {{ 'sidebar.new_budget' | translate }}
        </button>

        <button 
          (click)="calculator.emit()"
          class="w-full py-3 px-4 bg-gray-800/50 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all flex items-center justify-center gap-2"
        >
          <span>🧮</span> {{ 'sidebar.calculator' | translate }}
        </button>
      </div>

      <!-- Scrollable List -->
      <div class="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-hide">
          <div *ngIf="budgets().length > 0" class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">{{ 'sidebar.your_budgets' | translate }}</div>
          
          <button *ngFor="let budget of budgets()"
            (click)="selectBudget.emit(budget.id)"
            class="w-full p-3 rounded-xl text-left transition-all duration-200 group relative overflow-hidden"
            [class.bg-white]="selectedBudgetId() === budget.id"
            [class.text-black]="selectedBudgetId() === budget.id"
            [class.shadow-xl]="selectedBudgetId() === budget.id"
            [class.hover:bg-gray-800]="selectedBudgetId() !== budget.id"
            [class.text-gray-400]="selectedBudgetId() !== budget.id"
          > 
             <!-- Content -->
             <div class="relative z-10 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-xl filter drop-shadow-md">{{ budget.icon }}</span>
                    <span class="font-bold truncate max-w-[120px]">{{ budget.name }}</span>
                </div>
                <!-- Delete Action (Hover) -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity" *ngIf="selectedBudgetId() !== budget.id">
                    <button 
                        (click)="$event.stopPropagation(); requestDelete(budget.id)"
                        class="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        title="{{ 'sidebar.delete' | translate }}"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
             </div>
             
             <!-- Active Indicator -->
             <div *ngIf="selectedBudgetId() === budget.id" class="absolute left-0 top-0 bottom-0 w-1 bg-black/20"></div>
          </button>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-800/50 space-y-2">
         <!-- Settings / Toggles -->
         <div class="flex gap-2">
            <button (click)="toggleTheme()" class="flex-1 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700 transition-colors text-lg flex items-center justify-center border border-gray-700/50">
                {{ isDark() ? '☀️' : '🌙' }}
            </button>
            <button (click)="toggleLang()" class="flex-1 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700 transition-colors text-lg flex items-center justify-center border border-gray-700/50 font-bold text-xs uppercase text-gray-300">
                {{ currentLang() === 'fr' ? 'EN' : 'FR' }}
            </button>
         </div>

         <button (click)="logout.emit()" class="w-full py-2.5 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-sm font-semibold group">
           <span class="group-hover:-translate-x-1 transition-transform">←</span>
           {{ 'sidebar.logout' | translate }}
         </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  userEmail = 'Particulier';

  budgets = input<Budget[]>([]);
  selectedBudgetId = input<string>('');
  isLoading = input<boolean>(false);

  themeService = inject(ThemeService);
  langService = inject(LanguageService);

  isDark = this.themeService.isDark;
  currentLang = this.langService.currentLang;

  @Output() selectBudget = new EventEmitter<string>();
  @Output() createBudget = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() deleteBudget = new EventEmitter<string>();
  @Output() calculator = new EventEmitter<void>();

  constructor() {
    const auth = inject(AuthService);
    effect(() => {
      const u = auth.currentUser();
      this.userEmail = u?.email || 'Invité';
    });
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  toggleLang() {
    this.langService.toggle();
  }

  requestDelete(id: string) {
    if (confirm(this.langService.translate('sidebar.delete_confirm'))) {
      this.deleteBudget.emit(id);
    }
  }
}
