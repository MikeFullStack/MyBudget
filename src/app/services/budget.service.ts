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
    or,
    orderBy
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

    // Subcollection State
    readonly activeTransactions = signal<Transaction[]>([]);
    private transactionsUnsub: (() => void) | null = null;

    loadBudgetTransactions(budgetId: string) {
        // Unsubscribe previous
        if (this.transactionsUnsub) {
            this.transactionsUnsub();
            this.transactionsUnsub = null;
        }

        const user = this.authService.currentUser();
        const budget = this.budgets().find(b => b.id === budgetId);

        if (!user || !budget) {
            this.activeTransactions.set([]);
            return;
        }

        const ownerId = budget.ownerId || user.uid;
        const ref = collection(this.db, 'artifacts', 'mon-budget', 'users', ownerId, 'budgets', budgetId, 'transactions');
        const q = query(ref, orderBy('dateStr', 'desc')); // Order by date

        this.transactionsUnsub = onSnapshot(q, (snap) => {
            const txs = snap.docs.map(d => d.data() as Transaction);
            this.activeTransactions.set(txs);
        }, (err) => {
            console.error('Error loading transactions subcollection', err);
            this.activeTransactions.set([]);
        });
    }

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

            // Strategy: Hybrid Listener
            // 1. Listen to OWN budgets directly (latency compensated, fast, reliable)
            // 2. Listen to SHARED budgets via Collection Group (for discovery)

            let ownedBudgets: Budget[] = [];
            let sharedBudgets: Budget[] = [];

            const updateState = () => {
                const map = new Map<string, Budget>();
                ownedBudgets.forEach(b => map.set(b.id, b));
                sharedBudgets.forEach(b => map.set(b.id, b));

                const combined = Array.from(map.values());
                this.budgets.set(combined);
                this.isLoading.set(false);
            };

            // 1. Owned Budgets Listener
            const ownedRef = collection(this.db, 'artifacts', 'mon-budget', 'users', user.uid, 'budgets');
            const unsubOwned = onSnapshot(ownedRef, (snap) => {
                ownedBudgets = snap.docs.map(d => ({ ...d.data(), id: d.id } as Budget));
                updateState();
            }, (err) => {
                console.error('Owned budgets listener error', err);
                this.isLoading.set(false);
            });

            // 2. Shared Budgets Listener
            import('firebase/firestore').then(({ collectionGroup, where, onSnapshot }) => {
                const sharedQuery = query(
                    collectionGroup(this.db, 'budgets'),
                    where('participants', 'array-contains', user.email)
                );

                const unsubShared = onSnapshot(sharedQuery, (snap) => {
                    sharedBudgets = snap.docs.map(d => ({ ...d.data(), id: d.id } as Budget));

                    // Start Migration Check: Add Self ID if missing
                    sharedBudgets.forEach(b => {
                        const hasMyId = b.participantIds?.includes(user.uid);
                        // If I see it (via email rule) but my ID is not in the secure list, ADD IT.
                        if (!hasMyId) {
                            console.log(`Migrating budget ${b.name} to UID permissions...`);
                            const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', b.ownerId || user.uid, 'budgets', b.id);
                            updateDoc(ref, {
                                participantIds: arrayUnion(user.uid)
                            }).catch(e => console.error('Migration failed', e)); // Fail silently/log
                        }
                    });

                    updateState();
                }, (err) => {
                    console.error('Shared budgets listener error', err);
                    // Don't stop loading here, owned might have worked
                });

                onCleanup(() => {
                    unsubOwned();
                    unsubShared();
                });
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
                participants: [user.email || ''], // Legacy & for Invite display
                participantIds: [user.uid], // Secure Access
                themeColor,
                icon,
                // transactions: [], // REMOVED: Managed in subcollection now
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

        // Determine path: owned vs shared?
        // Ideally we should know the OWNER of the budget to construct the path.
        // For now, we assume we are working on a budget we have access to via the known path pattern.
        // But if it's shared, we need the ownerId.
        const budget = this.budgets().find(b => b.id === budgetId);
        if (!budget) throw new Error('Budget not found locally');

        // Path construction: artifacts/mon-budget/users/{ownerId}/budgets/{budgetId}/transactions/{txId}
        const ownerId = budget.ownerId || user.uid; // Fallback to self if missing (shouldn't happen on new budgets)

        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', ownerId, 'budgets', budgetId, 'transactions', transaction.id);

        await setDoc(ref, transaction);
    }

    async deleteTransaction(budgetId: string, transactionId: string): Promise<void> {
        const user = this.authService.currentUser();
        const budget = this.budgets().find(b => b.id === budgetId);
        if (!user || !budget) return;

        const ownerId = budget.ownerId || user.uid;
        const ref = doc(this.db, 'artifacts', 'mon-budget', 'users', ownerId, 'budgets', budgetId, 'transactions', transactionId);

        await deleteDoc(ref);
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
            // await updateDoc(ref, { transactions }); // REMOVED

            // Add to subcollection
            for (const t of transactions) {
                await this.addTransaction(walletId, t);
            }

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
                // await updateDoc(mRef, { transactions: mTransactions }); // REMOVED

                for (const t of mTransactions) {
                    await this.addTransaction(monthlyId, t);
                }
            }

        } catch (err) {
            console.error('Seeding failed', err);
            throw err;
        }
    }
}
