import { Component, EventEmitter, Input, Output, signal, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../../core/services/ai.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isMarkdown?: boolean;
}

@Component({
  selector: 'app-ai-advisor-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-[80vh] md:h-[90vh]">
        
        <!-- Header -->
        <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 shrink-0">
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

        <!-- Chat Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20" #scrollContainer>
            
            @for (msg of messages(); track $index) {
                <div [class.flex-row-reverse]="msg.role === 'user'" class="flex items-start gap-3">
                    <!-- Avatar -->
                    <div [class.bg-blue-600]="msg.role === 'user'" [class.bg-purple-600]="msg.role === 'assistant'" class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 shadow-sm mt-1">
                        {{ msg.role === 'user' ? 'Moi' : 'AI' }}
                    </div>

                    <!-- Bubble -->
                    <div [class.bg-blue-600]="msg.role === 'user'" 
                         [class.text-white]="msg.role === 'user'"
                         [class.bg-white]="msg.role === 'assistant'" 
                         [class.dark:bg-gray-800]="msg.role === 'assistant'"
                         [class.text-gray-800]="msg.role === 'assistant'"
                         [class.dark:text-gray-200]="msg.role === 'assistant'"
                         class="max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed"
                         [class.rounded-tr-none]="msg.role === 'user'"
                         [class.rounded-tl-none]="msg.role === 'assistant'">
                        
                        @if (msg.isMarkdown) {
                             <div class="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap" [innerHTML]="msg.content"></div>
                        } @else {
                            {{ msg.content }}
                        }
                    </div>
                </div>
            }

            @if (isLoading()) {
                <div class="flex items-start gap-3 animate-pulse">
                     <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs shrink-0">AI</div>
                     <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm space-y-2 w-48">
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                     </div>
                </div>
            }
            
            @if (error()) {
                <div class="flex justify-center">
                    <div class="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-red-100">
                        {{ error() }}
                    </div>
                </div>
            }
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
            <div class="flex gap-2">
                <input 
                    type="text" 
                    [(ngModel)]="userInput" 
                    (keydown.enter)="sendMessage()"
                    placeholder="Posez une question sur votre budget..." 
                    class="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    [disabled]="isLoading()"
                >
                <button 
                    (click)="sendMessage()" 
                    [disabled]="!userInput.trim() || isLoading()"
                    class="bg-black dark:bg-white text-white dark:text-black p-3 rounded-xl hover:opacity-80 disabled:opacity-50 transition-all shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
             <p class="text-center text-[10px] text-gray-400 mt-2">L'IA peut faire des erreurs. Vérifiez toujours vos données.</p>
        </div>

      </div>
    </div>
  `
})
export class AiAdvisorModalComponent implements AfterViewChecked {
  @Input() budgetContext: any;
  @Output() close = new EventEmitter<void>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private aiService = inject(AiService);

  isLoading = signal(true);
  error = signal<string | null>(null);
  messages = signal<ChatMessage[]>([]);
  userInput = '';

  constructor() {
    // Auto-start analysis when component initializes
    setTimeout(() => this.startInitialAnalysis(), 100);
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  async startInitialAnalysis() {
    if (!this.budgetContext) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const ctx = this.getSafeContext();
      const response = await this.aiService.analyzeBudget(ctx);

      // Add initial analysis as first message
      this.messages.update(msgs => [
        ...msgs,
        { role: 'assistant', content: response, isMarkdown: true } // Analysis is markdown formatted
      ]);

    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'Problème de connexion avec le cerveau AI.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading()) return;

    const question = this.userInput;
    this.userInput = ''; // Clear input
    this.error.set(null);

    // Add user message immediately
    this.messages.update(msgs => [...msgs, { role: 'user', content: question }]);

    this.isLoading.set(true);

    try {
      const ctx = this.getSafeContext();
      const response = await this.aiService.askAdvisor(ctx, question);

      this.messages.update(msgs => [...msgs, { role: 'assistant', content: response, isMarkdown: false }]);
    } catch (err: any) {
      this.error.set('Impossible de répondre à cette question.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getSafeContext() {
    return {
      monthlyIncome: this.budgetContext.income || 0,
      monthlyOutcome: this.budgetContext.outcome || 0,
      balance: (this.budgetContext.income || 0) - (this.budgetContext.outcome || 0),
      savingsGoalCount: this.budgetContext.goals?.length || 0,
      transactions: this.budgetContext.transactions || []
    };
  }
}
