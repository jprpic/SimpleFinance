import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-savings-hero',
    standalone: true,
    templateUrl: './savings-hero.html',
    styleUrl: './savings-hero.css',
})
export class SavingsHeroComponent {
    @Input() total = 0;

    protected formatCurrency(value: number): string {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    }
}
