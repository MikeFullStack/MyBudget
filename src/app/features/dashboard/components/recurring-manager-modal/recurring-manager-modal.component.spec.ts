import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecurringManagerModalComponent } from './recurring-manager-modal.component';
import { RecurringTransaction } from '../../../../shared/models/budget.models';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('RecurringManagerModalComponent', () => {
    let component: RecurringManagerModalComponent;
    let fixture: ComponentFixture<RecurringManagerModalComponent>;

    const mockItems: RecurringTransaction[] = [
        { id: '1', label: 'Rent', amount: 1000, type: 'outcome', category: 'Housing', frequency: 'monthly', nextDueDate: '2024-01-01' },
        { id: '2', label: 'Salary', amount: 3000, type: 'income', category: 'Work', frequency: 'monthly', nextDueDate: '2024-01-05' }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RecurringManagerModalComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RecurringManagerModalComponent);
        component = fixture.componentInstance;
        component.recurringItems = mockItems;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display items', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const items = compiled.querySelectorAll('.flex.items-center.justify-between');
        // Header is not an item. Items have specific class structure.
        // The loop creates a div for each item.
        // Let's count elements with text content matching labels.
        expect(compiled.textContent).toContain('Rent');
        expect(compiled.textContent).toContain('Salary');
    });

    it('should emit delete event', () => {
        const deleteSpy = vi.spyOn(component.delete, 'emit');
        // Find delete button for first item
        const buttons = fixture.nativeElement.querySelectorAll('button[title="Arrêter la récurrence"]');
        expect(buttons.length).toBe(2);

        (buttons[0] as HTMLElement).click();
        expect(deleteSpy).toHaveBeenCalledWith('1');
    });

    it('should emit close event', () => {
        const closeSpy = vi.spyOn(component.close, 'emit');
        const closeBtn = fixture.nativeElement.querySelector('button[class*="hover:bg-gray-100"]'); // Adjusted selector based on template
        // Or just look for the X button
        // The Close button is: <button (click)="close.emit()" ...><span ...>✕</span></button>
        // It's the first button usually, or distinct class.

        // Let's assume it's the one in the header. 
        // <div class="flex justify-between items-center mb-6"> ... <button ...
        const headerBtn = fixture.nativeElement.querySelector('.flex.justify-between button');
        (headerBtn as HTMLElement).click();
        expect(closeSpy).toHaveBeenCalled();
    });
});
