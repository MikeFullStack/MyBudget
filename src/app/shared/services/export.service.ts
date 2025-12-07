import { Injectable } from '@angular/core';
import { Budget, Transaction } from '../models/budget.models';

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    downloadBudgetAsJSON(budget: Budget) {
        const dataStr = JSON.stringify(budget, null, 2);
        const filename = `budget_${budget.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        this.downloadFile(dataStr, filename, 'application/json');
    }

    downloadTransactionsAsCSV(transactions: Transaction[], budgetName: string) {
        if (!transactions.length) return;

        // Header
        const headers = ['Date', 'Label', 'Amount', 'Type', 'Category', 'Description'];
        const rows = transactions.map(t => [
            t.dateStr,
            `"${t.label.replace(/"/g, '""')}"`, // Escape quotes
            t.amount.toFixed(2),
            t.type,
            t.category || '',
            `"${(t.description || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const filename = `transactions_${budgetName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadFile(csvContent, filename, 'text/csv');
    }

    private downloadFile(content: string, filename: string, type: string) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
