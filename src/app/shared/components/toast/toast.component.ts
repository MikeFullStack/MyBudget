import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md border border-white/20 animate-slide-in"
          [ngClass]="{
            'bg-white/90 text-gray-900': toast.type === 'info',
            'bg-green-500/90 text-white': toast.type === 'success',
            'bg-red-500/90 text-white': toast.type === 'error'
          }"
        >
          <!-- Icon -->
          <div class="text-lg">
            @switch (toast.type) {
                @case ('success') { ✅ }
                @case ('error') { ❌ }
                @case ('info') { ℹ️ }
            }
          </div>
          
          <div class="flex-1 min-w-0">
             <p class="text-sm font-semibold tracking-wide pr-2">{{ toast.message }}</p>
          </div>
          
          @if (toast.action) {
              <button 
                (click)="toast.action.onClick(); toastService.remove(toast.id)"
                class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                  {{ toast.action.label }}
              </button>
          }
           
          <button (click)="toastService.remove(toast.id)" class="ml-2 opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-slide-in {
      animation: slideIn 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
