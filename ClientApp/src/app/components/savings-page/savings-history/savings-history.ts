import { Component, Input } from '@angular/core';

import { SavingsCategory, SavingsTransaction } from '../../../models/savings.model';

@Component({
    selector: 'app-savings-history',
    standalone: true,
    templateUrl: './savings-history.html',
    styleUrl: './savings-history.css',
})
export class SavingsHistoryComponent {
    @Input() transactions: SavingsTransaction[] = [];
    @Input() categories: SavingsCategory[] = [];

    protected transactionLabel(transaction: SavingsTransaction): string {
        const from = this.categories.find((category) => category.id === transaction.fromCategoryId)?.name;
        const to = this.categories.find((category) => category.id === transaction.toCategoryId)?.name;
        return transaction.type === 'TRANSFER' ? `${from} to ${to}` : to || from || 'All envelopes';
    }
    protected transactionTypeLabel(type: SavingsTransaction['type']): string { return ({ BULK_DEPOSIT: 'Bulk deposit', TOP_UP: 'Top up', TRANSFER: 'Transfer', WITHDRAWAL: 'Withdrawal' })[type]; }
    protected formatCurrency(value: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
    protected formatDate(value: string): string { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
}
