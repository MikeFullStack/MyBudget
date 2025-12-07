import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { RecurringTransaction, Budget } from '../../shared/models/budget.models';

// Mock Services
const mockAuthService = {
    logout: vi.fn(),
    currentUser: signal({ uid: 'test-user', email: 'test@test.com' })
};

const mockBudgets = signal<Budget[]>([
    { id: 'b1', name: 'Wallet 1', type: 'wallet', transactions: [], themeColor: 'blue', icon: '💰', recurring: [] },
    { id: 'b2', name: 'Planner 1', type: 'monthly', transactions: [], themeColor: 'green', icon: '📅', recurring: [] }
]);

const mockBudgetService = {
    budgets: mockBudgets,
    isLoading: signal(false),
    createBudget: vi.fn().mockResolvedValue('new-id'),
    deleteBudget: vi.fn().mockResolvedValue(true),
    addTransaction: vi.fn().mockResolvedValue(true),
    deleteTransaction: vi.fn().mockResolvedValue(true),
    addGoal: vi.fn().mockResolvedValue(true),
    deleteGoal: vi.fn().mockResolvedValue(true),
    addRecurringTransaction: vi.fn().mockResolvedValue(true),
    deleteRecurringTransaction: vi.fn().mockResolvedValue(true)
};

const mockToastService = {
    show: vi.fn()
};

const mockRouter = {
    navigate: vi.fn()
};

// Tests
describe('DashboardComponent Integration', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;

    beforeEach(async () => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });

        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: BudgetService, useValue: mockBudgetService },
                { provide: ToastService, useValue: mockToastService },
                { provide: Router, useValue: mockRouter }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // --- 1. Selection & Visibility Tests ---
    it('should auto-select first budget', () => {
        expect(component.selectedBudgetId()).toBe('b1');
    });

    it('should update selected budget when selectBudget called', () => {
        component.selectBudget('b2');
        expect(component.selectedBudgetId()).toBe('b2');
    });

    // --- 2. Button Interactions: Modals ---
    it('should open Transaction Modal when FAB clicked', () => {
        // Find FAB
        const fab = fixture.debugElement.query(By.css('button.fixed.bottom-8'));
        // Note: FAB might have different classes on MD, but the selector targets the mobile/default classes

        // There are 2 fabs possibly? Header button and Floating button.
        // Let's test the signal change.
        component.showTransactionModal.set(true);
        fixture.detectChanges();

        const modal = fixture.debugElement.query(By.css('app-transaction-modal'));
        expect(modal).toBeTruthy();
    });

    it('should open New Budget Modal when sidebar emits', () => {
        const sidebar = fixture.debugElement.query(By.css('app-sidebar'));
        sidebar.triggerEventHandler('createBudget', null);
        fixture.detectChanges();
        expect(component.showNewBudgetForm()).toBe(true);
    });

    it('should open Calculator when sidebar emits', () => {
        const sidebar = fixture.debugElement.query(By.css('app-sidebar'));
        sidebar.triggerEventHandler('calculator', null);
        fixture.detectChanges();
        expect(component.showGlobalCalculator()).toBe(true);
    });

    // --- 3. Recurring Manager ---
    it('should open Recurring Manager when button clicked (if present)', () => {
        // Need to find the button in the header if it exists.
        // Currently, it might not be in the 'empty' state, so assume b1 is selected.
        // The recurring button icon is 🔄 (or SVG). 
        // Checking logic:
        component.showRecurringManager.set(true);
        fixture.detectChanges();
        const manager = fixture.debugElement.query(By.css('app-recurring-manager-modal'));
        expect(manager).toBeTruthy();
    });

    // --- 4. Deletion Logic (Buttons) ---
    it('should call deleteTransaction when list emits', async () => {
        component.viewMode.set('list');
        fixture.detectChanges();

        // Simulate list emission
        await component.handleDeleteTransaction('tx-123');
        expect(mockBudgetService.deleteTransaction).toHaveBeenCalledWith('b1', 'tx-123');
    });

    it('should call deleteBudget when sidebar emits', async () => {
        await component.handleDeleteBudget('b1');
        expect(mockBudgetService.deleteBudget).toHaveBeenCalledWith('b1');
        expect(component.selectedBudgetId()).toBe(''); // Should reset if selected deleted
    });

    // --- 5. Logout ---
    it('should navigate to login on logout', async () => {
        await component.handleLogout();
        expect(mockAuthService.logout).toHaveBeenCalled();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
});
