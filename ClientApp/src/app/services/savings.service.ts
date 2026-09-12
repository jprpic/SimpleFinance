import { Injectable, computed, signal } from '@angular/core';
import { createStore, get, set } from 'idb-keyval';

import { SAVINGS_CATEGORY_DEFINITIONS, SavingsAllocation, SavingsCategory, SavingsCategoryId, SavingsTransaction } from '../models/savings.model';

const CATEGORIES_KEY = 'pwa_savings_categories';
const TRANSACTIONS_KEY = 'pwa_savings_transactions';
const ALLOCATION_KEY = 'pwa_savings_allocation';
const savingsStore = createStore('simple-finance-savings-db', 'savings-store');

const createEmptyCategories = (): SavingsCategory[] => SAVINGS_CATEGORY_DEFINITIONS.map((category) => ({ ...category, balance: 0 }));
const createDefaultAllocation = (): SavingsAllocation => Object.fromEntries(
    SAVINGS_CATEGORY_DEFINITIONS.map((category) => [category.id, category.targetPercentage]),
) as SavingsAllocation;

@Injectable({ providedIn: 'root' })
export class SavingsService {
    readonly transactions = signal<SavingsTransaction[]>([]);
    private readonly allocation = signal<SavingsAllocation>(createDefaultAllocation());
    readonly categories = computed(() => this.calculateCategories(this.transactions(), this.allocation()));
    readonly totalSaved = computed(() => this.categories().reduce((sum, category) => sum + category.balance, 0));
    private loadPromise: Promise<void> | null = null;

    async load(): Promise<void> {
        if (!this.loadPromise) {
            this.loadPromise = Promise.all([
                get<SavingsCategory[]>(CATEGORIES_KEY, savingsStore),
                get<SavingsTransaction[]>(TRANSACTIONS_KEY, savingsStore),
                get<Partial<SavingsAllocation>>(ALLOCATION_KEY, savingsStore),
            ]).then(async ([categories, transactions, allocation]) => {
                const resolvedAllocation = this.resolveAllocation(allocation);
                this.allocation.set(resolvedAllocation);
                this.transactions.set(transactions ?? []);
                if (!categories?.length || !allocation) await this.persist(resolvedAllocation);
            }).catch(() => {
                this.allocation.set(createDefaultAllocation());
                this.transactions.set([]);
            });
        }
        await this.loadPromise;
    }

