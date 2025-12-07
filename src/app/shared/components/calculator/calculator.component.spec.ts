import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalculatorComponent } from './calculator.component';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('CalculatorComponent', () => {
    let component: CalculatorComponent;
    let fixture: ComponentFixture<CalculatorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CalculatorComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CalculatorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should append numbers correctly', () => {
        component.append('5');
        component.append('3');
        expect(component.currentInput).toBe('53');
    });

    it('should handle decimal points', () => {
        component.append('5');
        component.append('.');
        component.append('5');
        component.append('.'); // Should ignore second dot
        expect(component.currentInput).toBe('5.5');
    });

    it('should clear inputs', () => {
        component.append('123');
        component.setOperator('+');
        component.clear();
        expect(component.currentInput).toBe('');
        expect(component.previousInput).toBe('');
        expect(component.operator).toBeNull();
    });

    it('should perform addition', () => {
        component.append('10');
        component.setOperator('+');
        component.append('20');
        component.calculate();
        expect(component.currentInput).toBe('30');
    });

    it('should perform subtraction', () => {
        component.append('10');
        component.setOperator('-');
        component.append('5');
        component.calculate();
        expect(component.currentInput).toBe('5');
    });

    it('should perform multiplication', () => {
        component.append('10');
        component.setOperator('*');
        component.append('5');
        component.calculate();
        expect(component.currentInput).toBe('50');
    });

    it('should perform division', () => {
        component.append('10');
        component.setOperator('/');
        component.append('2');
        component.calculate();
        expect(component.currentInput).toBe('5');
    });

    it('should toggle sign', () => {
        component.append('10');
        component.toggleSign();
        expect(component.currentInput).toBe('-10');
        component.toggleSign();
        expect(component.currentInput).toBe('10');
    });

    it('should chain operations', () => {
        component.append('10');
        component.setOperator('+');
        component.append('10');
        component.setOperator('+'); // Implicitly calculates 10+10=20
        expect(component.currentInput).toBe('20');
        expect(component.previousInput).toBe('20');

        component.append('5');
        component.calculate();
        expect(component.currentInput).toBe('25');
    });

    it('should emit value on submit', () => {
        const applySpy = vi.spyOn(component.apply, 'emit');
        const closeSpy = vi.spyOn(component.close, 'emit');

        component.append('100');
        component.submit();

        expect(applySpy).toHaveBeenCalledWith(100);
        expect(closeSpy).toHaveBeenCalled();
    });
});
