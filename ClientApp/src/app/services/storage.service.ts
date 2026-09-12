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
        return spendings ?? [];
    }

    async addSpending(item: Omit<Spending, 'id' | 'createdAt'>): Promise<Spending[]> {
        const existingSpendings = await this.getSpendings();
        const entry: Spending = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };

        const nextSpendings = [entry, ...existingSpendings].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        await set(SPENDINGS_KEY, nextSpendings, spendingStore);
        return nextSpendings;
    }

    async deleteSpending(id: string): Promise<Spending[]> {
        const existingSpendings = await this.getSpendings();
        const nextSpendings = existingSpendings.filter((spending) => spending.id !== id);

        await set(SPENDINGS_KEY, nextSpendings, spendingStore);
        return nextSpendings;
    }
}
