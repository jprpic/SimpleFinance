import { Injectable } from '@angular/core';
import { createStore, get, set } from 'idb-keyval';

import { Spending } from '../models/spending.model';

const DB_NAME = 'simple-finance-db';
const STORE_NAME = 'spending-store';
const SPENDINGS_KEY = 'spendings';

const spendingStore = createStore(DB_NAME, STORE_NAME);

@Injectable({ providedIn: 'root' })
export class StorageService {
    async getSpendings(): Promise<Spending[]> {
        const spendings = await get<Spending[]>(SPENDINGS_KEY, spendingStore);
        const normalizedSpendings = (spendings ?? []).map((spending) => ({
            ...spending,
            date: spending.date ?? spending.createdAt.slice(0, 10),
        }));

        if (normalizedSpendings.some((spending, index) => spending.date !== spendings?.[index]?.date)) {
            await set(SPENDINGS_KEY, normalizedSpendings, spendingStore);
        }

        return this.sortByDate(normalizedSpendings);
    }

    async addSpending(item: Omit<Spending, 'id' | 'createdAt'>): Promise<Spending[]> {
        const existingSpendings = await this.getSpendings();
        const entry: Spending = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };

        const nextSpendings = [entry, ...existingSpendings].sort(
            (a, b) => b.date.localeCompare(a.date),
        );

        await set(SPENDINGS_KEY, nextSpendings, spendingStore);
        return nextSpendings;
    }

    async updateSpending(id: string, changes: Omit<Spending, 'id' | 'createdAt'>): Promise<Spending[]> {
        const existingSpendings = await this.getSpendings();
        const nextSpendings = existingSpendings
            .map((spending) => spending.id === id ? { ...spending, ...changes } : spending)
            .sort((a, b) => b.date.localeCompare(a.date));

        await set(SPENDINGS_KEY, nextSpendings, spendingStore);
        return nextSpendings;
    }

    async deleteSpending(id: string): Promise<Spending[]> {
        const existingSpendings = await this.getSpendings();
        const nextSpendings = existingSpendings.filter((spending) => spending.id !== id);

        await set(SPENDINGS_KEY, nextSpendings, spendingStore);
        return nextSpendings;
    }

    private sortByDate(spendings: Spending[]): Spending[] {
        return [...spendings].sort((a, b) => b.date.localeCompare(a.date));
    }
}