    async depositBulk(amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        if (!this.categories().length) {
            throw new Error('Savings categories are not loaded.');
        }

        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'BULK_DEPOSIT', amount, note,
            categoryAmounts: Object.fromEntries(this.categories().map((category) => [category.id, amount * category.targetPercentage / 100])),
        };
        await this.commitTransactions([transaction, ...this.transactions()]);
    }

    async topUpCategory(categoryId: string, amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        this.findCategory(categoryId);
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'TOP_UP', amount, toCategoryId: categoryId, note,
        };
        await this.commitTransactions([transaction, ...this.transactions()]);
    }

    async transferFunds(fromId: string, toId: string, amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        if (fromId === toId) {
            throw new Error('Choose two different envelopes.');
        }
        const source = this.findCategory(fromId);
        this.findCategory(toId);
        if (source.balance < amount) {
            throw new Error(`Not enough funds in ${source.name}.`);
        }
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'TRANSFER', amount, fromCategoryId: fromId, toCategoryId: toId, note,
        };
        await this.commitTransactions([transaction, ...this.transactions()]);
    }

    async withdrawFunds(categoryId: string, amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        this.findCategory(categoryId);
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'WITHDRAWAL', amount, fromCategoryId: categoryId, note,
        };
        await this.commitTransactions([transaction, ...this.transactions()]);
    }

    async updateTransaction(id: string, changes: Pick<SavingsTransaction, 'amount' | 'note' | 'fromCategoryId' | 'toCategoryId'>): Promise<void> {
        await this.load();
        this.assertPositiveAmount(changes.amount);
        const existing = this.transactions().find((transaction) => transaction.id === id);
        if (!existing) throw new Error('Savings transaction not found.');
        if (existing.type === 'TRANSFER' && changes.fromCategoryId === changes.toCategoryId) {
            throw new Error('Choose two different envelopes.');
        }
        const updated = this.transactions().map((transaction) => transaction.id === id ? { ...transaction, ...changes } : transaction);
        await this.commitTransactions(updated);
    }

    async deleteTransaction(id: string): Promise<void> {
        await this.load();
        const nextTransactions = this.transactions().filter((transaction) => transaction.id !== id);
        if (nextTransactions.length === this.transactions().length) throw new Error('Savings transaction not found.');
        await this.commitTransactions(nextTransactions);
    }

    async updateAllocation(allocation: SavingsAllocation): Promise<void> {
        await this.load();
        this.assertValidAllocation(allocation);
        this.allocation.set(allocation);
        await Promise.all([
            set(CATEGORIES_KEY, this.categories(), savingsStore),
            set(ALLOCATION_KEY, allocation, savingsStore),
        ]);
    }

    private async commitTransactions(transactions: SavingsTransaction[]): Promise<void> {
        const nextCategories = this.calculateCategories(transactions, this.allocation());
        await Promise.all([
            set(CATEGORIES_KEY, nextCategories, savingsStore),
            set(TRANSACTIONS_KEY, transactions, savingsStore),
        ]);
        this.transactions.set(transactions);
    }

    private async persist(allocation: SavingsAllocation): Promise<void> {
        await set(CATEGORIES_KEY, this.categories(), savingsStore);
        await set(TRANSACTIONS_KEY, this.transactions(), savingsStore);
        await set(ALLOCATION_KEY, allocation, savingsStore);
    }

    private calculateCategories(transactions: SavingsTransaction[], allocation: SavingsAllocation): SavingsCategory[] {
        return SAVINGS_CATEGORY_DEFINITIONS.map((definition) => ({
            ...definition,
            targetPercentage: allocation[definition.id],
            balance: transactions.reduce((total, transaction) => total + this.transactionAmountForCategory(transaction, definition.id, allocation), 0),
        }));
    }

    private transactionAmountForCategory(transaction: SavingsTransaction, categoryId: SavingsCategoryId, allocation: SavingsAllocation): number {
        if (transaction.type === 'BULK_DEPOSIT') {
            return transaction.categoryAmounts?.[categoryId] ?? transaction.amount * allocation[categoryId] / 100;
        }
        if (transaction.type === 'WITHDRAWAL') return transaction.fromCategoryId === categoryId ? -transaction.amount : 0;
        if (transaction.type === 'TOP_UP') return transaction.toCategoryId === categoryId ? transaction.amount : 0;
        if (transaction.fromCategoryId === categoryId) return -transaction.amount;
        if (transaction.toCategoryId === categoryId) return transaction.amount;
        return 0;
    }

    private resolveAllocation(stored: Partial<SavingsAllocation> | undefined): SavingsAllocation {
        const defaults = createDefaultAllocation();
        return SAVINGS_CATEGORY_DEFINITIONS.reduce((allocation, category) => {
            allocation[category.id] = stored?.[category.id] ?? defaults[category.id];
            return allocation;
        }, {} as SavingsAllocation);
    }

    private assertValidAllocation(allocation: SavingsAllocation): void {
        const total = SAVINGS_CATEGORY_DEFINITIONS.reduce((sum, category) => sum + allocation[category.id], 0);
        if (SAVINGS_CATEGORY_DEFINITIONS.some((category) => !Number.isFinite(allocation[category.id]) || allocation[category.id] < 0) || Math.abs(total - 100) > 0.001) {
            throw new Error('Allocation percentages must be zero or greater and add up to 100%.');
        }
    }

    private findCategory(categoryId: string): SavingsCategory {
        const category = this.categories().find((item) => item.id === categoryId);
        if (!category) throw new Error('Savings envelope not found.');
        return category;
    }

    private assertPositiveAmount(amount: number): void {
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.');
    }
}
