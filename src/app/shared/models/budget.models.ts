export interface Transaction {
    id: string;
    label: string;
    amount: number;
    type: 'income' | 'outcome';
    dateStr: string;
    category?: string;
    description?: string;
}

export interface MonthlyExpense {
    id: string;
    label: string;
    amount: number;
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    icon: string;
    color: string;
}

export interface RecurringTransaction {
    id: string;
    label: string;
    amount: number;
    type: 'income' | 'outcome';
    category: string;
    frequency: 'monthly' | 'weekly' | 'yearly';
    nextDueDate: string;
}

export interface Budget {
    id: string;
    name: string;
    icon: string;
    transactions: Transaction[];
    themeColor: string;
    type?: 'wallet' | 'monthly';
    monthlyData?: {
        salary: number;
        fixedExpenses: MonthlyExpense[];
        variableExpenses: MonthlyExpense[];
    };
    goals?: SavingsGoal[];
    recurring?: RecurringTransaction[];
    ownerId?: string;
    participants?: string[]; // Emails (Legacy/Invite)
    participantIds?: string[]; // UIDs (Secure)
}
