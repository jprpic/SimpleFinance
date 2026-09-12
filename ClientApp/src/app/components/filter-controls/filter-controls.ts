import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Category, SUBCATEGORIES_MAP } from '../../models/spending.model';
import { SpendingFilters } from '../../utils/spending-filters.utils';

@Component({
    selector: 'app-filter-controls',
    standalone: true,
    templateUrl: './filter-controls.html',
    styleUrl: './filter-controls.css',
})
export class FilterControlsComponent {
    @Input() years: number[] = [];
    @Output() filtersChanged = new EventEmitter<SpendingFilters>();

    protected readonly categories = Object.values(Category);
    protected readonly months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    protected getSubcategories(category: string): string[] {
        return SUBCATEGORIES_MAP[category as Category] ?? [];
    }

    protected updateFilters(year: string, month: string, category: string, subcategory: string): void {
        this.filtersChanged.emit({
            year: year ? Number(year) : null,
            month: month ? Number(month) : null,
            category: (category || null) as Category | null,
            subcategory: subcategory || null,
        });
    }

    protected updateCategory(year: string, month: string, category: string): void {
        this.updateFilters(year, month, category, '');
    }
}
