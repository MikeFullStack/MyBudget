import { effect, inject, Injectable, signal } from '@angular/core';
import {
    collection,
    doc,
    deleteDoc,
    Firestore,
    onSnapshot,
    query,
    setDoc,
    updateDoc,
    runTransaction,
    arrayUnion,
    arrayRemove,
    collectionGroup,
    where,
    or
} from 'firebase/firestore';
import { db, firebaseConfig } from '../core/firebase-init';
import { Budget, Transaction } from '../shared/models/budget.models';
import { AuthService } from './auth.service';
import { LoggerService } from '../core/services/logger.service';

// declare const __app_id: string | undefined;
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

@Injectable({ providedIn: 'root' })
export class BudgetService {
    private db: Firestore = db;
    private authService = inject(AuthService);
    private logger = inject(LoggerService);

    // State
    readonly budgets = signal<Budget[]>([]);
    readonly isLoading = signal<boolean>(true);

    constructor() {
        // Réagir automatiquement aux changements d'utilisateur pour charger les données
        effect((onCleanup) => {
            const user = this.authService.currentUser();

            if (!user) {
                this.budgets.set([]);
                this.isLoading.set(false);
                return;
            }

            this.isLoading.set(true);
            this.logger.phase('DONNÉES', 'Synchronisation avec le cloud (Partagé)...');

            // Query 1: My Budgets (Nested)
            // const qOwned = query(collection(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets'));

            // BETTER APPROACH: Use Collection Group to find *any* budget where I am owner OR participant
            // This requires that all budgets have 'ownerId' set correctly.
            // Since we are migrating, old budgets might default (handle that?).

            // To make it simple and working with current structure + sharing:
            // We'll listen to the specific paths if we knew them, but here we want discovery.

            // Strategy:
            // 1. Listen to my own budgets (fast, direct).
            // 2. Listen to budgets where I am a participant (Collection Group).
            // But Collection Group listeners can be expensive? No, it's fine.

            // Actually, if we use Collection Group for everything, we need unique IDs across the system.
            // Firestore IDs are usually unique enough.

            const budgetsRef = collectionGroup(this.db, 'budgets');

            // Complex OR query might require index.
            // Let's rely on 2 listeners and merge? Or just one simple logic?
            // "ownerId == uid" OR "participants array-contains email"

            // Note: OR queries in Firestore have limitations.
            // Let's try to query where participants contains my email.
            // AND query my own path.

            // Wait, collectionGroup 'budgets' includes my nested budgets too!
            // So if I query collectionGroup('budgets') where ownerId == uid, I get mine.
            // If I query collectionGroup('budgets') where participants contains email, I get shared.
            // I can combine them with `or(...)` if I have the index.

            // For now, let's implement the `or` query.
            // We need to import `collectionGroup` and `or`, `where`.

            import('firebase/firestore').then(({ collectionGroup, where, or, onSnapshot }) => {
                const q = query(
                    collectionGroup(this.db, 'budgets'),
                    or(
                        where('ownerId', '==', user.uid),
                        where('participants', 'array-contains', user.email)
                    )
                );

                const unsubscribe = onSnapshot(q, {
                    next: (snapshot) => {
                        const data = snapshot.docs.map(d => {
                            const b = d.data() as Budget;
                            b.id = d.id; // Ensure ID is correct
                            // Inject path for updates? Not needed if we use ID and assume structure?
                            // Actually updates need to know the path (ownerId).
                            // So we should store the 'ref.path' or similar if we want to update shared budgets.
                            return b;
                        });

                        // We need a way to know the *path* to update shared budgets later.
                        // Let's store a hidden metadata map of ID -> Path?
                        // Or just store ownerId in the Budget object (we added it).
                        // If we know ownerId, we know the path: users/{ownerId}/budgets/{budgetId}.

                        this.budgets.set(data);
                        this.isLoading.set(false);
                        this.processRecurringTransactions(data);
                    },
                    error: (err) => {
                        console.error('Snapshot Error', err);
                        // Fallback to local only query if index missing?
                        this.isLoading.set(false);
                    }
                });
                onCleanup(() => unsubscribe());
            });
        });
    }

