import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ShareModalComponent } from './components/share-modal/share-modal.component';
import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { signal, WritableSignal, Pipe, PipeTransform } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';
import { RecurringTransaction, Budget } from '../../shared/models/budget.models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { LanguageService } from '../../core/services/language.service';

vi.mock('canvas-confetti', () => {
    return {
        default: vi.fn()
    };
});

// Mock Services
const mockAuthService = {
    logout: vi.fn(),
    currentUser: signal({ uid: 'test-user', email: 'test@test.com' })
};

const mockBudgets = signal<Budget[]>([
    { id: 'b1', name: 'Wallet 1', type: 'wallet', transactions: [{ id: 'tx-123', amount: 10, label: 'Test', type: 'outcome', dateStr: '2023-01-01' }], themeColor: 'blue', icon: '💰', recurring: [] },
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
    updateGoal: vi.fn().mockResolvedValue(true),
    deleteGoal: vi.fn().mockResolvedValue(true),
    addRecurringTransaction: vi.fn().mockResolvedValue(true),
    deleteRecurringTransaction: vi.fn().mockResolvedValue(true),
    inviteUserToBudget: vi.fn().mockResolvedValue(true)
};

const mockToastService = {
    show: vi.fn()
};

const mockRouter = {
    navigate: vi.fn()
};

// Enhanced Mock to verify pipe interactions
@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
    transform(key: string): string {
        return `TR: ${key}`;
    }
}

const mockLanguageService = {
    currentLang: signal('en'),
    toggle: vi.fn(),
    translate: (key: string) => `TR: ${key}`
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
            imports: [DashboardComponent], // TranslatePipe is in imports but we will override
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: BudgetService, useValue: mockBudgetService },
                { provide: ToastService, useValue: mockToastService },
                { provide: Router, useValue: mockRouter },
                { provide: LanguageService, useValue: mockLanguageService }
            ]
        })
            .overrideComponent(DashboardComponent, {
                remove: { imports: [TranslatePipe] },
                add: { imports: [MockTranslatePipe, ShareModalComponent] }
            })
            .compileComponents();

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
        // Click it
        fab.triggerEventHandler('click', null);
        fixture.detectChanges();

        const modal = fixture.debugElement.query(By.css('app-transaction-modal'));
        expect(modal).toBeTruthy();
        expect(component.showTransactionModal()).toBe(true);
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
    it('should open Recurring Manager when button clicked', () => {
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

    // --- 6. Theming & I18n ---
    it('should show translated titles using the pipe', () => {
        // e.g., The analytics chart title or empty state
        // Let's assert that texts starting with TR: are present, verifying the pipe is active
        const mainElement = fixture.debugElement.nativeElement;
        expect(mainElement.textContent).toContain('TR: ');
    });

    it('should have dark mode class on main container', () => {
        // We added `dark:bg-[#000000]` to the main tag
        const main = fixture.debugElement.query(By.css('main'));
        expect(main.classes['dark:bg-[#000000]']).toBe(true);
    });

    // --- 7. Budget Creation Logic (Regression Test) ---
    it('should handle budget creation with themeColor and extra data (Wizard Payload)', async () => {
        const wizardPayload = {
            name: 'Wizard Budget',
            themeColor: 'pink',
            icon: '🧙',
            type: 'monthly',
            monthlyData: { salary: 5000, fixedExpenses: [], variableExpenses: [] }
        };

        await component.handleCreateBudget(wizardPayload);

        expect(mockBudgetService.createBudget).toHaveBeenCalledWith(
            'Wizard Budget',
            'pink', // Should map themeColor -> color param
            '🧙',
            'monthly',
            { monthlyData: wizardPayload.monthlyData } // Extra data
        );
        expect(mockToastService.show).toHaveBeenCalledWith('Budget créé avec succès', 'success');
    });

    it('should handle budget creation with standard payload (Modal Payload)', async () => {
        const modalPayload = {
            name: 'Standard Budget',
            color: 'blue',
            icon: '💰',
            type: 'wallet'
        };

        await component.handleCreateBudget(modalPayload);

        expect(mockBudgetService.createBudget).toHaveBeenCalledWith(
            'Standard Budget',
            'blue',
            '💰',
            'wallet',
            {} // Empty extra data
        );
    });

    // --- 8. Skeleton Loading ---
    it('should show skeleton when loading', () => {
        // Toggle loading
        mockBudgetService.isLoading.set(true);
        fixture.detectChanges();

        const skeleton = fixture.debugElement.query(By.css('app-skeleton'));
        expect(skeleton).toBeTruthy();

        // Turn off
        mockBudgetService.isLoading.set(false);
        fixture.detectChanges();

        // Should show content again (e.g. balance or empty state)
        const skeletonAfter = fixture.debugElement.query(By.css('app-skeleton'));
        expect(skeletonAfter).toBeFalsy();
    });

    // --- 9. Gamification (Confetti) ---
    it('should trigger celebration when goal reached', async () => {
        const goal = { id: 'g1', name: 'Trip', targetAmount: 1000, currentAmount: 500, icon: '✈️', color: 'blue' };
        mockBudgetService.budgets.set([{ id: 'b1', name: 'B1', type: 'wallet', transactions: [], goals: [goal], recurring: [] } as any]);
        fixture.detectChanges();

        // Update goal to target amount
        await component.handleUpdateGoal(goal, 1000);

        // Expect Toast to show congratulation message (Confetti logic is inside the same block)
        // Wait for dynamic import
        await vi.waitFor(() => {
            expect(mockToastService.show).toHaveBeenCalledWith(
                expect.stringContaining('Félicitations'),
                'success'
            );
        });
    });


    // --- 10. Shared Budgets ---
    it('should open share modal and invite user', async () => {
        const goal = { id: 'g1', name: 'Trip', targetAmount: 1000, currentAmount: 500, icon: '✈️', color: 'blue' };
        mockBudgetService.budgets.set([{ id: 'b1', name: 'B1', ownerId: 'uid1', type: 'wallet', transactions: [], goals: [], recurring: [] } as any]);
        component.selectedBudgetId.set('b1');
        fixture.detectChanges();

        // Open Modal
        component.showShareModal.set(true);
        fixture.detectChanges();

        const modal = fixture.debugElement.query(By.css('app-share-modal'));
        expect(modal).toBeTruthy();

        // Simulate invitation
        const shareComponent = modal.componentInstance as ShareModalComponent;
        shareComponent.email = 'invite@test.com';
        await shareComponent.invite();

        expect(mockBudgetService.inviteUserToBudget).toHaveBeenCalledWith('b1', 'invite@test.com');
    });
});
