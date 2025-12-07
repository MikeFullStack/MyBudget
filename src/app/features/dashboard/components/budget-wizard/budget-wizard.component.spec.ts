import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BudgetWizardComponent } from './budget-wizard.component';
import { By } from '@angular/platform-browser';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { vi, describe, it, expect, beforeEach } from 'vitest';

@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
    transform(key: string): string {
        return `TR: ${key}`;
    }
}

describe('BudgetWizardComponent', () => {
    let component: BudgetWizardComponent;
    let fixture: ComponentFixture<BudgetWizardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BudgetWizardComponent]
        })
            .overrideComponent(BudgetWizardComponent, {
                remove: { imports: [TranslatePipe] },
                add: { imports: [MockTranslatePipe] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(BudgetWizardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start at step 1 and invalid validity', () => {
        expect(component.step()).toBe(1);
        expect(component.canProceed()).toBe(false); // Name is empty
    });

    it('should validate step 1 when name is entered', () => {
        component.name = 'My Budget';
        fixture.detectChanges();
        expect(component.canProceed()).toBe(true);
    });

    it('should navigate flow correctly', () => {
        // Step 1 -> 2
        component.name = 'Budget';
        component.next();
        expect(component.step()).toBe(2);

        // Step 2 -> Invalid (Salary 0)
        expect(component.canProceed()).toBe(false); // null salary

        // Step 2 -> Valid
        component.salary = 3000;
        expect(component.canProceed()).toBe(true);
        component.next();
        expect(component.step()).toBe(3);

        // Step 3 -> 4
        component.next();
        expect(component.step()).toBe(4);
    });

    it('should add/remove fixed expenses', () => {
        component.newFixedLabel = 'Rent';
        component.newFixedAmount = 1000;
        component.addFixed();

        expect(component.fixedExpenses.length).toBe(1);
        expect(component.fixedExpenses[0].label).toBe('Rent');

        component.removeFixed(0);
        expect(component.fixedExpenses.length).toBe(0);
    });

    it('should emit create event with full payload', () => {
        // Setup state
        component.name = 'Final Budget';
        component.color = 'red';
        component.salary = 5000;
        component.newFixedLabel = 'Rent';
        component.newFixedAmount = 1000;
        component.addFixed();

        const emitSpy = vi.spyOn(component.create, 'emit');
        component.finish();

        expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Final Budget',
            themeColor: 'red',
            type: 'monthly',
            monthlyData: expect.objectContaining({
                salary: 5000,
                fixedExpenses: expect.arrayContaining([
                    expect.objectContaining({ label: 'Rent', amount: 1000 })
                ])
            })
        }));
    });
});
