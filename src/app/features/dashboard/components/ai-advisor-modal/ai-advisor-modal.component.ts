import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../../../core/services/ai.service';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';

@Component({
    selector: 'app-ai-advisor-modal',
    standalone: true,
    imports: [CommonModule, SkeletonComponent],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-lg">
              ✨
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Conseiller AI</h2>
              <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">Propulsé par Gemini 1.5 Pro</p>
            </div>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto flex-1 text-gray-700 dark:text-gray-300">
          @if (isLoading()) {
            <div class="space-y-4 animate-pulse">
                <div class="flex gap-2 items-center">
                    <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <span class="text-sm font-medium text-blue-500">Analyse de vos finances en cours...</span>
                </div>
                <app-skeleton height="20px" width="80%" borderRadius="0.5rem"></app-skeleton>
                <app-skeleton height="20px" width="90%" borderRadius="0.5rem"></app-skeleton>
                <app-skeleton height="100px" borderRadius="1rem"></app-skeleton>
                <app-skeleton height="20px" width="60%" borderRadius="0.5rem"></app-skeleton>
            </div>
          } @else if (error()) {
             <div class="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3">
                <span class="text-2xl">⚠️</span>
                <div>
                    <p class="font-bold">Erreur d'analyse</p>
                    <p class="text-sm">{{ error() }}</p>
                    <p class="text-xs mt-2 opacity-75">Vérifiez que l'API Vertex AI est activée dans Firebase Console.</p>
                </div>
             </div>
          } @else {
            <div class="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                {{ result() }}
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
            @if (!isLoading()) {
                <button (click)="generateAnalysis()" class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    🔄 Régénerer
                </button>
            }
            <button (click)="close.emit()" class="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-lg hover:transform hover:scale-105 transition-all">
                Terminé
            </button>
        </div>

      </div>
    </div>
  `
})
export class AiAdvisorModalComponent {
    @Input() budgetContext: any;
    @Output() close = new EventEmitter<void>();

    private aiService = inject(AiService);

    isLoading = signal(true);
    error = signal<string | null>(null);
    result = signal<string>('');

    constructor() {
        // Auto-start analysis when component initializes
        // But wait for input binding, so use timeout or lifecycle
        setTimeout(() => this.generateAnalysis(), 100);
    }

    async generateAnalysis() {
        if (!this.budgetContext) return;

        this.isLoading.set(true);
        this.error.set(null);
        this.result.set('');

        try {
            // Safe context generation
            const ctx = {
                monthlyIncome: this.budgetContext.income || 0,
                monthlyOutcome: this.budgetContext.outcome || 0,
                balance: (this.budgetContext.income || 0) - (this.budgetContext.outcome || 0),
                savingsGoalCount: this.budgetContext.goals?.length || 0,
                transactionsCount: this.budgetContext.transactions?.length || 0
                // We strip sensitive or huge data arrays to keep prompt token efficient
            };

            const response = await this.aiService.analyzeBudget(ctx);
            this.result.set(response);
        } catch (err: any) {
            console.error(err);
            this.error.set(err.message || 'Problème de connexion avec le cerveau AI.');
        } finally {
            this.isLoading.set(false);
        }
    }
}
