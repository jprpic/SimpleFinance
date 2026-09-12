import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SavingsAllocation, SavingsCategory, SavingsCategoryId } from '../../../models/savings.model';

export type SavingsModalMode = 'bulk' | 'transfer' | 'top-up' | 'spend' | 'allocation';
export interface SavingsActionPayload {
    mode: SavingsModalMode;
    amount: number;
    note: string;
    fromCategoryId: string;
    toCategoryId: string;
    allocation: SavingsAllocation;
}

@Component({
    selector: 'app-savings-action-modal',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './savings-action-modal.html',
    styleUrl: './savings-action-modal.css',
})
export class SavingsActionModalComponent implements OnChanges {
    @Input() mode: SavingsModalMode | null = null;
    @Input() categories: SavingsCategory[] = [];
    @Input() selectedCategory: SavingsCategory | null = null;
    @Input() allocation: SavingsAllocation = {} as SavingsAllocation;
    @Input() errorMessage = '';
    @Output() closed = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<SavingsActionPayload>();

    protected amountValue: number | null = null;
    protected noteValue = '';
    protected fromCategoryIdValue = '';
    protected toCategoryIdValue = '';
    protected allocationDraft: SavingsAllocation = {} as SavingsAllocation;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['allocation']) this.allocationDraft = { ...this.allocation };
    }

    protected modalTitle(): string { return ({ bulk: 'Add to all envelopes', transfer: 'Move funds', 'top-up': 'Top up envelope', spend: 'Spend from envelope', allocation: 'Edit allocation' } as Record<string, string>)[this.mode ?? ''] ?? ''; }
    protected modalActionLabel(): string { return this.mode === 'transfer' ? 'Transfer funds' : this.mode === 'spend' ? 'Record spending' : this.mode === 'allocation' ? 'Save allocation' : 'Save transaction'; }
    protected bulkAllocation(amount: number, percentage: number): number { return amount * percentage / 100; }
    protected allocationTotal(): number { return Object.values(this.allocationDraft).reduce((total, value) => total + Number(value || 0), 0); }
    protected setAllocation(categoryId: SavingsCategoryId, value: number | string): void { this.allocationDraft = { ...this.allocationDraft, [categoryId]: Number(value) }; }
    protected formatCurrency(value: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
    protected submit(): void { this.submitted.emit({ mode: this.mode!, amount: Number(this.amountValue), note: this.noteValue, fromCategoryId: this.fromCategoryIdValue, toCategoryId: this.toCategoryIdValue, allocation: this.allocationDraft }); }
}