    // --- CRUD Operations ---

    async createBudget(name: string, themeColor: string, icon: string, type: 'wallet' | 'monthly' = 'wallet', initialData?: any) {
        const user = this.authService.currentUser();
        if (!user) return null;

        try {
            const budgetRef = doc(collection(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets'));
            const newBudget: Omit<Budget, 'id'> & { id: string } = {
                id: budgetRef.id,
                name,
                ownerId: user.uid,
                participants: [],
                themeColor,
                icon,
                transactions: [],
                type,
                ...initialData
            };

            if (type === 'monthly' && !newBudget.monthlyData) {
                newBudget.monthlyData = { salary: 0, fixedExpenses: [], variableExpenses: [] };
            }

            await setDoc(budgetRef, newBudget);
            return budgetRef.id;
        } catch (err) {
            console.error('Error creating budget:', err);
            throw err;
        }
    }

    async inviteUserToBudget(budgetId: string, email: string) {
        // Warning: This updates the local path, but if the budget is SHARED (not owned), we need the correct path.
        // For now, we assume we are the owner or have the path in state if we want to invite.
        // BUT, if we loaded via CollectionGroup, we might not have the full path easily unless we stored it.
        // Simplified: We assume we own it for now or query lookup.

        // Robust way: Query to find the doc path then update.
        // Since we are using Collection Group for read, write is harder without path.
        // Workaround: We will search for the budget in our loaded list, which hopefully has data.
        // If we are the owner, it is in 'users/me/budgets'.

        const user = this.authService.currentUser();
        if (!user) return;

        const budget = this.budgets().find(b => b.id === budgetId);
        if (!budget) throw new Error('Budget not found');

        // If I am owner:
        let ref;
        if (budget.ownerId === user.uid) {
            ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
        } else {
            // I am a participant inviting someone else? 
            // Logic: Only owner can invite for now.
            throw new Error('Only the owner can invite users');
        }

        await updateDoc(ref, {
            participants: arrayUnion(email)
        });
    }

    async updateBudget(budgetId: string, data: Partial<Budget>) {
        const user = this.authService.currentUser();
        if (!user) return;
        try {
            const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
            await updateDoc(ref, data);
        } catch (err) {
            console.error('Update budget error', err);
            throw err;
        }
    }

    async addTransaction(budgetId: string, transaction: Transaction): Promise<void> {
        const user = this.authService.currentUser();
        if (!user) return;

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);

        // Atomic Add (Offline Safe)
        await updateDoc(ref, {
            transactions: arrayUnion(transaction)
        });
    }

    async deleteTransaction(budgetId: string, transactionId: string): Promise<void> {
        const user = this.authService.currentUser();
        const budget = this.budgets().find(b => b.id === budgetId);

        if (!user || !budget) return;

        // Find the EXACT object reference/value to remove
        const transactionToRemove = budget.transactions.find(t => t.id === transactionId);
        if (!transactionToRemove) {
            console.warn('Transaction not found locally, cannot remove atomically');
            return;
        }

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);

        // Atomic Remove (Offline Safe)
        await updateDoc(ref, {
            transactions: arrayRemove(transactionToRemove)
        });
    }

    async deleteBudget(budgetId: string): Promise<void> {
        const user = this.authService.currentUser();
        if (!user) return;

        try {
            const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
            await deleteDoc(ref);
        } catch (err) {
            console.error('Error deleting budget:', err);
            throw err;
        }
    }

    // --- Savings Goals ---

    async addGoal(budgetId: string, goal: import('../shared/models/budget.models').SavingsGoal) {
        const user = this.authService.currentUser();
        if (!user) return;

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
        await updateDoc(ref, {
            goals: arrayUnion(goal)
        });
    }

