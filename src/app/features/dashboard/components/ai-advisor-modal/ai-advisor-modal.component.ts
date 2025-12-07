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
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-black/20 backdrop-blur-sm">
      <!-- Main Card: Glassmorphism & Apple-style Rounded Corners -->
      <div class="w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 relative ring-1 ring-black/5">
        
        <!-- Header (Sticky, Minimal) -->
        <div class="px-4 py-3 flex items-center justify-between bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-800/50">
           <!-- Close Button (Circle with X) -->
           <button (click)="close.emit()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <span class="text-gray-500 dark:text-gray-400 text-lg leading-none">&times;</span>
           </button>
           
           <!-- Title Centered -->
           <div class="text-center">
              <h2 class="text-[15px] font-semibold text-gray-900 dark:text-white">Conseiller Budget</h2>
              <div class="flex items-center justify-center gap-1.5 opacity-60">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">Gemini 2.0</span>
              </div>
           </div>
           
           <!-- Spacer for symmetry or Menu -->
           <div class="w-8 h-8"></div> 
        </div>

        <!-- Chat Area (Clean, flexible bubbles) -->
        <div class="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent scroll-smooth" #scrollContainer>
           
            <!-- Disclaimer -->
            <div class="text-center py-4">
                <span class="px-3 py-1 rounded-full bg-gray-100 dark:bg-[#2C2C2E] text-[10px] text-gray-500 border border-gray-200 dark:border-gray-700">
                    L'IA peut faire des erreurs. Vérifiez vos données.
                </span>
            </div>

            @for (msg of messages(); track $index) {
                <div [class.justify-end]="msg.role === 'user'" [class.justify-start]="msg.role === 'assistant'" class="flex items-end gap-2 group">
                    
                    <!-- Avatar (AI only) -->
                    @if (msg.role === 'assistant') {
                        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] shadow-sm shrink-0 mb-1">
                            ✨
                        </div>
                    }

                    <!-- Bubble -->
                    <div [class.bg-[#007AFF]]="msg.role === 'user'" 
                         [class.text-white]="msg.role === 'user'"
                         [class.rounded-2xl]="true"
                         [class.rounded-br-sm]="msg.role === 'user'"
                         [class.bg-[#E9E9EB]]="msg.role === 'assistant'" 
                         [class.dark:bg-[#2C2C2E]]="msg.role === 'assistant'"
                         [class.text-black]="msg.role === 'assistant'"
                         [class.dark:text-white]="msg.role === 'assistant'"
                         [class.rounded-bl-sm]="msg.role === 'assistant'"
                         class="max-w-[75%] px-5 py-3 shadow-sm text-[15px] leading-relaxed relative transition-all duration-200 hover:shadow-md">
                        
                        @if (msg.isMarkdown) {
                             <div class="prose dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none text-[15px]" [innerHTML]="msg.content"></div>
                        } @else {
                            {{ msg.content }}
                        }
                    </div>
                </div>
            }

            @if (isLoading()) {
                <div class="flex justify-start items-center gap-2">
                     <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] shrink-0">✨</div>
                     <div class="bg-[#E9E9EB] dark:bg-[#2C2C2E] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                     </div>
                </div>
            }
            
            @if (error()) {
                <div class="flex justify-center my-4">
                    <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/50 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                        {{ error() }}
                    </div>
                </div>
            }
        </div>

        <!-- Input Area (Floating Pill) -->
        <div class="p-4 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-t border-gray-100/50 dark:border-gray-800/50">
            <div class="relative flex items-center group">
                <input 
                    type="text" 
                    [(ngModel)]="userInput" 
                    (keydown.enter)="sendMessage()"
                    placeholder="Message..." 
                    class="w-full bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-white rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder-gray-500 dark:placeholder-gray-400 text-[15px] transition-all"
                    [disabled]="isLoading()"
                >
                
                <button 
                    (click)="sendMessage()" 
                    [disabled]="!userInput.trim() || isLoading()"
                    class="absolute right-1.5 p-2 bg-[#007AFF] rounded-full text-white hover:bg-blue-600 disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-all duration-200 shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center w-9 h-9">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                </button>
            </div>
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
