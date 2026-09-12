import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SavingsCategory, SavingsCategoryId } from '../../../models/savings.model';

export interface SavingsFilters {
    year: number | null;
    month: number | null;
    category: SavingsCategoryId | null;
}

@Component({
    selector: 'app-savings-filters',
    standalone: true,
    templateUrl: './savings-filters.html',
    styleUrl: './savings-filters.css',
})
export class SavingsFiltersComponent {
    @Input() years: number[] = [];
    @Input() categories: SavingsCategory[] = [];
    @Output() filtersChanged = new EventEmitter<SavingsFilters>();

    protected readonly months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    protected updateFilters(year: string, month: string, category: string): void {
        this.filtersChanged.emit({
            year: year ? Number(year) : null,
            month: month ? Number(month) : null,
            category: (category || null) as SavingsCategoryId | null,
        });
    }
}
