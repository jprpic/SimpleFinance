import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';

import { SAVINGS_CATEGORY_DEFINITIONS, SavingsAllocation, SavingsCategory, SavingsCategoryId, SavingsTransaction } from '../../models/savings.model';
import { SavingsService } from '../../services/savings.service';
import { SavingsActionModalComponent, SavingsActionPayload, SavingsModalMode } from './savings-action-modal/savings-action-modal';
import { SavingsCategoryCardComponent } from './savings-category-card/savings-category-card';
import { SavingsFilters, SavingsFiltersComponent } from './savings-filters/savings-filters';
import { SavingsHeroComponent } from './savings-hero/savings-hero';
import { SavingsHistoryComponent } from './savings-history/savings-history';

@Component({
    selector: 'app-savings-page',
    standalone: true,
    imports: [SavingsActionModalComponent, SavingsCategoryCardComponent, SavingsFiltersComponent, SavingsHeroComponent, SavingsHistoryComponent],
    templateUrl: './savings-page.html',
    styleUrl: './savings-page.css',
})
export class SavingsPageComponent implements OnInit {
    protected readonly savings = inject(SavingsService);
    @ViewChild('moreActions') private moreActions?: ElementRef<HTMLDetailsElement>;
    protected readonly filters = signal<SavingsFilters>({ year: null, month: null, category: null });
    protected readonly modal = signal<SavingsModalMode | null>(null);
    protected readonly selectedCategory = signal<SavingsCategory | null>(null);
    protected readonly transactionToEdit = signal<SavingsTransaction | null>(null);
    protected readonly errorMessage = signal('');
    protected readonly allocationDraft = signal<SavingsAllocation>(this.createAllocationDraft());
    protected readonly years = computed(() => [...new Set(this.savings.transactions().map((transaction) => new Date(transaction.date).getFullYear()))].sort((a, b) => b - a));
    protected readonly periodTransactions = computed(() => this.savings.transactions().filter((transaction) => this.matchesPeriod(transaction, this.filters())));
    protected readonly filteredTransactions = computed(() => {
        const category = this.filters().category;
        return this.periodTransactions().filter((transaction) => !category || transaction.type === 'BULK_DEPOSIT' || transaction.fromCategoryId === category || transaction.toCategoryId === category);
    });
    protected readonly displayedCategories = computed(() => {
        const { year, month } = this.filters();
        if (year === null && month === null) return this.savings.categories();

        return this.savings.categories().map((category) => ({
            ...category,
            balance: this.periodTransactions().reduce((total, transaction) => total + this.categoryTransactionAmount(transaction, category.id), 0),
        }));
    });
    protected readonly displayedTotal = computed(() => {
        const { year, month } = this.filters();
        if (year === null && month === null) return this.savings.totalSaved();
        return this.periodTransactions().reduce((total, transaction) => total + this.totalTransactionAmount(transaction), 0);
    });

    async ngOnInit(): Promise<void> { await this.savings.load(); }
    @HostListener('document:click')
    protected closeMoreActions(): void { if (this.moreActions) this.moreActions.nativeElement.open = false; }
    protected allocationTotal(): number { return this.savings.categories().reduce((total, category) => total + category.targetPercentage, 0); }
    protected updateFilters(filters: SavingsFilters): void { this.filters.set(filters); }
    protected openBulkDeposit(): void { this.openAction('bulk'); }
    protected openAllocationSettings(): void { this.allocationDraft.set(this.createAllocationDraft()); this.openAction('allocation'); }
    protected openTransfer(): void { this.openAction('transfer'); }
    protected openAmountAction(category: SavingsCategory, action: 'top-up' | 'spend'): void { this.openAction(action, category); }
    protected closeModal(): void { this.modal.set(null); this.selectedCategory.set(null); this.transactionToEdit.set(null); this.errorMessage.set(''); }

    protected async submitAction(payload: SavingsActionPayload): Promise<void> {
        this.errorMessage.set('');
        try {
            if (payload.mode === 'bulk') await this.savings.depositBulk(payload.amount, payload.note);
            if (payload.mode === 'allocation') await this.savings.updateAllocation(payload.allocation, payload.allocationValidFrom);
            if (payload.mode === 'top-up') await this.savings.topUpCategory(this.selectedCategory()?.id ?? '', payload.amount, payload.note);
            if (payload.mode === 'spend') await this.savings.withdrawFunds(this.selectedCategory()?.id ?? '', payload.amount, payload.note);
            if (payload.mode === 'transfer') await this.savings.transferFunds(payload.fromCategoryId, payload.toCategoryId, payload.amount, payload.note);
            if (payload.mode === 'edit' && payload.transactionId) await this.savings.updateTransaction(payload.transactionId, {
                amount: payload.amount,
                note: payload.note,
                fromCategoryId: payload.fromCategoryId || undefined,
                toCategoryId: payload.toCategoryId || undefined,
            });
            this.closeModal();
        } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Unable to complete this action.'); }
    }

    protected openEditTransaction(transaction: SavingsTransaction): void {
        if (transaction.type === 'BULK_DEPOSIT') return;
        this.transactionToEdit.set(transaction);
        this.selectedCategory.set(null);
        this.errorMessage.set('');
        this.modal.set('edit');
    }

    protected async deleteTransaction(id: string): Promise<void> {
        this.errorMessage.set('');
        try { await this.savings.deleteTransaction(id); } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Unable to delete the transaction.'); }
    }

    private createAllocationDraft(): SavingsAllocation { return Object.fromEntries(this.savings.categories().map((category) => [category.id, category.targetPercentage])) as SavingsAllocation; }
    private openAction(action: SavingsModalMode, category?: SavingsCategory): void { this.modal.set(action); this.selectedCategory.set(category ?? null); this.errorMessage.set(''); }

    private matchesPeriod(transaction: SavingsTransaction, filters: SavingsFilters): boolean {
        const date = new Date(transaction.date);
        return (filters.year === null || date.getFullYear() === filters.year) && (filters.month === null || date.getMonth() === filters.month);
    }

    private totalTransactionAmount(transaction: SavingsTransaction): number {
        return transaction.type === 'WITHDRAWAL' ? -transaction.amount : transaction.type === 'TRANSFER' ? 0 : transaction.amount;
    }

    private categoryTransactionAmount(transaction: SavingsTransaction, categoryId: SavingsCategoryId): number {
        if (transaction.type === 'BULK_DEPOSIT') {
            return transaction.categoryAmounts?.[categoryId] ?? 0;
        }
        if (transaction.type === 'WITHDRAWAL') return transaction.fromCategoryId === categoryId ? -transaction.amount : 0;
        if (transaction.type === 'TOP_UP') return transaction.toCategoryId === categoryId ? transaction.amount : 0;
        if (transaction.fromCategoryId === categoryId) return -transaction.amount;
        if (transaction.toCategoryId === categoryId) return transaction.amount;
        return 0;
    }
}
