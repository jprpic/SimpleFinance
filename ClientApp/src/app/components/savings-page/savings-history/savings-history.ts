import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { SavingsCategory, SavingsTransaction } from '../../../models/savings.model';

@Component({
    selector: 'app-savings-history',
    standalone: true,
    templateUrl: './savings-history.html',
    styleUrl: './savings-history.css',
})
export class SavingsHistoryComponent implements OnChanges {
    @Input() transactions: SavingsTransaction[] = [];
    @Input() categories: SavingsCategory[] = [];
    @Output() editRequested = new EventEmitter<SavingsTransaction>();
    @Output() deleteRequested = new EventEmitter<string>();
    protected readonly pageSize = 10;
    protected currentPage = 1;

    protected get totalPages(): number { return Math.ceil(this.transactions.length / this.pageSize); }
    protected get pagedTransactions(): SavingsTransaction[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.transactions.slice(startIndex, startIndex + this.pageSize);
    }
    protected get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, index) => index + 1); }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['transactions']) this.currentPage = 1;
    }

    protected goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) this.currentPage = page;
    }
    protected goToPreviousPage(): void { this.goToPage(this.currentPage - 1); }
    protected goToNextPage(): void { this.goToPage(this.currentPage + 1); }

    protected transactionLabel(transaction: SavingsTransaction): string {
        const from = this.categories.find((category) => category.id === transaction.fromCategoryId)?.name;
        const to = this.categories.find((category) => category.id === transaction.toCategoryId)?.name;
        return transaction.type === 'TRANSFER' ? `${from} to ${to}` : to || from || 'All envelopes';
    }
    protected transactionTypeLabel(type: SavingsTransaction['type']): string { return ({ BULK_DEPOSIT: 'Bulk deposit', TOP_UP: 'Top up', TRANSFER: 'Transfer', WITHDRAWAL: 'Withdrawal' })[type]; }
    protected formatCurrency(value: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
    protected formatDate(value: string): string { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
}
