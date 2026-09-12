import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Spending } from '../../models/spending.model';

@Component({
    selector: 'app-spending-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './spending-list.html',
    styleUrl: './spending-list.css',
})
export class SpendingListComponent {
    @Input() spendings: Spending[] = [];
    @Output() editRequested = new EventEmitter<Spending>();
    @Output() deleteRequested = new EventEmitter<string>();

    protected formatDate(value: string): string {
        return new Date(value).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    protected onDelete(id: string): void {
        this.deleteRequested.emit(id);
    }

    protected onEdit(spending: Spending): void {
        this.editRequested.emit(spending);
    }
}
