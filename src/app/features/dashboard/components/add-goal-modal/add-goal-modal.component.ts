import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-goal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl transition-colors duration-300">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nouvel Objectif</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-400 mb-1 ml-1">Nom</label>
            <input type="text" [(ngModel)]="name" class="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" placeholder="Ex: Voyage, MacBook...">
          </div>

          <div>
             <label class="block text-xs font-semibold text-gray-400 mb-1 ml-1">Cible ($)</label>
             <input type="number" [(ngModel)]="target" class="w-full bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors" placeholder="0.00">
          </div>

          <div>
             <label class="block text-xs font-semibold text-gray-400 mb-1 ml-1">Icône</label>
             <div class="flex gap-2 text-xl overflow-x-auto pb-2 scrollbar-hide">
                @for (ic of icons; track ic) {
                    <button (click)="icon = ic" [class.bg-gray-200]="icon === ic" [class.dark:bg-gray-700]="icon === ic" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{{ ic }}</button>
                }
             </div>
          </div>
        </div>

        <div class="flex gap-2 mt-6">
          <button (click)="close.emit()" class="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-colors">Annuler</button>
          <button (click)="submit()" [disabled]="!name || !target" class="flex-1 px-4 py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Créer</button>
        </div>
      </div>
    </div>
  `
})
export class AddGoalModalComponent {
  name = '';
  target: number | null = null;
  icon = '🎯';

  icons = ['🎯', '✈️', '🚗', '🏠', '💻', '🎁', '🎓', '🏥', '💍'];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ name: string, targetAmount: number, icon: string }>();

  submit() {
    if (this.name && this.target) {
      this.save.emit({ name: this.name, targetAmount: this.target, icon: this.icon });
    }
  }
}
