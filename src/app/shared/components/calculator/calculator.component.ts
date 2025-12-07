import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-calculator',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div class="bg-gray-900 rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-gray-800">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
           <h3 class="text-white font-medium text-sm border px-2 py-1 rounded border-gray-700">Calculatrice</h3>
           <button (click)="close.emit()" class="text-gray-400 hover:text-white transition-colors">✕</button>
        </div>

        <!-- Display -->
        <div class="bg-black/50 rounded-2xl p-4 mb-4 text-right h-24 flex flex-col justify-end">
            <div class="text-gray-400 text-xs mb-1 h-4">{{ previousInput }} {{ operator }}</div>
            <div class="text-white text-3xl font-mono font-bold">{{ currentInput || '0' }}</div>
        </div>

        <!-- Keypad -->
        <div class="grid grid-cols-4 gap-3">
            <button (click)="clear()" class="col-span-1 bg-red-500/20 text-red-400 h-14 rounded-xl font-bold hover:bg-red-500/30">C</button>
            <button (click)="toggleSign()" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">+/-</button>
            <button (click)="append('%')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">%</button>
            <button (click)="setOperator('/')" class="bg-orange-500 text-white h-14 rounded-xl font-bold hover:bg-orange-600">÷</button>

            <button (click)="append('7')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">7</button>
            <button (click)="append('8')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">8</button>
            <button (click)="append('9')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">9</button>
            <button (click)="setOperator('*')" class="bg-orange-500 text-white h-14 rounded-xl font-bold hover:bg-orange-600">×</button>

            <button (click)="append('4')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">4</button>
            <button (click)="append('5')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">5</button>
            <button (click)="append('6')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">6</button>
            <button (click)="setOperator('-')" class="bg-orange-500 text-white h-14 rounded-xl font-bold hover:bg-orange-600">-</button>

            <button (click)="append('1')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">1</button>
            <button (click)="append('2')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">2</button>
            <button (click)="append('3')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">3</button>
            <button (click)="setOperator('+')" class="bg-orange-500 text-white h-14 rounded-xl font-bold hover:bg-orange-600">+</button>

            <button (click)="append('0')" class="col-span-2 bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">0</button>
            <button (click)="append('.')" class="bg-gray-800 text-white h-14 rounded-xl font-bold hover:bg-gray-700">.</button>
            <button (click)="calculate()" class="bg-orange-500 text-white h-14 rounded-xl font-bold hover:bg-orange-600">=</button>
        </div>

        <!-- Action -->
         <button (click)="submit()" class="w-full mt-4 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
            Utiliser cette valeur
         </button>

      </div>
    </div>
  `
})
export class CalculatorComponent {
    @Input() set initialValue(val: number | null) {
        if (val) this.currentInput = val.toString();
    }

    @Output() close = new EventEmitter<void>();
    @Output() apply = new EventEmitter<number>();

    currentInput = '';
    previousInput = '';
    operator: string | null = null;
    resetNext = false;

    append(char: string) {
        if (this.resetNext) {
            this.currentInput = '';
            this.resetNext = false;
        }
        if (char === '.' && this.currentInput.includes('.')) return;
        this.currentInput += char;
    }

    clear() {
        this.currentInput = '';
        this.previousInput = '';
        this.operator = null;
    }

    toggleSign() {
        if (this.currentInput) {
            this.currentInput = (parseFloat(this.currentInput) * -1).toString();
        }
    }

    setOperator(op: string) {
        if (this.currentInput === '') return;

        if (this.previousInput && this.operator) {
            this.calculate();
        }

        this.operator = op;
        this.previousInput = this.currentInput;
        this.resetNext = true;
    }

    calculate() {
        if (!this.operator || !this.previousInput) return;

        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        let res = 0;

        switch (this.operator) {
            case '+': res = prev + current; break;
            case '-': res = prev - current; break;
            case '*': res = prev * current; break;
            case '/': res = prev / current; break;
        }

        this.currentInput = res.toString();
        this.operator = null;
        this.previousInput = '';
        this.resetNext = true; // Ready for new operation or just displaying result
    }

    submit() {
        if (this.currentInput) {
            this.apply.emit(parseFloat(this.currentInput));
        }
        this.close.emit();
    }
}
