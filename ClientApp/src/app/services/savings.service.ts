import { Injectable, computed, signal } from '@angular/core';
import { createStore, get, set } from 'idb-keyval';

import { SAVINGS_CATEGORY_DEFINITIONS, SavingsAllocation, SavingsCategory, SavingsTransaction } from '../models/savings.model';

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
    readonly categories = signal<SavingsCategory[]>(createEmptyCategories());
    readonly transactions = signal<SavingsTransaction[]>([]);
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
                this.categories.set(this.mergeBalances(categories, resolvedAllocation));
                this.transactions.set(transactions ?? []);
                if (!categories?.length || !allocation) await this.persist(resolvedAllocation);
            }).catch(() => {
                this.categories.set(createEmptyCategories());
                this.transactions.set([]);
            });
        }
        await this.loadPromise;
    }

    async depositBulk(amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        const categories = this.categories();
        if (!categories.length) {
            throw new Error('Savings categories are not loaded.');
        }

        const nextCategories = categories.map((category) => ({
            ...category,
            balance: category.balance + amount * category.targetPercentage / 100,
        }));
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'BULK_DEPOSIT', amount, note,
        };
        await this.commit(nextCategories, [transaction, ...this.transactions()]);
    }

    async topUpCategory(categoryId: string, amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        const category = this.findCategory(categoryId);
        const nextCategories = this.categories().map((item) => item.id === category.id ? { ...item, balance: item.balance + amount } : item);
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'TOP_UP', amount, toCategoryId: categoryId, note,
        };
        await this.commit(nextCategories, [transaction, ...this.transactions()]);
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
        const nextCategories = this.categories().map((category) => {
            if (category.id === fromId) return { ...category, balance: category.balance - amount };
            if (category.id === toId) return { ...category, balance: category.balance + amount };
            return category;
        });
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'TRANSFER', amount, fromCategoryId: fromId, toCategoryId: toId, note,
        };
        await this.commit(nextCategories, [transaction, ...this.transactions()]);
    }

    async withdrawFunds(categoryId: string, amount: number, note?: string): Promise<void> {
        await this.load();
        this.assertPositiveAmount(amount);
        const category = this.findCategory(categoryId);
        if (category.balance < amount) {
            throw new Error(`Not enough funds in ${category.name}.`);
        }
        const nextCategories = this.categories().map((item) => item.id === categoryId ? { ...item, balance: item.balance - amount } : item);
        const transaction: SavingsTransaction = {
            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'WITHDRAWAL', amount, fromCategoryId: categoryId, note,
        };
        await this.commit(nextCategories, [transaction, ...this.transactions()]);
    }

    async updateAllocation(allocation: SavingsAllocation): Promise<void> {
        await this.load();
        this.assertValidAllocation(allocation);
        const nextCategories = this.categories().map((category) => ({
            ...category,
            targetPercentage: allocation[category.id],
        }));
        await Promise.all([
            set(CATEGORIES_KEY, nextCategories, savingsStore),
            set(ALLOCATION_KEY, allocation, savingsStore),
        ]);
        this.categories.set(nextCategories);
    }

    private async commit(categories: SavingsCategory[], transactions: SavingsTransaction[]): Promise<void> {
        await Promise.all([
            set(CATEGORIES_KEY, categories, savingsStore),
            set(TRANSACTIONS_KEY, transactions, savingsStore),
        ]);
        this.categories.set(categories);
        this.transactions.set(transactions);
    }

    private async persist(allocation: SavingsAllocation): Promise<void> {
        await set(CATEGORIES_KEY, this.categories(), savingsStore);
        await set(TRANSACTIONS_KEY, this.transactions(), savingsStore);
        await set(ALLOCATION_KEY, allocation, savingsStore);
    }

    private mergeBalances(storedCategories: SavingsCategory[] | undefined, allocation: SavingsAllocation): SavingsCategory[] {
        return SAVINGS_CATEGORY_DEFINITIONS.map((definition) => ({
            ...definition,
            targetPercentage: allocation[definition.id],
            balance: storedCategories?.find((category) => category.id === definition.id)?.balance ?? 0,
        }));
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
