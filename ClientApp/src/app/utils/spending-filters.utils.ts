import { Category, Spending } from '../models/spending.model';

export interface SpendingFilters {
    year: number | null;
    month: number | null;
    category: Category | null;
    subcategory: string | null;
}

export function filterSpendings(spendings: Spending[], filters: SpendingFilters): Spending[] {
    return spendings.filter((spending) => {
        const date = new Date(`${spending.date}T00:00:00`);

        return (filters.year === null || date.getFullYear() === filters.year)
            && (filters.month === null || date.getMonth() === filters.month)
            && (filters.category === null || spending.category === filters.category)
            && (filters.subcategory === null || spending.subcategory === filters.subcategory);
    });
}
