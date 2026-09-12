import { Category, Spending } from '../models/spending.model';
import { filterSpendings } from './spending-filters.utils';

describe('spending-filters.utils', () => {
    const spendings: Spending[] = [
        {
            id: '1',
            amount: 120,
            category: Category.FOOD,
            subcategory: 'Groceries',
            createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
            id: '2',
            amount: 200,
            category: Category.HOUSING,
            subcategory: 'Rent',
            createdAt: '2024-01-15T10:00:00.000Z',
        },
        {
            id: '3',
            amount: 50,
            category: Category.FOOD,
            subcategory: 'Restaurants & Dining Out',
            createdAt: '2025-03-05T10:00:00.000Z',
        },
    ];

    it('returns all spendings when no filters are selected', () => {
        expect(filterSpendings(spendings, { year: null, month: null, category: null, subcategory: null })).toEqual(spendings);
    });

    it('applies year, month, and category together', () => {
        expect(filterSpendings(spendings, {
            year: 2024,
            month: 0,
            category: Category.HOUSING,
            subcategory: 'Rent',
        })).toEqual([spendings[1]]);
    });
});
