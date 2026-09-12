import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { Spending } from '../../models/spending.model';

@Component({
    selector: 'app-spending-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './spending-list.html',
    styleUrl: './spending-list.css',
})
export class SpendingListComponent implements OnChanges {
    @Input() spendings: Spending[] = [];
    @Output() editRequested = new EventEmitter<Spending>();
    @Output() deleteRequested = new EventEmitter<string>();

    protected readonly pageSize = 10;
    protected currentPage = 1;

    protected get totalPages(): number {
        return Math.ceil(this.spendings.length / this.pageSize);
    }

    protected get pagedSpendings(): Spending[] {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        return this.spendings.slice(startIndex, startIndex + this.pageSize);
    }

    protected get pageNumbers(): number[] {
        return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['spendings']) {
            this.currentPage = 1;
        }
    }

    protected goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    protected goToPreviousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    protected goToNextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

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
