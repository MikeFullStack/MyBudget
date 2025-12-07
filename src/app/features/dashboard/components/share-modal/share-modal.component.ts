import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../../../services/budget.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-share-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" (click)="close.emit()">
      <div class="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
            <div>
                 <h2 class="text-xl font-bold text-gray-900 dark:text-white">Partager le budget</h2>
                 <p class="text-sm text-gray-500 dark:text-gray-400">Invitez des membres à collaborer.</p>
            </div>
            <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
            <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email du participant</label>
                <div class="flex gap-2">
                    <input 
                        type="email" 
                        [(ngModel)]="email" 
                        placeholder="exemple@email.com" 
                        class="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    >
                    <button 
                        (click)="invite()" 
                        [disabled]="isLoading() || !email"
                        class="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-500/20">
                        @if (isLoading()) { ⏳ } @else { Inviter }
                    </button>
                </div>
            </div>

            <!-- Participants List -->
            @if (participants && participants.length > 0) {
                <div>
                    <h3 class="text-xs font-bold text-gray-500 uppercase mb-3">Membres actuels</h3>
                    <div class="space-y-2">
                        @for (p of participants; track p) {
                            <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                    {{ p.charAt(0).toUpperCase() }}
                                </div>
                                <span class="text-sm font-medium dark:text-gray-200">{{ p }}</span>
                            </div>
                        }
                    </div>
                </div>
            } @else {
                <div class="text-center py-6 text-gray-400 text-sm italic border-t border-dashed border-gray-100 dark:border-gray-800 pt-6">
                    Aucun participant pour le moment.
                </div>
            }
        </div>

      </div>
    </div>
  `
})
export class ShareModalComponent {
    @Input() budgetId!: string;
    @Input() participants: string[] = [];
    @Output() close = new EventEmitter<void>();

    private budgetService = inject(BudgetService);
    private toast = inject(ToastService);

    email = '';
    isLoading = signal(false);

    async invite() {
        if (!this.email || !this.email.includes('@')) {
            this.toast.show('Email invalide', 'error');
            return;
        }

        this.isLoading.set(true);
        try {
            await this.budgetService.inviteUserToBudget(this.budgetId, this.email);
            this.toast.show(`Invitation envoyée à ${this.email}`, 'success');
            this.email = '';
            // Note: The UI will update automatically via Firestore snapshot if successful
        } catch (err: any) {
            console.error(err);
            this.toast.show(err.message || 'Erreur lors de l\'invitation', 'error');
        } finally {
            this.isLoading.set(false);
        }
    }
}
