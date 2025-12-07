import { TestBed } from '@angular/core/testing';
import { BudgetService } from './budget.service';
import { AuthService } from './auth.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as firestore from 'firebase/firestore';

// Mock Firebase functions
vi.mock('firebase/firestore', async () => {
    return {
        getFirestore: vi.fn(),
        collection: vi.fn(),
        doc: vi.fn(() => ({ id: 'mock-id' })),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        onSnapshot: vi.fn(),
        query: vi.fn(),
        arrayUnion: vi.fn()
    };
});

// Mock AuthService
const mockAuthService = {
    currentUser: vi.fn(),
};

describe('BudgetService', () => {
    let service: BudgetService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BudgetService,
                { provide: AuthService, useValue: mockAuthService }
            ]
        });
        service = TestBed.inject(BudgetService);
        mockAuthService.currentUser.mockReturnValue({ uid: 'test-user' });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should seed demo data correctly (Wallet + Monthly)', async () => {
        // Spy on internal createBudget if possible, or check firestore calls
        // Since createBudget is part of the class, we can spy on it?
        // Better: Check side effects (setDoc calls)

        // Since seedDemoData now calls addTransaction which does a lookup of the budget in the local state,
        // we must mock that state.

        // Mock that the budget was "created" and exists in state
        (service.budgets as any).set([
            { id: 'mock-id', ownerId: 'test-user', transactions: [] } // 'mock-id' is what doc().id returns in our mock
        ]);

        await service.seedDemoData();

        // Create Budget calls
        const setDocCalls = (firestore.setDoc as any).mock.calls;
        const budgetCalls = setDocCalls.filter((c: any) => c[1].type === 'wallet' || c[1].type === 'monthly');

        expect(budgetCalls.length).toBe(2);

        // 1. Wallet
        expect(firestore.setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            type: 'wallet',
            name: 'Compte Principal'
        }));

        // 2. Monthly
        const calls = (firestore.setDoc as any).mock.calls;
        const monthlyCall = calls.find((c: any) => c[1].type === 'monthly');
        expect(monthlyCall).toBeTruthy();
        expect(monthlyCall[1].monthlyData.salary).toBe(4200);
        expect(monthlyCall[1].monthlyData.fixedExpenses.length).toBeGreaterThan(0);
    });
});
