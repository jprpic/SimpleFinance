import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category, Spending, SUBCATEGORIES_MAP } from '../../models/spending.model';

export interface QuickAddFormValue {
    id?: string;
    amount: number | null;
    category: Category | null;
    subcategory: string;
    date: string;
}

@Component({
    selector: 'app-quick-add-modal',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './quick-add-modal.html',
    styleUrl: './quick-add-modal.css',
})
export class QuickAddModalComponent implements OnChanges {
    @Input() isOpen = false;
    @Input() spendingToEdit: Spending | null = null;
    @Output() closed = new EventEmitter<void>();
    @Output() submitted = new EventEmitter<QuickAddFormValue>();

    protected readonly categories = Object.values(Category);

    protected readonly form = new FormGroup({
        amount: new FormControl<number | null>(null, {
            nonNullable: false,
            validators: [Validators.required, Validators.min(0.01)],
        }),
        category: new FormControl<Category | null>(Category.HOUSING, {
            nonNullable: false,
            validators: [Validators.required],
        }),
        subcategory: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
        date: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required],
        }),
    });

    protected readonly selectedCategory = this.form.controls.category.value ?? Category.HOUSING;

    get subcategories(): string[] {
        const category = this.form.controls.category.value ?? Category.HOUSING;
        return SUBCATEGORIES_MAP[category];
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.isOpen && (changes['isOpen'] || changes['spendingToEdit'])) {
            this.resetForm(this.spendingToEdit);
        }
    }

    protected onCategoryChange(): void {
        const category = this.form.controls.category.value as Category | null;
        const nextCategory = category ?? Category.HOUSING;
        const available = SUBCATEGORIES_MAP[nextCategory] ?? [];
        const nextValue = available[0] ?? '';
        this.form.controls.subcategory.setValue(nextValue, { emitEvent: false });
    }

    protected close(): void {
        this.closed.emit();
    }

    protected submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitted.emit({
            ...this.form.getRawValue(),
            id: this.spendingToEdit?.id,
        } as QuickAddFormValue);
    }

    protected resetForm(spending: Spending | null = null): void {
        const category = Category.HOUSING;
        this.form.reset({
            amount: spending?.amount ?? null,
            category: spending?.category ?? category,
            subcategory: spending?.subcategory ?? SUBCATEGORIES_MAP[category][0],
            date: spending?.date ?? this.todayIsoDate(),
        });
    }

    private todayIsoDate(): string {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    protected get dialogTitle(): string {
        return this.spendingToEdit ? 'Edit Spending' : 'Quick Add';
    }

    protected get submitLabel(): string {
        return this.spendingToEdit ? 'Update' : 'Save';
    }
}
