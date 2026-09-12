import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Category, SUBCATEGORIES_MAP } from '../../models/spending.model';

export interface QuickAddFormValue {
    amount: number | null;
    category: Category | null;
    subcategory: string;
}

@Component({
    selector: 'app-quick-add-modal',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './quick-add-modal.html',
    styleUrl: './quick-add-modal.css',
})
export class QuickAddModalComponent {
    @Input() isOpen = false;
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
    });

    protected readonly selectedCategory = this.form.controls.category.value ?? Category.HOUSING;

    get subcategories(): string[] {
        const category = this.form.controls.category.value ?? Category.HOUSING;
        return SUBCATEGORIES_MAP[category];
    }

    ngOnChanges(): void {
        if (this.isOpen) {
            this.resetForm();
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

        this.submitted.emit(this.form.getRawValue() as QuickAddFormValue);
    }

    protected resetForm(): void {
        const category = Category.HOUSING;
        this.form.reset({
            amount: null,
            category,
            subcategory: SUBCATEGORIES_MAP[category][0],
        });
    }
}
