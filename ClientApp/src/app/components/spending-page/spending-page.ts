import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { Category, Spending } from '../../models/spending.model';
import { StorageService } from '../../services/storage.service';
import { filterSpendings, SpendingFilters } from '../../utils/spending-filters.utils';
import { QuickAddFormValue, QuickAddModalComponent } from '../quick-add-modal/quick-add-modal';
import { FilterControlsComponent } from '../filter-controls/filter-controls';
import { SpendingListComponent } from '../spending-list/spending-list';

@Component({
  selector: 'app-spending-page',
  standalone: true,
  imports: [FilterControlsComponent, QuickAddModalComponent, SpendingListComponent],
  template: `
    <section class="page-shell">
      <div class="page-header">
        <div>
          <p class="eyebrow">Daily life</p>
          <h2>Spendings</h2>
        </div>

        <button
          type="button"
          class="quick-add-button"
          data-testid="quick-add-button"
          (click)="openModal()"
        >
          + Add spending
        </button>
      </div>

      <app-filter-controls [years]="years()" (filtersChanged)="filters.set($event)"></app-filter-controls>
      <div class="filtered-total" data-testid="filtered-total">
        <span>Total spent for current filters</span>
        <strong>{{ formatCurrency(filteredTotal()) }}</strong>
      </div>
      <app-spending-list [spendings]="filteredSpendings()" (editRequested)="openEditModal($event)" (deleteRequested)="deleteSpending($event)"></app-spending-list>
      <app-quick-add-modal
        [isOpen]="isModalOpen()"
        [spendingToEdit]="spendingToEdit()"
        (closed)="closeModal()"
        (submitted)="handleQuickAddSubmit($event)"
      ></app-quick-add-modal>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-shell {
        max-width: 960px;
        margin: 0 auto;
        padding: 0 20px 40px;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 28px;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: #6b7280;
        font-size: .75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h2 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 2.75rem);
      }

      .quick-add-button {
        border: none;
        border-radius: 10px;
        background: #17202b;
        color: #fff;
        padding: .8rem 1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 18px #17202b29;
      }

      .quick-add-button:hover {
        background: #263442;
      }

      .filtered-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 26px 0 30px;
        padding: 28px;
        border-radius: 20px;
        background: linear-gradient(120deg, #173b3f, #23605d);
        color: #fff;
        box-shadow: 0 16px 30px #173b3f33;
      }

      .filtered-total span {
        display: block;
        margin-bottom: 8px;
        color: #b8d6d1;
        font-size: .85rem;
      }

      .filtered-total strong {
        font-size: clamp(2.2rem, 8vw, 3.5rem);
        letter-spacing: -.05em;
      }

      @media (max-width: 640px) {
        .page-header {
          align-items: flex-start;
          flex-direction: column;
          gap: 16px;
        }

        .quick-add-button {
          width: 100%;
        }

        .filtered-total {
          align-items: flex-start;
          flex-direction: column;
          gap: 6px;
        }
      }
    `,
  ],
})
export class SpendingPageComponent implements OnInit {
  private readonly storage = inject(StorageService);

  protected readonly spendings = signal<Spending[]>([]);
  protected readonly filters = signal<SpendingFilters>({ year: null, month: null, category: null, subcategory: null });
  protected readonly isModalOpen = signal(false);
  protected readonly spendingToEdit = signal<Spending | null>(null);
  protected readonly years = computed(() => [...new Set(this.spendings().map((spending) => Number(spending.date.slice(0, 4))))].sort((a, b) => b - a));
  protected readonly filteredSpendings = computed(() => filterSpendings(this.spendings(), this.filters()));
  protected readonly filteredTotal = computed(() => this.filteredSpendings().reduce((total, spending) => total + spending.amount, 0));

  async ngOnInit(): Promise<void> {
    await this.loadSpendings();
  }

  protected async loadSpendings(): Promise<void> {
    this.spendings.set(await this.storage.getSpendings());
  }

  protected openModal(): void {
    this.spendingToEdit.set(null);
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
    this.spendingToEdit.set(null);
  }

  protected openEditModal(spending: Spending): void {
    this.spendingToEdit.set(spending);
    this.isModalOpen.set(true);
  }

  protected async handleQuickAddSubmit(formValue: QuickAddFormValue): Promise<void> {
    const changes = {
      amount: Number(formValue.amount),
      category: formValue.category ?? Category.HOUSING,
      subcategory: formValue.subcategory,
      date: formValue.date,
    };
    const nextSpendings = formValue.id
      ? await this.storage.updateSpending(formValue.id, changes)
      : await this.storage.addSpending(changes);

    this.spendings.set(nextSpendings);
    this.closeModal();
  }

  protected async deleteSpending(id: string): Promise<void> {
    const nextSpendings = await this.storage.deleteSpending(id);
    this.spendings.set(nextSpendings);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
