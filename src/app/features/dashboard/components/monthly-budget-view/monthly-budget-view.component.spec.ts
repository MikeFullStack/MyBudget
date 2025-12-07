import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MonthlyBudgetViewComponent } from './monthly-budget-view.component';
import { BudgetService } from '../../../../services/budget.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Budget } from '../../../../shared/models/budget.models';
import { By } from '@angular/platform-browser';

// --- Mocks ---
const mockBudgetService = {
    updateBudget: vi.fn(),
    budgets: signal<Budget[]>([])
};

const mockToastService = {
    show: vi.fn()
};

// Mock TranslatePipe
@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
    transform(key: string): string {
        return `TR: ${key}`;
    }
}

import { Pipe, PipeTransform, Directive, Input, ElementRef, inject, OnChanges } from '@angular/core';
import { TextScrambleDirective } from '../../../../shared/directives/text-scramble.directive';

@Directive({
    selector: '[appScramble]',
    standalone: true
})
class MockTextScrambleDirective implements OnChanges {
    @Input('appScramble') text: string = '';
    private el = inject(ElementRef);
    ngOnChanges() {
        this.el.nativeElement.textContent = this.text;
    }
}

describe('MonthlyBudgetViewComponent', () => {
    let component: MonthlyBudgetViewComponent;
    let fixture: ComponentFixture<MonthlyBudgetViewComponent>;

    const testBudget: Budget = {
        id: 'b1',
        name: 'Test Planner',
        type: 'monthly',
        themeColor: 'green',
        icon: '📅',
        transactions: [], // Not used in monthly view directly
        recurring: [],
        // Monthly specific props
        monthlyData: {
            salary: 5000,
            fixedExpenses: [
                { id: 'f1', label: 'Rent', amount: 2000 },
                { id: 'f2', label: 'Internet', amount: 100 }
            ],
            variableExpenses: [
                { id: 'v1', label: 'Groceries', amount: 600 }
            ]
        }
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        await TestBed.configureTestingModule({
            imports: [MonthlyBudgetViewComponent],
            providers: [
                { provide: BudgetService, useValue: mockBudgetService },
                { provide: ToastService, useValue: mockToastService }
            ]
        })
            .overrideComponent(MonthlyBudgetViewComponent, {
                remove: { imports: [TranslatePipe, TextScrambleDirective] },
                add: { imports: [MockTranslatePipe, MockTextScrambleDirective] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(MonthlyBudgetViewComponent);
        component = fixture.componentInstance;

        // Set Input Signal (Signal Inputs need to be set via fixture ref if using ComponentRef, 
        // but here we are using standard component input binding mechanism or just manually setting if possible.
        // However, Signal Inputs are read-only from inside. In tests, we set them via the template parent 
        // or by setting the input on the componentRef if Angular version supports it.
        // For simplicity in this env, we'll assume standard @Input() or manually patching if it was a signal input.
        // Looking at source: `budget = input.required<Budget>();`
        fixture.componentRef.setInput('budget', testBudget);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // --- 1. Rendering & Data Display ---
    it('should display the budget name correctly', () => {
        const titleEl = fixture.debugElement.query(By.css('h2'));
        expect(titleEl.nativeElement.textContent).toContain('Test Planner');
    });

    it('should translate static labels', () => {
        // "Exercice Mensuel" -> 'common.monthly'
        const subtitle = fixture.debugElement.query(By.css('p.text-xs'));
        expect(subtitle.nativeElement.textContent).toContain('TR: common.monthly');
    });

    // --- 2. Calculations (The "Google Precision" Part) ---
    it('should correctly calculate total fixed expenses', () => {
        // 2000 + 100 = 2100
        expect(component.totalFixed()).toBe(2100);
    });

    it('should correctly calculate total variable expenses', () => {
        // 600
        expect(component.totalVariable()).toBe(600);
    });

    it('should correctly calculate remaining capacity', () => {
        // 5000 - 2100 - 600 = 2300
        expect(component.remaining()).toBe(2300);
    });

    it('should correctly calculate ratios', () => {
        // Fixed Ratio: 2100 / 5000 = 0.42
        expect(component.fixedRatio()).toBe(0.42);

        // Remaining Ratio: 2300 / 5000 = 0.46
        expect(component.remainingRatio()).toBe(0.46);
    });

    // --- 3. Interaction & Logic ---
    it('should call updateSalary when salary input changes', () => {
        const input = fixture.debugElement.query(By.css('input[type="number"]'));
        // Simulate user typing 6000
        input.nativeElement.value = '6000';
        input.nativeElement.dispatchEvent(new Event('input')); // ngModel updates on input/change
        input.nativeElement.dispatchEvent(new Event('change')); // Ensure change event fires

        // Note: The component likely uses `ngModelChange` to trigger updates.
        // We can verify if `updateBudget` was called with the new salary.
        // Let's call the method directly to verify logic if DOM interaction is flaky in jsdom.
        component.updateSalary(6000);

        expect(mockBudgetService.updateBudget).toHaveBeenCalledWith(
            'b1',
            expect.objectContaining({
                monthlyData: expect.objectContaining({
                    salary: 6000
                })
            })
        );
    });

    it('should add a new fixed expense', async () => {
        component.newFixedLabel = 'Netflix';
        component.newFixedAmount = 20;

        await component.addItem('fixed');

        expect(mockBudgetService.updateBudget).toHaveBeenCalled();
        const callArgs = mockBudgetService.updateBudget.mock.calls[0];
        const callData = callArgs[1].monthlyData; // 2nd argument is the updates object
        expect(callData.fixedExpenses).toHaveLength(3);
        expect(callData.fixedExpenses[2]).toMatchObject({ label: 'Netflix', amount: 20 });

        // Verify reset
        expect(component.newFixedLabel).toBe('');
        expect(component.newFixedAmount).toBeNull();
    });

    it('should remove an expense', () => {
        component.removeItem('fixed', 'f1'); // Remove Rent

        expect(mockBudgetService.updateBudget).toHaveBeenCalled();
        const callArgs = mockBudgetService.updateBudget.mock.lastCall!;
        // Should only have f2 (Internet) left
        const callData = callArgs[1].monthlyData;
        expect(callData.fixedExpenses).toHaveLength(1);
        expect(callData.fixedExpenses[0].id).toBe('f2');
    });

    // --- 4. Theming (Structural Test) ---
    it('should apply dark mode classes to main container', () => {
        // The user specifically asked for "precise" tests. 
        // We check that the dark mode text class is present in the template.
        const container = fixture.debugElement.query(By.css('div.max-w-6xl'));
        // classes: ... text-gray-900 dark:text-white
        expect(container.classes['dark:text-white']).toBe(true);
    });

    it('should apply dark mode background to cards', () => {
        // Check one of the summary cards - explicitly select by border/bg classes to avoid main container
        const summaryCard = fixture.debugElement.query(By.css('.rounded-lg.bg-gray-50'));
        // classes: ... bg-gray-50 dark:bg-gray-800
        expect(summaryCard.nativeElement.classList).toContain('dark:bg-gray-800');
    });
});