    async deleteGoal(budgetId: string, goalId: string) {
        const user = this.authService.currentUser();
        const budget = this.budgets().find(b => b.id === budgetId);
        if (!user || !budget || !budget.goals) return;

        const goal = budget.goals.find(g => g.id === goalId);
        if (!goal) return;

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
        await updateDoc(ref, {
            goals: arrayRemove(goal)
        });
    }

    async updateGoal(budgetId: string, goal: import('../shared/models/budget.models').SavingsGoal) {
        const user = this.authService.currentUser();
        const budget = this.budgets().find(b => b.id === budgetId);
        if (!user || !budget || !budget.goals) return;

        const oldGoal = budget.goals.find(g => g.id === goal.id);
        if (!oldGoal) return;

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);

        // Remove old and add new (Simulate Update)
        await updateDoc(ref, { goals: arrayRemove(oldGoal) });
        await updateDoc(ref, { goals: arrayUnion(goal) });
    }

    // --- Recurring Transactions ---

    async addRecurringTransaction(budgetId: string, recurring: import('../shared/models/budget.models').RecurringTransaction) {
        const user = this.authService.currentUser();
        if (!user) return;

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
        await updateDoc(ref, {
            recurring: arrayUnion(recurring)
        });
    }

    async deleteRecurringTransaction(budgetId: string, recurringId: string) {
        const user = this.authService.currentUser();
        const budget = this.budgets().find(b => b.id === budgetId);
        if (!user || !budget || !budget.recurring) return;

        const toRemove = budget.recurring.find(r => r.id === recurringId);
        if (!toRemove) return;

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budgetId);
        await updateDoc(ref, {
            recurring: arrayRemove(toRemove)
        });
    }

    // Process logic to run on load
    async processRecurringTransactions(budgets: Budget[]) {
        const user = this.authService.currentUser();
        if (!user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const budget of budgets) {
            if (!budget.recurring || budget.recurring.length === 0) continue;

            let needsUpdate = false;
            let newTransactions = [...budget.transactions];
            // Deep copy to avoid mutating signal value directly before write
            let updatedRecurring = budget.recurring.map(r => ({ ...r }));

            for (const rule of updatedRecurring) {
                const dueDate = new Date(rule.nextDueDate);
                dueDate.setHours(0, 0, 0, 0);

                if (dueDate <= today) {
                    needsUpdate = true;
                    // Generate Transaction
                    const newTx: Transaction = {
                        id: crypto.randomUUID(),
                        label: rule.label,
                        amount: rule.amount,
                        type: rule.type,
                        dateStr: rule.nextDueDate, // Use the due date as transaction date
                        category: rule.category,
                        description: 'Généré automatiquement (Récurrent)'
                    };
                    newTransactions = [newTx, ...newTransactions];

                    // Calculate next due date
                    const nextDate = new Date(dueDate);
                    if (rule.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                    else if (rule.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                    else if (rule.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

                    rule.nextDueDate = nextDate.toISOString().split('T')[0];
                }
            }

            if (needsUpdate) {
                try {
                    console.log(`[BudgetService] Processing recurring items for ${budget.name}`);
                    const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', budget.id);
                    await updateDoc(ref, {
                        transactions: newTransactions,
                        recurring: updatedRecurring
                    });
                } catch (err) {
                    console.error('Failed to process recurring transactions', err);
                }
            }
        }
    }

    async seedDemoData() {
        const user = this.authService.currentUser();
        if (!user) return;

        try {
            // 1. Create Wallet
            const walletId = await this.createBudget('Compte Principal', 'blue', '💳', 'wallet');
            if (!walletId) return;

            // 2. Add Transactions
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            const transactions: Transaction[] = [
                { id: crypto.randomUUID(), label: 'Salaire', amount: 3500, type: 'income', dateStr: today, category: 'Salaire', description: 'Virement mensuel' },
                { id: crypto.randomUUID(), label: 'Loyer', amount: 1200, type: 'outcome', dateStr: today, category: 'Logement' },
                { id: crypto.randomUUID(), label: 'Courses', amount: 154.30, type: 'outcome', dateStr: yesterday, category: 'Alimentation' },
                { id: crypto.randomUUID(), label: 'Transport', amount: 85, type: 'outcome', dateStr: yesterday, category: 'Transport' },
                { id: crypto.randomUUID(), label: 'Restaurant', amount: 65.50, type: 'outcome', dateStr: yesterday, category: 'Loisirs' },
                { id: crypto.randomUUID(), label: 'Freelance', amount: 450, type: 'income', dateStr: yesterday, category: 'Revenus extra' }
            ];

            const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', walletId);
            await updateDoc(ref, { transactions });

            // 3. Add Goal
            const goal: import('../shared/models/budget.models').SavingsGoal = {
                id: crypto.randomUUID(),
                name: 'Vacances',
                targetAmount: 2000,
                currentAmount: 1250,
                icon: '✈️',
                color: 'orange'
            };
            await this.addGoal(walletId, goal);

            // 4. Add Recurring
            const recurring: import('../shared/models/budget.models').RecurringTransaction = {
                id: crypto.randomUUID(),
                label: 'Netflix',
                amount: 15.99,
                type: 'outcome',
                category: 'Abonnements',
                frequency: 'monthly',
                nextDueDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0]
            };
            await this.addRecurringTransaction(walletId, recurring);

            await this.addRecurringTransaction(walletId, recurring);

            // ---------------------------------------------------------
            // 5. Create Monthly Budget (Planner)
            // ---------------------------------------------------------
            const monthlyId = await this.createBudget('Plan Mensuel', 'purple', '📅', 'monthly', {
                monthlyData: {
                    salary: 4200,
                    fixedExpenses: [
                        { id: crypto.randomUUID(), label: 'Loyer', amount: 1350 },
                        { id: crypto.randomUUID(), label: 'Internet + Tel', amount: 65 },
                        { id: crypto.randomUUID(), label: 'Électricité', amount: 90 },
                        { id: crypto.randomUUID(), label: 'Assurance Auto', amount: 45 }
                    ],
                    variableExpenses: [
                        { id: crypto.randomUUID(), label: 'Courses', amount: 400 },
                        { id: crypto.randomUUID(), label: 'Sorties', amount: 200 },
                        { id: crypto.randomUUID(), label: 'Essence', amount: 150 }
                    ]
                }
            });

            if (monthlyId) {
                // Add matching transactions to visualize progress
                const mTransactions: Transaction[] = [
                    { id: crypto.randomUUID(), label: 'Salaire', amount: 4200, type: 'income', dateStr: today, category: 'Salaire' },
                    { id: crypto.randomUUID(), label: 'Loyer Décembre', amount: 1350, type: 'outcome', dateStr: today, category: 'Logement' },
                    { id: crypto.randomUUID(), label: 'Orange', amount: 65, type: 'outcome', dateStr: yesterday, category: 'Factures' },
                    { id: crypto.randomUUID(), label: 'Carrefour', amount: 124.50, type: 'outcome', dateStr: yesterday, category: 'Alimentation' },
                    { id: crypto.randomUUID(), label: 'Cinema', amount: 24, type: 'outcome', dateStr: yesterday, category: 'Loisirs' },
                    { id: crypto.randomUUID(), label: 'Bar', amount: 45, type: 'outcome', dateStr: yesterday, category: 'Loisirs' }
                ];

                const mRef = doc(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets', monthlyId);
                await updateDoc(mRef, { transactions: mTransactions });
            }

        } catch (err) {
            console.error('Seeding failed', err);
            throw err;
        }
    }
}
