import { Component, OnInit, inject, signal } from '@angular/core';

import { SAVINGS_CATEGORY_DEFINITIONS, SavingsAllocation, SavingsCategory, SavingsCategoryId, SavingsTransaction } from '../../models/savings.model';
import { SavingsService } from '../../services/savings.service';
import { SavingsActionModalComponent, SavingsActionPayload, SavingsModalMode } from './savings-action-modal/savings-action-modal';
import { SavingsCategoryCardComponent } from './savings-category-card/savings-category-card';
import { SavingsHeroComponent } from './savings-hero/savings-hero';
import { SavingsHistoryComponent } from './savings-history/savings-history';

@Component({
    selector: 'app-savings-page',
    standalone: true,
    imports: [SavingsActionModalComponent, SavingsCategoryCardComponent, SavingsHeroComponent, SavingsHistoryComponent],
    templateUrl: './savings-page.html',
    styleUrl: './savings-page.css',
})
export class SavingsPageComponent implements OnInit {
    protected readonly savings = inject(SavingsService);
    protected readonly modal = signal<SavingsModalMode | null>(null);
    protected readonly selectedCategory = signal<SavingsCategory | null>(null);
    protected readonly errorMessage = signal('');
    protected readonly allocationDraft = signal<SavingsAllocation>(this.createAllocationDraft());

    async ngOnInit(): Promise<void> { await this.savings.load(); }
    protected allocationTotal(): number { return this.savings.categories().reduce((total, category) => total + category.targetPercentage, 0); }
    protected openBulkDeposit(): void { this.openAction('bulk'); }
    protected openAllocationSettings(): void { this.allocationDraft.set(this.createAllocationDraft()); this.openAction('allocation'); }
    protected openTransfer(): void { this.openAction('transfer'); }
    protected openAmountAction(category: SavingsCategory, action: 'top-up' | 'spend'): void { this.openAction(action, category); }
    protected closeModal(): void { this.modal.set(null); this.selectedCategory.set(null); this.errorMessage.set(''); }

    protected async submitAction(payload: SavingsActionPayload): Promise<void> {
        this.errorMessage.set('');
        try {
            if (payload.mode === 'bulk') await this.savings.depositBulk(payload.amount, payload.note);
            if (payload.mode === 'allocation') await this.savings.updateAllocation(payload.allocation);
            if (payload.mode === 'top-up') await this.savings.topUpCategory(this.selectedCategory()?.id ?? '', payload.amount, payload.note);
            if (payload.mode === 'spend') await this.savings.withdrawFunds(this.selectedCategory()?.id ?? '', payload.amount, payload.note);
            if (payload.mode === 'transfer') await this.savings.transferFunds(payload.fromCategoryId, payload.toCategoryId, payload.amount, payload.note);
            this.closeModal();
        } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Unable to complete this action.'); }
    }

    private createAllocationDraft(): SavingsAllocation { return Object.fromEntries(this.savings.categories().map((category) => [category.id, category.targetPercentage])) as SavingsAllocation; }
    private openAction(action: SavingsModalMode, category?: SavingsCategory): void { this.modal.set(action); this.selectedCategory.set(category ?? null); this.errorMessage.set(''); }
}
