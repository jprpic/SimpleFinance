import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SavingsCategory } from '../../../models/savings.model';

@Component({
    selector: 'app-savings-category-card',
    standalone: true,
    templateUrl: './savings-category-card.html',
    styleUrl: './savings-category-card.css',
})
export class SavingsCategoryCardComponent {
    @Input() category!: SavingsCategory;
    @Output() actionRequested = new EventEmitter<'top-up' | 'spend'>();

    protected formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    }
}
